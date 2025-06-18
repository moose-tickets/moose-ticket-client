// src/services/backendSecurityService.ts
// Service to integrate with backend security features
import axios from 'axios';

export interface BackendSecurityRequest {
  action: string;
  userAgent?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  sessionId?: string;
  inputData?: any;
  timestamp: number;
}

export interface BackendSecurityResponse {
  allowed: boolean;
  reason?: string;
  riskScore: number;
  requiresMFA?: boolean;
  blockDuration?: number;
  recommendations: string[];
}

export interface EmailValidationResponse {
  isValid: boolean;
  isDisposable: boolean;
  isFreemail: boolean;
  domain: string;
  riskScore: number;
  suggestions: string[];
}

export interface ThreatAnalysisResponse {
  threats: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }[];
  overallRisk: number;
  blocked: boolean;
  sanitizedInput?: string;
}

class BackendSecurityService {
  private readonly BASE_URL = __DEV__ 
    ? "http://localhost:3000/api"
    : "https://api.mooseticket.com/api";
    
  private readonly SECURITY_ENDPOINTS = {
    VALIDATE_ACTION: '/security/validate-action',
    VALIDATE_EMAIL: '/security/validate-email',
    ANALYZE_THREAT: '/security/analyze-threat',
    REPORT_INCIDENT: '/security/report-incident',
    GET_SECURITY_STATUS: '/security/status',
  };

  // Validate action with backend security service
  async validateAction(request: BackendSecurityRequest): Promise<BackendSecurityResponse> {
    try {
      console.log('🛡️ Validating action with backend security service:', request.action);
      
      const response = await axios.post(`${this.BASE_URL}${this.SECURITY_ENDPOINTS.VALIDATE_ACTION}`, {
        ...request,
        clientType: 'react-native',
        appVersion: '1.0.0', // You can get this from Constants
      });

      if (response.data?.success) {
        const result = response.data.data as BackendSecurityResponse;
        
        if (!result.allowed) {
          console.warn('🚫 Backend security blocked action:', result.reason);
        } else {
          console.log('✅ Backend security approved action');
        }
        
        return result;
      }

      // Fallback response if backend doesn't respond properly
      return {
        allowed: true,
        riskScore: 0.1,
        recommendations: ['Backend security validation unavailable']
      };

    } catch (error: any) {
      console.error('Backend security validation failed:', error);
      
      // Fail open for user experience, but log the issue
      return {
        allowed: true,
        riskScore: 0.5,
        recommendations: ['Security validation temporarily unavailable']
      };
    }
  }

  // Advanced email validation via backend
  async validateEmailWithBackend(email: string): Promise<EmailValidationResponse> {
    try {
      const response = await axios.post(`${this.BASE_URL}${this.SECURITY_ENDPOINTS.VALIDATE_EMAIL}`, {
        email: email.toLowerCase().trim(),
        timestamp: Date.now()
      });

      if (response.data?.success) {
        return response.data.data as EmailValidationResponse;
      }

      // Fallback to basic validation
      return this.basicEmailValidation(email);

    } catch (error) {
      console.error('Backend email validation failed:', error);
      return this.basicEmailValidation(email);
    }
  }

  // Threat analysis via backend
  async analyzeThreat(input: string, context?: string): Promise<ThreatAnalysisResponse> {
    try {
      const response = await axios.post(`${this.BASE_URL}${this.SECURITY_ENDPOINTS.ANALYZE_THREAT}`, {
        input,
        context,
        timestamp: Date.now(),
        clientInfo: {
          platform: 'react-native',
          // Add other relevant client info
        }
      });

      if (response.data?.success) {
        return response.data.data as ThreatAnalysisResponse;
      }

      // Fallback response
      return {
        threats: [],
        overallRisk: 0,
        blocked: false
      };

    } catch (error) {
      console.error('Backend threat analysis failed:', error);
      return {
        threats: [],
        overallRisk: 0,
        blocked: false
      };
    }
  }

  // Report security incident to backend
  async reportSecurityIncident(incident: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    metadata?: any;
  }): Promise<boolean> {
    try {
      const response = await axios.post(`${this.BASE_URL}${this.SECURITY_ENDPOINTS.REPORT_INCIDENT}`, {
        ...incident,
        timestamp: Date.now(),
        reportedBy: 'mobile-app'
      });

      return response.data?.success || false;

    } catch (error) {
      console.error('Failed to report security incident:', error);
      return false;
    }
  }

  // Get current security status from backend
  async getSecurityStatus(): Promise<{
    globalThreatLevel: 'low' | 'medium' | 'high' | 'critical';
    userRiskScore: number;
    activeAlerts: string[];
    recommendedActions: string[];
  }> {
    try {
      const response = await axios.get(`${this.BASE_URL}${this.SECURITY_ENDPOINTS.GET_SECURITY_STATUS}`);

      if (response.data?.success) {
        return response.data.data;
      }

      return {
        globalThreatLevel: 'low',
        userRiskScore: 0.1,
        activeAlerts: [],
        recommendedActions: []
      };

    } catch (error) {
      console.error('Failed to get security status:', error);
      return {
        globalThreatLevel: 'low',
        userRiskScore: 0.1,
        activeAlerts: ['Security status unavailable'],
        recommendedActions: ['Check internet connection']
      };
    }
  }

  // Fallback email validation
  private basicEmailValidation(email: string): EmailValidationResponse {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    const domain = email.split('@')[1] || '';
    const freemailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const disposableDomains = ['10minutemail.com', 'tempmail.org'];
    
    const isFreemail = freemailDomains.includes(domain.toLowerCase());
    const isDisposable = disposableDomains.includes(domain.toLowerCase());

    return {
      isValid,
      isDisposable,
      isFreemail,
      domain,
      riskScore: isDisposable ? 0.8 : isFreemail ? 0.2 : 0.1,
      suggestions: isValid ? [] : ['Please enter a valid email address']
    };
  }

  // Helper method to create security request
  createSecurityRequest(
    action: string,
    additionalData?: any
  ): BackendSecurityRequest {
    return {
      action,
      timestamp: Date.now(),
      deviceFingerprint: 'mobile_device', // Get from enhanced security service
      userAgent: 'MooseTicketApp/1.0.0 React-Native',
      ...additionalData
    };
  }
}

// Export singleton
const backendSecurityService = new BackendSecurityService();
export default backendSecurityService;