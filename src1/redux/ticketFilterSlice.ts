// src/redux/slices/ticketFiltersSlice.ts

import { createSlice } from '@reduxjs/toolkit';

const ticketFiltersSlice = createSlice({
  name: 'ticketFilters',
  initialState: {
    vehicleType: 'All',
    status: 'All',
    city: 'Toronto',
    startDate: null,
    endDate: null,
  },
  reducers: {
    setFilters(state, action) {
      Object.assign(state, action.payload);
    },
    resetFilters(state) {
      state.vehicleType = 'All';
      state.status = 'All';
      state.city = 'Toronto';
      state.startDate = null;
      state.endDate = null;
    },
  },
});

export const { setFilters, resetFilters } = ticketFiltersSlice.actions;
export default ticketFiltersSlice.reducer;
