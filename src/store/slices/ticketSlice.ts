// src/store/slices/ticketSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ticketService from '../../services/ticketService';
import { 
  Ticket, 
  CreateTicketRequest, 
  UpdateTicketRequest,
  TicketFilters,
  Dispute,
  CreateDisputeRequest,
  Payment,
  PaymentRequest,
  ApiResponse,
  PaginationParams,
} from '../../types/api';
import { ITicket, ITicketListResponse } from '../../types/ticket.types';

export interface TicketStats {
  total: number;
  paid: number;
  outstanding: number;
  disputed: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}

export interface TicketSummary {
  recentTickets: ITicket[];
  upcomingDueDates: ITicket[];
  totalFinesThisMonth: number;
  totalFinesThisYear: number;
}

export interface TicketState {
  tickets: ITicketListResponse[];
  currentTicket: ITicket | null;
  disputes: Dispute[];
  currentDispute: Dispute | null;
  stats: TicketStats | null;
  summary: TicketSummary | null;
  filters: TicketFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  isLoading: boolean;
  isLoadingMore: boolean;
  isLoadingTicket: boolean;
  isLoadingDispute: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isPaying: boolean;
  isDisputing: boolean;
  isUploadingEvidence: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: TicketState = {
  tickets: [],
  currentTicket: null,
  disputes: [],
  currentDispute: null,
  stats: null,
  summary: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  isLoading: false,
  isLoadingMore: false,
  isLoadingTicket: false,
  isLoadingDispute: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isPaying: false,
  isDisputing: false,
  isUploadingEvidence: false,
  error: null,
  lastUpdated: null,
};

// Async Thunks - Ticket Management
export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (params?: PaginationParams & TicketFilters, { rejectWithValue }) => {
    try {
      const response = await ticketService.getTickets(params);
      console.log('Fetch Tickets Response:', response);
      if (response.success && response.data) {
        // Handle the nested structure: response.data.data.tickets (double nesting from API client)
        const apiData = response.data.data || response.data;
        const tickets = apiData.tickets || apiData;

        
        const pagination = apiData.pagination || {
          page: params?.page || 1,
          limit: params?.limit || 20,
          total: Array.isArray(tickets) ? tickets.length : 0,
          totalPages: Math.ceil((Array.isArray(tickets) ? tickets.length : 0) / (params?.limit || 20)),
          hasNextPage: false,
          hasPrevPage: false,
        };

        
        return {
          tickets,
          pagination,
          isLoadMore: (params?.page || 1) > 1,
        };
      } else {
        return rejectWithValue(response.message || 'Failed to fetch tickets');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchTicket = createAsyncThunk(
  'tickets/fetchTicket',
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const response = await ticketService.getTicket(ticketId);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch ticket');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createTicket = createAsyncThunk(
  'tickets/createTicket',
  async (ticketData: CreateTicketRequest, { rejectWithValue }) => {
    try {
      const response = await ticketService.createTicket(ticketData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to create ticket');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateTicket = createAsyncThunk(
  'tickets/updateTicket',
  async ({ ticketId, updates }: { ticketId: string; updates: UpdateTicketRequest }, { rejectWithValue }) => {
    try {
      const response = await ticketService.updateTicket(ticketId, updates);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to update ticket');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deleteTicket = createAsyncThunk(
  'tickets/deleteTicket',
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const response = await ticketService.deleteTicket(ticketId);
      if (response.success) {
        return ticketId;
      } else {
        return rejectWithValue(response.message || 'Failed to delete ticket');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Payment Management
export const payTicket = createAsyncThunk(
  'tickets/payTicket',
  async (paymentData: PaymentRequest, { rejectWithValue }) => {
    try {
      const response = await ticketService.payTicket(paymentData);
      if (response.success && response.data) {
        return {
          payment: response.data,
          ticketId: paymentData.ticketId,
        };
      } else {
        return rejectWithValue(response.message || 'Payment failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Dispute Management
export const createDispute = createAsyncThunk(
  'tickets/createDispute',
  async (disputeData: CreateDisputeRequest, { rejectWithValue }) => {
    try {
      const response = await ticketService.createDispute(disputeData);
      if (response.success && response.data) {
        return {
          dispute: response.data,
          ticketId: disputeData.ticketId,
        };
      } else {
        return rejectWithValue(response.message || 'Failed to create dispute');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchDisputes = createAsyncThunk(
  'tickets/fetchDisputes',
  async (params?: PaginationParams, { rejectWithValue }) => {
    try {
      const response = await ticketService.getDisputes(params);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch disputes');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchDispute = createAsyncThunk(
  'tickets/fetchDispute',
  async (disputeId: string, { rejectWithValue }) => {
    try {
      const response = await ticketService.getDispute(disputeId);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch dispute');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const uploadEvidence = createAsyncThunk(
  'tickets/uploadEvidence',
  async ({ disputeId, files, descriptions }: { disputeId: string; files: File[]; descriptions?: string[] }, { rejectWithValue }) => {
    try {
      const response = await ticketService.uploadEvidence(disputeId, files, descriptions);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to upload evidence');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Analytics and Stats
export const fetchTicketStats = createAsyncThunk(
  'tickets/fetchStats',
  async (timeRange?: string, { rejectWithValue }) => {
    try {
      const response = await ticketService.getTicketStats(timeRange);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch stats');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchTicketSummary = createAsyncThunk(
  'tickets/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ticketService.getTicketSummary();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch summary');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const exportTickets = createAsyncThunk(
  'tickets/exportTickets',
  async ({ format, filters }: { format?: 'json' | 'csv' | 'pdf'; filters?: TicketFilters }, { rejectWithValue }) => {
    try {
      const response = await ticketService.exportTickets(format, filters);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Export failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Government Integration
export const lookupGovernmentTicket = createAsyncThunk(
  'tickets/lookupGovernment',
  async ({ ticketNumber, jurisdiction }: { ticketNumber: string; jurisdiction: string }, { rejectWithValue }) => {
    try {
      const response = await ticketService.lookupTicketFromGovernment(ticketNumber, jurisdiction);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Government lookup failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Bulk Operations
export const bulkUpdateTickets = createAsyncThunk(
  'tickets/bulkUpdate',
  async ({ ticketIds, updates }: { ticketIds: string[]; updates: Partial<UpdateTicketRequest> }, { rejectWithValue }) => {
    try {
      const response = await ticketService.bulkUpdateTickets(ticketIds, updates);
      if (response.success) {
        return { ticketIds, updates };
      } else {
        return rejectWithValue(response.message || 'Bulk update failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const bulkDeleteTickets = createAsyncThunk(
  'tickets/bulkDelete',
  async (ticketIds: string[], { rejectWithValue }) => {
    try {
      const response = await ticketService.bulkDeleteTickets(ticketIds);
      if (response.success) {
        return ticketIds;
      } else {
        return rejectWithValue(response.message || 'Bulk delete failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Ticket Slice
const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
    },
    clearCurrentDispute: (state) => {
      state.currentDispute = null;
    },
    setFilters: (state, action: PayloadAction<TicketFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    updateTicketInList: (state, action: PayloadAction<ITicket>) => {
      const index = state.tickets.findIndex(ticket => ticket._id === action.payload.id);
      if (index !== -1) {
        state.tickets[index] = action.payload;
      }
    },
    removeTicketFromList: (state, action: PayloadAction<string>) => {
      state.tickets = state.tickets.filter(ticket => ticket._id !== action.payload);
    },
    addTicketToList: (state, action: PayloadAction<ITicket>) => {
      state.tickets.unshift(action.payload);
    },
    markTicketAsPaid: (state, action: PayloadAction<string>) => {
      // Update ticket in list
      const ticketIndex = state.tickets.findIndex(ticket => ticket._id === action.payload);
      if (ticketIndex !== -1) {
        state.tickets[ticketIndex].status = 'Paid' as any;
        state.tickets[ticketIndex].updatedAt = new Date().toISOString();
      }
      
      // Update current ticket if it matches
      if (state.currentTicket && state.currentTicket._id === action.payload) {
        state.currentTicket.status = 'Paid' as any;
        state.currentTicket.updatedAt = new Date().toISOString();
      }
    },
    markTicketAsDisputed: (state, action: PayloadAction<string>) => {
      // Update ticket in list
      const ticketIndex = state.tickets.findIndex(ticket => ticket._id === action.payload);
      if (ticketIndex !== -1) {
        state.tickets[ticketIndex].status = 'Disputed' as any;
        state.tickets[ticketIndex].updatedAt = new Date().toISOString();
      }
      
      // Update current ticket if it matches
      if (state.currentTicket && state.currentTicket._id === action.payload) {
        state.currentTicket.status = 'Disputed' as any;
        state.currentTicket.updatedAt = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tickets cases
      .addCase(fetchTickets.pending, (state, action) => {
        const isLoadMore = (action.meta.arg?.page || 1) > 1;
        if (isLoadMore) {
          state.isLoadingMore = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        
        if (action.payload.isLoadMore) {
          // Append new tickets for load more
          state.tickets = [...state.tickets, ...action.payload.tickets];
        } else {
          // Replace tickets for fresh load
          state.tickets = action.payload.tickets;
        }
        
        state.pagination = action.payload.pagination;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        state.error = action.payload as string;
      })
      
      // Fetch single ticket cases
      .addCase(fetchTicket.pending, (state) => {
        state.isLoadingTicket = true;
        state.error = null;
      })
      .addCase(fetchTicket.fulfilled, (state, action) => {
        state.isLoadingTicket = false;
        state.currentTicket = action.payload;
        state.error = null;
      })
      .addCase(fetchTicket.rejected, (state, action) => {
        state.isLoadingTicket = false;
        state.error = action.payload as string;
      })
      
      // Create ticket cases
      .addCase(createTicket.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.isCreating = false;
        state.tickets.unshift(action.payload);
        state.error = null;
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      })
      
      // Update ticket cases
      .addCase(updateTicket.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.tickets.findIndex(ticket => ticket._id === action.payload.id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.currentTicket && state.currentTicket._id === action.payload.id) {
          state.currentTicket = action.payload;
        }
        state.error = null;
      })
      .addCase(updateTicket.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      })
      
      // Delete ticket cases
      .addCase(deleteTicket.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.tickets = state.tickets.filter(ticket => ticket._id !== action.payload);
        if (state.currentTicket && state.currentTicket._id === action.payload) {
          state.currentTicket = null;
        }
        state.error = null;
      })
      .addCase(deleteTicket.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      })
      
      // Pay ticket cases
      .addCase(payTicket.pending, (state) => {
        state.isPaying = true;
        state.error = null;
      })
      .addCase(payTicket.fulfilled, (state, action) => {
        state.isPaying = false;
        // Update ticket status to paid
        const ticketIndex = state.tickets.findIndex(ticket => ticket._id === action.payload.ticketId);
        if (ticketIndex !== -1) {
          state.tickets[ticketIndex].status = 'Paid' as any;
          state.tickets[ticketIndex].updatedAt = new Date().toISOString();
        }
        
        if (state.currentTicket && state.currentTicket._id === action.payload.ticketId) {
          state.currentTicket.status = 'Paid' as any;
          state.currentTicket.updatedAt = new Date().toISOString();
        }
        state.error = null;
      })
      .addCase(payTicket.rejected, (state, action) => {
        state.isPaying = false;
        state.error = action.payload as string;
      })
      
      // Dispute management cases
      .addCase(createDispute.pending, (state) => {
        state.isDisputing = true;
        state.error = null;
      })
      .addCase(createDispute.fulfilled, (state, action) => {
        state.isDisputing = false;
        state.disputes.unshift(action.payload.dispute);
        
        // Update ticket status to disputed
        const ticketIndex = state.tickets.findIndex(ticket => ticket._id === action.payload.ticketId);
        if (ticketIndex !== -1) {
          state.tickets[ticketIndex].status = 'Disputed' as any;
          state.tickets[ticketIndex].updatedAt = new Date().toISOString();
        }
        
        if (state.currentTicket && state.currentTicket._id === action.payload.ticketId) {
          state.currentTicket.status = 'Disputed' as any;
          state.currentTicket.updatedAt = new Date().toISOString();
        }
        state.error = null;
      })
      .addCase(createDispute.rejected, (state, action) => {
        state.isDisputing = false;
        state.error = action.payload as string;
      })
      
      // Fetch disputes cases
      .addCase(fetchDisputes.fulfilled, (state, action) => {
        state.disputes = action.payload;
        state.error = null;
      })
      .addCase(fetchDisputes.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Fetch single dispute cases
      .addCase(fetchDispute.pending, (state) => {
        state.isLoadingDispute = true;
        state.error = null;
      })
      .addCase(fetchDispute.fulfilled, (state, action) => {
        state.isLoadingDispute = false;
        state.currentDispute = action.payload;
        state.error = null;
      })
      .addCase(fetchDispute.rejected, (state, action) => {
        state.isLoadingDispute = false;
        state.error = action.payload as string;
      })
      
      // Upload evidence cases
      .addCase(uploadEvidence.pending, (state) => {
        state.isUploadingEvidence = true;
        state.error = null;
      })
      .addCase(uploadEvidence.fulfilled, (state, action) => {
        state.isUploadingEvidence = false;
        state.currentDispute = action.payload;
        const disputeIndex = state.disputes.findIndex(dispute => dispute.id === action.payload.id);
        if (disputeIndex !== -1) {
          state.disputes[disputeIndex] = action.payload;
        }
        state.error = null;
      })
      .addCase(uploadEvidence.rejected, (state, action) => {
        state.isUploadingEvidence = false;
        state.error = action.payload as string;
      })
      
      // Stats and summary cases
      .addCase(fetchTicketStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchTicketStats.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      .addCase(fetchTicketSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
        state.error = null;
      })
      .addCase(fetchTicketSummary.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Bulk operations cases
      .addCase(bulkUpdateTickets.fulfilled, (state, action) => {
        const { ticketIds, updates } = action.payload;
        ticketIds.forEach(ticketId => {
          const index = state.tickets.findIndex(ticket => ticket._id === ticketId);
          if (index !== -1) {
            state.tickets[index] = { ...state.tickets[index], ...updates, updatedAt: new Date().toISOString() };
          }
        });
        state.error = null;
      })
      .addCase(bulkUpdateTickets.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      .addCase(bulkDeleteTickets.fulfilled, (state, action) => {
        state.tickets = state.tickets.filter(ticket => !action.payload.includes(ticket._id));
        state.error = null;
      })
      .addCase(bulkDeleteTickets.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentTicket,
  clearCurrentDispute,
  setFilters,
  clearFilters,
  setPagination,
  updateTicketInList,
  removeTicketFromList,
  addTicketToList,
  markTicketAsPaid,
  markTicketAsDisputed,
} = ticketSlice.actions;

export default ticketSlice.reducer;

// Selectors
export const selectTickets = (state: { tickets: TicketState }) => state.tickets.tickets;
export const selectCurrentTicket = (state: { tickets: TicketState }) => state.tickets.currentTicket;
export const selectDisputes = (state: { tickets: TicketState }) => state.tickets.disputes;
export const selectCurrentDispute = (state: { tickets: TicketState }) => state.tickets.currentDispute;
export const selectTicketStats = (state: { tickets: TicketState }) => state.tickets.stats;
export const selectTicketSummary = (state: { tickets: TicketState }) => state.tickets.summary;
export const selectTicketFilters = (state: { tickets: TicketState }) => state.tickets.filters;
export const selectTicketPagination = (state: { tickets: TicketState }) => state.tickets.pagination;
export const selectTicketLoading = (state: { tickets: TicketState }) => state.tickets.isLoading;
export const selectTicketLoadingMore = (state: { tickets: TicketState }) => state.tickets.isLoadingMore;
export const selectTicketError = (state: { tickets: TicketState }) => state.tickets.error;
export const selectIsCreatingTicket = (state: { tickets: TicketState }) => state.tickets.isCreating;
export const selectIsUpdatingTicket = (state: { tickets: TicketState }) => state.tickets.isUpdating;
export const selectIsDeletingTicket = (state: { tickets: TicketState }) => state.tickets.isDeleting;
export const selectIsPayingTicket = (state: { tickets: TicketState }) => state.tickets.isPaying;
export const selectIsDisputing = (state: { tickets: TicketState }) => state.tickets.isDisputing;
export const selectIsUploadingEvidence = (state: { tickets: TicketState }) => state.tickets.isUploadingEvidence;