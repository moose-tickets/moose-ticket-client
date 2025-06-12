// src/hooks/useBotCheck.ts
import { useState, useEffect, useCallback } from 'react';
import ArcjetSecurity, { BotContext, SecurityContext } from '../services/arcjetSecurity';

export interface UseBotCheckOptions {
  context?: SecurityContext;
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
      const result = await ArcjetSecurity.getBotContext(context);
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
        score: 1,
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