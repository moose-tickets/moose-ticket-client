// src/services/apiClients.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { Platform, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import ErrorHandlerService from "./errorHandlerService";

// Base configuration - Updated for direct auth service connection
const BASE_URL = __DEV__ 
  ? "http://localhost:3001/api"  // Development URL (Direct Auth Service)
  : "https://api.mooseticket.com/api"; // Production URL

const API_TIMEOUT = 30000; // 30 seconds

/**
 * Check if user is currently logged in
 */
async function isUserLoggedIn(): Promise<boolean> {
  try {
    const userData = await SecureStore.getItemAsync("userData");
    const token = await SecureStore.getItemAsync("userToken");
    const refreshToken = await SecureStore.getItemAsync("refreshToken");
    
    return !!(userData && token && refreshToken);
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
}

/**
 * Helper to fetch token from SecureStore and check if refresh is needed
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync("userToken");
    if (!token) return null;

    // Check if user is logged in
    const loggedIn = await isUserLoggedIn();
    console.log(' ⚠️ User logged in status:', loggedIn);
    if (!loggedIn) {
      // User is not logged in, clear any stale tokens
      await Promise.all([
        SecureStore.deleteItemAsync("userToken"),
        SecureStore.deleteItemAsync("refreshToken"),
        SecureStore.deleteItemAsync("tokenExpiry"),
        SecureStore.deleteItemAsync("userData"),
      ]);
      return null;
    }

    // Check token expiry and refresh if needed (for logged-in users only)
    const expiryStr = await SecureStore.getItemAsync("tokenExpiry");
    if (expiryStr) {
      const expiry = new Date(expiryStr);
      const now = new Date();
      
      // Refresh token if it expires within the next 5 minutes
      const bufferTime = 5 * 60 * 1000;
      if (expiry.getTime() <= (now.getTime() + bufferTime)) {
        console.log('Token expiring soon, attempting refresh...');
        try {
          const newToken = await refreshToken();
          return newToken || token; // Fall back to current token if refresh fails
        } catch (error) {
          console.warn('Proactive token refresh failed:', error);
          return token; // Return current token and let 401 handler deal with it
        }
      }
    }

    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return await SecureStore.getItemAsync("userToken");
  }
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
        
        // Calculate new expiry time (assume 24h if not provided)
        const expiresAt = responseData.expiresAt || 
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        
        // Store new tokens and expiry
        await Promise.all([
          SecureStore.setItemAsync("userToken", newToken),
          SecureStore.setItemAsync("refreshToken", newRefreshToken),
          SecureStore.setItemAsync("tokenExpiry", expiresAt),
        ]);
        
        console.log('Token refreshed successfully, new expiry:', expiresAt);
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
      console.log('✅ Attaching token to request:', token);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Enhanced security headers
      // Security headers disabled - rate limiting removed
      console.log('API request processed (security headers disabled)');
      console.log(' 🔐 Request headers Authorization:', config.headers.Authorization);

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

    console.log('❤️ API response received:');
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

    // Handle 401 errors with token refresh (only for logged-in users)
    if (status === 401 && !originalRequest._retry) {
      // Check if user is actually logged in before attempting refresh
      const loggedIn = await isUserLoggedIn();
      
      if (!loggedIn) {
        // User is not logged in, don't attempt refresh
        console.log('401 error for non-logged-in user, skipping token refresh');
        return Promise.reject(error);
      }

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

      // originalRequest._retry = true;
      
      // try {
      //   console.log('👻 Attempting token refresh for logged-in user...');
      //   const newToken = await refreshToken();
      //   console.log('Token refreshed successfully:', newToken);
      //   if (newToken) {
      //     originalRequest.headers.Authorization = `Bearer ${newToken}`;
      //     console.log('Token added to request headers:', newToken);
      //     return baseClient(originalRequest);
      //   }
      // } catch (refreshError) {
      //   // Token refresh failed for logged-in user
      //   console.error('Token refresh failed:', refreshError);
      //   await Promise.all([
      //     SecureStore.deleteItemAsync("userToken"),
      //     SecureStore.deleteItemAsync("refreshToken"),
      //     SecureStore.deleteItemAsync("tokenExpiry"),
      //     SecureStore.deleteItemAsync("userData"),
      //   ]);
      //   setTimeout(() => {
      //     Alert.alert("Session expired", "Please sign in again.");
      //   }, 100);
      // }
    }

    // Rate limiting handling removed
    
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
