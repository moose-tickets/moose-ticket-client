// src/services/errorHandlerService.ts
import { AxiosError, AxiosResponse } from 'axios';
import { ApiResponse } from '../types/api';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: AxiosError) => boolean;
  onRetry?: (error: AxiosError, retryCount: number) => void;
}

export interface ErrorContext {
  endpoint: string;
  method: string;
  retryCount?: number;
  timestamp: string;
  userId?: string;
}

export interface StandardError {
  code: string;
  message: string;
  details?: any;
  context?: ErrorContext;
  isRetryable: boolean;
  isUserError: boolean;
}

class ErrorHandlerService {
  
  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    retryCondition: (error: AxiosError) => this.isRetryableError(error),
  };

  // Error Classification
  private isRetryableError(error: AxiosError): boolean {
    // Network errors
    if (!error.response) {
      return true;
    }

    const status = error.response.status;
    
    // Server errors (5xx) are generally retryable
    if (status >= 500) {
      return true;
    }

    // Rate limiting removed

    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // DNS/connection errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return true;
    }

    return false;
  }

  private isUserError(error: AxiosError): boolean {
    if (!error.response) {
      return false;
    }

    const status = error.response.status;
    
    // Client errors (4xx) are usually user errors
    return status >= 400 && status < 500;
  }

  private getErrorCode(error: AxiosError): string {
    if (!error.response) {
      if (error.code) {
        return error.code;
      }
      return 'NETWORK_ERROR';
    }

    const status = error.response.status;
    
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'VALIDATION_ERROR';
      // Rate limiting removed
      case 500: return 'INTERNAL_SERVER_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      case 504: return 'GATEWAY_TIMEOUT';
      default: return `HTTP_${status}`;
    }
  }

  private getUserFriendlyMessage(error: AxiosError): string {
    if (!error.response) {
      if (error.code === 'ENOTFOUND') {
        return 'Please check your internet connection and try again.';
      }
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return 'Request timed out. Please try again.';
      }
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    const status = error.response.status;
    const data = error.response.data as any;
    
    // Use server-provided message if available
    if (data?.message) {
      return data.message;
    }

    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'You need to sign in to access this feature.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data.';
      case 422:
        return 'Please check your input and try again.';
      // Rate limiting removed
      case 500:
        return 'A server error occurred. Please try again later.';
      case 502:
        return 'Server is temporarily unavailable. Please try again later.';
      case 503:
        return 'Service is temporarily unavailable. Please try again later.';
      case 504:
        return 'Request timed out. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // Standardize Error Response
  standardizeError(error: AxiosError, context: Partial<ErrorContext> = {}): StandardError {
    const standardError: StandardError = {
      code: this.getErrorCode(error),
      message: this.getUserFriendlyMessage(error),
      isRetryable: this.isRetryableError(error),
      isUserError: this.isUserError(error),
      context: {
        endpoint: context.endpoint || 'unknown',
        method: context.method || 'unknown',
        timestamp: new Date().toISOString(),
        retryCount: context.retryCount || 0,
        userId: context.userId,
      },
    };

    // Add error details for debugging
    if (error.response?.data) {
      standardError.details = error.response.data;
    } else if (error.code) {
      standardError.details = { code: error.code, message: error.message };
    }

    return standardError;
  }

  // Convert to API Response Format
  toApiResponse<T = any>(error: AxiosError, context: Partial<ErrorContext> = {}): ApiResponse<T> {
    const standardError = this.standardizeError(error, context);
    
    return {
      success: false,
      error: standardError.code,
      message: standardError.message,
    };
  }

  // Retry Logic with Exponential Backoff
  private calculateDelay(retryCount: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, retryCount);
    return Math.min(delay, config.maxDelay);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeWithRetry<T>(
    operation: () => Promise<AxiosResponse<T>>,
    context: Partial<ErrorContext> = {},
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<AxiosResponse<T>> {
    const config = { ...this.DEFAULT_RETRY_CONFIG, ...retryConfig };
    let lastError: AxiosError;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as AxiosError;
        
        // Don't retry on the last attempt
        if (attempt === config.maxRetries) {
          break;
        }

        // Check if error is retryable
        if (!config.retryCondition!(lastError)) {
          break;
        }

        // Calculate delay for next retry
        const delay = this.calculateDelay(attempt, config);
        
        // Log retry attempt
        // if(attempt === (config.maxRetries + 1)){
          console.warn(`Request failed (attempt ${attempt + 1}/${config.maxRetries + 1}), retrying in ${delay}ms:`, {
            endpoint: context.endpoint,
            method: context.method,
            error: this.getErrorCode(lastError),
          });
        // }

        // Call retry callback if provided
        if (config.onRetry) {
          config.onRetry(lastError, attempt + 1);
        }

        // Wait before retrying
        await this.wait(delay);
      }
    }

    // All retries exhausted, throw the last error
    throw lastError;
  }

  // Network Status Detection
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  // Error Reporting (for analytics/monitoring)
  async reportError(error: StandardError, additionalData?: any): Promise<void> {
    try {
      // Only report non-user errors to avoid noise
      if (error.isUserError) {
        return;
      }

      const errorReport = {
        ...error,
        additionalData,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        timestamp: new Date().toISOString(),
      };

      // In a real app, you'd send this to your error tracking service
      // (e.g., Sentry, Bugsnag, LogRocket, etc.)
      console.error('Error Report:', errorReport);
      
      // Example: Send to analytics endpoint
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });
      
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  // Specific Error Handlers
  handleNetworkError(error: AxiosError, context: Partial<ErrorContext> = {}): ApiResponse {
    const standardError = this.standardizeError(error, context);
    
    // Report network errors for monitoring
    this.reportError(standardError);
    
    if (!this.isOnline()) {
      return {
        success: false,
        error: 'OFFLINE',
        message: 'You appear to be offline. Please check your internet connection.',
      };
    }

    return this.toApiResponse(error, context);
  }

  handleAuthError(error: AxiosError, context: Partial<ErrorContext> = {}): ApiResponse {
    const standardError = this.standardizeError(error, context);
    
    if (error.response?.status === 401) {
      // Token might be expired, could trigger refresh logic here
      return {
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Your session has expired. Please sign in again.',
      };
    }

    if (error.response?.status === 403) {
      return {
        success: false,
        error: 'PERMISSION_DENIED',
        message: 'You do not have permission to perform this action.',
      };
    }

    return this.toApiResponse(error, context);
  }

  handleValidationError(error: AxiosError, context: Partial<ErrorContext> = {}): ApiResponse {
    const data = error.response?.data as any;
    
    if (data?.errors && typeof data.errors === 'object') {
      // Format validation errors nicely
      const validationMessages = Object.values(data.errors).flat().join(', ');
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: validationMessages,
      };
    }

    return this.toApiResponse(error, context);
  }

  // Rate limit error handling removed

  // Global Error Handler
  handleError(error: AxiosError, context: Partial<ErrorContext> = {}): ApiResponse {
    if (!error.response) {
      return this.handleNetworkError(error, context);
    }

    const status = error.response.status;

    switch (status) {
      case 401:
      case 403:
        return this.handleAuthError(error, context);
      case 422:
        return this.handleValidationError(error, context);
      // Rate limiting removed
      default:
        const standardError = this.standardizeError(error, context);
        
        // Report server errors for monitoring
        if (status >= 500) {
          this.reportError(standardError);
        }
        
        return this.toApiResponse(error, context);
    }
  }
}

export default new ErrorHandlerService();