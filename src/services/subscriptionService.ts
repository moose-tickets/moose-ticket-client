// src/services/subscriptionService.ts
import apiClient from "./apiClients";
import unifiedSecurityService, { SecurityActionType } from "./unifiedSecurityService";
import { 
  Subscription,
  SubscriptionPlan,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  BillingHistory,
  ApiResponse,
  PaginationParams
} from "../types/api";
import { 
  validateRequired,
  validateEmail,
  validateForm
} from "../utils/validators";
import { 
  sanitizeUserContent,
  sanitizeFormData,
  sanitizeEmail,
  redactForLogging 
} from "../utils/sanitize";

const SUBSCRIPTION_ENDPOINTS = {
  SUBSCRIPTIONS: '/subscriptions',
  SUBSCRIPTION_DETAIL: (id: string) => `/subscriptions/${id}`,
  SUBSCRIPTION_PLANS: '/subscriptions/plans',
  PLAN_DETAIL: (id: string) => `/subscriptions/plans/${id}`,
  CURRENT_SUBSCRIPTION: '/subscriptions',
  CANCEL_SUBSCRIPTION: (id: string) => `/subscriptions/${id}`,
  RESUME_SUBSCRIPTION: (id: string) => `/subscriptions/${id}`,
  UPGRADE_SUBSCRIPTION: (id: string) => `/subscriptions/${id}/upgrade`,
  BILLING_HISTORY: (id: string) => `/subscriptions/${id}/billing`,
  USAGE_ANALYTICS: (id: string) => `/subscriptions/${id}/usage`,
  QUOTAS: (id: string) => `/subscriptions/${id}/usage`,
} as const;

class SubscriptionService {

  // Subscription Management
  async getSubscriptions(params?: PaginationParams): Promise<ApiResponse<Subscription[]>> {
    try {
      // 1. Sanitize query parameters
      const sanitizedParams: any = {};
      
      if (params?.page) sanitizedParams.page = Math.max(1, parseInt(String(params.page)));
      if (params?.limit) sanitizedParams.limit = Math.min(50, Math.max(1, parseInt(String(params.limit))));
      if (params?.sortBy) sanitizedParams.sortBy = params.sortBy.trim();
      if (params?.sortOrder) sanitizedParams.sortOrder = params.sortOrder;

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<Subscription[]>>(
        SUBSCRIPTION_ENDPOINTS.SUBSCRIPTIONS,
        { params: sanitizedParams }
      );

      return response.data;

    } catch (error: any) {
      console.error('Get subscriptions error:', error);
      
      return {
        success: false,
        error: 'Failed to get subscriptions',
        message: 'Unable to retrieve subscriptions.'
      };
    }
  }

  async getCurrentSubscription(): Promise<ApiResponse<Subscription>> {
    try {
      const response = await apiClient.get<ApiResponse<Subscription>>(
        SUBSCRIPTION_ENDPOINTS.CURRENT_SUBSCRIPTION
      );

      return response.data;

    } catch (error: any) {
      console.error('Get current subscription error:', error);
      
      return {
        success: false,
        error: 'Failed to get current subscription',
        message: 'Unable to retrieve current subscription.'
      };
    }
  }

  async getSubscription(subscriptionId: string): Promise<ApiResponse<Subscription>> {
    try {
      // 1. Validate required ID
      if (!subscriptionId || subscriptionId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid subscription ID',
          message: 'Subscription ID is required.'
        };
      }

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<Subscription>>(
        SUBSCRIPTION_ENDPOINTS.SUBSCRIPTION_DETAIL(subscriptionId)
      );

      return response.data;

    } catch (error: any) {
      console.error('Get subscription error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Subscription not found',
          message: 'The requested subscription could not be found.'
        };
      }

      return {
        success: false,
        error: 'Failed to get subscription',
        message: 'Unable to retrieve subscription details.'
      };
    }
  }

  async createSubscription(subscriptionData: CreateSubscriptionRequest): Promise<ApiResponse<Subscription>> {
    try {
      // 1. Validate input
      const validationRules = {
        planId: (id: string) => validateRequired(id, 'Plan ID'),
        // paymentMethodId is optional for testing
        // billingEmail is optional
      };

      const formValidation = await validateForm(subscriptionData, validationRules);
      if (!formValidation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: Object.values(formValidation.errors).flat().join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        planId: subscriptionData.planId.trim(),
        billingCycle: subscriptionData.billingCycle || 'monthly',
        paymentMethodId: subscriptionData.paymentMethodId?.trim(),
        billingEmail: subscriptionData.billingEmail ? sanitizeEmail(subscriptionData.billingEmail) : undefined,
        metadata: subscriptionData.metadata || {},
        promoCode: subscriptionData.promoCode?.trim().toUpperCase(),
      };

      // 3. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.PAYMENT_ATTEMPT,
        sanitizedData
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.reason || 'Security validation failed'
        };
      }

      // 4. Log sanitized request
      console.log('Creating subscription:', redactForLogging(sanitizedData));

      // 5. Make API request
      const response = await apiClient.post<ApiResponse<Subscription>>(
        SUBSCRIPTION_ENDPOINTS.SUBSCRIPTIONS,
        sanitizedData
      );

      if (response.data.success) {
        console.log('Subscription created successfully:', response.data.data?.id);
      }

      return response.data;

    } catch (error: any) {
      console.error('Create subscription error:', error);
      
      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many subscription attempts. Please try again later.'
        };
      }

      if (error.response?.status === 409) {
        return {
          success: false,
          error: 'Subscription exists',
          message: 'You already have an active subscription.'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to create subscription. Please try again.'
      };
    }
  }

  async updateSubscription(subscriptionId: string, subscriptionData: UpdateSubscriptionRequest): Promise<ApiResponse<Subscription>> {
    try {
      // 1. Validate required ID
      if (!subscriptionId || subscriptionId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid subscription ID',
          message: 'Subscription ID is required.'
        };
      }

      // 2. Sanitize input
      const sanitizedData: UpdateSubscriptionRequest = {};
      
      if (subscriptionData.planId) {
        sanitizedData.planId = subscriptionData.planId.trim();
      }
      if (subscriptionData.paymentMethodId) {
        sanitizedData.paymentMethodId = subscriptionData.paymentMethodId.trim();
      }
      if (subscriptionData.billingEmail) {
        sanitizedData.billingEmail = sanitizeEmail(subscriptionData.billingEmail);
      }
      if (subscriptionData.metadata) {
        sanitizedData.metadata = subscriptionData.metadata;
      }

      // 3. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.API_REQUEST,
        sanitizedData
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.reason || 'Security validation failed'
        };
      }

      // 4. Log request details
      console.log('🔄 Making update request to:', SUBSCRIPTION_ENDPOINTS.SUBSCRIPTION_DETAIL(subscriptionId));
      console.log('🔄 Request payload:', sanitizedData);

      // 5. Make API request
      const response = await apiClient.put<ApiResponse<Subscription>>(
        SUBSCRIPTION_ENDPOINTS.SUBSCRIPTION_DETAIL(subscriptionId),
        sanitizedData
      );

      console.log('🔄 Update response:', response.data);

      if (response.data.success) {
        console.log('Subscription updated successfully:', subscriptionId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Update subscription error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to update subscription. Please try again.'
      };
    }
  }

  async cancelSubscription(subscriptionId: string, reason?: string, cancelAtPeriodEnd: boolean = true): Promise<ApiResponse<Subscription>> {
    try {
      // 1. Validate required ID
      if (!subscriptionId || subscriptionId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid subscription ID',
          message: 'Subscription ID is required.'
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        reason: reason ? sanitizeUserContent(reason) : undefined,
        cancelAtPeriodEnd,
      };

      // 3. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.API_REQUEST,
        { action: 'cancel_subscription', subscriptionId, ...sanitizedData }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.reason || 'Security validation failed'
        };
      }

      // 4. Make API request
      const response = await apiClient.post<ApiResponse<Subscription>>(
        SUBSCRIPTION_ENDPOINTS.CANCEL_SUBSCRIPTION(subscriptionId),
        sanitizedData
      );

      if (response.data.success) {
        console.log('Subscription cancelled successfully:', subscriptionId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to cancel subscription. Please try again.'
      };
    }
  }

  async resumeSubscription(subscriptionId: string): Promise<ApiResponse<Subscription>> {
    try {
      // 1. Validate required ID
      if (!subscriptionId || subscriptionId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid subscription ID',
          message: 'Subscription ID is required.'
        };
      }

      // 2. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.API_REQUEST,
        { action: 'resume_subscription', subscriptionId }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.reason || 'Security validation failed'
        };
      }

      // 3. Make API request
      const response = await apiClient.post<ApiResponse<Subscription>>(
        SUBSCRIPTION_ENDPOINTS.RESUME_SUBSCRIPTION(subscriptionId)
      );

      if (response.data.success) {
        console.log('Subscription resumed successfully:', subscriptionId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Resume subscription error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to resume subscription. Please try again.'
      };
    }
  }

  async upgradeSubscription(subscriptionId: string, newPlanId: string, promoCode?: string): Promise<ApiResponse<Subscription>> {
    try {
      // 1. Validate input
      const validationRules = {
        subscriptionId: (id: string) => validateRequired(id, 'Subscription ID'),
        newPlanId: (id: string) => validateRequired(id, 'New plan ID'),
      };

      const formValidation = await validateForm({ subscriptionId, newPlanId }, validationRules);
      if (!formValidation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: Object.values(formValidation.errors).flat().join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        planId: newPlanId.trim(),  // Backend expects 'planId', not 'newPlanId'
        promoCode: promoCode?.trim().toUpperCase(),
      };

      // 3. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.PAYMENT_ATTEMPT,
        sanitizedData
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.reason || 'Security validation failed'
        };
      }

      // 4. Log request details
      console.log('🔄 Making upgrade request to:', SUBSCRIPTION_ENDPOINTS.UPGRADE_SUBSCRIPTION(subscriptionId));
      console.log('🔄 Request payload:', sanitizedData);

      // 5. Make API request
      const response = await apiClient.post<ApiResponse<Subscription>>(
        SUBSCRIPTION_ENDPOINTS.UPGRADE_SUBSCRIPTION(subscriptionId),
        sanitizedData
      );

      console.log('🔄 Upgrade response:', response.data);

      if (response.data.success) {
        console.log('Subscription upgraded successfully:', subscriptionId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Upgrade subscription error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to upgrade subscription. Please try again.'
      };
    }
  }

  // Plan Management
  async getSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    try {
      const response = await apiClient.get<ApiResponse<SubscriptionPlan[]>>(
        SUBSCRIPTION_ENDPOINTS.SUBSCRIPTION_PLANS
      );

      return response.data;

    } catch (error: any) {
      console.error('Get subscription plans error:', error);
      
      return {
        success: false,
        error: 'Failed to get subscription plans',
        message: 'Unable to retrieve subscription plans.'
      };
    }
  }

  async getSubscriptionPlan(planId: string): Promise<ApiResponse<SubscriptionPlan>> {
    try {
      // 1. Validate required ID
      if (!planId || planId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid plan ID',
          message: 'Plan ID is required.'
        };
      }

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<SubscriptionPlan>>(
        SUBSCRIPTION_ENDPOINTS.PLAN_DETAIL(planId)
      );

      return response.data;

    } catch (error: any) {
      console.error('Get subscription plan error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Plan not found',
          message: 'The requested subscription plan could not be found.'
        };
      }

      return {
        success: false,
        error: 'Failed to get subscription plan',
        message: 'Unable to retrieve subscription plan details.'
      };
    }
  }

  // Billing and Usage
  async getBillingHistory(params?: PaginationParams & { dateFrom?: string; dateTo?: string }): Promise<ApiResponse<BillingHistory[]>> {
    try {
      // First get current subscription to get the subscription ID
      const currentSub = await this.getCurrentSubscription();
      if (!currentSub.success || !currentSub.data || !currentSub.data.subscription) {
        return {
          success: false,
          error: 'No active subscription',
          message: 'No active subscription found to get billing history for.'
        };
      }

      // 1. Sanitize query parameters
      const sanitizedParams: any = {};
      
      if (params?.page) sanitizedParams.page = Math.max(1, parseInt(String(params.page)));
      if (params?.limit) sanitizedParams.limit = Math.min(100, Math.max(1, parseInt(String(params.limit))));
      if (params?.sortBy) sanitizedParams.sortBy = params.sortBy.trim();
      if (params?.sortOrder) sanitizedParams.sortOrder = params.sortOrder;
      if (params?.dateFrom) sanitizedParams.dateFrom = params.dateFrom;
      if (params?.dateTo) sanitizedParams.dateTo = params.dateTo;

      // Extract subscription ID - handle both _id and id fields
      const subscription = currentSub.data.subscription;
      const subscriptionId = subscription._id || subscription.id;
      if (!subscriptionId) {
        return {
          success: false,
          error: 'Invalid subscription data',
          message: 'Subscription data is missing ID field.'
        };
      }

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<BillingHistory[]>>(
        SUBSCRIPTION_ENDPOINTS.BILLING_HISTORY(subscriptionId),
        { params: sanitizedParams }
      );

      return response.data;

    } catch (error: any) {
      console.error('Get billing history error:', error);
      
      return {
        success: false,
        error: 'Failed to get billing history',
        message: 'Unable to retrieve billing history.'
      };
    }
  }

  async getUsageAnalytics(timeRange?: string): Promise<ApiResponse<any>> {
    try {
      // First get current subscription to get the subscription ID
      const currentSub = await this.getCurrentSubscription();
      if (!currentSub.success || !currentSub.data || !currentSub.data.subscription) {
        return {
          success: false,
          error: 'No active subscription',
          message: 'No active subscription found to get usage analytics for.'
        };
      }

      // Extract subscription ID - handle both _id and id fields
      const subscription = currentSub.data.subscription;
      const subscriptionId = subscription._id || subscription.id;
      if (!subscriptionId) {
        return {
          success: false,
          error: 'Invalid subscription data',
          message: 'Subscription data is missing ID field.'
        };
      }

      const params = timeRange ? { timeRange } : {};
      const response = await apiClient.get<ApiResponse<any>>(
        SUBSCRIPTION_ENDPOINTS.USAGE_ANALYTICS(subscriptionId),
        { params }
      );
      return response.data;
    } catch (error: any) {
      console.error('Get usage analytics error:', error);
      
      return {
        success: false,
        error: 'Failed to get usage analytics',
        message: 'Unable to retrieve usage analytics.'
      };
    }
  }

  async getQuotas(): Promise<ApiResponse<any>> {
    try {
      // First get current subscription to get the subscription ID
      const currentSub = await this.getCurrentSubscription();
      if (!currentSub.success || !currentSub.data || !currentSub.data.subscription) {
        return {
          success: false,
          error: 'No active subscription',
          message: 'No active subscription found to get quotas for.'
        };
      }

      // Extract subscription ID - handle both _id and id fields
      const subscription = currentSub.data.subscription;
      const subscriptionId = subscription._id || subscription.id;
      if (!subscriptionId) {
        return {
          success: false,
          error: 'Invalid subscription data',
          message: 'Subscription data is missing ID field.'
        };
      }

      const response = await apiClient.get<ApiResponse<any>>(
        SUBSCRIPTION_ENDPOINTS.QUOTAS(subscriptionId)
      );
      return response.data;
    } catch (error: any) {
      console.error('Get quotas error:', error);
      
      return {
        success: false,
        error: 'Failed to get quotas',
        message: 'Unable to retrieve subscription quotas.'
      };
    }
  }

  // Promo codes and discounts
  async validatePromoCode(promoCode: string, planId?: string): Promise<ApiResponse<any>> {
    try {
      const validationRules = {
        promoCode: (code: string) => validateRequired(code, 'Promo code'),
      };

      const formValidation = await validateForm({ promoCode }, validationRules);
      if (!formValidation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: Object.values(formValidation.errors).flat().join(', ')
        };
      }

      const sanitizedData = {
        promoCode: promoCode.trim().toUpperCase(),
        planId: planId?.trim(),
      };

      const response = await apiClient.post<ApiResponse<any>>(
        '/subscriptions/validate-promo',
        sanitizedData
      );

      return response.data;

    } catch (error: any) {
      console.error('Validate promo code error:', error);
      
      return {
        success: false,
        error: 'Validation failed',
        message: 'Unable to validate promo code.'
      };
    }
  }

  // Subscription analytics
  async getSubscriptionAnalytics(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        '/subscriptions/analytics'
      );
      return response.data;
    } catch (error: any) {
      console.error('Get subscription analytics error:', error);
      
      return {
        success: false,
        error: 'Failed to get analytics',
        message: 'Unable to retrieve subscription analytics.'
      };
    }
  }

  // Invoice management
  async getInvoices(params?: PaginationParams): Promise<ApiResponse<any[]>> {
    try {
      const sanitizedParams: any = {};
      
      if (params?.page) sanitizedParams.page = Math.max(1, parseInt(String(params.page)));
      if (params?.limit) sanitizedParams.limit = Math.min(100, Math.max(1, parseInt(String(params.limit))));

      const response = await apiClient.get<ApiResponse<any[]>>(
        '/subscriptions/invoices',
        { params: sanitizedParams }
      );
      return response.data;
    } catch (error: any) {
      console.error('Get invoices error:', error);
      
      return {
        success: false,
        error: 'Failed to get invoices',
        message: 'Unable to retrieve invoices.'
      };
    }
  }

  async downloadInvoice(invoiceId: string): Promise<ApiResponse<any>> {
    try {
      if (!invoiceId || invoiceId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid invoice ID',
          message: 'Invoice ID is required.'
        };
      }

      const response = await apiClient.get<ApiResponse<any>>(
        `/subscriptions/invoices/${invoiceId}/download`
      );
      return response.data;
    } catch (error: any) {
      console.error('Download invoice error:', error);
      
      return {
        success: false,
        error: 'Download failed',
        message: 'Unable to download invoice.'
      };
    }
  }
}

export default new SubscriptionService();