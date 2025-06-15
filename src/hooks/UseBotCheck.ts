// src/hooks/useBotCheck.ts
import { useState, useEffect, useCallback } from 'react';
import unifiedSecurityService, { SecurityActionType } from '../services/unifiedSecurityService';

export interface BotContext {
  score: number;
  isHuman: boolean;
  confidence: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface UseBotCheckOptions {
  context?: Record<string, any>;
  autoCheck?: boolean;
  onBotDetected?: (context: BotContext) => void;
  onHumanVerified?: (context: BotContext) => void;
}

export interface UseBotCheckReturn {
  botContext: BotContext | null;
  isChecking: boolean;
  isHuman: boolean;
  riskLevel: BotContext['riskLevel'];
  checkBot: () => Promise<BotContext>;
  reset: () => void;
}

export const useBotCheck = (options: UseBotCheckOptions = {}): UseBotCheckReturn => {
  const {
    context,
    autoCheck = false,
    onBotDetected,
    onHumanVerified
  } = options;

  const [botContext, setBotContext] = useState<BotContext | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkBot = useCallback(async (): Promise<BotContext> => {
    setIsChecking(true);
    
    try {
      // Use unified security service for comprehensive device checks
      const securityResult = await unifiedSecurityService.validateAction(SecurityActionType.API_REQUEST, undefined, context);
      
      // Convert security result to bot context format
      const result: BotContext = {
        score: securityResult.riskLevel === 'critical' ? 0.9 : securityResult.riskLevel === 'high' ? 0.7 : securityResult.riskLevel === 'medium' ? 0.4 : 0.1,
        isHuman: securityResult.allowed,
        confidence: securityResult.riskLevel === 'critical' ? 'high' : securityResult.riskLevel === 'high' ? 'medium' : 'low',
        riskLevel: securityResult.riskLevel
      };
      
      setBotContext(result);

      // Trigger callbacks based on result
      if (!result.isHuman && result.riskLevel === 'critical') {
        onBotDetected?.(result);
      } else if (result.isHuman) {
        onHumanVerified?.(result);
      }

      return result;
    } catch (error) {
      console.error('Bot check failed:', error);
      const fallbackContext: BotContext = {
        score: 0.1,
        isHuman: true,
        confidence: 'low',
        riskLevel: 'low'
      };
      setBotContext(fallbackContext);
      return fallbackContext;
    } finally {
      setIsChecking(false);
    }
  }, [context, onBotDetected, onHumanVerified]);

  const reset = useCallback(() => {
    setBotContext(null);
    setIsChecking(false);
  }, []);

  // Auto-check on mount if enabled
  useEffect(() => {
    if (autoCheck && !botContext && !isChecking) {
      checkBot();
    }
  }, [autoCheck, botContext, isChecking, checkBot]);

  return {
    botContext,
    isChecking,
    isHuman: botContext?.isHuman ?? true,
    riskLevel: botContext?.riskLevel ?? 'low',
    checkBot,
    reset
  };
};