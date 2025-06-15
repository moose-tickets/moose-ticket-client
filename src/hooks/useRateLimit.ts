// src/hooks/useRateLimit.ts
import { useState, useCallback, useRef } from 'react';
import unifiedSecurityService, { SecurityActionType } from '../services/unifiedSecurityService';

export interface SecurityResult {
  allowed: boolean;
  reason?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  resetTime?: Date;
  remaining?: number;
}

export interface UseRateLimitOptions {
  type: SecurityActionType;
  context?: Record<string, any>;
  onRateLimited?: (result: SecurityResult) => void;
  onAllowed?: () => void;
}

export interface UseRateLimitReturn {
  isRateLimited: boolean;
  remaining: number;
  resetTime: Date | null;
  checkRateLimit: () => Promise<SecurityResult>;
  executeWithRateLimit: <T>(fn: () => Promise<T>) => Promise<T>;
  reset: () => void;
}

export const useRateLimit = (options: UseRateLimitOptions): UseRateLimitReturn => {
  const { type, context, onRateLimited, onAllowed } = options;
  
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remaining, setRemaining] = useState(999);
  const [resetTime, setResetTime] = useState<Date | null>(null);
  const lastCheckRef = useRef<number>(0);

  const checkRateLimit = useCallback(async (): Promise<SecurityResult> => {
    try {
      const result = await unifiedSecurityService.validateAction(type, undefined, context);
      
      setIsRateLimited(!result.allowed);
      setRemaining(result.remaining || 0);
      setResetTime(result.resetTime || null);
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
      const fallbackResult: SecurityResult = {
        allowed: true,
        riskLevel: 'low',
        remaining: 999,
        resetTime: new Date(Date.now() + 60000)
      };
      return fallbackResult;
    }
  }, [type, context, onRateLimited, onAllowed]);

  const executeWithRateLimit = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    const rateLimitResult = await checkRateLimit();
    
    if (!rateLimitResult.allowed) {
      const resetTimeStr = rateLimitResult.resetTime?.toLocaleTimeString() || 'later';
      throw new Error(`Rate limit exceeded. Try again after ${resetTimeStr}`);
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
  rateLimitType: SecurityActionType,
  context?: Record<string, any>
) => {
  return async (...args: T): Promise<R> => {
    const rateLimitResult = await unifiedSecurityService.validateAction(rateLimitType, undefined, context);
    
    if (!rateLimitResult.allowed) {
      const resetTimeStr = rateLimitResult.resetTime?.toLocaleTimeString() || 'later';
      throw new Error(`Rate limit exceeded. Try again after ${resetTimeStr}`);
    }

    return await fn(...args);
  };
};