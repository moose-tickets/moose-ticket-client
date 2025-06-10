// src/services/arcjetSecurity.ts
import Constants from "expo-constants";

let Arcjet: any;
try {
  // Attempt to require the Arcjet SDK; if it isn't installed, catch the error
  Arcjet = require("arcjet");
} catch (e) {
  console.warn(
    "⚠️ arcjet package not found. Security features will be disabled.",
    e
  );
}

// Security types
export type BotContext = { 
  score: number; 
  isHuman: boolean; 
  confidence: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
};

export type EmailValidationResult = {
  isValid: boolean;
  isDisposable: boolean;
  domain: string;
  score: number;
  reason?: string;
};

export type AttackProtectionResult = {
  allowed: boolean;
  attackType?: 'sql_injection' | 'xss' | 'path_traversal' | 'command_injection';
  threat: 'none' | 'low' | 'medium' | 'high' | 'critical';
  blocked: boolean;
};

export type SecurityContext = {
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  fingerprint?: string;
};

// Rate limiting configurations
export enum RateLimitType {
  AUTH_LOGIN = 'auth_login',
  AUTH_SIGNUP = 'auth_signup',
  AUTH_FORGOT_PASSWORD = 'auth_forgot_password',
  PAYMENT_SUBMIT = 'payment_submit',
  FORM_SUBMIT = 'form_submit',
  SEARCH_QUERY = 'search_query',
  PROFILE_UPDATE = 'profile_update',
  TICKET_CREATE = 'ticket_create',
  DISPUTE_SUBMIT = 'dispute_submit',
  FILE_UPLOAD = 'file_upload',
}

const RATE_LIMIT_CONFIGS = {
  [RateLimitType.AUTH_LOGIN]: { requests: 5, window: '15m' },
  [RateLimitType.AUTH_SIGNUP]: { requests: 3, window: '1h' },
  [RateLimitType.AUTH_FORGOT_PASSWORD]: { requests: 3, window: '1h' },
  [RateLimitType.PAYMENT_SUBMIT]: { requests: 5, window: '1h' },
  [RateLimitType.FORM_SUBMIT]: { requests: 10, window: '1h' },
  [RateLimitType.SEARCH_QUERY]: { requests: 50, window: '1h' },
  [RateLimitType.PROFILE_UPDATE]: { requests: 10, window: '1h' },
  [RateLimitType.TICKET_CREATE]: { requests: 20, window: '1h' },
  [RateLimitType.DISPUTE_SUBMIT]: { requests: 5, window: '1h' },
  [RateLimitType.FILE_UPLOAD]: { requests: 10, window: '1h' },
};

class ArcjetSecurity {
  private static instance: any = null;
  private static isInitialized = false;

  static initialize() {
    if (!Arcjet) {
      console.warn("Arcjet not available - security features disabled");
      return;
    }
    
    if (!ArcjetSecurity.instance) {
      const apiKey = Constants.expoConfig?.extra?.ARCHET_API_KEY ?? "";
      if (!apiKey) {
        console.warn(
          "⚠️ ARCHET_API_KEY is missing in Constants.expoConfig.extra – Arcjet not initialized."
        );
        return;
      }
      
      try {
        ArcjetSecurity.instance = new Arcjet({
          apiKey,
          environment: __DEV__ ? "development" : "production",
          // Enhanced configuration
          rules: [
            // Bot detection rules
            {
              type: 'bot',
              mode: 'live',
              allow: [], // Block all bots by default
            },
            // Rate limiting rules
            {
              type: 'rate-limit',
              mode: 'live',
              characteristics: ['ip', 'userId'],
            },
            // Email validation rules
            {
              type: 'email',
              mode: 'live',
              block: ['disposable', 'invalid'],
            },
            // Attack protection rules
            {
              type: 'shield',
              mode: 'live',
            }
          ]
        });
        
        ArcjetSecurity.isInitialized = true;
        console.log("✅ Arcjet Security initialized successfully");
      } catch (error) {
        console.error("❌ Failed to initialize Arcjet Security:", error);
      }
    }
  }

  static getInstance(): any {
    if (!Arcjet) {
      throw new Error("Arcjet SDK not loaded. Cannot call getInstance().");
    }
    if (!ArcjetSecurity.instance) {
      throw new Error("ArcjetSecurity not initialized; call initialize() first.");
    }
    return ArcjetSecurity.instance;
  }

  static isAvailable(): boolean {
    return !!Arcjet && ArcjetSecurity.isInitialized;
  }

  // Enhanced bot detection
  static async getBotContext(context?: SecurityContext): Promise<BotContext> {
    if (!ArcjetSecurity.isAvailable()) {
      return { 
        score: 1, 
        isHuman: true, 
        confidence: 'low',
        riskLevel: 'low'
      };
    }

    try {
      const arcjet = ArcjetSecurity.getInstance();
      const deviceInfo = {
        platform: Constants.platform?.os ?? "unknown",
        sdkVersion: Constants.expoConfig?.sdkVersion ?? "unknown",
        appVersion: Constants.expoConfig?.version ?? "unknown",
        ...context
      };

      const result = await arcjet.protect({
        type: 'bot',
        ...deviceInfo
      });

      const score = result.decision?.score ?? 1;
      const isHuman = score < 0.5; // More strict bot detection
      
      let confidence: 'low' | 'medium' | 'high' = 'low';
      if (score < 0.2 || score > 0.8) confidence = 'high';
      else if (score < 0.4 || score > 0.6) confidence = 'medium';

      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (score > 0.9) riskLevel = 'critical';
      else if (score > 0.7) riskLevel = 'high';
      else if (score > 0.5) riskLevel = 'medium';

      return {
        score,
        isHuman,
        confidence,
        riskLevel
      };
    } catch (error) {
      console.error("Bot detection error:", error);
      return { 
        score: 1, 
        isHuman: true, 
        confidence: 'low',
        riskLevel: 'low'
      };
    }
  }

  // Rate limiting
  static async checkRateLimit(
    type: RateLimitType, 
    context?: SecurityContext
  ): Promise<RateLimitResult> {
    if (!ArcjetSecurity.isAvailable()) {
      return {
        allowed: true,
        remaining: 999,
        resetTime: new Date(Date.now() + 60000),
        limit: 999
      };
    }

    try {
      const arcjet = ArcjetSecurity.getInstance();
      const config = RATE_LIMIT_CONFIGS[type];
      
      const result = await arcjet.protect({
        type: 'rate-limit',
        max: config.requests,
        window: config.window,
        characteristics: context ? [context.userId, context.ip] : ['ip'],
        ...context
      });

      return {
        allowed: result.conclusion === 'ALLOW',
        remaining: result.reason?.remaining ?? config.requests,
        resetTime: new Date(result.reason?.resetTime ?? Date.now() + 60000),
        limit: config.requests
      };
    } catch (error) {
      console.error("Rate limit check error:", error);
      return {
        allowed: true,
        remaining: 999,
        resetTime: new Date(Date.now() + 60000),
        limit: 999
      };
    }
  }

  // Email validation
  static async validateEmail(email: string): Promise<EmailValidationResult> {
    if (!ArcjetSecurity.isAvailable()) {
      // Basic fallback validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: emailRegex.test(email),
        isDisposable: false,
        domain: email.split('@')[1] || '',
        score: emailRegex.test(email) ? 1 : 0
      };
    }

    try {
      const arcjet = ArcjetSecurity.getInstance();
      
      const result = await arcjet.protect({
        type: 'email',
        email: email.toLowerCase().trim()
      });

      return {
        isValid: result.conclusion === 'ALLOW',
        isDisposable: result.reason?.includes('disposable') ?? false,
        domain: email.split('@')[1] || '',
        score: result.decision?.score ?? 0,
        reason: result.reason
      };
    } catch (error) {
      console.error("Email validation error:", error);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: emailRegex.test(email),
        isDisposable: false,
        domain: email.split('@')[1] || '',
        score: emailRegex.test(email) ? 1 : 0
      };
    }
  }

  // Attack protection (SQL injection, XSS, etc.)
  static async protectAgainstAttacks(
    input: string | Record<string, any>,
    context?: SecurityContext
  ): Promise<AttackProtectionResult> {
    if (!ArcjetSecurity.isAvailable()) {
      return {
        allowed: true,
        threat: 'none',
        blocked: false
      };
    }

    try {
      const arcjet = ArcjetSecurity.getInstance();
      
      const result = await arcjet.protect({
        type: 'shield',
        input: typeof input === 'string' ? input : JSON.stringify(input),
        ...context
      });

      let threat: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
      if (result.decision?.score > 0.9) threat = 'critical';
      else if (result.decision?.score > 0.7) threat = 'high';
      else if (result.decision?.score > 0.5) threat = 'medium';
      else if (result.decision?.score > 0.2) threat = 'low';

      return {
        allowed: result.conclusion === 'ALLOW',
        attackType: result.reason?.type,
        threat,
        blocked: result.conclusion === 'DENY'
      };
    } catch (error) {
      console.error("Attack protection error:", error);
      return {
        allowed: true,
        threat: 'none',
        blocked: false
      };
    }
  }

  // Data redaction for sensitive information
  static redactSensitiveData(
    data: Record<string, any>, 
    sensitiveFields: string[] = ['password', 'ssn', 'creditCard', 'cvv']
  ): Record<string, any> {
    const redacted = { ...data };
    
    sensitiveFields.forEach(field => {
      if (redacted[field]) {
        if (typeof redacted[field] === 'string') {
          const value = redacted[field] as string;
          if (field === 'creditCard') {
            // Mask credit card: show only last 4 digits
            redacted[field] = '**** **** **** ' + value.slice(-4);
          } else if (field === 'ssn') {
            // Mask SSN: show only last 4 digits
            redacted[field] = '***-**-' + value.slice(-4);
          } else {
            // Completely redact passwords, CVV, etc.
            redacted[field] = '[REDACTED]';
          }
        }
      }
    });

    return redacted;
  }

  // Input sanitization
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove basic HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/script/gi, 'scriipt') // Neutralize script tags
      .replace(/\0/g, ''); // Remove null bytes
  }

  // Comprehensive security check combining all features
  static async performSecurityCheck(
    action: RateLimitType,
    data?: Record<string, any>,
    context?: SecurityContext
  ): Promise<{
    allowed: boolean;
    botCheck: BotContext;
    rateLimit: RateLimitResult;
    attackProtection?: AttackProtectionResult;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    try {
      // Perform bot detection
      const botCheck = await this.getBotContext(context);
      if (!botCheck.isHuman && botCheck.riskLevel === 'critical') {
        errors.push('Suspicious bot activity detected');
      }

      // Check rate limits
      const rateLimit = await this.checkRateLimit(action, context);
      if (!rateLimit.allowed) {
        errors.push(`Rate limit exceeded. Try again after ${rateLimit.resetTime.toLocaleTimeString()}`);
      }

      // Check for attacks if data is provided
      let attackProtection: AttackProtectionResult | undefined;
      if (data) {
        attackProtection = await this.protectAgainstAttacks(data, context);
        if (!attackProtection.allowed) {
          errors.push('Potentially malicious input detected');
        }
      }

      const allowed = errors.length === 0;

      return {
        allowed,
        botCheck,
        rateLimit,
        attackProtection,
        errors
      };
    } catch (error) {
      console.error("Security check error:", error);
      return {
        allowed: true, // Fail open for user experience
        botCheck: { score: 1, isHuman: true, confidence: 'low', riskLevel: 'low' },
        rateLimit: { allowed: true, remaining: 999, resetTime: new Date(), limit: 999 },
        errors: []
      };
    }
  }
}

export default ArcjetSecurity;