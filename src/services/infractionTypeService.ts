import AsyncStorage from '@react-native-async-storage/async-storage';
import { InfractionType } from '../store/slices/infractionTypeSlice';
import { API_BASE_URL } from '../config/backendConfig';

interface InfractionTypeParams {
  page?: number;
  limit?: number;
  category?: string;
  province?: string;
  municipality?: string;
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

class InfractionTypeService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async getAllInfractionTypes(params?: InfractionTypeParams): Promise<ApiResponse<InfractionType[]>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/infraction-types?${queryParams.toString()}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch infraction types');
    }

    return response.json();
  }

  async getInfractionTypeById(id: string | number): Promise<ApiResponse<InfractionType>> {
    const response = await fetch(`${API_BASE_URL}/api/infraction-types/${id}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch infraction type');
    }

    return response.json();
  }

  async getCategories(): Promise<ApiResponse<string[]>> {
    const response = await fetch(`${API_BASE_URL}/api/infraction-types/categories`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch categories');
    }

    return response.json();
  }

  async getProvinces(): Promise<ApiResponse<string[]>> {
    const response = await fetch(`${API_BASE_URL}/api/infraction-types/provinces`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch provinces');
    }

    return response.json();
  }

  // Admin methods (if needed)
  async createInfractionType(data: Partial<InfractionType>): Promise<ApiResponse<InfractionType>> {
    const response = await fetch(`${API_BASE_URL}/api/infraction-types`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create infraction type');
    }

    return response.json();
  }

  async updateInfractionType(id: string | number, data: Partial<InfractionType>): Promise<ApiResponse<InfractionType>> {
    const response = await fetch(`${API_BASE_URL}/api/infraction-types/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update infraction type');
    }

    return response.json();
  }

  async deleteInfractionType(id: string | number): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/api/infraction-types/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete infraction type');
    }

    return response.json();
  }

  async toggleInfractionTypeStatus(id: string | number): Promise<ApiResponse<InfractionType>> {
    const response = await fetch(`${API_BASE_URL}/api/infraction-types/${id}/toggle`, {
      method: 'PATCH',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to toggle infraction type status');
    }

    return response.json();
  }
}

export const infractionTypeService = new InfractionTypeService();
export default infractionTypeService;