// src/services/disputeService.ts
import apiClient from "./apiClients";
import ArcjetSecurity, { RateLimitType } from "./arcjetSecurity";
import { 
  Dispute,
  CreateDisputeRequest,
  UpdateDisputeRequest,
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
  sanitizeFileName,
  redactForLogging 
} from "../utils/sanitize";

const DISPUTE_ENDPOINTS = {
  DISPUTES: '/disputes',
  DISPUTE_DETAIL: (id: string) => `/disputes/${id}`,
  DISPUTE_EVIDENCE: (id: string) => `/disputes/${id}/evidence`,
  DISPUTE_DECISIONS: (id: string) => `/disputes/${id}/decisions`,
  DISPUTE_SUMMARY: '/disputes/summary',
  DISPUTE_STATS: '/disputes/stats',
  DISPUTE_EXPORT: '/disputes/export',
} as const;

class DisputeService {

  // Dispute Management
  async getDisputes(params?: PaginationParams & { 
    status?: string; 
    dateFrom?: string; 
    dateTo?: string;
    ticketId?: string;
  }): Promise<ApiResponse<Dispute[]>> {
    try {
      // 1. Sanitize query parameters
      const sanitizedParams: any = {};
      
      if (params?.page) sanitizedParams.page = Math.max(1, parseInt(String(params.page)));
      if (params?.limit) sanitizedParams.limit = Math.min(100, Math.max(1, parseInt(String(params.limit))));
      if (params?.sortBy) sanitizedParams.sortBy = params.sortBy.trim();
      if (params?.sortOrder) sanitizedParams.sortOrder = params.sortOrder;
      if (params?.status) sanitizedParams.status = params.status;
      if (params?.dateFrom) sanitizedParams.dateFrom = params.dateFrom;
      if (params?.dateTo) sanitizedParams.dateTo = params.dateTo;
      if (params?.ticketId) sanitizedParams.ticketId = params.ticketId.trim();

      // 2. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.SEARCH_QUERY,
        sanitizedParams
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      // 3. Make API request
      const response = await apiClient.get<ApiResponse<Dispute[]>>(
        DISPUTE_ENDPOINTS.DISPUTES,
        { params: sanitizedParams }
      );

      return response.data;

    } catch (error: any) {
      console.error('Get disputes error:', error);
      
      return {
        success: false,
        error: 'Failed to get disputes',
        message: 'Unable to retrieve disputes.'
      };
    }
  }

  async getDispute(disputeId: string): Promise<ApiResponse<Dispute>> {
    try {
      // 1. Validate required ID
      if (!disputeId || disputeId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid dispute ID',
          message: 'Dispute ID is required.'
        };
      }

      // 2. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.SEARCH_QUERY,
        { action: 'get_dispute', disputeId }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      // 3. Make API request
      const response = await apiClient.get<ApiResponse<Dispute>>(
        DISPUTE_ENDPOINTS.DISPUTE_DETAIL(disputeId)
      );

      return response.data;

    } catch (error: any) {
      console.error('Get dispute error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Dispute not found',
          message: 'The requested dispute could not be found.'
        };
      }

      return {
        success: false,
        error: 'Failed to get dispute',
        message: 'Unable to retrieve dispute details.'
      };
    }
  }

  async createDispute(disputeData: CreateDisputeRequest): Promise<ApiResponse<Dispute>> {
    try {
      // 1. Validate input
      const validationRules = {
        ticketId: (id: string) => validateRequired(id, 'Ticket ID'),
        reason: (reason: string) => validateRequired(reason, 'Dispute reason'),
        reasonCode: (code: string) => validateRequired(code, 'Reason code'),
        description: (desc: string) => {
          if (!desc || desc.trim().length < 10) {
            return { isValid: false, errors: ['Description must be at least 10 characters'] };
          }
          if (desc.trim().length > 5000) {
            return { isValid: false, errors: ['Description must be less than 5000 characters'] };
          }
          return { isValid: true, errors: [] };
        },
      };

      const formValidation = await validateForm(disputeData, validationRules);
      if (!formValidation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: Object.values(formValidation.errors).flat().join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        ticketId: disputeData.ticketId.trim(),
        reason: disputeData.reason.trim(),
        reasonCode: disputeData.reasonCode.trim(),
        description: sanitizeUserContent(disputeData.description),
        contactEmail: disputeData.contactEmail?.trim(),
        contactPhone: disputeData.contactPhone?.replace(/\D/g, ''),
        evidence: disputeData.evidence || [],
      };

      // 3. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.DISPUTE_SUBMIT,
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
      console.log('Creating dispute:', redactForLogging(sanitizedData));

      // 5. Handle file uploads if present
      let formData: FormData | typeof sanitizedData = sanitizedData;
      
      if (sanitizedData.evidence && sanitizedData.evidence.length > 0) {
        formData = new FormData();
        
        // Add text fields
        Object.entries(sanitizedData).forEach(([key, value]) => {
          if (key !== 'evidence' && value !== undefined) {
            (formData as FormData).append(key, String(value));
          }
        });

        // Add evidence files
        sanitizedData.evidence.forEach((file, index) => {
          (formData as FormData).append(`evidence`, file, sanitizeFileName(`evidence_${index}`));
        });
      }

      // 6. Make API request
      const response = await apiClient.post<ApiResponse<Dispute>>(
        DISPUTE_ENDPOINTS.DISPUTES,
        formData,
        formData instanceof FormData ? {
          headers: { 'Content-Type': 'multipart/form-data' }
        } : undefined
      );

      if (response.data.success) {
        console.log('Dispute created successfully:', response.data.data?.id);
      }

      return response.data;

    } catch (error: any) {
      console.error('Create dispute error:', error);
      
      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many dispute submissions. Please try again later.'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to create dispute. Please try again.'
      };
    }
  }

  async updateDispute(disputeId: string, disputeData: UpdateDisputeRequest): Promise<ApiResponse<Dispute>> {
    try {
      // 1. Validate required ID
      if (!disputeId || disputeId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid dispute ID',
          message: 'Dispute ID is required.'
        };
      }

      // 2. Sanitize input
      const sanitizedData: UpdateDisputeRequest = {};
      
      if (disputeData.description) {
        sanitizedData.description = sanitizeUserContent(disputeData.description);
      }
      if (disputeData.contactEmail) {
        sanitizedData.contactEmail = disputeData.contactEmail.trim();
      }
      if (disputeData.contactPhone) {
        sanitizedData.contactPhone = disputeData.contactPhone.replace(/\D/g, '');
      }
      if (disputeData.status) {
        sanitizedData.status = disputeData.status;
      }

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

      // 4. Make API request
      const response = await apiClient.put<ApiResponse<Dispute>>(
        DISPUTE_ENDPOINTS.DISPUTE_DETAIL(disputeId),
        sanitizedData
      );

      if (response.data.success) {
        console.log('Dispute updated successfully:', disputeId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Update dispute error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to update dispute. Please try again.'
      };
    }
  }

  async deleteDispute(disputeId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // 1. Validate required ID
      if (!disputeId || disputeId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid dispute ID',
          message: 'Dispute ID is required.'
        };
      }

      // 2. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        { action: 'delete_dispute', disputeId }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      // 3. Make API request
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        DISPUTE_ENDPOINTS.DISPUTE_DETAIL(disputeId)
      );

      if (response.data.success) {
        console.log('Dispute deleted successfully:', disputeId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Delete dispute error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to delete dispute. Please try again.'
      };
    }
  }

  // Evidence Management
  async uploadEvidence(disputeId: string, evidenceFiles: File[], descriptions?: string[]): Promise<ApiResponse<Dispute>> {
    try {
      // 1. Validate input
      if (!disputeId || disputeId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid dispute ID',
          message: 'Dispute ID is required.'
        };
      }

      if (!evidenceFiles || evidenceFiles.length === 0) {
        return {
          success: false,
          error: 'No files provided',
          message: 'Please select files to upload.'
        };
      }

      // Validate file sizes and types
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'];

      for (const file of evidenceFiles) {
        if (file.size > maxFileSize) {
          return {
            success: false,
            error: 'File too large',
            message: `File ${file.name} is larger than 10MB.`
          };
        }

        if (!allowedTypes.includes(file.type)) {
          return {
            success: false,
            error: 'Invalid file type',
            message: `File ${file.name} has an unsupported format.`
          };
        }
      }

      // 2. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FILE_UPLOAD,
        { 
          disputeId, 
          fileCount: evidenceFiles.length,
          totalSize: evidenceFiles.reduce((sum, file) => sum + file.size, 0)
        }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      // 3. Prepare form data
      const formData = new FormData();
      
      evidenceFiles.forEach((file, index) => {
        formData.append('evidence', file, sanitizeFileName(file.name));
        
        if (descriptions && descriptions[index]) {
          formData.append(`description_${index}`, sanitizeUserContent(descriptions[index]));
        }
      });

      // 4. Make API request
      const response = await apiClient.post<ApiResponse<Dispute>>(
        DISPUTE_ENDPOINTS.DISPUTE_EVIDENCE(disputeId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        console.log('Evidence uploaded successfully for dispute:', disputeId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Upload evidence error:', error);
      
      return {
        success: false,
        error: 'Upload failed',
        message: 'Unable to upload evidence. Please try again.'
      };
    }
  }

  // Analytics and Export
  async getDisputeStats(timeRange?: string): Promise<ApiResponse<any>> {
    try {
      const params = timeRange ? { timeRange } : {};
      const response = await apiClient.get<ApiResponse<any>>(
        DISPUTE_ENDPOINTS.DISPUTE_STATS,
        { params }
      );
      return response.data;
    } catch (error: any) {
      console.error('Get dispute stats error:', error);
      
      return {
        success: false,
        error: 'Failed to get stats',
        message: 'Unable to retrieve dispute statistics.'
      };
    }
  }

  async getDisputeSummary(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(DISPUTE_ENDPOINTS.DISPUTE_SUMMARY);
      return response.data;
    } catch (error: any) {
      console.error('Get dispute summary error:', error);
      
      return {
        success: false,
        error: 'Failed to get summary',
        message: 'Unable to retrieve dispute summary.'
      };
    }
  }

  async exportDisputes(format: 'json' | 'csv' | 'pdf' = 'json', filters?: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        DISPUTE_ENDPOINTS.DISPUTE_EXPORT,
        { format, filters }
      );
      return response.data;
    } catch (error: any) {
      console.error('Export disputes error:', error);
      
      return {
        success: false,
        error: 'Export failed',
        message: 'Unable to export disputes. Please try again.'
      };
    }
  }

  // Dispute Decision Management
  async getDisputeDecisions(disputeId: string): Promise<ApiResponse<any[]>> {
    try {
      if (!disputeId || disputeId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid dispute ID',
          message: 'Dispute ID is required.'
        };
      }

      const response = await apiClient.get<ApiResponse<any[]>>(
        DISPUTE_ENDPOINTS.DISPUTE_DECISIONS(disputeId)
      );
      return response.data;
    } catch (error: any) {
      console.error('Get dispute decisions error:', error);
      
      return {
        success: false,
        error: 'Failed to get decisions',
        message: 'Unable to retrieve dispute decisions.'
      };
    }
  }

  // Bulk operations
  async bulkUpdateDisputes(disputeIds: string[], updates: Partial<UpdateDisputeRequest>): Promise<ApiResponse<any>> {
    try {
      if (!disputeIds || disputeIds.length === 0) {
        return {
          success: false,
          error: 'No disputes selected',
          message: 'Please select at least one dispute to update.'
        };
      }

      const sanitizedData = {
        disputeIds: disputeIds.map(id => id.trim()),
        updates: updates,
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

      const response = await apiClient.patch<ApiResponse<any>>(
        '/disputes/bulk-update',
        sanitizedData
      );

      return response.data;

    } catch (error: any) {
      console.error('Bulk update disputes error:', error);
      
      return {
        success: false,
        error: 'Bulk update failed',
        message: 'Unable to update selected disputes. Please try again.'
      };
    }
  }
}

export default new DisputeService();