// src/store/slices/appSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    badge: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReporting: boolean;
    locationTracking: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large' | 'xl';
    highContrast: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
  };
  biometrics: {
    enabled: boolean;
    type: 'fingerprint' | 'face' | 'none';
  };
}

export interface NetworkStatus {
  isConnected: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  isReachable: boolean;
  lastConnected: string | null;
}

export interface LocationPermission {
  granted: boolean;
  accuracy: 'precise' | 'approximate' | 'denied';
  lastRequested: string | null;
}

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  version: string;
  model: string;
  manufacturer: string;
  uniqueId: string;
  pushToken: string | null;
}

export interface AppState {
  // App lifecycle
  isInitialized: boolean;
  isLoading: boolean;
  isOnline: boolean;
  isInBackground: boolean;
  lastActiveTime: number | null;
  
  // Settings
  settings: AppSettings;
  
  // Device and permissions
  deviceInfo: DeviceInfo;
  networkStatus: NetworkStatus;
  locationPermission: LocationPermission;
  
  // Navigation and UI
  currentRoute: string;
  routeHistory: string[];
  modalStack: string[];
  bottomSheetOpen: boolean;
  keyboardVisible: boolean;
  
  // Cache and storage
  cacheSize: number;
  storageUsed: number;
  lastCacheCleared: string | null;
  
  // Error handling
  errors: {
    id: string;
    message: string;
    stack?: string;
    timestamp: string;
    acknowledged: boolean;
  }[];
  
  // Feature flags
  features: {
    [featureName: string]: boolean;
  };
  
  // App metrics
  metrics: {
    launchCount: number;
    sessionCount: number;
    crashCount: number;
    averageSessionDuration: number;
    lastLaunchDate: string | null;
  };
  
  // Update info
  updateInfo: {
    available: boolean;
    version: string | null;
    mandatory: boolean;
    releaseNotes: string | null;
  };
  
  error: string | null;
}

const defaultSettings: AppSettings = {
  theme: 'auto',
  language: 'en',
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
    badge: true,
  },
  privacy: {
    analytics: true,
    crashReporting: true,
    locationTracking: false,
  },
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    reduceMotion: false,
    screenReader: false,
  },
  biometrics: {
    enabled: false,
    type: 'none',
  },
};

const initialState: AppState = {
  isInitialized: false,
  isLoading: false,
  isOnline: true,
  isInBackground: false,
  lastActiveTime: null,
  
  settings: defaultSettings,
  
  deviceInfo: {
    platform: 'ios',
    version: '1.0.0',
    model: 'Unknown',
    manufacturer: 'Unknown',
    uniqueId: 'unknown',
    pushToken: null,
  },
  
  networkStatus: {
    isConnected: true,
    connectionType: 'unknown',
    isReachable: true,
    lastConnected: null,
  },
  
  locationPermission: {
    granted: false,
    accuracy: 'denied',
    lastRequested: null,
  },
  
  currentRoute: '',
  routeHistory: [],
  modalStack: [],
  bottomSheetOpen: false,
  keyboardVisible: false,
  
  cacheSize: 0,
  storageUsed: 0,
  lastCacheCleared: null,
  
  errors: [],
  
  features: {
    darkMode: true,
    biometricAuth: true,
    pushNotifications: true,
    locationServices: true,
    crashReporting: true,
    analytics: true,
    autoUpdate: true,
    offlineMode: true,
  },
  
  metrics: {
    launchCount: 0,
    sessionCount: 0,
    crashCount: 0,
    averageSessionDuration: 0,
    lastLaunchDate: null,
  },
  
  updateInfo: {
    available: false,
    version: null,
    mandatory: false,
    releaseNotes: null,
  },
  
  error: null,
};

// Async Thunks
export const initializeApp = createAsyncThunk(
  'app/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // Load saved settings
      const savedSettings = await AsyncStorage.getItem('app_settings');
      const settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings;
      
      // Load metrics
      const savedMetrics = await AsyncStorage.getItem('app_metrics');
      const metrics = savedMetrics ? JSON.parse(savedMetrics) : initialState.metrics;
      
      // Increment launch count
      const updatedMetrics = {
        ...metrics,
        launchCount: metrics.launchCount + 1,
        lastLaunchDate: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('app_metrics', JSON.stringify(updatedMetrics));
      
      return {
        settings,
        metrics: updatedMetrics,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize app');
    }
  }
);

export const updateSettings = createAsyncThunk(
  'app/updateSettings',
  async (newSettings: Partial<AppSettings>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { app: AppState };
      const updatedSettings = { ...state.app.settings, ...newSettings };
      
      await AsyncStorage.setItem('app_settings', JSON.stringify(updatedSettings));
      
      return updatedSettings;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update settings');
    }
  }
);

export const clearCache = createAsyncThunk(
  'app/clearCache',
  async (_, { rejectWithValue }) => {
    try {
      // Clear specific cache keys
      const cacheKeys = [
        'tickets_cache',
        'vehicles_cache',
        'payments_cache',
        'notifications_cache',
      ];
      
      await Promise.all(cacheKeys.map(key => AsyncStorage.removeItem(key)));
      
      return {
        clearedAt: new Date().toISOString(),
        size: 0,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to clear cache');
    }
  }
);

export const checkForUpdates = createAsyncThunk(
  'app/checkForUpdates',
  async (_, { rejectWithValue }) => {
    try {
      // Mock update check - in real app, this would call your update service
      const currentVersion = '1.0.0';
      const latestVersion = '1.0.1';
      
      if (currentVersion !== latestVersion) {
        return {
          available: true,
          version: latestVersion,
          mandatory: false,
          releaseNotes: 'Bug fixes and performance improvements',
        };
      }
      
      return {
        available: false,
        version: null,
        mandatory: false,
        releaseNotes: null,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check for updates');
    }
  }
);

export const reportError = createAsyncThunk(
  'app/reportError',
  async (error: { message: string; stack?: string }, { rejectWithValue }) => {
    try {
      const errorReport = {
        id: Date.now().toString(),
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        acknowledged: false,
      };
      
      // In a real app, you would send this to your error reporting service
      console.error('Error reported:', errorReport);
      
      return errorReport;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to report error');
    }
  }
);

export const requestLocationPermission = createAsyncThunk(
  'app/requestLocationPermission',
  async (_, { rejectWithValue }) => {
    try {
      // Mock permission request - in real app, use location permission library
      return {
        granted: true,
        accuracy: 'precise' as const,
        lastRequested: new Date().toISOString(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to request location permission');
    }
  }
);

export const updateDeviceInfo = createAsyncThunk(
  'app/updateDeviceInfo',
  async (deviceInfo: Partial<DeviceInfo>, { rejectWithValue }) => {
    try {
      return deviceInfo;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update device info');
    }
  }
);

// App Slice
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      state.networkStatus.isConnected = action.payload;
      
      if (action.payload) {
        state.networkStatus.lastConnected = new Date().toISOString();
      }
    },
    
    updateNetworkStatus: (state, action: PayloadAction<Partial<NetworkStatus>>) => {
      state.networkStatus = { ...state.networkStatus, ...action.payload };
    },
    
    setBackgroundState: (state, action: PayloadAction<boolean>) => {
      state.isInBackground = action.payload;
      
      if (!action.payload) {
        state.lastActiveTime = Date.now();
      }
    },
    
    setCurrentRoute: (state, action: PayloadAction<string>) => {
      const route = action.payload;
      
      if (state.currentRoute !== route) {
        if (state.currentRoute) {
          state.routeHistory.push(state.currentRoute);
        }
        state.currentRoute = route;
        
        // Keep only last 10 routes in history
        if (state.routeHistory.length > 10) {
          state.routeHistory = state.routeHistory.slice(-10);
        }
      }
    },
    
    openModal: (state, action: PayloadAction<string>) => {
      state.modalStack.push(action.payload);
    },
    
    closeModal: (state, action: PayloadAction<string>) => {
      const index = state.modalStack.lastIndexOf(action.payload);
      if (index > -1) {
        state.modalStack.splice(index, 1);
      }
    },
    
    closeAllModals: (state) => {
      state.modalStack = [];
    },
    
    setBottomSheetOpen: (state, action: PayloadAction<boolean>) => {
      state.bottomSheetOpen = action.payload;
    },
    
    setKeyboardVisible: (state, action: PayloadAction<boolean>) => {
      state.keyboardVisible = action.payload;
    },
    
    addError: (state, action: PayloadAction<{ message: string; stack?: string }>) => {
      const error = {
        id: Date.now().toString(),
        message: action.payload.message,
        stack: action.payload.stack,
        timestamp: new Date().toISOString(),
        acknowledged: false,
      };
      
      state.errors.unshift(error);
      
      // Keep only last 50 errors
      if (state.errors.length > 50) {
        state.errors = state.errors.slice(0, 50);
      }
    },
    
    acknowledgeError: (state, action: PayloadAction<string>) => {
      const error = state.errors.find(err => err.id === action.payload);
      if (error) {
        error.acknowledged = true;
      }
    },
    
    clearErrors: (state) => {
      state.errors = [];
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    updateFeatureFlag: (state, action: PayloadAction<{ feature: string; enabled: boolean }>) => {
      state.features[action.payload.feature] = action.payload.enabled;
    },
    
    updateFeatureFlags: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.features = { ...state.features, ...action.payload };
    },
    
    incrementSessionCount: (state) => {
      state.metrics.sessionCount += 1;
    },
    
    incrementCrashCount: (state) => {
      state.metrics.crashCount += 1;
    },
    
    updateSessionDuration: (state, action: PayloadAction<number>) => {
      const { sessionCount, averageSessionDuration } = state.metrics;
      const newAverage = ((averageSessionDuration * sessionCount) + action.payload) / (sessionCount + 1);
      state.metrics.averageSessionDuration = newAverage;
    },
    
    updateCacheSize: (state, action: PayloadAction<number>) => {
      state.cacheSize = action.payload;
    },
    
    updateStorageUsed: (state, action: PayloadAction<number>) => {
      state.storageUsed = action.payload;
    },
    
    dismissUpdate: (state) => {
      state.updateInfo.available = false;
    },
    
    resetApp: (state) => {
      // Reset to initial state but keep device info and some metrics
      const deviceInfo = state.deviceInfo;
      const launchCount = state.metrics.launchCount;
      
      Object.assign(state, {
        ...initialState,
        deviceInfo,
        metrics: {
          ...initialState.metrics,
          launchCount,
        },
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize app cases
      .addCase(initializeApp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeApp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.settings = action.payload.settings;
        state.metrics = action.payload.metrics;
        state.lastActiveTime = Date.now();
        state.error = null;
      })
      .addCase(initializeApp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update settings cases
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.error = null;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Clear cache cases
      .addCase(clearCache.fulfilled, (state, action) => {
        state.cacheSize = action.payload.size;
        state.lastCacheCleared = action.payload.clearedAt;
        state.error = null;
      })
      .addCase(clearCache.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Check for updates cases
      .addCase(checkForUpdates.fulfilled, (state, action) => {
        state.updateInfo = action.payload;
        state.error = null;
      })
      .addCase(checkForUpdates.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Report error cases
      .addCase(reportError.fulfilled, (state, action) => {
        state.errors.unshift(action.payload);
        
        // Keep only last 50 errors
        if (state.errors.length > 50) {
          state.errors = state.errors.slice(0, 50);
        }
      })
      
      // Location permission cases
      .addCase(requestLocationPermission.fulfilled, (state, action) => {
        state.locationPermission = action.payload;
        state.error = null;
      })
      .addCase(requestLocationPermission.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Device info cases
      .addCase(updateDeviceInfo.fulfilled, (state, action) => {
        state.deviceInfo = { ...state.deviceInfo, ...action.payload };
        state.error = null;
      })
      .addCase(updateDeviceInfo.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setLoading,
  setOnlineStatus,
  updateNetworkStatus,
  setBackgroundState,
  setCurrentRoute,
  openModal,
  closeModal,
  closeAllModals,
  setBottomSheetOpen,
  setKeyboardVisible,
  addError,
  acknowledgeError,
  clearErrors,
  clearError,
  updateFeatureFlag,
  updateFeatureFlags,
  incrementSessionCount,
  incrementCrashCount,
  updateSessionDuration,
  updateCacheSize,
  updateStorageUsed,
  dismissUpdate,
  resetApp,
} = appSlice.actions;

export default appSlice.reducer;

// Selectors
export const selectIsInitialized = (state: { app: AppState }) => state.app.isInitialized;
export const selectIsLoading = (state: { app: AppState }) => state.app.isLoading;
export const selectIsOnline = (state: { app: AppState }) => state.app.isOnline;
export const selectIsInBackground = (state: { app: AppState }) => state.app.isInBackground;
export const selectSettings = (state: { app: AppState }) => state.app.settings;
export const selectTheme = (state: { app: AppState }) => state.app.settings.theme;
export const selectLanguage = (state: { app: AppState }) => state.app.settings.language;
export const selectNotificationSettings = (state: { app: AppState }) => state.app.settings.notifications;
export const selectPrivacySettings = (state: { app: AppState }) => state.app.settings.privacy;
export const selectAccessibilitySettings = (state: { app: AppState }) => state.app.settings.accessibility;
export const selectBiometricSettings = (state: { app: AppState }) => state.app.settings.biometrics;
export const selectDeviceInfo = (state: { app: AppState }) => state.app.deviceInfo;
export const selectNetworkStatus = (state: { app: AppState }) => state.app.networkStatus;
export const selectLocationPermission = (state: { app: AppState }) => state.app.locationPermission;
export const selectCurrentRoute = (state: { app: AppState }) => state.app.currentRoute;
export const selectRouteHistory = (state: { app: AppState }) => state.app.routeHistory;
export const selectModalStack = (state: { app: AppState }) => state.app.modalStack;
export const selectIsBottomSheetOpen = (state: { app: AppState }) => state.app.bottomSheetOpen;
export const selectIsKeyboardVisible = (state: { app: AppState }) => state.app.keyboardVisible;
export const selectErrors = (state: { app: AppState }) => state.app.errors;
export const selectUnacknowledgedErrors = (state: { app: AppState }) => state.app.errors.filter(err => !err.acknowledged);
export const selectFeatures = (state: { app: AppState }) => state.app.features;
export const selectFeature = (featureName: string) => (state: { app: AppState }) => state.app.features[featureName];
export const selectMetrics = (state: { app: AppState }) => state.app.metrics;
export const selectUpdateInfo = (state: { app: AppState }) => state.app.updateInfo;
export const selectCacheSize = (state: { app: AppState }) => state.app.cacheSize;
export const selectStorageUsed = (state: { app: AppState }) => state.app.storageUsed;
export const selectAppError = (state: { app: AppState }) => state.app.error;