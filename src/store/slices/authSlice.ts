// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import { ApiResponse } from '../../types/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'user' | 'premium' | 'admin' | 'super_admin';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  avatar?: string;
  subscription?: {
    planId: string;
    status: string;
    currentPeriodEnd: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginAttempts: number;
  lastLoginAttempt: number | null;
  isLocked: boolean;
  oauthProviders: {
    google: boolean;
    facebook: boolean;
    apple: boolean;
  };
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  loginAttempts: 0,
  lastLoginAttempt: null,
  isLocked: false,
  oauthProviders: {
    google: true,
    facebook: true,
    apple: true,
  },
};

// Async Thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string; rememberMe?: boolean }, { rejectWithValue }) => {
    try {
      console.log(credentials)
      const response = await authService.login(credentials);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Login failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (userData: {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    phone?: string;
    agreeToTerms: boolean;
    agreeToPrivacy: boolean;
  }, { rejectWithValue }) => {
    try {
      const response = await authService.signup(userData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Signup failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// OAuth Login Async Thunk
export const loginWithOAuth = createAsyncThunk(
  'auth/loginWithOAuth',
  async (params: { provider: 'google' | 'facebook' | 'apple'; token: string; userData?: any }, { rejectWithValue }) => {
    try {
      const response = await authService.loginWithOAuth(params.provider, params.token, params.userData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || `${params.provider} login failed`);
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'OAuth login failed');
    }
  }
);

export const hydrateAuth = createAsyncThunk(
  'auth/hydrateAuth',
  async (_, { rejectWithValue }) => {
    try {
      const savedUser = await authService.getStoredUser();
      const savedToken = await authService.getStoredToken();
      
      if (savedToken && savedUser) {
        // Check if token is still valid
        const isValid = await authService.isTokenValid();
        if (isValid) {
          return { token: savedToken, user: savedUser };
        } else {
          // Try to refresh token
          const refreshSuccess = await authService.refreshToken();
          if (refreshSuccess) {
            const newToken = await authService.getStoredToken();
            const updatedUser = await authService.getStoredUser();
            if (newToken && updatedUser) {
              return { token: newToken, user: updatedUser };
            }
          }
        }
      }
      return null;
    } catch (error: any) {
      return rejectWithValue('Failed to load saved session');
    }
  }
);

export const refreshTokenThunk = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const refreshToken = state.auth.refreshToken;
      
      if (!refreshToken) {
        return rejectWithValue('No refresh token available');
      }

      const response = await authService.refreshToken(refreshToken);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Token refresh failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const refreshToken = state.auth.refreshToken;
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      return true;
    } catch (error: any) {
      // Even if logout fails on server, clear local state
      console.warn('Logout error:', error.message);
      return true;
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to get user');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        return response.message || 'Password reset email sent';
      } else {
        return rejectWithValue(response.message || 'Password reset failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: { token: string; password: string; confirmPassword: string }, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(data);
      if (response.success) {
        return response.message || 'Password reset successful';
      } else {
        return rejectWithValue(response.message || 'Password reset failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (data: { currentPassword: string; newPassword: string; confirmPassword: string }, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(data);
      if (response.success) {
        return response.message || 'Password changed successfully';
      } else {
        return rejectWithValue(response.message || 'Password change failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await authService.verifyEmail(token);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Email verification failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.resendVerification();
      if (response.success) {
        return response.message || 'Verification email sent';
      } else {
        return rejectWithValue(response.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const getOAuthStatus = createAsyncThunk(
  'auth/getOAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getOAuthStatus();
      if (response.success && response.data) {
        return response.data.oauth;
      } else {
        return rejectWithValue(response.message || 'Failed to get OAuth status');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loginAttempts = 0;
      state.lastLoginAttempt = null;
      state.isLocked = false;
    },
    setTokens: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
      state.lastLoginAttempt = Date.now();
      
      // Lock account after 5 failed attempts for 15 minutes
      if (state.loginAttempts >= 5) {
        state.isLocked = true;
        setTimeout(() => {
          state.isLocked = false;
          state.loginAttempts = 0;
        }, 15 * 60 * 1000);
      }
    },
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.lastLoginAttempt = null;
      state.isLocked = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
        state.loginAttempts = 0;
        state.isLocked = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.loginAttempts += 1;
      })
      
      // Signup cases
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // OAuth login cases
      .addCase(loginWithOAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithOAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginWithOAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Hydrate auth cases
      .addCase(hydrateAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
        state.error = null;
      })
      .addCase(hydrateAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Refresh token cases
      .addCase(refreshTokenThunk.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(refreshTokenThunk.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
        state.loginAttempts = 0;
        state.isLocked = false;
      })
      
      // Get current user cases
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Forgot password cases
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Reset password cases
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Change password cases
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Email verification cases
      .addCase(verifyEmail.fulfilled, (state, action) => {
        if (state.user) {
          state.user.isEmailVerified = true;
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // OAuth status cases
      .addCase(getOAuthStatus.fulfilled, (state, action) => {
        state.oauthProviders = action.payload;
      });
  },
});

export const {
  clearError,
  clearAuth,
  setTokens,
  updateUser,
  incrementLoginAttempts,
  resetLoginAttempts,
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectIsLocked = (state: { auth: AuthState }) => state.auth.isLocked;