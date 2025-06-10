// src/services/paymentService.ts
import apiClient from "./apiClients";
import ArcjetSecurity, { RateLimitType } from "./arcjetSecurity";
import { 
  PaymentMethod,
  CreatePaymentMethodRequest,
  Payment,
  PaymentRequest,
  BillingHistory,
  Subscription,
  SubscriptionPlan,
  CreateSubscriptionRequest,
  ApiResponse,
  PaginationParams
} from "../types/api";
import { 
  validateCreditCard, 
  validateCVV,
  validateRequired,
  validateForm
} from "../utils/validators";
import { 
  sanitizeCreditCard,
  sanitizeCVV,
  sanitizeName,
  sanitizeFormData,
  redactForLogging 
} from "../utils/sanitize";

const PAYMENT_ENDPOINTS = {
  PAYMENT_METHODS: '/payments/methods',
  PAYMENT_METHOD_DETAIL: (id: string) => `/payments/methods/${id}`,
  SET_DEFAULT_PAYMENT: (id: string) => `/payments/methods/${id}/default`,
  PAYMENTS: '/payments',
  PAYMENT_DETAIL: (id: string) => `/payments/${id}`,
  BILLING_HISTORY: '/billing/history',
  SUBSCRIPTIONS: '/subscriptions',
  SUBSCRIPTION_DETAIL: (id: string) => `/subscriptions/${id}`,
  SUBSCRIPTION_PLANS: '/subscriptions/plans',
  CANCEL_SUBSCRIPTION: (id: string) => `/subscriptions/${id}/cancel`,
  REFUND_PAYMENT: (id: string) => `/payments/${id}/refund`,
} as const;

class PaymentService {

  // Payment Methods Management
  async getPaymentMethods(params?: PaginationParams): Promise<ApiResponse<PaymentMethod[]>> {
    try {
      // 1. Sanitize query parameters
      const sanitizedParams: any = {};
      
      if (params?.page) sanitizedParams.page = Math.max(1, parseInt(String(params.page)));
      if (params?.limit) sanitizedParams.limit = Math.min(50, Math.max(1, parseInt(String(params.limit))));
      if (params?.sortBy) sanitizedParams.sortBy = params.sortBy.trim();
      if (params?.sortOrder) sanitizedParams.sortOrder = params.sortOrder;

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<PaymentMethod[]>>(
        PAYMENT_ENDPOINTS.PAYMENT_METHODS,
        { params: sanitizedParams }
      );

      return response.data;

    } catch (error: any) {
      console.error('Get payment methods error:', error);
      
      return {
        success: false,
        error: 'Failed to get payment methods',
        message: 'Unable to retrieve payment methods.'
      };
    }
  }

  async createPaymentMethod(paymentData: CreatePaymentMethodRequest): Promise<ApiResponse<PaymentMethod>> {
    try {
      // 1. Validate input
      const validationRules = {
        cardNumber: (cardNumber: string) => validateCreditCard(cardNumber),
        cardCvv: (cvv: string) => validateCVV(cvv),
        cardholderName: (name: string) => validateRequired(name, 'Cardholder name'),
        cardExpiry: (expiry: string) => {
          const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
          if (!expiryRegex.test(expiry)) {
            return { isValid: false, errors: ['Invalid expiry date format (MM/YY)'] };
          }
          
          const [month, year] = expiry.split('/');
          const now = new Date();
          const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
          
          if (expiryDate <= now) {
            return { isValid: false, errors: ['Card has expired'] };
          }
          
          return { isValid: true, errors: [] };
        },
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
        type: 'card' as const,
        cardNumber: sanitizeCreditCard(paymentData.cardNumber),
        cardExpiry: paymentData.cardExpiry.trim(),
        cardCvv: sanitizeCVV(paymentData.cardCvv),
        cardholderName: sanitizeName(paymentData.cardholderName),
        billingAddress: sanitizeFormData(paymentData.billingAddress, {
          fullName: sanitizeName,
          address: (val: string) => val.trim(),
          city: (val: string) => val.trim(),
          state: (val: string) => val.trim(),
          country: (val: string) => val.trim(),
          postalCode: (val: string) => val.trim().toUpperCase(),
        }),
        isDefault: paymentData.isDefault || false,
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

      // 4. Log sanitized request (sensitive data redacted)
      console.log('Creating payment method:', redactForLogging(sanitizedData));

      // 5. Make API request
      const response = await apiClient.post<ApiResponse<PaymentMethod>>(
        PAYMENT_ENDPOINTS.PAYMENT_METHODS,
        sanitizedData
      );

      if (response.data.success) {
        console.log('Payment method created successfully:', response.data.data?.id);
      }

      return response.data;

    } catch (error: any) {
      console.error('Create payment method error:', error);
      
      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many payment method submissions. Please try again later.'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to create payment method. Please try again.'
      };
    }
  }

  async updatePaymentMethod(paymentMethodId: string, paymentData: Partial<CreatePaymentMethodRequest>): Promise<ApiResponse<PaymentMethod>> {
    try {
      // 1. Validate required ID
      if (!paymentMethodId || paymentMethodId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid payment method ID',
          message: 'Payment method ID is required.'
        };
      }

      // 2. Sanitize input
      const sanitizedData: any = {};
      
      if (paymentData.cardholderName) {
        sanitizedData.cardholderName = sanitizeName(paymentData.cardholderName);
      }

      if (paymentData.billingAddress) {
        sanitizedData.billingAddress = sanitizeFormData(paymentData.billingAddress, {
          fullName: sanitizeName,
          address: (val: string) => val.trim(),
          city: (val: string) => val.trim(),
          state: (val: string) => val.trim(),
          country: (val: string) => val.trim(),
          postalCode: (val: string) => val.trim().toUpperCase(),
        });
      }

      if (paymentData.isDefault !== undefined) {
        sanitizedData.isDefault = paymentData.isDefault;
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
      const response = await apiClient.put<ApiResponse<PaymentMethod>>(
        PAYMENT_ENDPOINTS.PAYMENT_METHOD_DETAIL(paymentMethodId),
        sanitizedData
      );

      if (response.data.success) {
        console.log('Payment method updated successfully:', paymentMethodId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Update payment method error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to update payment method. Please try again.'
      };
    }
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // 1. Validate required ID
      if (!paymentMethodId || paymentMethodId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid payment method ID',
          message: 'Payment method ID is required.'
        };
      }

      // 2. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        { action: 'delete_payment_method', paymentMethodId }
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
        PAYMENT_ENDPOINTS.PAYMENT_METHOD_DETAIL(paymentMethodId)
      );

      if (response.data.success) {
        console.log('Payment method deleted successfully:', paymentMethodId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Delete payment method error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to delete payment method. Please try again.'
      };
    }
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<ApiResponse<PaymentMethod>> {
    try {
      // 1. Validate required ID
      if (!paymentMethodId || paymentMethodId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid payment method ID',
          message: 'Payment method ID is required.'
        };
      }

      // 2. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        { action: 'set_default_payment', paymentMethodId }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      // 3. Make API request
      const response = await apiClient.patch<ApiResponse<PaymentMethod>>(
        PAYMENT_ENDPOINTS.SET_DEFAULT_PAYMENT(paymentMethodId)
      );

      if (response.data.success) {
        console.log('Default payment method set successfully:', paymentMethodId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Set default payment method error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to set default payment method. Please try again.'
      };
    }
  }

  // Payment History
  async getPayments(params?: PaginationParams): Promise<ApiResponse<Payment[]>> {
    try {
      // 1. Sanitize query parameters
      const sanitizedParams: any = {};
      
      if (params?.page) sanitizedParams.page = Math.max(1, parseInt(String(params.page)));
      if (params?.limit) sanitizedParams.limit = Math.min(100, Math.max(1, parseInt(String(params.limit))));
      if (params?.sortBy) sanitizedParams.sortBy = params.sortBy.trim();
      if (params?.sortOrder) sanitizedParams.sortOrder = params.sortOrder;

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<Payment[]>>(
        PAYMENT_ENDPOINTS.PAYMENTS,
        { params: sanitizedParams }
      );

      return response.data;

    } catch (error: any) {
      console.error('Get payments error:', error);
      
      return {
        success: false,
        error: 'Failed to get payments',
        message: 'Unable to retrieve payment history.'
      };
    }
  }

  async getPayment(paymentId: string): Promise<ApiResponse<Payment>> {
    try {
      // 1. Validate required ID
      if (!paymentId || paymentId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid payment ID',
          message: 'Payment ID is required.'
        };
      }

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<Payment>>(
        PAYMENT_ENDPOINTS.PAYMENT_DETAIL(paymentId)
      );

      return response.data;

    } catch (error: any) {
      console.error('Get payment error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Payment not found',
          message: 'The requested payment could not be found.'
        };
      }

      return {
        success: false,
        error: 'Failed to get payment',
        message: 'Unable to retrieve payment details.'
      };
    }
  }

  async refundPayment(paymentId: string, reason?: string): Promise<ApiResponse<Payment>> {
    try {
      // 1. Validate required ID
      if (!paymentId || paymentId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid payment ID',
          message: 'Payment ID is required.'
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        reason: reason ? reason.trim() : undefined,
      };

      // 3. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        { action: 'refund_payment', paymentId, ...sanitizedData }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      // 4. Make API request
      const response = await apiClient.post<ApiResponse<Payment>>(
        PAYMENT_ENDPOINTS.REFUND_PAYMENT(paymentId),
        sanitizedData
      );

      if (response.data.success) {
        console.log('Payment refunded successfully:', paymentId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Refund payment error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to process refund. Please try again.'
      };
    }
  }

  // Billing History
  async getBillingHistory(params?: PaginationParams & { dateFrom?: string; dateTo?: string }): Promise<ApiResponse<BillingHistory[]>> {
    try {
      // 1. Sanitize query parameters
      const sanitizedParams: any = {};
      
      if (params?.page) sanitizedParams.page = Math.max(1, parseInt(String(params.page)));
      if (params?.limit) sanitizedParams.limit = Math.min(100, Math.max(1, parseInt(String(params.limit))));
      if (params?.sortBy) sanitizedParams.sortBy = params.sortBy.trim();
      if (params?.sortOrder) sanitizedParams.sortOrder = params.sortOrder;
      if (params?.dateFrom) sanitizedParams.dateFrom = params.dateFrom;
      if (params?.dateTo) sanitizedParams.dateTo = params.dateTo;

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<BillingHistory[]>>(
        PAYMENT_ENDPOINTS.BILLING_HISTORY,
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

  // Subscription Management
  async getSubscriptions(): Promise<ApiResponse<Subscription[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Subscription[]>>(
        PAYMENT_ENDPOINTS.SUBSCRIPTIONS
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

  async getSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    try {
      const response = await apiClient.get<ApiResponse<SubscriptionPlan[]>>(
        PAYMENT_ENDPOINTS.SUBSCRIPTION_PLANS
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

  async createSubscription(subscriptionData: CreateSubscriptionRequest): Promise<ApiResponse<Subscription>> {
    try {
      // 1. Validate input
      const validationRules = {
        planId: (id: string) => validateRequired(id, 'Plan ID'),
        paymentMethodId: (id: string) => validateRequired(id, 'Payment method ID'),
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
        paymentMethodId: subscriptionData.paymentMethodId.trim(),
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
      console.log('Creating subscription:', redactForLogging(sanitizedData));

      // 5. Make API request
      const response = await apiClient.post<ApiResponse<Subscription>>(
        PAYMENT_ENDPOINTS.SUBSCRIPTIONS,
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

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to create subscription. Please try again.'
      };
    }
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<ApiResponse<Subscription>> {
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
        reason: reason ? reason.trim() : undefined,
      };

      // 3. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        { action: 'cancel_subscription', subscriptionId, ...sanitizedData }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      // 4. Make API request
      const response = await apiClient.post<ApiResponse<Subscription>>(
        PAYMENT_ENDPOINTS.CANCEL_SUBSCRIPTION(subscriptionId),
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
}

export default new PaymentService();