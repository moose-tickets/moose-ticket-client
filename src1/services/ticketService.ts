// src/services/ticketService.ts
import apiClient from "./apiClients";
import ArcjetSecurity, { RateLimitType } from "./arcjetSecurity";
import { 
  Ticket,
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketFilters,
  Dispute,
  CreateDisputeRequest,
  Payment,
  PaymentRequest,
  ApiResponse,
  PaginationParams
} from "../types/api";
import { 
  validateLicensePlate, 
  validateRequired,
  validateForm
} from "../utils/validators";
import { 
  sanitizeLicensePlate,
  sanitizeUserContent,
  sanitizeFormData,
  sanitizeFileName,
  redactForLogging 
} from "../utils/sanitize";

const TICKET_ENDPOINTS = {
  TICKETS: '/tickets',
  TICKET_DETAIL: (id: string) => `/tickets/${id}`,
  TICKET_PAY: (id: string) => `/tickets/${id}/pay`,
  TICKET_DISPUTE: (id: string) => `/tickets/${id}/dispute`,
  DISPUTES: '/disputes',
  DISPUTE_DETAIL: (id: string) => `/disputes/${id}`,
  PAYMENTS: '/payments',
  PAYMENT_DETAIL: (id: string) => `/payments/${id}`,
  UPLOAD_EVIDENCE: (disputeId: string) => `/disputes/${disputeId}/evidence`,
} as const;

class TicketService {

  // Ticket Management
  async getTickets(params?: PaginationParams & TicketFilters): Promise<ApiResponse<Ticket[]>> {
    try {
      // 1. Sanitize query parameters
      const sanitizedParams: any = {};
      
      if (params?.page) sanitizedParams.page = Math.max(1, parseInt(String(params.page)));
      if (params?.limit) sanitizedParams.limit = Math.min(100, Math.max(1, parseInt(String(params.limit))));
      if (params?.sortBy) sanitizedParams.sortBy = params.sortBy.trim();
      if (params?.sortOrder) sanitizedParams.sortOrder = params.sortOrder;
      
      // Filter parameters
      if (params?.status) sanitizedParams.status = params.status;
      if (params?.dateFrom) sanitizedParams.dateFrom = params.dateFrom;
      if (params?.dateTo) sanitizedParams.dateTo = params.dateTo;
      if (params?.minAmount) sanitizedParams.minAmount = Math.max(0, params.minAmount);
      if (params?.maxAmount) sanitizedParams.maxAmount = Math.max(0, params.maxAmount);
      if (params?.licensePlate) sanitizedParams.licensePlate = sanitizeLicensePlate(params.licensePlate);
      if (params?.city) sanitizedParams.city = sanitizeUserContent(params.city);

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
      const response = await apiClient.get<ApiResponse<Ticket[]>>(
        TICKET_ENDPOINTS.TICKETS,
        { params: sanitizedParams }
      );

      return response.data;

    } catch (error: any) {
      console.error('Get tickets error:', error);
      
      return {
        success: false,
        error: 'Failed to get tickets',
        message: 'Unable to retrieve tickets.'
      };
    }
  }

  async getTicket(ticketId: string): Promise<ApiResponse<Ticket>> {
    try {
      // 1. Validate required ID
      if (!ticketId || ticketId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid ticket',
          message: 'Ticket ID is required.'
        };
      }

      // 2. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.SEARCH_QUERY,
        { action: 'get_ticket', ticketId }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      // 3. Make API request
      const response = await apiClient.get<ApiResponse<Ticket>>(
        TICKET_ENDPOINTS.TICKET_DETAIL(ticketId)
      );

      return response.data;

    } catch (error: any) {
      console.error('Get ticket error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Ticket not found',
          message: 'The requested ticket could not be found.'
        };
      }

      return {
        success: false,
        error: 'Failed to get ticket',
        message: 'Unable to retrieve ticket details.'
      };
    }
  }

  async createTicket(ticketData: CreateTicketRequest): Promise<ApiResponse<Ticket>> {
    try {
      // 1. Validate input
      const validationRules = {
        licensePlate: (plate: string) => validateLicensePlate(plate),
        violationType: (type: string) => validateRequired(type, 'Violation type'),
        issueDate: (date: string) => validateRequired(date, 'Issue date'),
        location: (location: string) => validateRequired(location, 'Location'),
        city: (city: string) => validateRequired(city, 'City'),
        fineAmount: (amount: number) => {
          if (!amount || amount <= 0) {
            return { isValid: false, errors: ['Fine amount must be greater than 0'] };
          }
          return { isValid: true, errors: [] };
        },
      };

      const formValidation = await validateForm(ticketData, validationRules);
      if (!formValidation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: Object.values(formValidation.errors).flat().join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        licensePlate: sanitizeLicensePlate(ticketData.licensePlate),
        violationType: ticketData.violationType.trim(),
        violationCode: ticketData.violationCode?.trim(),
        issueDate: ticketData.issueDate,
        location: sanitizeUserContent(ticketData.location),
        city: sanitizeUserContent(ticketData.city),
        state: ticketData.state?.trim(),
        postalCode: ticketData.postalCode?.trim().toUpperCase(),
        fineAmount: ticketData.fineAmount,
        notes: ticketData.notes ? sanitizeUserContent(ticketData.notes) : undefined,
        images: ticketData.images || [],
      };

      // 3. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.TICKET_CREATE,
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
      console.log('Creating ticket:', redactForLogging(sanitizedData));

      // 5. Handle file uploads if present
      let formData: FormData | typeof sanitizedData = sanitizedData;
      
      if (sanitizedData.images && sanitizedData.images.length > 0) {
        formData = new FormData();
        
        // Add text fields
        Object.entries(sanitizedData).forEach(([key, value]) => {
          if (key !== 'images' && value !== undefined) {
            (formData as FormData).append(key, String(value));
          }
        });

        // Add image files
        sanitizedData.images.forEach((image, index) => {
          (formData as FormData).append(`images`, image, sanitizeFileName(`image_${index}.jpg`));
        });
      }

      // 6. Make API request
      const response = await apiClient.post<ApiResponse<Ticket>>(
        TICKET_ENDPOINTS.TICKETS,
        formData,
        formData instanceof FormData ? {
          headers: { 'Content-Type': 'multipart/form-data' }
        } : undefined
      );

      if (response.data.success) {
        console.log('Ticket created successfully:', response.data.data?.id);
      }

      return response.data;

    } catch (error: any) {
      console.error('Create ticket error:', error);
      
      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many tickets created. Please try again later.'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to create ticket. Please try again.'
      };
    }
  }

  async updateTicket(ticketId: string, ticketData: UpdateTicketRequest): Promise<ApiResponse<Ticket>> {
    try {
      // 1. Validate required ID
      if (!ticketId || ticketId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid ticket ID',
          message: 'Ticket ID is required.'
        };
      }

      // 2. Sanitize input
      const sanitizedData: UpdateTicketRequest = {};
      
      if (ticketData.licensePlate) {
        sanitizedData.licensePlate = sanitizeLicensePlate(ticketData.licensePlate);
      }
      if (ticketData.violationType) {
        sanitizedData.violationType = ticketData.violationType.trim();
      }
      if (ticketData.location) {
        sanitizedData.location = sanitizeUserContent(ticketData.location);
      }
      if (ticketData.city) {
        sanitizedData.city = sanitizeUserContent(ticketData.city);
      }
      if (ticketData.state) {
        sanitizedData.state = ticketData.state.trim();
      }
      if (ticketData.postalCode) {
        sanitizedData.postalCode = ticketData.postalCode.trim().toUpperCase();
      }
      if (ticketData.fineAmount !== undefined) {
        sanitizedData.fineAmount = ticketData.fineAmount;
      }
      if (ticketData.notes) {
        sanitizedData.notes = sanitizeUserContent(ticketData.notes);
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
      const response = await apiClient.put<ApiResponse<Ticket>>(
        TICKET_ENDPOINTS.TICKET_DETAIL(ticketId),
        sanitizedData
      );

      if (response.data.success) {
        console.log('Ticket updated successfully:', ticketId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Update ticket error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to update ticket. Please try again.'
      };
    }
  }

  async deleteTicket(ticketId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // 1. Validate required ID
      if (!ticketId || ticketId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid ticket ID',
          message: 'Ticket ID is required.'
        };
      }

      // 2. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        { action: 'delete_ticket', ticketId }
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
        TICKET_ENDPOINTS.TICKET_DETAIL(ticketId)
      );

      if (response.data.success) {
        console.log('Ticket deleted successfully:', ticketId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Delete ticket error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to delete ticket. Please try again.'
      };
    }
  }

  // Payment Management
  async payTicket(paymentData: PaymentRequest): Promise<ApiResponse<Payment>> {
    try {
      // 1. Validate input
      const validationRules = {
        ticketId: (id: string) => validateRequired(id, 'Ticket ID'),
        paymentMethodId: (id: string) => validateRequired(id, 'Payment method ID'),
        amount: (amount: number) => {
          if (!amount || amount <= 0) {
            return { isValid: false, errors: ['Amount must be greater than 0'] };
          }
          return { isValid: true, errors: [] };
        },
        currency: (currency: string) => validateRequired(currency, 'Currency'),
      };

      const formValidation = await validateForm(paymentData, validationRules);
      if (!formValidation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: Object.values(formValidation.errors).flat().join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        ticketId: paymentData.ticketId.trim(),
        paymentMethodId: paymentData.paymentMethodId.trim(),
        amount: paymentData.amount,
        currency: paymentData.currency.toUpperCase().trim(),
      };

      // 3. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.PAYMENT_SUBMIT,
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
      console.log('Processing payment:', redactForLogging(sanitizedData));

      // 5. Make API request
      const response = await apiClient.post<ApiResponse<Payment>>(
        TICKET_ENDPOINTS.TICKET_PAY(sanitizedData.ticketId),
        sanitizedData
      );

      if (response.data.success) {
        console.log('Payment processed successfully:', response.data.data?.id);
      }

      return response.data;

    } catch (error: any) {
      console.error('Pay ticket error:', error);
      
      if (error.response?.status === 400) {
        return {
          success: false,
          error: 'Payment failed',
          message: error.response.data?.message || 'Payment could not be processed.'
        };
      }

      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many payment attempts. Please try again later.'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to process payment. Please try again.'
      };
    }
  }

  // Dispute Management
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
        TICKET_ENDPOINTS.TICKET_DISPUTE(sanitizedData.ticketId),
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

  async getDisputes(params?: PaginationParams): Promise<ApiResponse<Dispute[]>> {
    try {
      // 1. Sanitize query parameters
      const sanitizedParams: any = {};
      
      if (params?.page) sanitizedParams.page = Math.max(1, parseInt(String(params.page)));
      if (params?.limit) sanitizedParams.limit = Math.min(100, Math.max(1, parseInt(String(params.limit))));
      if (params?.sortBy) sanitizedParams.sortBy = params.sortBy.trim();
      if (params?.sortOrder) sanitizedParams.sortOrder = params.sortOrder;

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<Dispute[]>>(
        TICKET_ENDPOINTS.DISPUTES,
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

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<Dispute>>(
        TICKET_ENDPOINTS.DISPUTE_DETAIL(disputeId)
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
        TICKET_ENDPOINTS.UPLOAD_EVIDENCE(disputeId),
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
}

export default new TicketService();