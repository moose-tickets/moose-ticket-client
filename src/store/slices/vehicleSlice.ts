// src/store/slices/vehicleSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import vehicleService from '../../services/vehicleService';
import { 
  Vehicle, 
  CreateVehicleRequest, 
  UpdateVehicleRequest,
  ApiResponse,
  PaginationParams 
} from '../../types/api';

export interface VehicleAnalytics {
  totalVehicles: number;
  totalTickets: number;
  totalFines: number;
  mostTicketedVehicle: Vehicle | null;
  ticketsByVehicle: { [vehicleId: string]: number };
  finesByVehicle: { [vehicleId: string]: number };
}

export interface VehicleValidation {
  isValid: boolean;
  details?: any;
  errors?: string[];
}

export interface VehicleState {
  vehicles: Vehicle[];
  currentVehicle: Vehicle | null;
  defaultVehicle: Vehicle | null;
  analytics: VehicleAnalytics | null;
  validation: VehicleValidation | null;
  searchResults: Vehicle[];
  vinDecodeResult: any | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  isLoadingVehicle: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isValidating: boolean;
  isSearching: boolean;
  isDecodingVIN: boolean;
  isSettingDefault: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: VehicleState = {
  vehicles: [],
  currentVehicle: null,
  defaultVehicle: null,
  analytics: null,
  validation: null,
  searchResults: [],
  vinDecodeResult: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  isLoadingVehicle: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isValidating: false,
  isSearching: false,
  isDecodingVIN: false,
  isSettingDefault: false,
  error: null,
  lastUpdated: null,
};

// Async Thunks - Vehicle Management
export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchVehicles',
  async (params?: PaginationParams, { rejectWithValue }) => {
    try {
      const response = await vehicleService.getVehicles(params);
      if (response.success && response.data) {
        return {
          vehicles: response.data,
          pagination: response.pagination || {
            page: params?.page || 1,
            limit: params?.limit || 20,
            total: response.data.length,
            totalPages: Math.ceil(response.data.length / (params?.limit || 20)),
          }
        };
      } else {
        return rejectWithValue(response.message || 'Failed to fetch vehicles');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchVehicle = createAsyncThunk(
  'vehicles/fetchVehicle',
  async (vehicleId: string, { rejectWithValue }) => {
    try {
      const response = await vehicleService.getVehicle(vehicleId);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch vehicle');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createVehicle = createAsyncThunk(
  'vehicles/createVehicle',
  async (vehicleData: CreateVehicleRequest, { rejectWithValue }) => {
    try {
      const response = await vehicleService.createVehicle(vehicleData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to create vehicle');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateVehicle = createAsyncThunk(
  'vehicles/updateVehicle',
  async ({ vehicleId, updates }: { vehicleId: string; updates: UpdateVehicleRequest }, { rejectWithValue }) => {
    try {
      const response = await vehicleService.updateVehicle(vehicleId, updates);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to update vehicle');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deleteVehicle = createAsyncThunk(
  'vehicles/deleteVehicle',
  async (vehicleId: string, { rejectWithValue }) => {
    try {
      const response = await vehicleService.deleteVehicle(vehicleId);
      if (response.success) {
        return vehicleId;
      } else {
        return rejectWithValue(response.message || 'Failed to delete vehicle');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const setDefaultVehicle = createAsyncThunk(
  'vehicles/setDefaultVehicle',
  async (vehicleId: string, { rejectWithValue }) => {
    try {
      const response = await vehicleService.setDefaultVehicle(vehicleId);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to set default vehicle');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Vehicle Validation and Search
export const validateLicensePlate = createAsyncThunk(
  'vehicles/validateLicensePlate',
  async ({ licensePlate, state }: { licensePlate: string; state: string }, { rejectWithValue }) => {
    try {
      const response = await vehicleService.validateLicensePlate(licensePlate, state);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'License plate validation failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const validateCanadianPlate = createAsyncThunk(
  'vehicles/validateCanadianPlate',
  async ({ licensePlate, province }: { licensePlate: string; province: string }, { rejectWithValue }) => {
    try {
      const response = await vehicleService.validateCanadianPlate(licensePlate, province);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Canadian plate validation failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const searchVehiclesByPlate = createAsyncThunk(
  'vehicles/searchByPlate',
  async ({ licensePlate, state }: { licensePlate: string; state?: string }, { rejectWithValue }) => {
    try {
      const response = await vehicleService.searchVehiclesByPlate(licensePlate, state);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Vehicle search failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const decodeVIN = createAsyncThunk(
  'vehicles/decodeVIN',
  async (vin: string, { rejectWithValue }) => {
    try {
      const response = await vehicleService.decodeVIN(vin);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'VIN decode failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Analytics
export const fetchVehicleAnalytics = createAsyncThunk(
  'vehicles/fetchAnalytics',
  async (vehicleId?: string, { rejectWithValue }) => {
    try {
      const response = await vehicleService.getVehicleAnalytics(vehicleId);
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

// Vehicle Slice
const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentVehicle: (state) => {
      state.currentVehicle = null;
    },
    clearValidation: (state) => {
      state.validation = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearVinDecodeResult: (state) => {
      state.vinDecodeResult = null;
    },
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    updateVehicleInList: (state, action: PayloadAction<Vehicle>) => {
      const index = state.vehicles.findIndex(vehicle => vehicle.id === action.payload.id);
      if (index !== -1) {
        state.vehicles[index] = action.payload;
      }
    },
    removeVehicleFromList: (state, action: PayloadAction<string>) => {
      state.vehicles = state.vehicles.filter(vehicle => vehicle.id !== action.payload);
    },
    addVehicleToList: (state, action: PayloadAction<Vehicle>) => {
      state.vehicles.unshift(action.payload);
    },
    setDefaultVehicleInList: (state, action: PayloadAction<string>) => {
      // Clear previous default
      state.vehicles.forEach(vehicle => {
        vehicle.isDefault = false;
      });
      
      // Set new default
      const index = state.vehicles.findIndex(vehicle => vehicle.id === action.payload);
      if (index !== -1) {
        state.vehicles[index].isDefault = true;
        state.defaultVehicle = state.vehicles[index];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch vehicles cases
      .addCase(fetchVehicles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vehicles = action.payload.vehicles;
        state.pagination = action.payload.pagination;
        
        // Set default vehicle if found
        const defaultVehicle = action.payload.vehicles.find(v => v.isDefault);
        if (defaultVehicle) {
          state.defaultVehicle = defaultVehicle;
        }
        
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch single vehicle cases
      .addCase(fetchVehicle.pending, (state) => {
        state.isLoadingVehicle = true;
        state.error = null;
      })
      .addCase(fetchVehicle.fulfilled, (state, action) => {
        state.isLoadingVehicle = false;
        state.currentVehicle = action.payload;
        state.error = null;
      })
      .addCase(fetchVehicle.rejected, (state, action) => {
        state.isLoadingVehicle = false;
        state.error = action.payload as string;
      })
      
      // Create vehicle cases
      .addCase(createVehicle.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createVehicle.fulfilled, (state, action) => {
        state.isCreating = false;
        state.vehicles.unshift(action.payload);
        
        // Set as default if specified
        if (action.payload.isDefault) {
          // Clear previous default
          state.vehicles.forEach(vehicle => {
            if (vehicle.id !== action.payload.id) {
              vehicle.isDefault = false;
            }
          });
          state.defaultVehicle = action.payload;
        }
        
        state.error = null;
      })
      .addCase(createVehicle.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      })
      
      // Update vehicle cases
      .addCase(updateVehicle.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.vehicles.findIndex(vehicle => vehicle.id === action.payload.id);
        if (index !== -1) {
          state.vehicles[index] = action.payload;
        }
        if (state.currentVehicle && state.currentVehicle.id === action.payload.id) {
          state.currentVehicle = action.payload;
        }
        
        // Update default vehicle if needed
        if (action.payload.isDefault) {
          state.defaultVehicle = action.payload;
        } else if (state.defaultVehicle && state.defaultVehicle.id === action.payload.id) {
          state.defaultVehicle = null;
        }
        
        state.error = null;
      })
      .addCase(updateVehicle.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      })
      
      // Delete vehicle cases
      .addCase(deleteVehicle.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.vehicles = state.vehicles.filter(vehicle => vehicle.id !== action.payload);
        
        if (state.currentVehicle && state.currentVehicle.id === action.payload) {
          state.currentVehicle = null;
        }
        
        if (state.defaultVehicle && state.defaultVehicle.id === action.payload) {
          state.defaultVehicle = null;
        }
        
        state.error = null;
      })
      .addCase(deleteVehicle.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      })
      
      // Set default vehicle cases
      .addCase(setDefaultVehicle.pending, (state) => {
        state.isSettingDefault = true;
        state.error = null;
      })
      .addCase(setDefaultVehicle.fulfilled, (state, action) => {
        state.isSettingDefault = false;
        
        // Clear all defaults
        state.vehicles.forEach(vehicle => {
          vehicle.isDefault = false;
        });
        
        // Set new default
        const index = state.vehicles.findIndex(vehicle => vehicle.id === action.payload.id);
        if (index !== -1) {
          state.vehicles[index] = action.payload;
        }
        
        state.defaultVehicle = action.payload;
        state.error = null;
      })
      .addCase(setDefaultVehicle.rejected, (state, action) => {
        state.isSettingDefault = false;
        state.error = action.payload as string;
      })
      
      // License plate validation cases
      .addCase(validateLicensePlate.pending, (state) => {
        state.isValidating = true;
        state.error = null;
      })
      .addCase(validateLicensePlate.fulfilled, (state, action) => {
        state.isValidating = false;
        state.validation = action.payload;
        state.error = null;
      })
      .addCase(validateLicensePlate.rejected, (state, action) => {
        state.isValidating = false;
        state.validation = { isValid: false, errors: [action.payload as string] };
        state.error = action.payload as string;
      })
      
      // Canadian plate validation cases
      .addCase(validateCanadianPlate.pending, (state) => {
        state.isValidating = true;
        state.error = null;
      })
      .addCase(validateCanadianPlate.fulfilled, (state, action) => {
        state.isValidating = false;
        state.validation = action.payload;
        state.error = null;
      })
      .addCase(validateCanadianPlate.rejected, (state, action) => {
        state.isValidating = false;
        state.validation = { isValid: false, errors: [action.payload as string] };
        state.error = action.payload as string;
      })
      
      // Search vehicles cases
      .addCase(searchVehiclesByPlate.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchVehiclesByPlate.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
        state.error = null;
      })
      .addCase(searchVehiclesByPlate.rejected, (state, action) => {
        state.isSearching = false;
        state.searchResults = [];
        state.error = action.payload as string;
      })
      
      // VIN decode cases
      .addCase(decodeVIN.pending, (state) => {
        state.isDecodingVIN = true;
        state.error = null;
      })
      .addCase(decodeVIN.fulfilled, (state, action) => {
        state.isDecodingVIN = false;
        state.vinDecodeResult = action.payload;
        state.error = null;
      })
      .addCase(decodeVIN.rejected, (state, action) => {
        state.isDecodingVIN = false;
        state.vinDecodeResult = null;
        state.error = action.payload as string;
      })
      
      // Analytics cases
      .addCase(fetchVehicleAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
        state.error = null;
      })
      .addCase(fetchVehicleAnalytics.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentVehicle,
  clearValidation,
  clearSearchResults,
  clearVinDecodeResult,
  setPagination,
  updateVehicleInList,
  removeVehicleFromList,
  addVehicleToList,
  setDefaultVehicleInList,
} = vehicleSlice.actions;

export default vehicleSlice.reducer;

// Selectors
export const selectVehicles = (state: { vehicles: VehicleState }) => state.vehicles.vehicles;
export const selectCurrentVehicle = (state: { vehicles: VehicleState }) => state.vehicles.currentVehicle;
export const selectDefaultVehicle = (state: { vehicles: VehicleState }) => state.vehicles.defaultVehicle;
export const selectVehicleAnalytics = (state: { vehicles: VehicleState }) => state.vehicles.analytics;
export const selectVehicleValidation = (state: { vehicles: VehicleState }) => state.vehicles.validation;
export const selectSearchResults = (state: { vehicles: VehicleState }) => state.vehicles.searchResults;
export const selectVinDecodeResult = (state: { vehicles: VehicleState }) => state.vehicles.vinDecodeResult;
export const selectVehiclePagination = (state: { vehicles: VehicleState }) => state.vehicles.pagination;
export const selectVehicleLoading = (state: { vehicles: VehicleState }) => state.vehicles.isLoading;
export const selectVehicleError = (state: { vehicles: VehicleState }) => state.vehicles.error;
export const selectIsCreatingVehicle = (state: { vehicles: VehicleState }) => state.vehicles.isCreating;
export const selectIsUpdatingVehicle = (state: { vehicles: VehicleState }) => state.vehicles.isUpdating;
export const selectIsDeletingVehicle = (state: { vehicles: VehicleState }) => state.vehicles.isDeleting;
export const selectIsValidatingVehicle = (state: { vehicles: VehicleState }) => state.vehicles.isValidating;
export const selectIsSearchingVehicles = (state: { vehicles: VehicleState }) => state.vehicles.isSearching;
export const selectIsDecodingVIN = (state: { vehicles: VehicleState }) => state.vehicles.isDecodingVIN;
export const selectIsSettingDefault = (state: { vehicles: VehicleState }) => state.vehicles.isSettingDefault;