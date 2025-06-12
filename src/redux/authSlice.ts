// src/redux/authSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as SecureStore from "expo-secure-store";
import authService from "../services/authService";
import { LoginRequest, SignUpRequest, User, ApiResponse, LoginResponse } from "../types/api";

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isEmailVerified: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  isEmailVerified: false,
};

// Thunk to sign in
export const signIn = createAsyncThunk<
  LoginResponse,
  LoginRequest,
  { rejectValue: string }
>(
  "auth/signIn",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Sign-in failed");
      }
    } catch (err: any) {
      return rejectWithValue(err.message || "Sign-in failed");
    }
  }
);

// Thunk to sign up
export const signUp = createAsyncThunk<
  LoginResponse,
  SignUpRequest,
  { rejectValue: string }
>(
  "auth/signUp",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.signup(userData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Sign-up failed");
      }
    } catch (err: any) {
      return rejectWithValue(err.message || "Sign-up failed");
    }
  }
);

// Thunk to hydrate token on app start
export const hydrateAuth = createAsyncThunk<
  { user: User; token: string } | null,
  void,
  { rejectValue: string }
>(
  "auth/hydrateAuth",
  async (_, { rejectWithValue }) => {
    try {
      const savedToken = await SecureStore.getItemAsync("userToken");
      const savedUser = await authService.getStoredUser();
      
      if (savedToken && savedUser) {
        // Check if token is still valid
        const isValid = await authService.isTokenValid();
        if (isValid) {
          return { token: savedToken, user: savedUser };
        } else {
          // Try to refresh token
          const refreshSuccess = await authService.refreshToken();
          if (refreshSuccess) {
            const newToken = await SecureStore.getItemAsync("userToken");
            const updatedUser = await authService.getStoredUser();
            if (newToken && updatedUser) {
              return { token: newToken, user: updatedUser };
            }
          }
        }
      }
      return null;
    } catch (err: any) {
      return rejectWithValue("Failed to load saved session");
    }
  }
);

// Thunk to get current user
export const getCurrentUser = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser();
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to get user data");
      }
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to get user data");
    }
  }
);

// Thunk to logout
export const logout = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (err: any) {
      return rejectWithValue(err.message || "Logout failed");
    }
  }
);

// Thunk to forgot password
export const forgotPassword = createAsyncThunk<
  { message: string },
  string,
  { rejectValue: string }
>(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(email);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to send reset email");
      }
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to send reset email");
    }
  }
);

// Thunk to verify email
export const verifyEmail = createAsyncThunk<
  { message: string },
  string,
  { rejectValue: string }
>(
  "auth/verifyEmail",
  async (token, { rejectWithValue }) => {
    try {
      const response = await authService.verifyEmail(token);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Email verification failed");
      }
    } catch (err: any) {
      return rejectWithValue(err.message || "Email verification failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setEmailVerified: (state, action: PayloadAction<boolean>) => {
      state.isEmailVerified = action.payload;
      if (state.user) {
        state.user.emailVerified = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // signIn
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.isEmailVerified = action.payload.user.emailVerified || false;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Sign-in failed";
        state.isAuthenticated = false;
      })

      // signUp
      .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.isEmailVerified = action.payload.user.emailVerified || false;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Sign-up failed";
        state.isAuthenticated = false;
      })

      // hydrateAuth
      .addCase(hydrateAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
          state.isEmailVerified = action.payload.user.emailVerified || false;
        }
      })
      .addCase(hydrateAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to restore session";
        state.isAuthenticated = false;
      })

      // getCurrentUser
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isEmailVerified = action.payload.emailVerified || false;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to get user data";
      })

      // logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isEmailVerified = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        // Even if logout fails on server, clear local state
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isEmailVerified = false;
        state.error = null;
      })

      // forgotPassword
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to send reset email";
      })

      // verifyEmail
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = false;
        state.isEmailVerified = true;
        if (state.user) {
          state.user.emailVerified = true;
        }
        state.error = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Email verification failed";
      });
  },
});

export const { clearError, updateUser, setEmailVerified } = authSlice.actions;
export default authSlice.reducer;