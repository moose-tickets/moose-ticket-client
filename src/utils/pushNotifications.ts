// src/utils/pushNotifications.ts
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { store } from '../store';
import { registerPushToken, addNotification } from '../store/slices/notificationSlice';
import notificationService from '../services/notificationService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationData {
  ticketId?: string;
  disputeId?: string;
  paymentId?: string;
  type: 'ticket_reminder' | 'payment_confirmation' | 'dispute_update' | 'system_update';
  title: string;
  message: string;
  actionUrl?: string;
}

class PushNotificationManager {
  private notificationListener: any;
  private responseListener: any;
  private appStateListener: any;
  private tokenRefreshInterval: any;
  
  async initialize() {
    // Only works on physical devices
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return;
    }

    try {
      await this.registerForPushNotifications();
      this.setupNotificationListeners();
      this.setupAppStateListener();
      this.setupTokenRefreshTimer();
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  async registerForPushNotifications() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted for push notifications');
      }

      // Get push token (Expo Push Token for FCM)
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'moose-ticket', // Your Firebase project ID
      });
      const token = tokenData.data;
      const platform = Platform.OS as 'ios' | 'android' | 'web';

      // Get device info
      const deviceInfo = {
        model: Device.modelName || 'Unknown',
        osVersion: Device.osVersion || 'Unknown',
        appVersion: '1.0.0', // You can get this from app.json or package.json
      };

      // Register token with backend
      const registrationResult = await notificationService.registerPushToken(token, platform);
      
      if (registrationResult.success) {
        // Update Redux store
        store.dispatch(registerPushToken({ 
          token, 
          platform,
          deviceInfo,
          registeredAt: new Date().toISOString()
        }));

        console.log('Push notification token registered successfully:', {
          platform,
          tokenPreview: token.substring(0, 20) + '...',
        });
      } else {
        console.error('Failed to register token with backend:', registrationResult.message);
        throw new Error(registrationResult.message);
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      throw error;
    }
  }

  setupNotificationListeners() {
    // Handle notification received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        this.handleNotificationReceived(notification);
      }
    );

    // Handle notification response (user tapped notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        this.handleNotificationResponse(response);
      }
    );
  }

  private handleNotificationReceived(notification: Notifications.Notification) {
    const data = notification.request.content.data as PushNotificationData;
    
    // Add notification to Redux store
    store.dispatch(addNotification({
      id: notification.request.identifier,
      type: data.type,
      title: notification.request.content.title || data.title,
      message: notification.request.content.body || data.message,
      isRead: false,
      actionUrl: data.actionUrl,
      createdAt: new Date().toISOString(),
      metadata: {
        ticketId: data.ticketId,
        disputeId: data.disputeId,
        paymentId: data.paymentId,
      },
    }));
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data as PushNotificationData;
    
    // Handle navigation based on notification type and data
    if (data.ticketId) {
      // Navigate to ticket details
      console.log('Navigate to ticket:', data.ticketId);
    } else if (data.disputeId) {
      // Navigate to dispute details
      console.log('Navigate to dispute:', data.disputeId);
    } else if (data.paymentId) {
      // Navigate to payment details
      console.log('Navigate to payment:', data.paymentId);
    } else if (data.actionUrl) {
      // Handle custom action URL
      console.log('Handle action URL:', data.actionUrl);
    }
  }

  async scheduleLocalNotification(
    title: string,
    message: string,
    data: Partial<PushNotificationData>,
    trigger?: Notifications.NotificationTriggerInput
  ) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data,
          sound: true,
        },
        trigger: trigger || null, // null = immediate
      });

      console.log('Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log('Badge count set to:', count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  async refreshToken() {
    try {
      // Get new token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'moose-ticket',
      });
      const newToken = tokenData.data;
      const platform = Platform.OS as 'ios' | 'android' | 'web';

      // Get current token from store
      const state = store.getState();
      const currentToken = state.notification?.pushToken?.token;

      // Only register if token has changed
      if (newToken !== currentToken) {
        console.log('Push token changed, updating registration...');
        
        // Unregister old token if it exists
        if (currentToken) {
          await notificationService.unregisterPushToken(currentToken);
        }

        // Register new token
        const registrationResult = await notificationService.registerPushToken(newToken, platform);
        
        if (registrationResult.success) {
          // Update Redux store
          store.dispatch(registerPushToken({ 
            token: newToken, 
            platform,
            deviceInfo: {
              model: Device.modelName || 'Unknown',
              osVersion: Device.osVersion || 'Unknown',
              appVersion: '1.0.0',
            },
            registeredAt: new Date().toISOString()
          }));

          console.log('Push token refreshed successfully');
        }
      }

      return newToken;
    } catch (error) {
      console.error('Error refreshing push token:', error);
      throw error;
    }
  }

  async unregisterToken() {
    try {
      const state = store.getState();
      const currentToken = state.notification?.pushToken?.token;

      if (currentToken) {
        const result = await notificationService.unregisterPushToken(currentToken);
        
        if (result.success) {
          // Clear from Redux store
          store.dispatch(registerPushToken({ 
            token: null, 
            platform: null,
            deviceInfo: null,
            registeredAt: null
          }));

          console.log('Push token unregistered successfully');
        }

        return result;
      }
    } catch (error) {
      console.error('Error unregistering push token:', error);
      throw error;
    }
  }

  async testNotification() {
    try {
      const state = store.getState();
      const currentToken = state.notification?.pushToken?.token;

      if (!currentToken) {
        throw new Error('No push token registered');
      }

      // Send test notification through backend
      const result = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/notifications/device-tokens/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.auth.accessToken}`,
        },
        body: JSON.stringify({
          token: currentToken,
          title: 'Test Notification',
          message: 'This is a test notification from MooseTicket!',
        }),
      });

      const data = await result.json();
      
      if (data.success) {
        console.log('Test notification sent successfully');
      } else {
        console.error('Failed to send test notification:', data.message);
      }

      return data;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  setupAppStateListener() {
    this.appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground, refresh token
        this.refreshToken().catch((error) => {
          console.error('Failed to refresh token on app focus:', error);
        });
      }
    });
  }

  setupTokenRefreshTimer() {
    // Refresh token every 24 hours
    this.tokenRefreshInterval = setInterval(() => {
      this.refreshToken().catch((error) => {
        console.error('Failed to refresh token on timer:', error);
      });
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
    if (this.appStateListener) {
      this.appStateListener.remove();
    }
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }
  }

  // Utility methods for common notification scenarios
  async scheduleTicketReminder(ticketId: string, dueDate: Date) {
    const reminderDate = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before due date
    
    if (reminderDate > new Date()) {
      return this.scheduleLocalNotification(
        'Ticket Due Tomorrow',
        'Don\'t forget to pay your traffic ticket before the due date.',
        {
          type: 'ticket_reminder',
          ticketId,
        },
        { date: reminderDate }
      );
    }
  }

  async notifyPaymentSuccess(ticketId: string, amount: number) {
    return this.scheduleLocalNotification(
      'Payment Confirmed',
      `Your payment of $${amount.toFixed(2)} has been processed successfully.`,
      {
        type: 'payment_confirmation',
        ticketId,
      }
    );
  }

  async notifyDisputeUpdate(disputeId: string, status: string) {
    const statusMessages = {
      'under_review': 'Your dispute is now under review.',
      'approved': 'Great news! Your dispute has been approved.',
      'rejected': 'Your dispute has been rejected. You can view the details for more information.',
      'requires_action': 'Your dispute requires additional information.',
    };

    return this.scheduleLocalNotification(
      'Dispute Status Update',
      statusMessages[status as keyof typeof statusMessages] || `Your dispute status has been updated to ${status}.`,
      {
        type: 'dispute_update',
        disputeId,
      }
    );
  }
}

export const pushNotificationManager = new PushNotificationManager();
export default pushNotificationManager;