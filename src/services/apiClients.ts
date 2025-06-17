// src/services/apiClients.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { Platform, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import unifiedSecurityService from "./unifiedSecurityService";
import ErrorHandlerService from "./errorHandlerService";

// Base configuration - Updated for direct auth service connection
const BASE_URL = __DEV__ 
  ? "http://localhost:3001/api"  // Development URL (Direct Auth Service)
  : "https://api.mooseticket.com/api"; // Production URL

const API_TIMEOUT = 30000; // 30 seconds

/**
 * Helper to fetch token from SecureStore
 */
async function getAuthToken(): Promise<string | null> {
  return await SecureStore.getItemAsync("userToken");
}

// Token refresh lock to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Queue for requests waiting for token refresh
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

const refreshToken = async (): Promise<string | null> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const storedRefreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!storedRefreshToken) {
        throw new Error("No refresh token available");
      }

      const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken: storedRefreshToken
      });

      if (refreshResponse.data.success) {
        // Handle both old and new response formats
        const responseData = refreshResponse.data.data;
        const newToken = responseData.tokens?.accessToken || responseData.token;
        const newRefreshToken = responseData.tokens?.refreshToken || responseData.refreshToken;
        
        if (!newToken || !newRefreshToken) {
          throw new Error("Invalid token refresh response format");
        }
        
        // Store new tokens
        await Promise.all([
          SecureStore.setItemAsync("userToken", newToken),
          SecureStore.setItemAsync("refreshToken", newRefreshToken),
        ]);
        
        processQueue(null, newToken);
        return newToken;
      } else {
        throw new Error("Token refresh failed");
      }
    } catch (error) {
      // Clear all tokens on refresh failure
      await Promise.all([
        SecureStore.deleteItemAsync("userToken"),
        SecureStore.deleteItemAsync("refreshToken"),
        SecureStore.deleteItemAsync("userData"),
      ]);
      
      processQueue(error, null);
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const baseClient = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

baseClient.interceptors.request.use(
  async (config) => {
    try {
      // Attach JWT if available
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Enhanced security headers
      try {
        // Get comprehensive security context from unified security service
        const botContext = await unifiedSecurityService.getBotContext();
        console.log('API request security validated');
        
        // Attach security headers if available
        if (botContext) {
          config.headers["X-Security-Bot-Score"] = botContext.score;
          config.headers["X-Security-Risk-Level"] = botContext.riskLevel;
          config.headers["X-Security-Is-Human"] = botContext.isHuman;
          config.headers["X-Security-Confidence"] = botContext.confidence;
        }
        
      } catch (error) {
        console.warn("Failed to attach security headers:", error);
        // Continue without security headers if security service is unavailable
      }

      // Add device/platform information for security and analytics
      config.headers["X-Platform"] = Platform.OS;
      config.headers["X-Platform-Version"] = Platform.Version;
      config.headers["X-App-Version"] = "1.0.0";
      
      // Add request tracking
      config.headers["X-Request-ID"] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      config.headers["X-Request-Timestamp"] = new Date().toISOString();
      
      return config;
    } catch (error) {
      console.error("Request interceptor error:", error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

baseClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (__DEV__) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        requestId: response.config.headers?.["X-Request-ID"],
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const status = error.response?.status;
    const headers = error.response?.headers;
    
    // Create error context for better error handling
    const errorContext = {
      endpoint: originalRequest?.url || 'unknown',
      method: originalRequest?.method?.toUpperCase() || 'unknown',
      timestamp: new Date().toISOString(),
    };

    // Log errors in development
    if (__DEV__) {
      console.log(`❌ ${errorContext.method} ${errorContext.endpoint}`, {
        status: error.response?.status,
        message: error.message,
        requestId: originalRequest?.headers?.["X-Request-ID"],
      });
    }

    // Handle 401 errors with token refresh
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for ongoing refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return baseClient(originalRequest);
          } else {
            throw error;
          }
        }).catch((err) => {
          throw err;
        });
      }

      originalRequest._retry = true;
      
      try {
        const newToken = await refreshToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return baseClient(originalRequest);
        }
      } catch (refreshError) {
        // Token refresh failed
        await SecureStore.deleteItemAsync("userToken");
        setTimeout(() => {
          Alert.alert("Session expired", "Please sign in again.");
        }, 100);
      }
    }

    // Handle rate limiting with enhanced messaging
    if (status === 429) {
      const retryAfter = headers?.['retry-after'] || headers?.['x-ratelimit-reset'];
      const remainingRequests = headers?.['x-ratelimit-remaining'];
      
      let message = "You are making requests too frequently. Please wait and try again.";
      
      if (retryAfter) {
        const resetTime = new Date(parseInt(retryAfter) * 1000);
        message += ` Try again after ${resetTime.toLocaleTimeString()}.`;
      }
      
      if (remainingRequests !== undefined) {
        message += ` Remaining requests: ${remainingRequests}`;
      }
      
      // Auto-retry for short delays
      if (retryAfter && !originalRequest._retryAfterRateLimit) {
        const delay = parseInt(retryAfter) * 1000;
        if (delay <= 60000) { // Only auto-retry if delay is <= 60 seconds
          originalRequest._retryAfterRateLimit = true;
          console.log(`Rate limited, retrying after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return baseClient(originalRequest);
        }
      }
      
      setTimeout(() => {
        Alert.alert("Rate Limit Exceeded", message);
      }, 100);
    }
    
    // Handle security blocks
    if (status === 403) {
      const securityReason = headers?.['x-security-reason'] || 'Security policy violation';
      
      setTimeout(() => {
        Alert.alert(
          "Access Denied", 
          `Request blocked due to: ${securityReason}`
        );
      }, 100);
    }
    
    // Handle server errors
    if (status && status >= 500) {
      setTimeout(() => {
        Alert.alert(
          "Server Error",
          "Something went wrong on our end. Please try again later."
        );
      }, 100);
    }

    // Use centralized error handler for consistent error responses
    const handledError = ErrorHandlerService.handleError(error, errorContext);
    
    // Create a new error that includes our standardized response
    const enhancedError = new Error(handledError.message) as any;
    enhancedError.response = {
      ...error.response,
      data: handledError,
    };
    enhancedError.isHandledError = true;
    
    return Promise.reject(enhancedError);
  }
);

// Enhanced API client with retry logic for critical operations
class EnhancedApiClient {
  private client = baseClient;

  // Standard methods with built-in retry for network errors
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return ErrorHandlerService.executeWithRetry(
      () => this.client.get<T>(url, config),
      { endpoint: url, method: 'GET' }
    );
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return ErrorHandlerService.executeWithRetry(
      () => this.client.post<T>(url, data, config),
      { endpoint: url, method: 'POST' },
      { maxRetries: 2 } // Fewer retries for POST to avoid duplicate operations
    );
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return ErrorHandlerService.executeWithRetry(
      () => this.client.put<T>(url, data, config),
      { endpoint: url, method: 'PUT' },
      { maxRetries: 2 } // Fewer retries for PUT to avoid duplicate operations
    );
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return ErrorHandlerService.executeWithRetry(
      () => this.client.patch<T>(url, data, config),
      { endpoint: url, method: 'PATCH' },
      { maxRetries: 2 } // Fewer retries for PATCH to avoid duplicate operations
    );
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return ErrorHandlerService.executeWithRetry(
      () => this.client.delete<T>(url, config),
      { endpoint: url, method: 'DELETE' },
      { maxRetries: 1 } // Minimal retries for DELETE to avoid accidental multiple deletions
    );
  }

  // Direct access to underlying client for special cases
  get direct() {
    return this.client;
  }
}

// Export both the enhanced client (default) and base client for backward compatibility
export const apiClient = baseClient;
export default new EnhancedApiClient();
