import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { infractionTypeService } from '../../services/infractionTypeService';

export interface InfractionType {
  _id: string;
  code: string | number;
  type: {
    en: string;
    fr: string;
    ar: string;
  };
  violation: {
    en: string;
    fr: string;
    ar: string;
  };
  icon: string;
  category: 'stationary' | 'moving';
  baseFine: number;
  points: number;
  isActive: boolean;
  municipalityId: {
    _id: string;
    city: string;
    municipality: string;
    state_province: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InfractionTypeState {
  infractionTypes: InfractionType[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  categories: string[];
  filteredTypes: InfractionType[];
  filters: {
    category: string | null;
    search: string;
    isActive: boolean;
  };
}

const initialState: InfractionTypeState = {
  infractionTypes: [],
  loading: false,
  error: null,
  lastFetched: null,
  categories: [],
  filteredTypes: [],
  filters: {
    category: null,
    search: '',
    isActive: true,
  },
};

// Async thunk to fetch infraction types
export const fetchInfractionTypes = createAsyncThunk(
  'infractionTypes/fetchInfractionTypes',
  async (params?: { 
    category?: string; 
    search?: string; 
    isActive?: boolean;
    limit?: number;
  }, { rejectWithValue }) => {
    try {
      // Set defaults
      const requestParams = {
        isActive: true,
        limit: 100,
        ...params,
      };

      const response = await infractionTypeService.getAllInfractionTypes(requestParams);
      return response.data; // Array of infraction types
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async thunk to fetch categories
export const fetchInfractionCategories = createAsyncThunk(
  'infractionTypes/fetchInfractionCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await infractionTypeService.getCategories();
      return response.data; // Array of categories
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Helper function to filter infraction types
const filterInfractionTypes = (types: InfractionType[], filters: InfractionTypeState['filters']) => {
  return types.filter(type => {
    // Category filter
    if (filters.category && type.category !== filters.category) {
      return false;
    }
    
    // Active status filter
    if (type.isActive !== filters.isActive) {
      return false;
    }
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        type.code.toString().toLowerCase().includes(searchTerm) ||
        type.type.en.toLowerCase().includes(searchTerm) ||
        type.type.fr.toLowerCase().includes(searchTerm) ||
        type.type.ar.toLowerCase().includes(searchTerm) ||
        type.violation.en.toLowerCase().includes(searchTerm) ||
        type.violation.fr.toLowerCase().includes(searchTerm) ||
        type.violation.ar.toLowerCase().includes(searchTerm) ||
        type.municipalityId?.city.toLowerCase().includes(searchTerm) ||
        type.municipalityId?.municipality.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });
};

const infractionTypeSlice = createSlice({
  name: 'infractionTypes',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<{ key: keyof InfractionTypeState['filters']; value: any }>) => {
      state.filters[action.payload.key] = action.payload.value;
      state.filteredTypes = filterInfractionTypes(state.infractionTypes, state.filters);
    },
    clearFilters: (state) => {
      state.filters = {
        category: null,
        search: '',
        isActive: true,
      };
      state.filteredTypes = filterInfractionTypes(state.infractionTypes, state.filters);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch infraction types
      .addCase(fetchInfractionTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInfractionTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.infractionTypes = action.payload;
        state.filteredTypes = filterInfractionTypes(action.payload, state.filters);
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchInfractionTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch categories
      .addCase(fetchInfractionCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInfractionCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(fetchInfractionCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilter, clearFilters, clearError } = infractionTypeSlice.actions;

export default infractionTypeSlice.reducer;

// Selectors
export const selectInfractionTypes = (state: { infractionTypes: InfractionTypeState }) => state.infractionTypes.infractionTypes;
export const selectFilteredInfractionTypes = (state: { infractionTypes: InfractionTypeState }) => state.infractionTypes.filteredTypes;
export const selectInfractionTypesLoading = (state: { infractionTypes: InfractionTypeState }) => state.infractionTypes.loading;
export const selectInfractionTypesError = (state: { infractionTypes: InfractionTypeState }) => state.infractionTypes.error;
export const selectInfractionCategories = (state: { infractionTypes: InfractionTypeState }) => state.infractionTypes.categories;
export const selectInfractionTypeFilters = (state: { infractionTypes: InfractionTypeState }) => state.infractionTypes.filters;

// Helper selectors
export const selectInfractionTypesByCategory = (category: string) => 
  (state: { infractionTypes: InfractionTypeState }) => 
    state.infractionTypes.infractionTypes.filter(type => type.category === category && type.isActive);

export const selectInfractionTypeByCode = (code: string | number) => 
  (state: { infractionTypes: InfractionTypeState }) => 
    state.infractionTypes.infractionTypes.find(type => type.code.toString() === code.toString());

export const selectInfractionTypeById = (id: string) => 
  (state: { infractionTypes: InfractionTypeState }) => 
    state.infractionTypes.infractionTypes.find(type => type._id === id);