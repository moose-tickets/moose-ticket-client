// src/services/authService.ts
import * as SecureStore from "expo-secure-store";
import apiClient from "./apiClients";
import unifiedSecurityService, { SecurityActionType } from "./unifiedSecurityService";
import { 
  LoginRequest, 
  LoginResponse, 
  SignUpRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  ChangePasswordRequest,
  ApiResponse,
  User 
} from "../types/api";
import { 
  validateEmail, 
  validatePassword, 
  validateRequired,
  validateForm
} from "../utils/validators";
import { 
  sanitizeEmail, 
  sanitizePassword, 
  sanitizeName,
  redactForLogging 
} from "../utils/sanitize";

const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/register', // Updated to match backend
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHANGE_PASSWORD: '/auth/change-password',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification',
  ME: '/auth/profile',
  // OAuth endpoints
  OAUTH_GOOGLE: '/auth/google',
  OAUTH_FACEBOOK: '/auth/facebook', 
  OAUTH_APPLE: '/auth/apple',
  OAUTH_STATUS: '/auth/oauth/status',
  OAUTH_ACCOUNTS: '/auth/social-accounts',
} as const;

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'userToken',
  REFRESH_TOKEN: 'refreshToken',
  TOKEN_EXPIRY: 'tokenExpiry',
  USER_DATA: 'userData',
} as const;

class AuthService {
  
  // Token Management
  private async storeTokens(loginResponse: LoginResponse): Promise<void> {
    try {
      // Handle both formats: backend returns { tokens: { accessToken, refreshToken } } 
      // or direct { token, refreshToken }
      const accessToken = loginResponse.tokens?.accessToken || loginResponse.token;
      const refreshToken = loginResponse.tokens?.refreshToken || loginResponse.refreshToken;
      
      if (!accessToken || !refreshToken) {
        throw new Error(`Invalid token response format - accessToken: ${accessToken ? 'present' : 'missing'}, refreshToken: ${refreshToken ? 'present' : 'missing'}`);
      }

      // Calculate expiry time (assuming 24h for access token if not provided)
      const expiresAt = loginResponse.expiresAt || 
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refreshToken),
        SecureStore.setItemAsync(TOKEN_KEYS.TOKEN_EXPIRY, expiresAt),
        SecureStore.setItemAsync(TOKEN_KEYS.USER_DATA, JSON.stringify(loginResponse.user)),
      ]);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to save authentication data');
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(TOKEN_KEYS.TOKEN_EXPIRY),
        SecureStore.deleteItemAsync(TOKEN_KEYS.USER_DATA),
      ]);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(TOKEN_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get stored user:', error);
      return null;
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Failed to get stored token:', error);
      return null;
    }
  }

  async isTokenValid(): Promise<boolean> {
    try {
      const expiryStr = await SecureStore.getItemAsync(TOKEN_KEYS.TOKEN_EXPIRY);
      if (!expiryStr) return false;
      
      const expiry = new Date(expiryStr);
      const now = new Date();
      
      // Add 5 minute buffer before expiry
      const bufferTime = 5 * 60 * 1000;
      return expiry.getTime() > (now.getTime() + bufferTime);
    } catch (error) {
      console.error('Failed to check token validity:', error);
      return false;
    }
  }

  // Authentication Methods
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      // 1. Validate input
      const validationRules = {
        email: (email: string) => validateEmail(email, { required: true, allowDisposable: false }),
        password: (password: string) => validateRequired(password, 'Password'),
      };

      const formValidation = await validateForm(credentials, validationRules);
      if (!formValidation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: Object.values(formValidation.errors).flat().join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedCredentials = {
        email: sanitizeEmail(credentials.email),
        password: sanitizePassword(credentials.password),
        // rememberMe: credentials.rememberMe || false,
      };

      // 3. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.AUTH_LOGIN,
        sanitizedCredentials.email,
        { userId: sanitizedCredentials.email }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.reason || 'Security check failed'
        };
      }

      // 4. Log sanitized request (password redacted)
      console.log('Login attempt:', redactForLogging(sanitizedCredentials));

      // 5. Make API request
      const response = await apiClient.post<ApiResponse<LoginResponse>>(
        AUTH_ENDPOINTS.LOGIN,
        sanitizedCredentials
      );

      if (response.data.success && response.data.data) {
        // Store tokens securely
        await this.storeTokens(response.data.data);
        
        console.log('Login successful for user:', response.data.data.user.email);
        return response.data;
      }

      return {
        success: false,
        error: 'Login failed',
        message: response.data.message || 'Invalid credentials'
      };

    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Invalid credentials',
          message: 'The email or password you entered is incorrect.'
        };
      }

      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many login attempts. Please try again later.'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to connect to the server. Please check your internet connection.'
      };
    }
  }

  async signup(userData: SignUpRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      // 1. Validate input
      const validationRules = {
        email: (email: string) => validateEmail(email, { required: true, allowDisposable: false }),
        password: (password: string) => validatePassword(password, { minLength: 8 }),
        confirmPassword: (confirmPassword: string) => {
          if (confirmPassword !== userData.password) {
            return { isValid: false, errors: ['Passwords do not match'] };
          }
          return { isValid: true, errors: [] };
        },
        firstName: (name: string) => validateRequired(name, 'First name'),
        lastName: (name: string) => validateRequired(name, 'Last name'),
        phone: (phone: string) => validateRequired(phone, 'Phone number'),
      };

      const formValidation = await validateForm(userData, validationRules);
      if (!formValidation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: Object.values(formValidation.errors).flat().join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        email: sanitizeEmail(userData.email),
        password: sanitizePassword(userData.password),
        confirmPassword: sanitizePassword(userData.confirmPassword),
        firstName: sanitizeName(userData.firstName),
        lastName: sanitizeName(userData.lastName),
        phone: userData.phone.trim(),
      };

      // 3. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.AUTH_REGISTER,
        sanitizedData.email,
        { userId: sanitizedData.email }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.reason || 'Security check failed'
        };
      }

      // 4. Log sanitized request (passwords redacted)
      console.log('Signup attempt:', redactForLogging(sanitizedData));

      // 5. Make API request
      const response = await apiClient.post<ApiResponse<LoginResponse>>(
        AUTH_ENDPOINTS.SIGNUP,
        sanitizedData
      );

      if (response.data.success && response.data.data) {
        // Check if tokens are provided (auto-login after signup)
        if (response.data.data.tokens) {
          // Store tokens securely
          await this.storeTokens(response.data.data);
          console.log('Signup successful with auto-login for user:', response.data.data.user.email);
        } else {
          console.log('Signup successful, email verification required for user:', response.data.data.user?.email);
        }
        
        return response.data;
      }

      return {
        success: false,
        error: 'Signup failed',
        message: response.data.message || 'Failed to create account'
      };

    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.response?.status === 409) {
        return {
          success: false,
          error: 'Email already exists',
          message: 'An account with this email address already exists.'
        };
      }

      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many signup attempts. Please try again later.'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to create account. Please try again.'
      };
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // 1. Validate email
      const emailValidation = await validateEmail(email, { required: true });
      if (!emailValidation.isValid) {
        return {
          success: false,
          error: 'Invalid email',
          message: emailValidation.errors.join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedEmail = sanitizeEmail(email);

      // 3. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.PASSWORD_RESET,
        sanitizedEmail,
        { userId: sanitizedEmail }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.reason || 'Security check failed'
        };
      }

      // 4. Make API request
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        AUTH_ENDPOINTS.FORGOT_PASSWORD,
        { email: sanitizedEmail }
      );

      console.log('Password reset requested for:', sanitizedEmail);
      return response.data;

    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many password reset attempts. Please try again later.'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to send password reset email. Please try again.'
      };
    }
  }

  async resetPassword(resetData: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      // 1. Validate input
      const passwordValidation = validatePassword(resetData.password, { minLength: 8 });
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: 'Invalid password',
          message: passwordValidation.errors.join(', ')
        };
      }

      if (resetData.password !== resetData.confirmPassword) {
        return {
          success: false,
          error: 'Password mismatch',
          message: 'Passwords do not match'
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        token: resetData.token.trim(),
        password: sanitizePassword(resetData.password),
        confirmPassword: sanitizePassword(resetData.confirmPassword),
      };

      // 3. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.PASSWORD_RESET,
        undefined,
        { action: 'reset_password' }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.reason || 'Security check failed'
        };
      }

      // 4. Make API request
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        AUTH_ENDPOINTS.RESET_PASSWORD,
        sanitizedData
      );

      console.log('Password reset completed');
      return response.data;

    } catch (error: any) {
      console.error('Reset password error:', error);
      
      if (error.response?.status === 400) {
        return {
          success: false,
          error: 'Invalid token',
          message: 'Password reset token is invalid or expired.'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to reset password. Please try again.'
      };
    }
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      // 1. Validate input
      const currentPasswordValidation = validateRequired(passwordData.currentPassword, 'Current password');
      const newPasswordValidation = validatePassword(passwordData.newPassword, { minLength: 8 });
      
      if (!currentPasswordValidation.isValid) {
        return {
          success: false,
          error: 'Invalid current password',
          message: currentPasswordValidation.errors.join(', ')
        };
      }

      if (!newPasswordValidation.isValid) {
        return {
          success: false,
          error: 'Invalid new password',
          message: newPasswordValidation.errors.join(', ')
        };
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        return {
          success: false,
          error: 'Password mismatch',
          message: 'New passwords do not match'
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        currentPassword: sanitizePassword(passwordData.currentPassword),
        newPassword: sanitizePassword(passwordData.newPassword),
        confirmPassword: sanitizePassword(passwordData.confirmPassword),
      };

      // 3. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.PROFILE_UPDATE,
        undefined,
        { action: 'change_password' }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.reason || 'Security check failed'
        };
      }

      // 4. Make API request
      const response = await apiClient.put<ApiResponse<{ message: string }>>(
        AUTH_ENDPOINTS.CHANGE_PASSWORD,
        sanitizedData
      );

      console.log('Password changed successfully');
      return response.data;

    } catch (error: any) {
      console.error('Change password error:', error);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Invalid current password',
          message: 'Current password is incorrect.'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to change password. Please try again.'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      // Try to notify server of logout
      await apiClient.post(AUTH_ENDPOINTS.LOGOUT);
    } catch (error) {
      // Ignore server errors during logout
      console.warn('Server logout failed:', error);
    } finally {
      // Always clear local tokens
      await this.clearTokens();
      console.log('User logged out');
    }
  }

  async refreshToken(refreshTokenParam?: string): Promise<ApiResponse<LoginResponse>> {
    try {
      const refreshToken = refreshTokenParam || await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        return {
          success: false,
          error: 'No refresh token available',
          message: 'No refresh token found'
        };
      }

      const response = await apiClient.post<ApiResponse<LoginResponse>>(
        AUTH_ENDPOINTS.REFRESH,
        { refreshToken }
      );

      if (response.data.success && response.data.data) {
        await this.storeTokens(response.data.data);
        console.log('Token refreshed successfully');
        return response.data;
      }

      return {
        success: false,
        error: 'Token refresh failed',
        message: response.data.message || 'Unable to refresh token'
      };
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      await this.clearTokens();
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to refresh token. Please sign in again.'
      };
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(AUTH_ENDPOINTS.ME);
      
      if (response.data.success && response.data.data) {
        // Update stored user data
        await SecureStore.setItemAsync(
          TOKEN_KEYS.USER_DATA, 
          JSON.stringify(response.data.data)
        );
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Get current user error:', error);
      
      if (error.response?.status === 401) {
        // Token expired, try to refresh
        const refreshResponse = await this.refreshToken();
        if (refreshResponse.success) {
          // Retry the request
          return this.getCurrentUser();
        }
      }

      return {
        success: false,
        error: 'Failed to get user data',
        message: 'Unable to retrieve user information.'
      };
    }
  }

  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        AUTH_ENDPOINTS.VERIFY_EMAIL,
        { token: token.trim() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Email verification error:', error);
      
      return {
        success: false,
        error: 'Verification failed',
        message: 'Unable to verify email address.'
      };
    }
  }

  async resendVerification(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        AUTH_ENDPOINTS.RESEND_VERIFICATION
      );

      return response.data;
    } catch (error: any) {
      console.error('Resend verification error:', error);
      
      return {
        success: false,
        error: 'Resend failed',
        message: 'Unable to resend verification email.'
      };
    }
  }

  // OAuth Methods
  async getOAuthStatus(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        AUTH_ENDPOINTS.OAUTH_STATUS
      );
      return response.data;
    } catch (error: any) {
      console.error('OAuth status error:', error);
      return {
        success: false,
        error: 'Failed to get OAuth status',
        message: 'Unable to retrieve OAuth configuration.'
      };
    }
  }

  async getSocialAccounts(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        AUTH_ENDPOINTS.OAUTH_ACCOUNTS
      );
      return response.data;
    } catch (error: any) {
      console.error('Social accounts error:', error);
      return {
        success: false,
        error: 'Failed to get social accounts',
        message: 'Unable to retrieve linked social accounts.'
      };
    }
  }

  async unlinkSocialAccount(provider: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete<ApiResponse<any>>(
        `/auth/unlink/${provider}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Unlink social account error:', error);
      return {
        success: false,
        error: 'Failed to unlink account',
        message: `Unable to unlink ${provider} account.`
      };
    }
  }

  // Method to get OAuth login URLs for social providers
  getOAuthLoginUrl(provider: 'google' | 'facebook' | 'apple'): string {
    // Get base URL from environment
    const baseUrl = __DEV__ 
      ? "http://localhost:3000" 
      : "https://api.mooseticket.com";
      
    switch (provider) {
      case 'google':
        return `${baseUrl}${AUTH_ENDPOINTS.OAUTH_GOOGLE}`;
      case 'facebook':
        return `${baseUrl}${AUTH_ENDPOINTS.OAUTH_FACEBOOK}`;
      case 'apple':
        return `${baseUrl}${AUTH_ENDPOINTS.OAUTH_APPLE}`;
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  // OAuth Login Methods
  async loginWithOAuth(provider: 'google' | 'facebook' | 'apple', token: string, userData?: any): Promise<ApiResponse<LoginResponse>> {
    try {
      // 1. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.AUTH_LOGIN,
        userData?.email || `${provider}_user`,
        { provider, oauthLogin: true }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Security check failed',
          message: securityResult.reason || 'Security check failed'
        };
      }

      // 2. Send OAuth data to backend
      const response = await apiClient.post(AUTH_ENDPOINTS.OAUTH_GOOGLE, {
        provider,
        token,
        userData,
      });

      if (response.data?.success && response.data?.data) {
        const { user, tokens } = response.data.data;
        
        // Store tokens securely using the correct format
        await this.storeTokens({
          user,
          tokens,
          token: tokens?.accessToken, // Legacy support
          refreshToken: tokens?.refreshToken, // Legacy support
        } as LoginResponse);

        console.log(`✅ OAuth ${provider} login successful for:`, redactForLogging(user));
        
        return {
          success: true,
          data: { user, tokens },
          message: `Successfully signed in with ${provider}`
        };
      }

      return {
        success: false,
        error: response.data?.error || `${provider} authentication failed`,
        message: response.data?.message || `Failed to authenticate with ${provider}`
      };

    } catch (error: any) {
      console.error(`❌ OAuth ${provider} login error:`, error);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Invalid OAuth credentials',
          message: 'The OAuth token is invalid or expired'
        };
      }

      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Too many requests',
          message: 'Please wait before trying again'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: `Failed to connect to authentication server for ${provider} login`
      };
    }
  }
}

export default new AuthService();