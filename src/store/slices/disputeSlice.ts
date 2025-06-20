import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface Dispute {
  _id: string;
  disputeNumber: string;
  ticketId: string;
  userId: string;
  reason: string;
  description: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  evidence: Evidence[];
  messages: DisputeMessage[];
  reviewerNotes?: string;
  resolution?: string;
  submittedAt: string;
  reviewedAt?: string;
  resolvedAt?: string;
  metrics: {
    responseTime?: number;
    resolutionTime?: number;
    escalationCount: number;
    messageCount: number;
  };
}

export interface Evidence {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  description?: string;
  s3Key: string;
  downloadUrl?: string;
}

export interface DisputeMessage {
  _id: string;
  senderId: string;
  senderType: 'user' | 'admin' | 'system';
  message: string;
  timestamp: string;
  attachments?: Evidence[];
}

export interface DisputeFilters {
  status?: string;
  priority?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  searchTerm?: string;
}

interface DisputeState {
  disputes: Dispute[];
  currentDispute: Dispute | null;
  filters: DisputeFilters;
  loading: {
    fetch: boolean;
    create: boolean;
    update: boolean;
    upload: boolean;
  };
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  analytics: {
    totalDisputes: number;
    approvalRate: number;
    averageResolutionTime: number;
    statusDistribution: Record<string, number>;
  };
}

const initialState: DisputeState = {
  disputes: [],
  currentDispute: null,
  filters: {},
  loading: {
    fetch: false,
    create: false,
    update: false,
    upload: false,
  },
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
  analytics: {
    totalDisputes: 0,
    approvalRate: 0,
    averageResolutionTime: 0,
    statusDistribution: {},
  },
};

// Async Thunks
export const fetchDisputes = createAsyncThunk(
  'disputes/fetchDisputes',
  async (params: { page?: number; filters?: DisputeFilters } = {}) => {
    const { page = 1, filters = {} } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      ...Object.entries(filters).reduce((acc, [key, value]) => {
        if (value) acc[key] = typeof value === 'object' ? JSON.stringify(value) : value;
        return acc;
      }, {} as Record<string, string>),
    });

    const response = await fetch(`/api/disputes/search?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch disputes');
    }

    return response.json();
  }
);

export const fetchDisputeById = createAsyncThunk(
  'disputes/fetchDisputeById',
  async (disputeId: string) => {
    const response = await fetch(`/api/disputes/${disputeId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dispute');
    }

    return response.json();
  }
);

export const createDispute = createAsyncThunk(
  'disputes/createDispute',
  async (disputeData: {
    ticketId: string;
    reason: string;
    description: string;
    priority?: string;
  }) => {
    const response = await fetch('/api/disputes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(disputeData),
    });

    if (!response.ok) {
      throw new Error('Failed to create dispute');
    }

    return response.json();
  }
);

export const uploadEvidence = createAsyncThunk(
  'disputes/uploadEvidence',
  async (data: { disputeId: string; file: File; description?: string }) => {
    const formData = new FormData();
    formData.append('evidence', data.file);
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await fetch(`/api/disputes/${data.disputeId}/evidence`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload evidence');
    }

    return response.json();
  }
);

export const updateDisputeStatus = createAsyncThunk(
  'disputes/updateStatus',
  async (data: { disputeId: string; status: string; reviewerNotes?: string }) => {
    const response = await fetch(`/api/disputes/${data.disputeId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        status: data.status,
        reviewerNotes: data.reviewerNotes,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update dispute status');
    }

    return response.json();
  }
);

export const fetchDisputeAnalytics = createAsyncThunk(
  'disputes/fetchAnalytics',
  async () => {
    const response = await fetch('/api/disputes/admin/analytics', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return response.json();
  }
);

// Slice
const disputeSlice = createSlice({
  name: 'disputes',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<DisputeFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page when filters change
    },
    clearFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
    },
    setCurrentDispute: (state, action: PayloadAction<Dispute | null>) => {
      state.currentDispute = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ disputeId: string; message: DisputeMessage }>) => {
      const dispute = state.disputes.find(d => d._id === action.payload.disputeId);
      if (dispute) {
        dispute.messages.push(action.payload.message);
        dispute.metrics.messageCount += 1;
      }
      if (state.currentDispute?._id === action.payload.disputeId) {
        state.currentDispute.messages.push(action.payload.message);
        state.currentDispute.metrics.messageCount += 1;
      }
    },
    updateDispute: (state, action: PayloadAction<Partial<Dispute> & { _id: string }>) => {
      const index = state.disputes.findIndex(d => d._id === action.payload._id);
      if (index !== -1) {
        state.disputes[index] = { ...state.disputes[index], ...action.payload };
      }
      if (state.currentDispute?._id === action.payload._id) {
        state.currentDispute = { ...state.currentDispute, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch disputes
      .addCase(fetchDisputes.pending, (state) => {
        state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchDisputes.fulfilled, (state, action) => {
        state.loading.fetch = false;
        const { disputes, pagination } = action.payload;
        if (action.meta.arg.page === 1) {
          state.disputes = disputes;
        } else {
          state.disputes.push(...disputes);
        }
        state.pagination = pagination;
      })
      .addCase(fetchDisputes.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.error.message || 'Failed to fetch disputes';
      })
      
      // Fetch dispute by ID
      .addCase(fetchDisputeById.pending, (state) => {
        state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchDisputeById.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.currentDispute = action.payload;
        
        // Update in disputes array if exists
        const index = state.disputes.findIndex(d => d._id === action.payload._id);
        if (index !== -1) {
          state.disputes[index] = action.payload;
        }
      })
      .addCase(fetchDisputeById.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.error.message || 'Failed to fetch dispute';
      })
      
      // Create dispute
      .addCase(createDispute.pending, (state) => {
        state.loading.create = true;
        state.error = null;
      })
      .addCase(createDispute.fulfilled, (state, action) => {
        state.loading.create = false;
        state.disputes.unshift(action.payload);
        state.currentDispute = action.payload;
        state.pagination.total += 1;
      })
      .addCase(createDispute.rejected, (state, action) => {
        state.loading.create = false;
        state.error = action.error.message || 'Failed to create dispute';
      })
      
      // Upload evidence
      .addCase(uploadEvidence.pending, (state) => {
        state.loading.upload = true;
        state.error = null;
      })
      .addCase(uploadEvidence.fulfilled, (state, action) => {
        state.loading.upload = false;
        const { disputeId, evidence } = action.payload;
        
        // Update current dispute
        if (state.currentDispute?._id === disputeId) {
          state.currentDispute.evidence.push(evidence);
        }
        
        // Update in disputes array
        const dispute = state.disputes.find(d => d._id === disputeId);
        if (dispute) {
          dispute.evidence.push(evidence);
        }
      })
      .addCase(uploadEvidence.rejected, (state, action) => {
        state.loading.upload = false;
        state.error = action.error.message || 'Failed to upload evidence';
      })
      
      // Update dispute status
      .addCase(updateDisputeStatus.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateDisputeStatus.fulfilled, (state, action) => {
        state.loading.update = false;
        const updatedDispute = action.payload;
        
        // Update current dispute
        if (state.currentDispute?._id === updatedDispute._id) {
          state.currentDispute = updatedDispute;
        }
        
        // Update in disputes array
        const index = state.disputes.findIndex(d => d._id === updatedDispute._id);
        if (index !== -1) {
          state.disputes[index] = updatedDispute;
        }
      })
      .addCase(updateDisputeStatus.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.error.message || 'Failed to update dispute status';
      })
      
      // Fetch analytics
      .addCase(fetchDisputeAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setCurrentDispute,
  addMessage,
  updateDispute,
  clearError,
  resetState,
} = disputeSlice.actions;

export default disputeSlice.reducer;