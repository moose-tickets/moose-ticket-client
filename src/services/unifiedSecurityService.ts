// src/services/unifiedSecurityService.ts
// Unified security service combining frontend and backend security
import enhancedSecurityService, { SecurityActionType, SecurityResult } from './enhancedSecurityService';
import backendSecurityService from './backendSecurityService';

export { SecurityActionType } from './enhancedSecurityService';

export interface UnifiedSecurityResult extends SecurityResult {
  backendValidation?: boolean;
  localChecks?: string[];
  remoteChecks?: string[];
}

class UnifiedSecurityService {
  // Main security validation method
  async validateAction(
    action: SecurityActionType,
    input?: string,
    context?: Record<string, any>
  ): Promise<UnifiedSecurityResult> {
    const localChecks: string[] = [];
    const remoteChecks: string[] = [];
    
    console.log(`🛡️ Unified security check for: ${action}`);

    try {
      // 1. Enhanced local security check (primary)
      const localResult = await enhancedSecurityService.performComprehensiveSecurityCheck(
        action,
        input,
        context
      );
      
      localChecks.push('Device fingerprinting', 'Threat analysis', 'Session validation');

      if (!localResult.allowed) {
        console.log('🚫 Local security check failed:', localResult.reason);
        return {
          ...localResult,
          backendValidation: false,
          localChecks,
          remoteChecks: []
        };
      }

      // 2. Backend validation for critical actions
      let backendValidation = true;
      if (this.requiresBackendValidation(action)) {
        try {
          const securityRequest = backendSecurityService.createSecurityRequest(action, {
            inputData: input ? { sample: input.substring(0, 100) } : undefined,
            ...context
          });
          
          const backendResult = await backendSecurityService.validateAction(securityRequest);
          remoteChecks.push('Rate limiting', 'Global threat analysis', 'User risk scoring');
          
          if (!backendResult.allowed) {
            console.log('🚫 Backend security check failed:', backendResult.reason);
            return {
              allowed: false,
              reason: backendResult.reason || 'Backend security validation failed',
              riskLevel: 'high',
              backendValidation: false,
              requiresAdditionalAuth: backendResult.requiresMFA,
              suggestedActions: backendResult.recommendations,
              localChecks,
              remoteChecks
            };
          }
          
          backendValidation = true;
        } catch (error) {
          console.warn('Backend validation failed, proceeding with local checks only:', error);
          remoteChecks.push('Backend validation failed - offline mode');
          backendValidation = false;
        }
      }

      // 3. Return combined result
      return {
        ...localResult,
        backendValidation,
        localChecks,
        remoteChecks,
        metadata: {
          ...localResult.metadata,
          validationMethods: 'hybrid',
          backendConnected: backendValidation
        }
      };

    } catch (error) {
      console.error('Unified security check failed:', error);
      
      // Fallback to enhanced security service
      try {
        const fallbackResult = await enhancedSecurityService.performComprehensiveSecurityCheck(action, input, context);
        return {
          ...fallbackResult,
          backendValidation: false,
          localChecks: ['Enhanced security fallback'],
          remoteChecks: [],
          reason: 'Using local security only due to error'
        };
      } catch (fallbackError) {
        console.error('Fallback security check also failed:', fallbackError);
        // Return safe fallback
        return {
          allowed: true,
          riskLevel: 'medium',
          backendValidation: false,
          localChecks: ['Basic fallback'],
          remoteChecks: [],
          reason: 'Security validation unavailable - proceeding with caution'
        };
      }
    }
  }

  // Enhanced email validation
  async validateEmail(email: string): Promise<{
    isValid: boolean;
    isDisposable: boolean;
    riskScore: number;
    details: string[];
    source: 'local' | 'backend' | 'hybrid';
  }> {
    try {
      // Try backend validation first
      const backendResult = await backendSecurityService.validateEmailWithBackend(email);
      
      // Also run local validation
      const localResult = await enhancedSecurityService.validateEmailAdvanced(email);
      
      // Combine results
      return {
        isValid: backendResult.isValid && localResult.isValid,
        isDisposable: backendResult.isDisposable || localResult.isDisposable,
        riskScore: Math.max(backendResult.riskScore, localResult.riskScore),
        details: [...localResult.details, ...backendResult.suggestions],
        source: 'hybrid'
      };

    } catch (error) {
      console.warn('Backend email validation failed, using local only:', error);
      
      const localResult = await enhancedSecurityService.validateEmailAdvanced(email);
      return {
        isValid: localResult.isValid,
        isDisposable: localResult.isDisposable,
        riskScore: localResult.riskScore,
        details: localResult.details,
        source: 'local'
      };
    }
  }

  // Threat analysis
  async analyzeThreat(input: string, context?: string): Promise<{
    isThreat: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: string[];
    blocked: boolean;
    sanitizedInput?: string;
  }> {
    try {
      // Local threat analysis
      const localResult = enhancedSecurityService.analyzeInputForThreats(input);
      
      // Backend threat analysis for additional validation
      const backendResult = await backendSecurityService.analyzeThreat(input, context);
      
      // Combine results - be conservative (choose higher threat level)
      const isThreat = localResult.isThreat || backendResult.blocked;
      const severity = this.combineSeverityLevels(
        localResult.confidence > 0.7 ? 'high' : localResult.confidence > 0.4 ? 'medium' : 'low',
        backendResult.threats.length > 0 ? backendResult.threats[0].severity : 'low'
      );

      return {
        isThreat,
        severity,
        details: [
          localResult.details,
          ...backendResult.threats.map(t => t.description)
        ],
        blocked: isThreat && (severity === 'high' || severity === 'critical'),
        sanitizedInput: backendResult.sanitizedInput
      };

    } catch (error) {
      console.warn('Backend threat analysis failed, using local only:', error);
      
      const localResult = enhancedSecurityService.analyzeInputForThreats(input);
      return {
        isThreat: localResult.isThreat,
        severity: localResult.confidence > 0.7 ? 'high' : localResult.confidence > 0.4 ? 'medium' : 'low',
        details: [localResult.details],
        blocked: localResult.isThreat && localResult.confidence > 0.7
      };
    }
  }

  // Security status dashboard
  async getSecurityDashboard(): Promise<{
    deviceSecurity: any;
    sessionInfo: any;
    threatLevel: string;
    recommendations: string[];
    stats: any;
  }> {
    try {
      // Get local security stats
      const localStats = enhancedSecurityService.getSecurityStats();
      
      // Get backend security status
      const backendStatus = await backendSecurityService.getSecurityStatus();
      
      // Get biometric availability
      const biometricInfo = await enhancedSecurityService.checkBiometricAvailability();
      
      return {
        deviceSecurity: {
          platform: localStats.platform,
          biometricAvailable: biometricInfo.available,
          biometricTypes: biometricInfo.types,
          deviceTrusted: localStats.suspiciousActivityCount === 0
        },
        sessionInfo: {
          duration: localStats.sessionDuration,
          suspiciousActivities: localStats.suspiciousActivityCount,
          isDevMode: localStats.isDevMode
        },
        threatLevel: backendStatus.globalThreatLevel,
        recommendations: [
          ...backendStatus.recommendedActions,
          ...(biometricInfo.available ? [] : ['Consider enabling biometric authentication'])
        ],
        stats: {
          local: localStats,
          userRiskScore: backendStatus.userRiskScore,
          activeAlerts: backendStatus.activeAlerts
        }
      };

    } catch (error) {
      console.error('Failed to get security dashboard:', error);
      return {
        deviceSecurity: { platform: 'unknown', biometricAvailable: false, biometricTypes: [], deviceTrusted: true },
        sessionInfo: { duration: 0, suspiciousActivities: 0, isDevMode: false },
        threatLevel: 'unknown',
        recommendations: ['Security dashboard temporarily unavailable'],
        stats: {}
      };
    }
  }

  // Utility methods
  private requiresBackendValidation(action: SecurityActionType): boolean {
    const criticalActions = [
      SecurityActionType.PAYMENT_ATTEMPT,
      SecurityActionType.AUTH_LOGIN,
      SecurityActionType.AUTH_REGISTER,
      SecurityActionType.SENSITIVE_DATA_ACCESS
    ];
    
    return criticalActions.includes(action);
  }

  private combineSeverityLevels(
    local: 'low' | 'medium' | 'high' | 'critical',
    remote: 'low' | 'medium' | 'high' | 'critical'
  ): 'low' | 'medium' | 'high' | 'critical' {
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    const maxSeverity = Math.max(severityOrder[local], severityOrder[remote]);
    
    return Object.keys(severityOrder).find(
      key => severityOrder[key as keyof typeof severityOrder] === maxSeverity
    ) as 'low' | 'medium' | 'high' | 'critical';
  }

  // Cleanup and maintenance
  async clearAllSecurityData(): Promise<void> {
    await enhancedSecurityService.clearSecurityData();
    console.log('🧹 All security data cleared');
  }

  // Report security incident
  async reportIncident(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    metadata?: any
  ): Promise<boolean> {
    return await backendSecurityService.reportSecurityIncident({
      type,
      severity,
      description,
      metadata
    });
  }
}

// Export singleton
const unifiedSecurityService = new UnifiedSecurityService();

// Development helpers
if (__DEV__) {
  (global as any).getSecurityDashboard = () => unifiedSecurityService.getSecurityDashboard();
  (global as any).clearAllSecurity = () => unifiedSecurityService.clearAllSecurityData();
  console.log('🔧 Dev mode: Use getSecurityDashboard() and clearAllSecurity() in debugger');
}

export default unifiedSecurityService;