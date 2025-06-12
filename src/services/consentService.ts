// src/services/consentService.ts
import apiClient from "./apiClients";
import ArcjetSecurity, { RateLimitType } from "./arcjetSecurity";
import { 
  ApiResponse,
  PaginationParams
} from "../types/api";
import { 
  validateRequired,
  validateForm
} from "../utils/validators";
import { 
  sanitizeUserContent,
  sanitizeFormData,
  redactForLogging 
} from "../utils/sanitize";

interface ConsentRecord {
  id: string;
  policyType: string;
  policyVersion: string;
  consentGiven: boolean;
  consentDate: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

interface PolicyVersion {
  id: string;
  policyType: string;
  version: string;
  content: string;
  effectiveDate: string;
  isActive: boolean;
  createdAt: string;
}

interface ConsentRequest {
  policyType: string;
  policyVersion: string;
  consentGiven: boolean;
  metadata?: Record<string, any>;
}

const CONSENT_ENDPOINTS = {
  CONSENT_RECORDS: '/consent/records',
  CONSENT_RECORD_DETAIL: (id: string) => `/consent/records/${id}`,
  CONSENT_WITHDRAW: (id: string) => `/consent/records/${id}/withdraw`,
  POLICY_VERSIONS: '/consent/policies',
  POLICY_VERSION_DETAIL: (id: string) => `/consent/policies/${id}`,
  CURRENT_POLICIES: '/consent/policies/current',
  CONSENT_GIVE: '/consent/give',
  CONSENT_STATUS: '/consent/status',
  CONSENT_HISTORY: '/consent/history',
  COMPLIANCE_REPORT: '/consent/compliance/report',
} as const;

class ConsentService {

  // Consent Record Management
  async getConsentRecords(params?: PaginationParams & { 
    policyType?: string; 
    consentGiven?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<ConsentRecord[]>> {
    try {
      // 1. Sanitize query parameters
      const sanitizedParams: any = {};
      
      if (params?.page) sanitizedParams.page = Math.max(1, parseInt(String(params.page)));
      if (params?.limit) sanitizedParams.limit = Math.min(100, Math.max(1, parseInt(String(params.limit))));
      if (params?.sortBy) sanitizedParams.sortBy = params.sortBy.trim();
      if (params?.sortOrder) sanitizedParams.sortOrder = params.sortOrder;
      if (params?.policyType) sanitizedParams.policyType = params.policyType;
      if (params?.consentGiven !== undefined) sanitizedParams.consentGiven = params.consentGiven;
      if (params?.dateFrom) sanitizedParams.dateFrom = params.dateFrom;
      if (params?.dateTo) sanitizedParams.dateTo = params.dateTo;

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<ConsentRecord[]>>(
        CONSENT_ENDPOINTS.CONSENT_RECORDS,
        { params: sanitizedParams }
      );

      return response.data;

    } catch (error: any) {
      console.error('Get consent records error:', error);
      
      return {
        success: false,
        error: 'Failed to get consent records',
        message: 'Unable to retrieve consent records.'
      };
    }
  }

  async getConsentRecord(recordId: string): Promise<ApiResponse<ConsentRecord>> {
    try {
      // 1. Validate required ID
      if (!recordId || recordId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid record ID',
          message: 'Consent record ID is required.'
        };
      }

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<ConsentRecord>>(
        CONSENT_ENDPOINTS.CONSENT_RECORD_DETAIL(recordId)
      );

      return response.data;

    } catch (error: any) {
      console.error('Get consent record error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Consent record not found',
          message: 'The requested consent record could not be found.'
        };
      }

      return {
        success: false,
        error: 'Failed to get consent record',
        message: 'Unable to retrieve consent record details.'
      };
    }
  }

  async giveConsent(consentData: ConsentRequest): Promise<ApiResponse<ConsentRecord>> {
    try {
      // 1. Validate input
      const validationRules = {
        policyType: (type: string) => validateRequired(type, 'Policy type'),
        policyVersion: (version: string) => validateRequired(version, 'Policy version'),
        consentGiven: (consent: boolean) => {
          if (typeof consent !== 'boolean') {
            return { isValid: false, errors: ['Consent must be true or false'] };
          }
          return { isValid: true, errors: [] };
        },
      };

      const formValidation = await validateForm(consentData, validationRules);
      if (!formValidation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: Object.values(formValidation.errors).flat().join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        policyType: consentData.policyType.trim(),
        policyVersion: consentData.policyVersion.trim(),
        consentGiven: consentData.consentGiven,
        metadata: consentData.metadata || {},
      };

      // 3. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        sanitizedData
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      // 4. Log sanitized request
      console.log('Recording consent:', redactForLogging(sanitizedData));

      // 5. Make API request
      const response = await apiClient.post<ApiResponse<ConsentRecord>>(
        CONSENT_ENDPOINTS.CONSENT_GIVE,
        sanitizedData
      );

      if (response.data.success) {
        console.log('Consent recorded successfully:', response.data.data?.id);
      }

      return response.data;

    } catch (error: any) {
      console.error('Give consent error:', error);
      
      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many consent submissions. Please try again later.'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to record consent. Please try again.'
      };
    }
  }

  async withdrawConsent(recordId: string, reason?: string): Promise<ApiResponse<ConsentRecord>> {
    try {
      // 1. Validate required ID
      if (!recordId || recordId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid record ID',
          message: 'Consent record ID is required.'
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        reason: reason ? sanitizeUserContent(reason) : undefined,
      };

      // 3. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        { action: 'withdraw_consent', recordId, ...sanitizedData }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      // 4. Make API request
      const response = await apiClient.post<ApiResponse<ConsentRecord>>(
        CONSENT_ENDPOINTS.CONSENT_WITHDRAW(recordId),
        sanitizedData
      );

      if (response.data.success) {
        console.log('Consent withdrawn successfully:', recordId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Withdraw consent error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to withdraw consent. Please try again.'
      };
    }
  }

  // Policy Version Management
  async getPolicyVersions(policyType?: string): Promise<ApiResponse<PolicyVersion[]>> {
    try {
      const params = policyType ? { policyType } : {};
      const response = await apiClient.get<ApiResponse<PolicyVersion[]>>(
        CONSENT_ENDPOINTS.POLICY_VERSIONS,
        { params }
      );

      return response.data;

    } catch (error: any) {
      console.error('Get policy versions error:', error);
      
      return {
        success: false,
        error: 'Failed to get policy versions',
        message: 'Unable to retrieve policy versions.'
      };
    }
  }

  async getCurrentPolicies(): Promise<ApiResponse<PolicyVersion[]>> {
    try {
      const response = await apiClient.get<ApiResponse<PolicyVersion[]>>(
        CONSENT_ENDPOINTS.CURRENT_POLICIES
      );

      return response.data;

    } catch (error: any) {
      console.error('Get current policies error:', error);
      
      return {
        success: false,
        error: 'Failed to get current policies',
        message: 'Unable to retrieve current policies.'
      };
    }
  }

  async getPolicyVersion(policyId: string): Promise<ApiResponse<PolicyVersion>> {
    try {
      // 1. Validate required ID
      if (!policyId || policyId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid policy ID',
          message: 'Policy ID is required.'
        };
      }

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<PolicyVersion>>(
        CONSENT_ENDPOINTS.POLICY_VERSION_DETAIL(policyId)
      );

      return response.data;

    } catch (error: any) {
      console.error('Get policy version error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Policy not found',
          message: 'The requested policy could not be found.'
        };
      }

      return {
        success: false,
        error: 'Failed to get policy version',
        message: 'Unable to retrieve policy version details.'
      };
    }
  }

  // Consent Status and History
  async getConsentStatus(policyType?: string): Promise<ApiResponse<any>> {
    try {
      const params = policyType ? { policyType } : {};
      const response = await apiClient.get<ApiResponse<any>>(
        CONSENT_ENDPOINTS.CONSENT_STATUS,
        { params }
      );

      return response.data;

    } catch (error: any) {
      console.error('Get consent status error:', error);
      
      return {
        success: false,
        error: 'Failed to get consent status',
        message: 'Unable to retrieve consent status.'
      };
    }
  }

  async getConsentHistory(params?: PaginationParams & { policyType?: string }): Promise<ApiResponse<ConsentRecord[]>> {
    try {
      // 1. Sanitize query parameters
      const sanitizedParams: any = {};
      
      if (params?.page) sanitizedParams.page = Math.max(1, parseInt(String(params.page)));
      if (params?.limit) sanitizedParams.limit = Math.min(100, Math.max(1, parseInt(String(params.limit))));
      if (params?.sortBy) sanitizedParams.sortBy = params.sortBy.trim();
      if (params?.sortOrder) sanitizedParams.sortOrder = params.sortOrder;
      if (params?.policyType) sanitizedParams.policyType = params.policyType;

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<ConsentRecord[]>>(
        CONSENT_ENDPOINTS.CONSENT_HISTORY,
        { params: sanitizedParams }
      );

      return response.data;

    } catch (error: any) {
      console.error('Get consent history error:', error);
      
      return {
        success: false,
        error: 'Failed to get consent history',
        message: 'Unable to retrieve consent history.'
      };
    }
  }

  // Compliance and Reporting
  async getComplianceReport(params?: { 
    dateFrom?: string; 
    dateTo?: string; 
    policyType?: string;
    format?: 'json' | 'csv' | 'pdf';
  }): Promise<ApiResponse<any>> {
    try {
      const sanitizedParams: any = {};
      
      if (params?.dateFrom) sanitizedParams.dateFrom = params.dateFrom;
      if (params?.dateTo) sanitizedParams.dateTo = params.dateTo;
      if (params?.policyType) sanitizedParams.policyType = params.policyType;
      if (params?.format) sanitizedParams.format = params.format;

      const response = await apiClient.get<ApiResponse<any>>(
        CONSENT_ENDPOINTS.COMPLIANCE_REPORT,
        { params: sanitizedParams }
      );

      return response.data;

    } catch (error: any) {
      console.error('Get compliance report error:', error);
      
      return {
        success: false,
        error: 'Failed to get compliance report',
        message: 'Unable to retrieve compliance report.'
      };
    }
  }

  // Bulk consent operations
  async bulkGiveConsent(consentRequests: ConsentRequest[]): Promise<ApiResponse<any>> {
    try {
      if (!consentRequests || consentRequests.length === 0) {
        return {
          success: false,
          error: 'No consent requests provided',
          message: 'Please provide at least one consent request.'
        };
      }

      // Validate and sanitize each consent request
      const sanitizedRequests = consentRequests.map(request => ({
        policyType: request.policyType.trim(),
        policyVersion: request.policyVersion.trim(),
        consentGiven: request.consentGiven,
        metadata: request.metadata || {},
      }));

      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        { action: 'bulk_consent', requestCount: sanitizedRequests.length }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      const response = await apiClient.post<ApiResponse<any>>(
        '/consent/bulk-give',
        { consents: sanitizedRequests }
      );

      return response.data;

    } catch (error: any) {
      console.error('Bulk give consent error:', error);
      
      return {
        success: false,
        error: 'Bulk consent failed',
        message: 'Unable to process bulk consent. Please try again.'
      };
    }
  }

  // Privacy rights management
  async requestDataExport(format: 'json' | 'csv' = 'json'): Promise<ApiResponse<any>> {
    try {
      const sanitizedData = { format };

      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        sanitizedData
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      const response = await apiClient.post<ApiResponse<any>>(
        '/consent/data-export',
        sanitizedData
      );

      return response.data;

    } catch (error: any) {
      console.error('Request data export error:', error);
      
      return {
        success: false,
        error: 'Export request failed',
        message: 'Unable to request data export. Please try again.'
      };
    }
  }

  async requestDataDeletion(reason?: string): Promise<ApiResponse<any>> {
    try {
      const sanitizedData = {
        reason: reason ? sanitizeUserContent(reason) : undefined,
      };

      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        sanitizedData
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      const response = await apiClient.post<ApiResponse<any>>(
        '/consent/data-deletion',
        sanitizedData
      );

      return response.data;

    } catch (error: any) {
      console.error('Request data deletion error:', error);
      
      return {
        success: false,
        error: 'Deletion request failed',
        message: 'Unable to request data deletion. Please try again.'
      };
    }
  }

  // Cookie consent management
  async getCookiePreferences(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        '/consent/cookies/preferences'
      );
      return response.data;
    } catch (error: any) {
      console.error('Get cookie preferences error:', error);
      
      return {
        success: false,
        error: 'Failed to get cookie preferences',
        message: 'Unable to retrieve cookie preferences.'
      };
    }
  }

  async updateCookiePreferences(preferences: Record<string, boolean>): Promise<ApiResponse<any>> {
    try {
      const sanitizedData = sanitizeFormData(preferences, {
        essential: (val: boolean) => val,
        functional: (val: boolean) => val,
        analytics: (val: boolean) => val,
        marketing: (val: boolean) => val,
      });

      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.PROFILE_UPDATE,
        sanitizedData
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      const response = await apiClient.put<ApiResponse<any>>(
        '/consent/cookies/preferences',
        sanitizedData
      );

      return response.data;

    } catch (error: any) {
      console.error('Update cookie preferences error:', error);
      
      return {
        success: false,
        error: 'Update failed',
        message: 'Unable to update cookie preferences. Please try again.'
      };
    }
  }
}

export default new ConsentService();