// src/services/addressService.ts
import apiClient from "./apiClients";
import unifiedSecurityService, { SecurityActionType } from "./unifiedSecurityService";
import { 
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
  ApiResponse,
  PaginationParams
} from "../types/api";
import { 
  validateRequired,
  validateForm
} from "../utils/validators";
import { 
  sanitizeName, 
  sanitizeFormData,
  redactForLogging 
} from "../utils/sanitize";

const ADDRESS_ENDPOINTS = {
  ADDRESSES: '/addresses',
  ADDRESS_DETAIL: (id: string) => `/addresses/${id}`,
  SET_DEFAULT: (id: string) => `/addresses/${id}/set-default`,
  DEFAULT_BY_TYPE: (type: string) => `/addresses/default/${type}`,
} as const;

export interface AddressListQuery extends PaginationParams {
  type?: 'home' | 'work' | 'billing' | 'other';
}

class AddressService {

  // Address Management
  async getAddresses(params?: AddressListQuery): Promise<ApiResponse<{addresses: Address[], pagination: any}>> {
    try {
      // 1. Sanitize query parameters
      const sanitizedParams: any = {};
      
      if (params?.page) sanitizedParams.page = Math.max(1, parseInt(String(params.page)));
      if (params?.limit) sanitizedParams.limit = Math.min(50, Math.max(1, parseInt(String(params.limit))));
      if (params?.type) sanitizedParams.type = params.type;
      if (params?.sortBy) sanitizedParams.sortBy = params.sortBy.trim();
      if (params?.sortOrder) sanitizedParams.sortOrder = params.sortOrder;

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<{addresses: Address[], pagination: any}>>(
        ADDRESS_ENDPOINTS.ADDRESSES,
        { params: sanitizedParams }
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

  async getAddress(addressId: string): Promise<ApiResponse<Address>> {
    try {
      // 1. Validate required ID
      if (!addressId || addressId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid address ID',
          message: 'Address ID is required.'
        };
      }

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<Address>>(
        ADDRESS_ENDPOINTS.ADDRESS_DETAIL(addressId)
      );

      return response.data;

    } catch (error: any) {
      console.error('Get address error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Address not found',
          message: 'The requested address could not be found.'
        };
      }

      return {
        success: false,
        error: 'Failed to get address',
        message: 'Unable to retrieve address details.'
      };
    }
  }

  async createAddress(addressData: CreateAddressRequest): Promise<ApiResponse<Address>> {
    try {
      // 1. Validate input
      const validationRules = {
        street: (street: string) => validateRequired(street, 'Street address'),
        city: (city: string) => validateRequired(city, 'City'),
        state: (state: string) => validateRequired(state, 'State'),
        country: (country: string) => validateRequired(country, 'Country'),
        postalCode: (code: string) => validateRequired(code, 'Postal code'),
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
        type: (val: string) => val,
        isDefault: (val: boolean) => val,
        street: (val: string) => val.trim(),
        apartment: (val: string) => val?.trim() || undefined,
        city: (val: string) => val.trim(),
        state: (val: string) => val.trim(),
        country: (val: string) => val.trim(),
        postalCode: (val: string) => val.trim().toUpperCase(),
        landmark: (val: string) => val?.trim() || undefined,
        coordinates: (val: any) => val,
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

      // 4. Log sanitized request
      console.log('Creating address:', redactForLogging(sanitizedData));

      // 5. Make API request
      const response = await apiClient.post<ApiResponse<Address>>(
        ADDRESS_ENDPOINTS.ADDRESSES,
        sanitizedData
      );

      if (response.data.success) {
        console.log('Address created successfully:', response.data.data?.id);
      }

      return response.data;

    } catch (error: any) {
      console.error('Create address error:', error);
      
      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many address creation attempts. Please try again later.'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to create address. Please try again.'
      };
    }
  }

  async updateAddress(addressId: string, addressData: UpdateAddressRequest): Promise<ApiResponse<Address>> {
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
        type: (val: string) => val,
        isDefault: (val: boolean) => val,
        street: (val: string) => val?.trim(),
        apartment: (val: string) => val?.trim() || undefined,
        city: (val: string) => val?.trim(),
        state: (val: string) => val?.trim(),
        country: (val: string) => val?.trim(),
        postalCode: (val: string) => val?.trim()?.toUpperCase(),
        landmark: (val: string) => val?.trim() || undefined,
        coordinates: (val: any) => val,
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
        ADDRESS_ENDPOINTS.ADDRESS_DETAIL(addressId),
        sanitizedData
      );

      if (response.data.success) {
        console.log('Address updated successfully:', addressId);
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
        ADDRESS_ENDPOINTS.ADDRESS_DETAIL(addressId)
      );

      if (response.data.success) {
        console.log('Address deleted successfully:', addressId);
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
        ADDRESS_ENDPOINTS.SET_DEFAULT(addressId)
      );

      if (response.data.success) {
        console.log('Default address updated successfully:', addressId);
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

  async getDefaultAddress(type: 'home' | 'work' | 'billing' | 'other'): Promise<ApiResponse<Address | null>> {
    try {
      // 1. Make API request
      const response = await apiClient.get<ApiResponse<Address | null>>(
        ADDRESS_ENDPOINTS.DEFAULT_BY_TYPE(type)
      );

      return response.data;

    } catch (error: any) {
      console.error('Get default address error:', error);
      
      return {
        success: false,
        error: 'Failed to get default address',
        message: 'Unable to retrieve default address.'
      };
    }
  }
}

export default new AddressService();