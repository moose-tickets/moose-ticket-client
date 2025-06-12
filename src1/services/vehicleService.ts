// src/services/vehicleService.ts
import apiClient from "./apiClients";
import ArcjetSecurity, { RateLimitType } from "./arcjetSecurity";
import { 
  Vehicle,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  ApiResponse,
  PaginationParams
} from "../types/api";
import { 
  validateLicensePlate, 
  validateRequired,
  validateForm
} from "../utils/validators";
import { 
  sanitizeLicensePlate,
  sanitizeName,
  sanitizeUserContent,
  sanitizeFormData,
  redactForLogging 
} from "../utils/sanitize";

const VEHICLE_ENDPOINTS = {
  VEHICLES: '/vehicles',
  VEHICLE_DETAIL: (id: string) => `/vehicles/${id}`,
  SET_DEFAULT_VEHICLE: (id: string) => `/vehicles/${id}/default`,
} as const;

class VehicleService {

  // Vehicle Management
  async getVehicles(params?: PaginationParams): Promise<ApiResponse<Vehicle[]>> {
    try {
      // 1. Sanitize query parameters
      const sanitizedParams: any = {};
      
      if (params?.page) sanitizedParams.page = Math.max(1, parseInt(String(params.page)));
      if (params?.limit) sanitizedParams.limit = Math.min(50, Math.max(1, parseInt(String(params.limit))));
      if (params?.sortBy) sanitizedParams.sortBy = params.sortBy.trim();
      if (params?.sortOrder) sanitizedParams.sortOrder = params.sortOrder;

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<Vehicle[]>>(
        VEHICLE_ENDPOINTS.VEHICLES,
        { params: sanitizedParams }
      );

      return response.data;

    } catch (error: any) {
      console.error('Get vehicles error:', error);
      
      return {
        success: false,
        error: 'Failed to get vehicles',
        message: 'Unable to retrieve vehicles.'
      };
    }
  }

  async getVehicle(vehicleId: string): Promise<ApiResponse<Vehicle>> {
    try {
      // 1. Validate required ID
      if (!vehicleId || vehicleId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid vehicle ID',
          message: 'Vehicle ID is required.'
        };
      }

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<Vehicle>>(
        VEHICLE_ENDPOINTS.VEHICLE_DETAIL(vehicleId)
      );

      return response.data;

    } catch (error: any) {
      console.error('Get vehicle error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Vehicle not found',
          message: 'The requested vehicle could not be found.'
        };
      }

      return {
        success: false,
        error: 'Failed to get vehicle',
        message: 'Unable to retrieve vehicle details.'
      };
    }
  }

  async createVehicle(vehicleData: CreateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    try {
      // 1. Validate input
      const validationRules = {
        licensePlate: (plate: string) => validateLicensePlate(plate),
        make: (make: string) => validateRequired(make, 'Vehicle make'),
        model: (model: string) => validateRequired(model, 'Vehicle model'),
        year: (year: number) => {
          const currentYear = new Date().getFullYear();
          if (!year || year < 1900 || year > currentYear + 1) {
            return { 
              isValid: false, 
              errors: [`Year must be between 1900 and ${currentYear + 1}`] 
            };
          }
          return { isValid: true, errors: [] };
        },
        color: (color: string) => validateRequired(color, 'Vehicle color'),
        state: (state: string) => validateRequired(state, 'State'),
      };

      const formValidation = await validateForm(vehicleData, validationRules);
      if (!formValidation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: Object.values(formValidation.errors).flat().join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        licensePlate: sanitizeLicensePlate(vehicleData.licensePlate),
        make: sanitizeName(vehicleData.make),
        model: sanitizeName(vehicleData.model),
        year: vehicleData.year,
        color: sanitizeName(vehicleData.color),
        state: vehicleData.state.trim().toUpperCase(),
        isDefault: vehicleData.isDefault || false,
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

      // 4. Log sanitized request
      console.log('Creating vehicle:', redactForLogging(sanitizedData));

      // 5. Make API request
      const response = await apiClient.post<ApiResponse<Vehicle>>(
        VEHICLE_ENDPOINTS.VEHICLES,
        sanitizedData
      );

      if (response.data.success) {
        console.log('Vehicle created successfully:', response.data.data?.id);
      }

      return response.data;

    } catch (error: any) {
      console.error('Create vehicle error:', error);
      
      if (error.response?.status === 409) {
        return {
          success: false,
          error: 'License plate already exists',
          message: 'A vehicle with this license plate already exists.'
        };
      }

      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many vehicle creations. Please try again later.'
        };
      }

      return {
        success: false,
        error: 'Network error',
        message: 'Unable to create vehicle. Please try again.'
      };
    }
  }

  async updateVehicle(vehicleId: string, vehicleData: UpdateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    try {
      // 1. Validate required ID
      if (!vehicleId || vehicleId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid vehicle ID',
          message: 'Vehicle ID is required.'
        };
      }

      // 2. Sanitize input
      const sanitizedData: UpdateVehicleRequest = {};
      
      if (vehicleData.make) {
        sanitizedData.make = sanitizeName(vehicleData.make);
      }
      if (vehicleData.model) {
        sanitizedData.model = sanitizeName(vehicleData.model);
      }
      if (vehicleData.year !== undefined) {
        const currentYear = new Date().getFullYear();
        if (vehicleData.year < 1900 || vehicleData.year > currentYear + 1) {
          return {
            success: false,
            error: 'Invalid year',
            message: `Year must be between 1900 and ${currentYear + 1}.`
          };
        }
        sanitizedData.year = vehicleData.year;
      }
      if (vehicleData.color) {
        sanitizedData.color = sanitizeName(vehicleData.color);
      }
      if (vehicleData.state) {
        sanitizedData.state = vehicleData.state.trim().toUpperCase();
      }
      if (vehicleData.isDefault !== undefined) {
        sanitizedData.isDefault = vehicleData.isDefault;
      }

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
      const response = await apiClient.put<ApiResponse<Vehicle>>(
        VEHICLE_ENDPOINTS.VEHICLE_DETAIL(vehicleId),
        sanitizedData
      );

      if (response.data.success) {
        console.log('Vehicle updated successfully:', vehicleId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Update vehicle error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to update vehicle. Please try again.'
      };
    }
  }

  async deleteVehicle(vehicleId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // 1. Validate required ID
      if (!vehicleId || vehicleId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid vehicle ID',
          message: 'Vehicle ID is required.'
        };
      }

      // 2. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        { action: 'delete_vehicle', vehicleId }
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
        VEHICLE_ENDPOINTS.VEHICLE_DETAIL(vehicleId)
      );

      if (response.data.success) {
        console.log('Vehicle deleted successfully:', vehicleId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Delete vehicle error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to delete vehicle. Please try again.'
      };
    }
  }

  async setDefaultVehicle(vehicleId: string): Promise<ApiResponse<Vehicle>> {
    try {
      // 1. Validate required ID
      if (!vehicleId || vehicleId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid vehicle ID',
          message: 'Vehicle ID is required.'
        };
      }

      // 2. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.FORM_SUBMIT,
        { action: 'set_default_vehicle', vehicleId }
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      // 3. Make API request
      const response = await apiClient.patch<ApiResponse<Vehicle>>(
        VEHICLE_ENDPOINTS.SET_DEFAULT_VEHICLE(vehicleId)
      );

      if (response.data.success) {
        console.log('Default vehicle set successfully:', vehicleId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Set default vehicle error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to set default vehicle. Please try again.'
      };
    }
  }

  // Vehicle Lookup and Validation
  async validateLicensePlate(licensePlate: string, state: string): Promise<ApiResponse<{ isValid: boolean; details?: any }>> {
    try {
      // 1. Validate input
      const plateValidation = validateLicensePlate(licensePlate);
      if (!plateValidation.isValid) {
        return {
          success: false,
          error: 'Invalid license plate',
          message: plateValidation.errors.join(', ')
        };
      }

      const stateValidation = validateRequired(state, 'State');
      if (!stateValidation.isValid) {
        return {
          success: false,
          error: 'Invalid state',
          message: stateValidation.errors.join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedData = {
        licensePlate: sanitizeLicensePlate(licensePlate),
        state: state.trim().toUpperCase(),
      };

      // 3. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.SEARCH_QUERY,
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
      const response = await apiClient.post<ApiResponse<{ isValid: boolean; details?: any }>>(
        '/vehicles/validate-plate',
        sanitizedData
      );

      return response.data;

    } catch (error: any) {
      console.error('Validate license plate error:', error);
      
      return {
        success: false,
        error: 'Validation failed',
        message: 'Unable to validate license plate. Please try again.'
      };
    }
  }

  async searchVehiclesByPlate(licensePlate: string, state?: string): Promise<ApiResponse<Vehicle[]>> {
    try {
      // 1. Validate input
      const plateValidation = validateLicensePlate(licensePlate);
      if (!plateValidation.isValid) {
        return {
          success: false,
          error: 'Invalid license plate',
          message: plateValidation.errors.join(', ')
        };
      }

      // 2. Sanitize input
      const sanitizedParams: any = {
        licensePlate: sanitizeLicensePlate(licensePlate),
      };

      if (state) {
        sanitizedParams.state = state.trim().toUpperCase();
      }

      // 3. Perform security checks
      const securityResult = await ArcjetSecurity.performSecurityCheck(
        RateLimitType.SEARCH_QUERY,
        sanitizedParams
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: 'Unable to make Request',
          message: securityResult.errors.join(', ')
        };
      }

      // 4. Make API request
      const response = await apiClient.get<ApiResponse<Vehicle[]>>(
        '/vehicles/search',
        { params: sanitizedParams }
      );

      return response.data;

    } catch (error: any) {
      console.error('Search vehicles error:', error);
      
      return {
        success: false,
        error: 'Search failed',
        message: 'Unable to search vehicles. Please try again.'
      };
    }
  }
}

export default new VehicleService();