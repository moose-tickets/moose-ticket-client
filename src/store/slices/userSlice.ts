// src/store/slices/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import userService from '../../services/userService';
import { 
  User,
  UpdateUserRequest,
  UserPreferences,
  UpdatePreferencesRequest,
  Address,
  CreateAddressRequest,
  ApiResponse,
  PaginationParams 
} from '../../types/api';

export interface UserActivity {
  logins: number;
  ticketsCreated: number;
  paymentsProcessed: number;
  lastActivityDate: string;
  totalTimeSpent: number;
  featuresUsed: string[];
}

export interface UserStats {
  totalTickets: number;
  totalPaid: number;
  totalOutstanding: number;
  avgTicketAmount: number;
  mostFrequentViolation: string;
  accountAge: number;
  subscriptionStatus: string;
}

export interface UserAnalytics {
  activity: UserActivity;
  stats: UserStats;
  usage: {
    dailyUsage: { [date: string]: number };
    weeklyUsage: { [week: string]: number };
    monthlyUsage: { [month: string]: number };
  };
}

export interface UserState {
  profile: User | null;
  preferences: UserPreferences | null;
  addresses: Address[];
  defaultAddress: Address | null;
  activity: UserActivity | null;
  stats: UserStats | null;
  analytics: UserAnalytics | null;
  avatarUploadProgress: number | null;
  exportData: any | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  isLoadingProfile: boolean;
  isLoadingPreferences: boolean;
  isLoadingAddresses: boolean;
  isUpdatingProfile: boolean;
  isUpdatingPreferences: boolean;
  isUploadingAvatar: boolean;
  isCreatingAddress: boolean;
  isUpdatingAddress: boolean;
  isDeletingAddress: boolean;
  isSettingDefaultAddress: boolean;
  isDeletingAccount: boolean;
  isExporting: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: UserState = {
  profile: null,
  preferences: null,
  addresses: [],
  defaultAddress: null,
  activity: null,
  stats: null,
  analytics: null,
  avatarUploadProgress: null,
  exportData: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  isLoadingProfile: false,
  isLoadingPreferences: false,
  isLoadingAddresses: false,
  isUpdatingProfile: false,
  isUpdatingPreferences: false,
  isUploadingAvatar: false,
  isCreatingAddress: false,
  isUpdatingAddress: false,
  isDeletingAddress: false,
  isSettingDefaultAddress: false,
  isDeletingAccount: false,
  isExporting: false,
  error: null,
  lastUpdated: null,
};

// Async Thunks - Profile Management
export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getProfile();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch profile');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData: UpdateUserRequest, { rejectWithValue }) => {
    try {
      const response = await userService.updateProfile(profileData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'user/uploadAvatar',
  async ({ imageFile, filename }: { imageFile: File | Blob; filename: string }, { rejectWithValue }) => {
    try {
      const response = await userService.uploadAvatar(imageFile, filename);
      if (response.success && response.data) {
        return response.data.avatar;
      } else {
        return rejectWithValue(response.message || 'Failed to upload avatar');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Preferences Management
export const fetchPreferences = createAsyncThunk(
  'user/fetchPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getPreferences();
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

export const updatePreferences = createAsyncThunk(
  'user/updatePreferences',
  async (preferences: UpdatePreferencesRequest, { rejectWithValue }) => {
    try {
      const response = await userService.updatePreferences(preferences);
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

// Async Thunks - Address Management
export const fetchAddresses = createAsyncThunk(
  'user/fetchAddresses',
  async (params?: PaginationParams, { rejectWithValue }) => {
    try {
      const response = await userService.getAddresses(params);
      if (response.success && response.data) {
        return {
          addresses: response.data,
          pagination: response.pagination || {
            page: params?.page || 1,
            limit: params?.limit || 20,
            total: response.data.length,
            totalPages: Math.ceil(response.data.length / (params?.limit || 20)),
          }
        };
      } else {
        return rejectWithValue(response.message || 'Failed to fetch addresses');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createAddress = createAsyncThunk(
  'user/createAddress',
  async (addressData: CreateAddressRequest, { rejectWithValue }) => {
    try {
      const response = await userService.createAddress(addressData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to create address');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateAddress = createAsyncThunk(
  'user/updateAddress',
  async ({ addressId, updates }: { addressId: string; updates: Partial<CreateAddressRequest> }, { rejectWithValue }) => {
    try {
      const response = await userService.updateAddress(addressId, updates);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to update address');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'user/deleteAddress',
  async (addressId: string, { rejectWithValue }) => {
    try {
      const response = await userService.deleteAddress(addressId);
      if (response.success) {
        return addressId;
      } else {
        return rejectWithValue(response.message || 'Failed to delete address');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const setDefaultAddress = createAsyncThunk(
  'user/setDefaultAddress',
  async (addressId: string, { rejectWithValue }) => {
    try {
      const response = await userService.setDefaultAddress(addressId);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to set default address');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Account Management
export const deleteAccount = createAsyncThunk(
  'user/deleteAccount',
  async (password: string, { rejectWithValue }) => {
    try {
      const response = await userService.deleteAccount(password);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to delete account');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Analytics and Export
export const fetchUserAnalytics = createAsyncThunk(
  'user/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getAnalytics();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch analytics');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchUserActivity = createAsyncThunk(
  'user/fetchActivity',
  async (timeRange?: string, { rejectWithValue }) => {
    try {
      const response = await userService.getUserActivity(timeRange);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch activity');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  'user/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getUserStats();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch stats');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const exportUserData = createAsyncThunk(
  'user/exportData',
  async (format: 'json' | 'csv' = 'json', { rejectWithValue }) => {
    try {
      const response = await userService.exportUserData(format);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to export data');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// User Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearExportData: (state) => {
      state.exportData = null;
    },
    updateAvatarUploadProgress: (state, action: PayloadAction<number>) => {
      state.avatarUploadProgress = action.payload;
    },
    clearAvatarUploadProgress: (state) => {
      state.avatarUploadProgress = null;
    },
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    updateProfileInState: (state, action: PayloadAction<Partial<User>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    updatePreferencesInState: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      if (state.preferences) {
        state.preferences = { ...state.preferences, ...action.payload };
      }
    },
    addAddressToList: (state, action: PayloadAction<Address>) => {
      state.addresses.unshift(action.payload);
      
      // Set as default if specified
      if (action.payload.isDefault) {
        // Clear previous default
        state.addresses.forEach(address => {
          if (address.id !== action.payload.id) {
            address.isDefault = false;
          }
        });
        state.defaultAddress = action.payload;
      }
    },
    updateAddressInList: (state, action: PayloadAction<Address>) => {
      const index = state.addresses.findIndex(address => address.id === action.payload.id);
      if (index !== -1) {
        state.addresses[index] = action.payload;
      }
      
      // Update default address if needed
      if (action.payload.isDefault) {
        state.defaultAddress = action.payload;
      } else if (state.defaultAddress && state.defaultAddress.id === action.payload.id) {
        state.defaultAddress = null;
      }
    },
    removeAddressFromList: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.filter(address => address.id !== action.payload);
      
      if (state.defaultAddress && state.defaultAddress.id === action.payload) {
        state.defaultAddress = null;
      }
    },
    setDefaultAddressInList: (state, action: PayloadAction<string>) => {
      // Clear previous default
      state.addresses.forEach(address => {
        address.isDefault = false;
      });
      
      // Set new default
      const index = state.addresses.findIndex(address => address.id === action.payload);
      if (index !== -1) {
        state.addresses[index].isDefault = true;
        state.defaultAddress = state.addresses[index];
      }
    },
    resetUserState: (state) => {
      // Reset all user data (useful for logout)
      state.profile = null;
      state.preferences = null;
      state.addresses = [];
      state.defaultAddress = null;
      state.activity = null;
      state.stats = null;
      state.analytics = null;
      state.exportData = null;
      state.avatarUploadProgress = null;
      state.error = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile cases
      .addCase(fetchProfile.pending, (state) => {
        state.isLoadingProfile = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoadingProfile = false;
        state.profile = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoadingProfile = false;
        state.error = action.payload as string;
      })
      
      // Update profile cases
      .addCase(updateProfile.pending, (state) => {
        state.isUpdatingProfile = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isUpdatingProfile = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isUpdatingProfile = false;
        state.error = action.payload as string;
      })
      
      // Upload avatar cases
      .addCase(uploadAvatar.pending, (state) => {
        state.isUploadingAvatar = true;
        state.avatarUploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.isUploadingAvatar = false;
        state.avatarUploadProgress = null;
        
        if (state.profile) {
          state.profile.avatar = action.payload;
        }
        
        state.error = null;
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.isUploadingAvatar = false;
        state.avatarUploadProgress = null;
        state.error = action.payload as string;
      })
      
      // Fetch preferences cases
      .addCase(fetchPreferences.pending, (state) => {
        state.isLoadingPreferences = true;
        state.error = null;
      })
      .addCase(fetchPreferences.fulfilled, (state, action) => {
        state.isLoadingPreferences = false;
        state.preferences = action.payload;
        state.error = null;
      })
      .addCase(fetchPreferences.rejected, (state, action) => {
        state.isLoadingPreferences = false;
        state.error = action.payload as string;
      })
      
      // Update preferences cases
      .addCase(updatePreferences.pending, (state) => {
        state.isUpdatingPreferences = true;
        state.error = null;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.isUpdatingPreferences = false;
        state.preferences = action.payload;
        state.error = null;
      })
      .addCase(updatePreferences.rejected, (state, action) => {
        state.isUpdatingPreferences = false;
        state.error = action.payload as string;
      })
      
      // Fetch addresses cases
      .addCase(fetchAddresses.pending, (state) => {
        state.isLoadingAddresses = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.isLoadingAddresses = false;
        state.addresses = action.payload.addresses;
        state.pagination = action.payload.pagination;
        
        // Set default address if found
        const defaultAddress = action.payload.addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          state.defaultAddress = defaultAddress;
        }
        
        state.error = null;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.isLoadingAddresses = false;
        state.error = action.payload as string;
      })
      
      // Create address cases
      .addCase(createAddress.pending, (state) => {
        state.isCreatingAddress = true;
        state.error = null;
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.isCreatingAddress = false;
        state.addresses.unshift(action.payload);
        
        // Set as default if specified
        if (action.payload.isDefault) {
          // Clear previous default
          state.addresses.forEach(address => {
            if (address.id !== action.payload.id) {
              address.isDefault = false;
            }
          });
          state.defaultAddress = action.payload;
        }
        
        state.error = null;
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.isCreatingAddress = false;
        state.error = action.payload as string;
      })
      
      // Update address cases
      .addCase(updateAddress.pending, (state) => {
        state.isUpdatingAddress = true;
        state.error = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.isUpdatingAddress = false;
        const index = state.addresses.findIndex(address => address.id === action.payload.id);
        if (index !== -1) {
          state.addresses[index] = action.payload;
        }
        
        // Update default address if needed
        if (action.payload.isDefault) {
          state.defaultAddress = action.payload;
        } else if (state.defaultAddress && state.defaultAddress.id === action.payload.id) {
          state.defaultAddress = null;
        }
        
        state.error = null;
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.isUpdatingAddress = false;
        state.error = action.payload as string;
      })
      
      // Delete address cases
      .addCase(deleteAddress.pending, (state) => {
        state.isDeletingAddress = true;
        state.error = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.isDeletingAddress = false;
        state.addresses = state.addresses.filter(address => address.id !== action.payload);
        
        if (state.defaultAddress && state.defaultAddress.id === action.payload) {
          state.defaultAddress = null;
        }
        
        state.error = null;
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.isDeletingAddress = false;
        state.error = action.payload as string;
      })
      
      // Set default address cases
      .addCase(setDefaultAddress.pending, (state) => {
        state.isSettingDefaultAddress = true;
        state.error = null;
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.isSettingDefaultAddress = false;
        
        // Clear all defaults
        state.addresses.forEach(address => {
          address.isDefault = false;
        });
        
        // Set new default
        const index = state.addresses.findIndex(address => address.id === action.payload.id);
        if (index !== -1) {
          state.addresses[index] = action.payload;
        }
        
        state.defaultAddress = action.payload;
        state.error = null;
      })
      .addCase(setDefaultAddress.rejected, (state, action) => {
        state.isSettingDefaultAddress = false;
        state.error = action.payload as string;
      })
      
      // Delete account cases
      .addCase(deleteAccount.pending, (state) => {
        state.isDeletingAccount = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.isDeletingAccount = false;
        // Clear all user data
        state.profile = null;
        state.preferences = null;
        state.addresses = [];
        state.defaultAddress = null;
        state.error = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.isDeletingAccount = false;
        state.error = action.payload as string;
      })
      
      // Analytics and stats cases
      .addCase(fetchUserAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
        state.error = null;
      })
      .addCase(fetchUserAnalytics.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      .addCase(fetchUserActivity.fulfilled, (state, action) => {
        state.activity = action.payload;
        state.error = null;
      })
      .addCase(fetchUserActivity.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Export data cases
      .addCase(exportUserData.pending, (state) => {
        state.isExporting = true;
        state.error = null;
      })
      .addCase(exportUserData.fulfilled, (state, action) => {
        state.isExporting = false;
        state.exportData = action.payload;
        state.error = null;
      })
      .addCase(exportUserData.rejected, (state, action) => {
        state.isExporting = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearExportData,
  updateAvatarUploadProgress,
  clearAvatarUploadProgress,
  setPagination,
  updateProfileInState,
  updatePreferencesInState,
  addAddressToList,
  updateAddressInList,
  removeAddressFromList,
  setDefaultAddressInList,
  resetUserState,
} = userSlice.actions;

export default userSlice.reducer;

// Selectors
export const selectProfile = (state: { user: UserState }) => state.user.profile;
export const selectPreferences = (state: { user: UserState }) => state.user.preferences;
export const selectAddresses = (state: { user: UserState }) => state.user.addresses;
export const selectDefaultAddress = (state: { user: UserState }) => state.user.defaultAddress;
export const selectUserActivity = (state: { user: UserState }) => state.user.activity;
export const selectUserStats = (state: { user: UserState }) => state.user.stats;
export const selectUserAnalytics = (state: { user: UserState }) => state.user.analytics;
export const selectExportData = (state: { user: UserState }) => state.user.exportData;
export const selectAvatarUploadProgress = (state: { user: UserState }) => state.user.avatarUploadProgress;
export const selectUserPagination = (state: { user: UserState }) => state.user.pagination;
export const selectUserLoading = (state: { user: UserState }) => state.user.isLoading;
export const selectUserError = (state: { user: UserState }) => state.user.error;
export const selectIsUpdatingProfile = (state: { user: UserState }) => state.user.isUpdatingProfile;
export const selectIsUploadingAvatar = (state: { user: UserState }) => state.user.isUploadingAvatar;
export const selectIsUpdatingPreferences = (state: { user: UserState }) => state.user.isUpdatingPreferences;
export const selectIsCreatingAddress = (state: { user: UserState }) => state.user.isCreatingAddress;
export const selectIsUpdatingAddress = (state: { user: UserState }) => state.user.isUpdatingAddress;
export const selectIsDeletingAddress = (state: { user: UserState }) => state.user.isDeletingAddress;
export const selectIsSettingDefaultAddress = (state: { user: UserState }) => state.user.isSettingDefaultAddress;
export const selectIsDeletingAccount = (state: { user: UserState }) => state.user.isDeletingAccount;
export const selectIsExporting = (state: { user: UserState }) => state.user.isExporting;