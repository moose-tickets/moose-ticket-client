// src/services/notificationService.ts
import apiClient from "./apiClients";
import ArcjetSecurity, { RateLimitType } from "./arcjetSecurity";
import { 
  Notification,
  CreateNotificationRequest,
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

const NOTIFICATION_ENDPOINTS = {
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_DETAIL: (id: string) => `/notifications/${id}`,
  MARK_READ: (id: string) => `/notifications/${id}/read`,
  MARK_ALL_READ: '/notifications/mark-all-read',
  UNREAD_COUNT: '/notifications/unread-count',
  SETTINGS: '/notifications/settings',
  TEMPLATES: '/notifications/templates',
  DELIVERY_LOGS: '/notifications/delivery-logs',
  PREFERENCES: '/notifications/preferences',
} as const;

class NotificationService {

  // Notification Management
  async getNotifications(params?: PaginationParams & { type?: Notification['type']; isRead?: boolean }): Promise<ApiResponse<Notification[]>> {
    try {
      // 1. Sanitize query parameters
      const sanitizedParams: any = {};
      
      if (params?.page) sanitizedParams.page = Math.max(1, parseInt(String(params.page)));
      if (params?.limit) sanitizedParams.limit = Math.min(100, Math.max(1, parseInt(String(params.limit))));
      if (params?.sortBy) sanitizedParams.sortBy = params.sortBy.trim();
      if (params?.sortOrder) sanitizedParams.sortOrder = params.sortOrder;
      if (params?.type) sanitizedParams.type = params.type;
      if (params?.isRead !== undefined) sanitizedParams.isRead = params.isRead;

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<Notification[]>>(
        NOTIFICATION_ENDPOINTS.NOTIFICATIONS,
        { params: sanitizedParams }
      );

      return response.data;

    } catch (error: any) {
      console.error('Get notifications error:', error);
      
      return {
        success: false,
        error: 'Failed to get notifications',
        message: 'Unable to retrieve notifications.'
      };
    }
  }

  async getNotification(notificationId: string): Promise<ApiResponse<Notification>> {
    try {
      // 1. Validate required ID
      if (!notificationId || notificationId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid notification ID',
          message: 'Notification ID is required.'
        };
      }

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<Notification>>(
        NOTIFICATION_ENDPOINTS.NOTIFICATION_DETAIL(notificationId)
      );

      return response.data;

    } catch (error: any) {
      console.error('Get notification error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Notification not found',
          message: 'The requested notification could not be found.'
        };
      }

      return {
        success: false,
        error: 'Failed to get notification',
        message: 'Unable to retrieve notification details.'
      };
    }
  }

  async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    try {
      // 1. Validate required ID
      if (!notificationId || notificationId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid notification ID',
          message: 'Notification ID is required.'
        };
      }

      // 2. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        { action: 'mark_notification_read', notificationId }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      // 3. Make API request
      const response = await apiClient.patch<ApiResponse<Notification>>(
        NOTIFICATION_ENDPOINTS.MARK_READ(notificationId)
      );

      if (response.data.success) {
        console.log('Notification marked as read:', notificationId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Mark notification as read error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to mark notification as read. Please try again.'
      };
    }
  }

  async markAllAsRead(): Promise<ApiResponse<{ message: string; count: number }>> {
    try {
      // 1. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        { action: 'mark_all_notifications_read' }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      // 2. Make API request
      const response = await apiClient.patch<ApiResponse<{ message: string; count: number }>>(
        NOTIFICATION_ENDPOINTS.MARK_ALL_READ
      );

      if (response.data.success) {
        console.log('All notifications marked as read:', response.data.data?.count);
      }

      return response.data;

    } catch (error: any) {
      console.error('Mark all notifications as read error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to mark all notifications as read. Please try again.'
      };
    }
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // 1. Validate required ID
      if (!notificationId || notificationId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid notification ID',
          message: 'Notification ID is required.'
        };
      }

      // 2. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        { action: 'delete_notification', notificationId }
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
        NOTIFICATION_ENDPOINTS.NOTIFICATION_DETAIL(notificationId)
      );

      if (response.data.success) {
        console.log('Notification deleted successfully:', notificationId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Delete notification error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to delete notification. Please try again.'
      };
    }
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await apiClient.get<ApiResponse<{ count: number }>>(
        NOTIFICATION_ENDPOINTS.UNREAD_COUNT
      );

      return response.data;

    } catch (error: any) {
      console.error('Get unread count error:', error);
      
      return {
        success: false,
        error: 'Failed to get unread count',
        message: 'Unable to retrieve unread notification count.'
      };
    }
  }

  // Push Notification Management
  async registerPushToken(token: string, platform: 'ios' | 'android' | 'web'): Promise<ApiResponse<{ message: string }>> {
    try {
      // 1. Validate input
      const validationRules = {
        token: (token: string) => validateRequired(token, 'Push token'),
        platform: (platform: string) => {
          if (!['ios', 'android', 'web'].includes(platform)) {
            return { isValid: false, errors: ['Invalid platform'] };
          }
          return { isValid: true, errors: [] };
        },
      };

      const formValidation = await validateForm({ token, platform }, validationRules);
      if (!formValidation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: Object.values(formValidation.errors).flat().join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        token: token.trim(),
        platform,
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

      // 4. Make API request
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        '/notifications/push-token',
        sanitizedData
      );

      if (response.data.success) {
        console.log('Push token registered successfully for platform:', platform);
      }

      return response.data;

    } catch (error: any) {
      console.error('Register push token error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to register push token. Please try again.'
      };
    }
  }

  async unregisterPushToken(token: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // 1. Validate input
      const tokenValidation = validateRequired(token, 'Push token');
      if (!tokenValidation.isValid) {
        return {
          success: false,
          error: 'Invalid token',
          message: tokenValidation.errors.join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        token: token.trim(),
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

      // 4. Make API request
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        '/notifications/push-token',
        { data: sanitizedData }
      );

      if (response.data.success) {
        console.log('Push token unregistered successfully');
      }

      return response.data;

    } catch (error: any) {
      console.error('Unregister push token error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to unregister push token. Please try again.'
      };
    }
  }

  // Notification Settings
  async getNotificationSettings(): Promise<ApiResponse<{ email: boolean; push: boolean; sms: boolean; types: Record<string, boolean> }>> {
    try {
      const response = await apiClient.get<ApiResponse<{ email: boolean; push: boolean; sms: boolean; types: Record<string, boolean> }>>(
        NOTIFICATION_ENDPOINTS.SETTINGS
      );

      return response.data;

    } catch (error: any) {
      console.error('Get notification settings error:', error);
      
      return {
        success: false,
        error: 'Failed to get notification settings',
        message: 'Unable to retrieve notification settings.'
      };
    }
  }

  async updateNotificationSettings(settings: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    types?: Record<string, boolean>;
  }): Promise<ApiResponse<{ email: boolean; push: boolean; sms: boolean; types: Record<string, boolean> }>> {
    try {
      // 1. Sanitize input
      const sanitizedData: any = {};

      if (settings.email !== undefined) sanitizedData.email = settings.email;
      if (settings.push !== undefined) sanitizedData.push = settings.push;
      if (settings.sms !== undefined) sanitizedData.sms = settings.sms;
      if (settings.types) sanitizedData.types = settings.types;

      // 2. Perform security checks
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

      // 3. Make API request
      const response = await apiClient.put<ApiResponse<{ email: boolean; push: boolean; sms: boolean; types: Record<string, boolean> }>>(
        NOTIFICATION_ENDPOINTS.SETTINGS,
        sanitizedData
      );

      if (response.data.success) {
        console.log('Notification settings updated successfully');
      }

      return response.data;

    } catch (error: any) {
      console.error('Update notification settings error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to update notification settings. Please try again.'
      };
    }
  }

  // Test Notifications (for development/testing)
  async sendTestNotification(type: Notification['type'], title?: string, message?: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // 1. Validate input
      const validationRules = {
        type: (type: string) => {
          const validTypes = ['ticket_reminder', 'payment_confirmation', 'dispute_update', 'system_update'];
          if (!validTypes.includes(type)) {
            return { isValid: false, errors: ['Invalid notification type'] };
          }
          return { isValid: true, errors: [] };
        },
      };

      const formValidation = await validateForm({ type }, validationRules);
      if (!formValidation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: Object.values(formValidation.errors).flat().join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        type,
        title: title ? sanitizeUserContent(title) : undefined,
        message: message ? sanitizeUserContent(message) : undefined,
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

      // 4. Make API request
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        '/notifications/test',
        sanitizedData
      );

      if (response.data.success) {
        console.log('Test notification sent successfully');
      }

      return response.data;

    } catch (error: any) {
      console.error('Send test notification error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to send test notification. Please try again.'
      };
    }
  }

  // Template and Delivery Management
  async getNotificationTemplates(): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(
        NOTIFICATION_ENDPOINTS.TEMPLATES
      );
      return response.data;
    } catch (error: any) {
      console.error('Get notification templates error:', error);
      
      return {
        success: false,
        error: 'Failed to get templates',
        message: 'Unable to retrieve notification templates.'
      };
    }
  }

  async getDeliveryLogs(params?: PaginationParams & { 
    dateFrom?: string; 
    dateTo?: string; 
    status?: string; 
  }): Promise<ApiResponse<any[]>> {
    try {
      const sanitizedParams: any = {};
      
      if (params?.page) sanitizedParams.page = Math.max(1, parseInt(String(params.page)));
      if (params?.limit) sanitizedParams.limit = Math.min(100, Math.max(1, parseInt(String(params.limit))));
      if (params?.dateFrom) sanitizedParams.dateFrom = params.dateFrom;
      if (params?.dateTo) sanitizedParams.dateTo = params.dateTo;
      if (params?.status) sanitizedParams.status = params.status;

      const response = await apiClient.get<ApiResponse<any[]>>(
        NOTIFICATION_ENDPOINTS.DELIVERY_LOGS,
        { params: sanitizedParams }
      );
      return response.data;
    } catch (error: any) {
      console.error('Get delivery logs error:', error);
      
      return {
        success: false,
        error: 'Failed to get delivery logs',
        message: 'Unable to retrieve delivery logs.'
      };
    }
  }

  async getUserPreferences(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        NOTIFICATION_ENDPOINTS.PREFERENCES
      );
      return response.data;
    } catch (error: any) {
      console.error('Get user preferences error:', error);
      
      return {
        success: false,
        error: 'Failed to get preferences',
        message: 'Unable to retrieve user notification preferences.'
      };
    }
  }

  async updateUserPreferences(preferences: any): Promise<ApiResponse<any>> {
    try {
      const sanitizedData = sanitizeFormData(preferences, {
        email: (val: boolean) => val,
        sms: (val: boolean) => val,
        push: (val: boolean) => val,
        frequency: (val: string) => val.trim(),
        timezone: (val: string) => val.trim(),
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
        NOTIFICATION_ENDPOINTS.PREFERENCES,
        sanitizedData
      );

      return response.data;
    } catch (error: any) {
      console.error('Update user preferences error:', error);
      
      return {
        success: false,
        error: 'Update failed',
        message: 'Unable to update notification preferences. Please try again.'
      };
    }
  }

  // Bulk operations
  async markMultipleAsRead(notificationIds: string[]): Promise<ApiResponse<any>> {
    try {
      if (!notificationIds || notificationIds.length === 0) {
        return {
          success: false,
          error: 'No notifications selected',
          message: 'Please select at least one notification.'
        };
      }

      const sanitizedData = {
        notificationIds: notificationIds.map(id => id.trim()),
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
        '/notifications/bulk-read',
        sanitizedData
      );

      return response.data;
    } catch (error: any) {
      console.error('Mark multiple as read error:', error);
      
      return {
        success: false,
        error: 'Bulk update failed',
        message: 'Unable to mark notifications as read. Please try again.'
      };
    }
  }

  async deleteMultiple(notificationIds: string[]): Promise<ApiResponse<any>> {
    try {
      if (!notificationIds || notificationIds.length === 0) {
        return {
          success: false,
          error: 'No notifications selected',
          message: 'Please select at least one notification to delete.'
        };
      }

      const sanitizedData = {
        notificationIds: notificationIds.map(id => id.trim()),
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

      const response = await apiClient.delete<ApiResponse<any>>(
        '/notifications/bulk-delete',
        { data: sanitizedData }
      );

      return response.data;
    } catch (error: any) {
      console.error('Delete multiple notifications error:', error);
      
      return {
        success: false,
        error: 'Bulk delete failed',
        message: 'Unable to delete notifications. Please try again.'
      };
    }
  }
}

export default new NotificationService();