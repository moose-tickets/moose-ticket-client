// src/hooks/useBotCheck.ts
import { useState, useEffect, useCallback } from 'react';

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
      // Simplified bot check - rate limiting disabled, always allow
      const result: BotContext = {
        score: 0.1,
        isHuman: true,
        confidence: 'low',
        riskLevel: 'low'
      };
      
      setBotContext(result);

      // Trigger human verified callback
      onHumanVerified?.(result);

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