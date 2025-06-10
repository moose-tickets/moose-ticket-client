// src/hooks/useRateLimit.ts
import { useState, useCallback, useRef } from 'react';
import ArcjetSecurity, { RateLimitType, RateLimitResult, SecurityContext } from '../services/arcjetSecurity';

export interface UseRateLimitOptions {
  type: RateLimitType;
  context?: SecurityContext;
  onRateLimited?: (result: RateLimitResult) => void;
  onAllowed?: () => void;
}

export interface UseRateLimitReturn {
  isRateLimited: boolean;
  remaining: number;
  resetTime: Date | null;
  checkRateLimit: () => Promise<RateLimitResult>;
  executeWithRateLimit: <T>(fn: () => Promise<T>) => Promise<T>;
  reset: () => void;
}

export const useRateLimit = (options: UseRateLimitOptions): UseRateLimitReturn => {
  const { type, context, onRateLimited, onAllowed } = options;
  
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remaining, setRemaining] = useState(999);
  const [resetTime, setResetTime] = useState<Date | null>(null);
  const lastCheckRef = useRef<number>(0);

  const checkRateLimit = useCallback(async (): Promise<RateLimitResult> => {
    try {
      const result = await ArcjetSecurity.checkRateLimit(type, context);
      
      setIsRateLimited(!result.allowed);
      setRemaining(result.remaining);
      setResetTime(result.resetTime);
      lastCheckRef.current = Date.now();

      if (!result.allowed) {
        onRateLimited?.(result);
      } else {
        onAllowed?.();
      }

      return result;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow the request
      const fallbackResult: RateLimitResult = {
        allowed: true,
        remaining: 999,
        resetTime: new Date(Date.now() + 60000),
        limit: 999
      };
      return fallbackResult;
    }
  }, [type, context, onRateLimited, onAllowed]);

  const executeWithRateLimit = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    const rateLimitResult = await checkRateLimit();
    
    if (!rateLimitResult.allowed) {
      throw new Error(`Rate limit exceeded. Try again after ${rateLimitResult.resetTime.toLocaleTimeString()}`);
    }

    return await fn();
  }, [checkRateLimit]);

  const reset = useCallback(() => {
    setIsRateLimited(false);
    setRemaining(999);
    setResetTime(null);
    lastCheckRef.current = 0;
  }, []);

  return {
    isRateLimited,
    remaining,
    resetTime,
    checkRateLimit,
    executeWithRateLimit,
    reset
  };
};

// Higher-order function for wrapping API calls with rate limiting
export const withRateLimit = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  rateLimitType: RateLimitType,
  context?: SecurityContext
) => {
  return async (...args: T): Promise<R> => {
    const rateLimitResult = await ArcjetSecurity.checkRateLimit(rateLimitType, context);
    
    if (!rateLimitResult.allowed) {
      throw new Error(`Rate limit exceeded. Try again after ${rateLimitResult.resetTime.toLocaleTimeString()}`);
    }

    return await fn(...args);
  };
};