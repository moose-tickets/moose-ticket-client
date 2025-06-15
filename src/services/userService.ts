// src/services/userService.ts
import apiClient from "./apiClients";
import unifiedSecurityService, { SecurityActionType } from "./unifiedSecurityService";
import { 
  User,
  UpdateUserRequest,
  UserPreferences,
  UpdatePreferencesRequest,
  Address,
  CreateAddressRequest,
  ApiResponse,
  PaginationParams
} from "../types/api";
import { 
  validateEmail, 
  validatePhone, 
  validateLicensePlate,
  validateRequired,
  validateForm
} from "../utils/validators";
import { 
  sanitizeName, 
  sanitizePhone,
  sanitizeLicensePlate,
  sanitizeAddress,
  sanitizeFormData,
  redactForLogging 
} from "../utils/sanitize";

const USER_ENDPOINTS = {
  PROFILE: '/users/profile',
  PREFERENCES: '/users/preferences', 
  ADDRESSES: '/users/addresses',
  AVATAR: '/users/avatar',
  DELETE_ACCOUNT: '/users/delete',
  EXPORT: '/users/export',
  ANALYTICS: '/users/analytics',
} as const;

class UserService {

  // Profile Management
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(USER_ENDPOINTS.PROFILE);
      return response.data;
    } catch (error: any) {
      console.error('Get profile error:', error);
      
      return {
        success: false,
        error: 'Failed to get profile',
        message: 'Unable to retrieve profile information.'
      };
    }
  }

  async updateProfile(profileData: UpdateUserRequest): Promise<ApiResponse<User>> {
    try {
      // 1. Validate input
      const validationRules: Record<string, (value: any) => Promise<any> | any> = {};

      if (profileData.fullName) {
        validationRules.fullName = (name: string) => validateRequired(name, 'Full name');
      }

      if (profileData.phone) {
        validationRules.phone = (phone: string) => validatePhone(phone, { 
          required: false, 
          allowInternational: true 
        });
      }

      if (profileData.licenseNumber) {
        validationRules.licenseNumber = (license: string) => validateLicensePlate(license);
      }

      const formValidation = await validateForm(profileData, validationRules);
      if (!formValidation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: Object.values(formValidation.errors).flat().join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedData: UpdateUserRequest = {};
      
      if (profileData.fullName) {
        sanitizedData.fullName = sanitizeName(profileData.fullName);
      }

      if (profileData.phone) {
        sanitizedData.phone = sanitizePhone(profileData.phone);
      }

      if (profileData.licenseNumber) {
        sanitizedData.licenseNumber = sanitizeLicensePlate(profileData.licenseNumber);
      }

      if (profileData.avatar) {
        sanitizedData.avatar = profileData.avatar; // Assume this is a pre-validated URL
      }

      // 3. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.PROFILE_UPDATE,
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
      console.log('Profile update:', redactForLogging(sanitizedData));

      // 5. Make API request
      const response = await apiClient.put<ApiResponse<User>>(
        USER_ENDPOINTS.PROFILE,
        sanitizedData
      );

      if (response.data.success) {
        console.log('Profile updated successfully');
      }

      return response.data;

    } catch (error: any) {
      console.error('Update profile error:', error);
      
      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many profile updates. Please try again later.'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to update profile. Please try again.'
      };
    }
  }

  async uploadAvatar(imageFile: File | Blob, filename: string): Promise<ApiResponse<{ avatar: string }>> {
    try {
      // 1. Validate file
      if (!imageFile) {
        return {
          success: false,
          error: 'Invalid file',
          message: 'Please select a valid image file.'
        };
      }

      // Check file size (max 5MB)
      if (imageFile.size > 5 * 1024 * 1024) {
        return {
          success: false,
          error: 'File too large',
          message: 'Image file must be smaller than 5MB.'
        };
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(imageFile.type)) {
        return {
          success: false,
          error: 'Invalid file type',
          message: 'Please upload a JPEG, PNG, or WebP image.'
        };
      }

      // 2. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.FILE_UPLOAD,
        { filename, fileSize: imageFile.size, fileType: imageFile.type }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.reason || 'Security validation failed'
        };
      }

      // 3. Prepare form data
      const formData = new FormData();
      formData.append('avatar', imageFile, filename);

      // 4. Make API request
      const response = await apiClient.post<ApiResponse<{ avatar: string }>>(
        USER_ENDPOINTS.AVATAR,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        console.log('Avatar uploaded successfully');
      }

      return response.data;

    } catch (error: any) {
      console.error('Upload avatar error:', error);
      
      return {
        success: false,
        error: 'Upload failed',
        message: 'Unable to upload avatar. Please try again.'
      };
    }
  }

  // Preferences Management
  async getPreferences(): Promise<ApiResponse<UserPreferences>> {
    try {
      const response = await apiClient.get<ApiResponse<UserPreferences>>(USER_ENDPOINTS.PREFERENCES);
      return response.data;
    } catch (error: any) {
      console.error('Get preferences error:', error);
      
      return {
        success: false,
        error: 'Failed to get preferences',
        message: 'Unable to retrieve preferences.'
      };
    }
  }

  async updatePreferences(preferences: UpdatePreferencesRequest): Promise<ApiResponse<UserPreferences>> {
    try {
      // 1. Validate input
      const validationErrors: string[] = [];

      if (preferences.theme && !['light', 'dark', 'auto'].includes(preferences.theme)) {
        validationErrors.push('Invalid theme selection');
      }

      if (preferences.language && preferences.language.length < 2) {
        validationErrors.push('Invalid language code');
      }

      if (validationErrors.length > 0) {
        return {
          success: false,
          error: 'Validation failed',
          message: validationErrors.join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedData: UpdatePreferencesRequest = {};

      if (preferences.notifications) {
        sanitizedData.notifications = preferences.notifications;
      }

      if (preferences.theme) {
        sanitizedData.theme = preferences.theme;
      }

      if (preferences.language) {
        sanitizedData.language = preferences.language.toLowerCase().trim();
      }

      if (preferences.timezone) {
        sanitizedData.timezone = preferences.timezone.trim();
      }

      // 3. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.PROFILE_UPDATE,
        sanitizedData
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.reason || 'Security validation failed'
        };
      }

      // 4. Make API request
      const response = await apiClient.put<ApiResponse<UserPreferences>>(
        USER_ENDPOINTS.PREFERENCES,
        sanitizedData
      );

      if (response.data.success) {
        console.log('Preferences updated successfully');
      }

      return response.data;

    } catch (error: any) {
      console.error('Update preferences error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to update preferences. Please try again.'
      };
    }
  }

  // Address Management
  async getAddresses(params?: PaginationParams): Promise<ApiResponse<Address[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Address[]>>(
        USER_ENDPOINTS.ADDRESSES,
        { params }
      );
      return response.data;
    } catch (error: any) {
      console.error('Get addresses error:', error);
      
      return {
        success: false,
        error: 'Failed to get addresses',
        message: 'Unable to retrieve addresses.'
      };
    }
  }

  async createAddress(addressData: CreateAddressRequest): Promise<ApiResponse<Address>> {
    try {
      // 1. Validate input
      const validationRules = {
        fullName: (name: string) => validateRequired(name, 'Full name'),
        address: (address: string) => validateRequired(address, 'Address'),
        city: (city: string) => validateRequired(city, 'City'),
        state: (state: string) => validateRequired(state, 'State'),
        country: (country: string) => validateRequired(country, 'Country'),
        postalCode: (postalCode: string) => validateRequired(postalCode, 'Postal code'),
      };

      const formValidation = await validateForm(addressData, validationRules);
      if (!formValidation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: Object.values(formValidation.errors).flat().join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedData = sanitizeFormData(addressData, {
        fullName: sanitizeName,
        address: sanitizeAddress,
        city: (val: string) => val.trim(),
        state: (val: string) => val.trim(),
        country: (val: string) => val.trim(),
        postalCode: (val: string) => val.trim().toUpperCase(),
      }) as CreateAddressRequest;

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

      // 4. Make API request
      const response = await apiClient.post<ApiResponse<Address>>(
        USER_ENDPOINTS.ADDRESSES,
        sanitizedData
      );

      if (response.data.success) {
        console.log('Address created successfully');
      }

      return response.data;

    } catch (error: any) {
      console.error('Create address error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to create address. Please try again.'
      };
    }
  }

  async updateAddress(addressId: string, addressData: Partial<CreateAddressRequest>): Promise<ApiResponse<Address>> {
    try {
      // 1. Validate required ID
      if (!addressId || addressId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid address ID',
          message: 'Address ID is required.'
        };
      }

      // 2. Sanitize input
      const sanitizedData = sanitizeFormData(addressData, {
        fullName: sanitizeName,
        address: sanitizeAddress,
        city: (val: string) => val.trim(),
        state: (val: string) => val.trim(),
        country: (val: string) => val.trim(),
        postalCode: (val: string) => val.trim().toUpperCase(),
      });

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

      // 4. Make API request
      const response = await apiClient.put<ApiResponse<Address>>(
        `${USER_ENDPOINTS.ADDRESSES}/${addressId}`,
        sanitizedData
      );

      if (response.data.success) {
        console.log('Address updated successfully');
      }

      return response.data;

    } catch (error: any) {
      console.error('Update address error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to update address. Please try again.'
      };
    }
  }

  async deleteAddress(addressId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // 1. Validate required ID
      if (!addressId || addressId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid address ID',
          message: 'Address ID is required.'
        };
      }

      // 2. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.API_REQUEST,
        { action: 'delete_address', addressId }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.reason || 'Security validation failed'
        };
      }

      // 3. Make API request
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `${USER_ENDPOINTS.ADDRESSES}/${addressId}`
      );

      if (response.data.success) {
        console.log('Address deleted successfully');
      }

      return response.data;

    } catch (error: any) {
      console.error('Delete address error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to delete address. Please try again.'
      };
    }
  }

  async setDefaultAddress(addressId: string): Promise<ApiResponse<Address>> {
    try {
      // 1. Validate required ID
      if (!addressId || addressId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid address ID',
          message: 'Address ID is required.'
        };
      }

      // 2. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.API_REQUEST,
        { action: 'set_default_address', addressId }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.reason || 'Security validation failed'
        };
      }

      // 3. Make API request
      const response = await apiClient.patch<ApiResponse<Address>>(
        `${USER_ENDPOINTS.ADDRESSES}/${addressId}/default`
      );

      if (response.data.success) {
        console.log('Default address updated successfully');
      }

      return response.data;

    } catch (error: any) {
      console.error('Set default address error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to set default address. Please try again.'
      };
    }
  }

  // Account Management
  async deleteAccount(password: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // 1. Validate password
      const passwordValidation = validateRequired(password, 'Password');
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: 'Invalid password',
          message: passwordValidation.errors.join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedPassword = password.trim();

      // 3. Perform security checks
      const securityResult = await unifiedSecurityService.validateAction(
        SecurityActionType.API_REQUEST,
        { action: 'delete_account' }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.reason || 'Security validation failed'
        };
      }

      // 4. Log action (password redacted)
      console.log('Account deletion requested');

      // 5. Make API request
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        USER_ENDPOINTS.DELETE_ACCOUNT,
        { data: { password: sanitizedPassword } }
      );

      if (response.data.success) {
        console.log('Account deleted successfully');
      }

      return response.data;

    } catch (error: any) {
      console.error('Delete account error:', error);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Invalid password',
          message: 'Password is incorrect.'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to delete account. Please try again.'
      };
    }
  }

  // Analytics and Export
  async getAnalytics(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(USER_ENDPOINTS.ANALYTICS);
      return response.data;
    } catch (error: any) {
      console.error('Get analytics error:', error);
      
      return {
        success: false,
        error: 'Failed to get analytics',
        message: 'Unable to retrieve analytics data.'
      };
    }
  }

  async exportUserData(format: 'json' | 'csv' = 'json'): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        USER_ENDPOINTS.EXPORT,
        { format }
      );
      return response.data;
    } catch (error: any) {
      console.error('Export user data error:', error);
      
      return {
        success: false,
        error: 'Export failed',
        message: 'Unable to export user data. Please try again.'
      };
    }
  }

  // User activity and statistics
  async getUserActivity(timeRange?: string): Promise<ApiResponse<any>> {
    try {
      const params = timeRange ? { timeRange } : {};
      const response = await apiClient.get<ApiResponse<any>>(
        '/users/activity',
        { params }
      );
      return response.data;
    } catch (error: any) {
      console.error('Get user activity error:', error);
      
      return {
        success: false,
        error: 'Failed to get activity',
        message: 'Unable to retrieve user activity.'
      };
    }
  }

  async getUserStats(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/users/stats');
      return response.data;
    } catch (error: any) {
      console.error('Get user stats error:', error);
      
      return {
        success: false,
        error: 'Failed to get stats',
        message: 'Unable to retrieve user statistics.'
      };
    }
  }
}

export default new UserService();