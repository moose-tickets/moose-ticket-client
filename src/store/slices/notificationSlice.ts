// src/store/slices/notificationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import notificationService from '../../services/notificationService';
import { 
  Notification,
  CreateNotificationRequest,
  ApiResponse,
  PaginationParams 
} from '../../types/api';

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  types: Record<string, boolean>;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  timezone: string;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface DeliveryLog {
  id: string;
  notificationId: string;
  channel: 'email' | 'sms' | 'push';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  timestamp: string;
  error?: string;
}

export interface NotificationTemplate {
  id: string;
  type: Notification['type'];
  title: string;
  body: string;
  variables: string[];
}

export interface NotificationState {
  notifications: Notification[];
  currentNotification: Notification | null;
  unreadCount: number;
  settings: NotificationSettings | null;
  preferences: NotificationPreferences | null;
  templates: NotificationTemplate[];
  deliveryLogs: DeliveryLog[];
  pushToken: {
    token: string | null;
    platform: 'ios' | 'android' | 'web' | null;
    deviceInfo: {
      model?: string;
      osVersion?: string;
      appVersion?: string;
    } | null;
    registeredAt: string | null;
  } | null;
  filters: {
    type?: Notification['type'];
    isRead?: boolean;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  isLoadingNotification: boolean;
  isLoadingSettings: boolean;
  isUpdatingSettings: boolean;
  isMarkingAsRead: boolean;
  isMarkingAllAsRead: boolean;
  isDeleting: boolean;
  isRegisteringPushToken: boolean;
  isSendingTest: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: NotificationState = {
  notifications: [],
  currentNotification: null,
  unreadCount: 0,
  settings: null,
  preferences: null,
  templates: [],
  deliveryLogs: [],
  pushToken: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  isLoadingNotification: false,
  isLoadingSettings: false,
  isUpdatingSettings: false,
  isMarkingAsRead: false,
  isMarkingAllAsRead: false,
  isDeleting: false,
  isRegisteringPushToken: false,
  isSendingTest: false,
  error: null,
  lastUpdated: null,
};

// Async Thunks - Notification Management
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params?: PaginationParams & { type?: Notification['type']; isRead?: boolean }, { rejectWithValue }) => {
    try {
      const response = await notificationService.getNotifications(params);
      if (response.success && response.data) {
        return {
          notifications: response.data,
          pagination: response.pagination || {
            page: params?.page || 1,
            limit: params?.limit || 20,
            total: response.data.length,
            totalPages: Math.ceil(response.data.length / (params?.limit || 20)),
          }
        };
      } else {
        return rejectWithValue(response.message || 'Failed to fetch notifications');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchNotification = createAsyncThunk(
  'notifications/fetchNotification',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await notificationService.getNotification(notificationId);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch notification');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to mark as read');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to mark all as read');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      if (response.success) {
        return notificationId;
      } else {
        return rejectWithValue(response.message || 'Failed to delete notification');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success && response.data) {
        return response.data.count;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch unread count');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Push Notifications
export const registerPushToken = createAsyncThunk(
  'notifications/registerPushToken',
  async ({ token, platform, deviceInfo, registeredAt }: { 
    token: string | null; 
    platform: 'ios' | 'android' | 'web' | null;
    deviceInfo?: {
      model?: string;
      osVersion?: string;
      appVersion?: string;
    } | null;
    registeredAt?: string | null;
  }, { rejectWithValue }) => {
    try {
      if (token && platform) {
        const response = await notificationService.registerPushToken(token, platform);
        if (response.success) {
          return { token, platform, deviceInfo, registeredAt };
        } else {
          return rejectWithValue(response.message || 'Failed to register push token');
        }
      } else {
        // Clear token case
        return { token, platform, deviceInfo, registeredAt };
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const unregisterPushToken = createAsyncThunk(
  'notifications/unregisterPushToken',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await notificationService.unregisterPushToken(token);
      if (response.success) {
        return true;
      } else {
        return rejectWithValue(response.message || 'Failed to unregister push token');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Settings and Preferences
export const fetchNotificationSettings = createAsyncThunk(
  'notifications/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getNotificationSettings();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch settings');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateSettings',
  async (settings: Partial<NotificationSettings>, { rejectWithValue }) => {
    try {
      const response = await notificationService.updateNotificationSettings(settings);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to update settings');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchNotificationPreferences = createAsyncThunk(
  'notifications/fetchPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getUserPreferences();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch preferences');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateNotificationPreferences = createAsyncThunk(
  'notifications/updatePreferences',
  async (preferences: Partial<NotificationPreferences>, { rejectWithValue }) => {
    try {
      const response = await notificationService.updateUserPreferences(preferences);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to update preferences');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Templates and Logs
export const fetchNotificationTemplates = createAsyncThunk(
  'notifications/fetchTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getNotificationTemplates();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch templates');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchDeliveryLogs = createAsyncThunk(
  'notifications/fetchDeliveryLogs',
  async (params?: PaginationParams & { dateFrom?: string; dateTo?: string; status?: string }, { rejectWithValue }) => {
    try {
      const response = await notificationService.getDeliveryLogs(params);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch delivery logs');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Test and Bulk Operations
export const sendTestNotification = createAsyncThunk(
  'notifications/sendTest',
  async ({ type, title, message }: { type: Notification['type']; title?: string; message?: string }, { rejectWithValue }) => {
    try {
      const response = await notificationService.sendTestNotification(type, title, message);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to send test notification');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const markMultipleAsRead = createAsyncThunk(
  'notifications/markMultipleAsRead',
  async (notificationIds: string[], { rejectWithValue }) => {
    try {
      const response = await notificationService.markMultipleAsRead(notificationIds);
      if (response.success) {
        return notificationIds;
      } else {
        return rejectWithValue(response.message || 'Failed to mark multiple as read');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deleteMultipleNotifications = createAsyncThunk(
  'notifications/deleteMultiple',
  async (notificationIds: string[], { rejectWithValue }) => {
    try {
      const response = await notificationService.deleteMultiple(notificationIds);
      if (response.success) {
        return notificationIds;
      } else {
        return rejectWithValue(response.message || 'Failed to delete multiple notifications');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Notification Slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentNotification: (state) => {
      state.currentNotification = null;
    },
    setFilters: (state, action: PayloadAction<typeof initialState.filters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    updateNotificationInList: (state, action: PayloadAction<Notification>) => {
      const index = state.notifications.findIndex(notif => notif.id === action.payload.id);
      if (index !== -1) {
        const oldNotification = state.notifications[index];
        state.notifications[index] = action.payload;
        
        // Update unread count
        if (oldNotification.isRead !== action.payload.isRead) {
          if (action.payload.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          } else {
            state.unreadCount += 1;
          }
        }
      }
    },
    removeNotificationFromList: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(notif => notif.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    markNotificationAsReadInList: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(notif => notif.id === action.payload);
      if (index !== -1 && !state.notifications[index].isRead) {
        state.notifications[index].isRead = true;
        state.notifications[index].readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllNotificationsAsReadInList: (state) => {
      state.notifications.forEach(notification => {
        if (!notification.isRead) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
        }
      });
      state.unreadCount = 0;
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    resetUnreadCount: (state) => {
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications cases
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications;
        state.pagination = action.payload.pagination;
        
        // Calculate unread count
        state.unreadCount = action.payload.notifications.filter(n => !n.isRead).length;
        
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch single notification cases
      .addCase(fetchNotification.pending, (state) => {
        state.isLoadingNotification = true;
        state.error = null;
      })
      .addCase(fetchNotification.fulfilled, (state, action) => {
        state.isLoadingNotification = false;
        state.currentNotification = action.payload;
        state.error = null;
      })
      .addCase(fetchNotification.rejected, (state, action) => {
        state.isLoadingNotification = false;
        state.error = action.payload as string;
      })
      
      // Mark as read cases
      .addCase(markAsRead.pending, (state) => {
        state.isMarkingAsRead = true;
        state.error = null;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.isMarkingAsRead = false;
        
        // Update notification in list
        const index = state.notifications.findIndex(notif => notif.id === action.payload.id);
        if (index !== -1 && !state.notifications[index].isRead) {
          state.notifications[index] = action.payload;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        
        // Update current notification
        if (state.currentNotification && state.currentNotification.id === action.payload.id) {
          state.currentNotification = action.payload;
        }
        
        state.error = null;
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.isMarkingAsRead = false;
        state.error = action.payload as string;
      })
      
      // Mark all as read cases
      .addCase(markAllAsRead.pending, (state) => {
        state.isMarkingAllAsRead = true;
        state.error = null;
      })
      .addCase(markAllAsRead.fulfilled, (state, action) => {
        state.isMarkingAllAsRead = false;
        
        // Mark all notifications as read
        state.notifications.forEach(notification => {
          if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date().toISOString();
          }
        });
        
        state.unreadCount = 0;
        state.error = null;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.isMarkingAllAsRead = false;
        state.error = action.payload as string;
      })
      
      // Delete notification cases
      .addCase(deleteNotification.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.isDeleting = false;
        
        const index = state.notifications.findIndex(notif => notif.id === action.payload);
        if (index !== -1) {
          const notification = state.notifications[index];
          if (!notification.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications.splice(index, 1);
        }
        
        if (state.currentNotification && state.currentNotification.id === action.payload) {
          state.currentNotification = null;
        }
        
        state.error = null;
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      })
      
      // Fetch unread count cases
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
        state.error = null;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Push token registration cases
      .addCase(registerPushToken.pending, (state) => {
        state.isRegisteringPushToken = true;
        state.error = null;
      })
      .addCase(registerPushToken.fulfilled, (state, action) => {
        state.isRegisteringPushToken = false;
        state.pushToken = {
          token: action.payload.token,
          platform: action.payload.platform,
          deviceInfo: action.payload.deviceInfo || null,
          registeredAt: action.payload.registeredAt || null,
        };
        state.error = null;
      })
      .addCase(registerPushToken.rejected, (state, action) => {
        state.isRegisteringPushToken = false;
        state.error = action.payload as string;
      })
      
      // Push token unregistration cases
      .addCase(unregisterPushToken.fulfilled, (state) => {
        state.pushToken = null;
        state.error = null;
      })
      .addCase(unregisterPushToken.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Settings cases
      .addCase(fetchNotificationSettings.pending, (state) => {
        state.isLoadingSettings = true;
        state.error = null;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.isLoadingSettings = false;
        state.settings = action.payload;
        state.error = null;
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.isLoadingSettings = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateNotificationSettings.pending, (state) => {
        state.isUpdatingSettings = true;
        state.error = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.isUpdatingSettings = false;
        state.settings = action.payload;
        state.error = null;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.isUpdatingSettings = false;
        state.error = action.payload as string;
      })
      
      // Preferences cases
      .addCase(fetchNotificationPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
        state.error = null;
      })
      .addCase(fetchNotificationPreferences.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
        state.error = null;
      })
      .addCase(updateNotificationPreferences.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Templates and logs cases
      .addCase(fetchNotificationTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;
        state.error = null;
      })
      .addCase(fetchNotificationTemplates.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      .addCase(fetchDeliveryLogs.fulfilled, (state, action) => {
        state.deliveryLogs = action.payload;
        state.error = null;
      })
      .addCase(fetchDeliveryLogs.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Test notification cases
      .addCase(sendTestNotification.pending, (state) => {
        state.isSendingTest = true;
        state.error = null;
      })
      .addCase(sendTestNotification.fulfilled, (state) => {
        state.isSendingTest = false;
        state.error = null;
      })
      .addCase(sendTestNotification.rejected, (state, action) => {
        state.isSendingTest = false;
        state.error = action.payload as string;
      })
      
      // Bulk operations cases
      .addCase(markMultipleAsRead.fulfilled, (state, action) => {
        const notificationIds = action.payload;
        let unreadReduced = 0;
        
        state.notifications.forEach(notification => {
          if (notificationIds.includes(notification.id) && !notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date().toISOString();
            unreadReduced++;
          }
        });
        
        state.unreadCount = Math.max(0, state.unreadCount - unreadReduced);
        state.error = null;
      })
      .addCase(markMultipleAsRead.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      .addCase(deleteMultipleNotifications.fulfilled, (state, action) => {
        const notificationIds = action.payload;
        let unreadReduced = 0;
        
        state.notifications = state.notifications.filter(notification => {
          if (notificationIds.includes(notification.id)) {
            if (!notification.isRead) {
              unreadReduced++;
            }
            return false;
          }
          return true;
        });
        
        state.unreadCount = Math.max(0, state.unreadCount - unreadReduced);
        state.error = null;
      })
      .addCase(deleteMultipleNotifications.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentNotification,
  setFilters,
  clearFilters,
  setPagination,
  addNotification,
  updateNotificationInList,
  removeNotificationFromList,
  markNotificationAsReadInList,
  markAllNotificationsAsReadInList,
  incrementUnreadCount,
  decrementUnreadCount,
  resetUnreadCount,
} = notificationSlice.actions;

export default notificationSlice.reducer;

// Selectors
export const selectNotifications = (state: { notifications: NotificationState }) => state.notifications.notifications;
export const selectCurrentNotification = (state: { notifications: NotificationState }) => state.notifications.currentNotification;
export const selectUnreadCount = (state: { notifications: NotificationState }) => state.notifications.unreadCount;
export const selectNotificationSettings = (state: { notifications: NotificationState }) => state.notifications.settings;
export const selectNotificationPreferences = (state: { notifications: NotificationState }) => state.notifications.preferences;
export const selectNotificationTemplates = (state: { notifications: NotificationState }) => state.notifications.templates;
export const selectDeliveryLogs = (state: { notifications: NotificationState }) => state.notifications.deliveryLogs;
export const selectPushToken = (state: { notifications: NotificationState }) => state.notifications.pushToken;
export const selectNotificationFilters = (state: { notifications: NotificationState }) => state.notifications.filters;
export const selectNotificationPagination = (state: { notifications: NotificationState }) => state.notifications.pagination;
export const selectNotificationLoading = (state: { notifications: NotificationState }) => state.notifications.isLoading;
export const selectNotificationError = (state: { notifications: NotificationState }) => state.notifications.error;
export const selectIsMarkingAsRead = (state: { notifications: NotificationState }) => state.notifications.isMarkingAsRead;
export const selectIsMarkingAllAsRead = (state: { notifications: NotificationState }) => state.notifications.isMarkingAllAsRead;
export const selectIsDeletingNotification = (state: { notifications: NotificationState }) => state.notifications.isDeleting;