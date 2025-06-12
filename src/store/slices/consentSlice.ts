import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface ConsentRecord {
  _id: string;
  userId: string;
  consentType: 'privacy_policy' | 'terms_of_service' | 'data_processing' | 'marketing' | 'cookies' | 'location' | 'notifications';
  version: string;
  status: 'granted' | 'denied' | 'withdrawn' | 'expired';
  grantedAt?: string;
  withdrawnAt?: string;
  expiresAt?: string;
  ipAddress: string;
  userAgent: string;
  method: 'explicit' | 'implicit' | 'opt_in' | 'opt_out';
  metadata: {
    source: string;
    context?: string;
    reason?: string;
    [key: string]: any;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyVersion {
  _id: string;
  policyType: 'privacy_policy' | 'terms_of_service' | 'cookie_policy' | 'data_processing';
  version: string;
  title: string;
  content: string;
  summary: string;
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
  requiresConsent: boolean;
  changes?: string[];
  language: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentSettings {
  privacy_policy: boolean;
  terms_of_service: boolean;
  data_processing: boolean;
  marketing: boolean;
  cookies: boolean;
  location: boolean;
  notifications: boolean;
  analytics: boolean;
  performance: boolean;
  functional: boolean;
}

export interface ConsentAnalytics {
  totalConsents: number;
  consentsByType: Record<string, number>;
  consentsByStatus: Record<string, number>;
  withdrawalRate: number;
  complianceScore: number;
  lastUpdated: string;
}

interface ConsentState {
  consents: ConsentRecord[];
  currentConsents: Record<string, ConsentRecord>;
  policies: PolicyVersion[];
  currentPolicies: Record<string, PolicyVersion>;
  settings: ConsentSettings;
  analytics: ConsentAnalytics | null;
  loading: {
    fetch: boolean;
    update: boolean;
    policies: boolean;
    analytics: boolean;
  };
  error: string | null;
  showConsentModal: boolean;
  pendingConsents: string[];
  hasUnreadPolicyUpdates: boolean;
  lastConsentCheck: string | null;
}

const initialState: ConsentState = {
  consents: [],
  currentConsents: {},
  policies: [],
  currentPolicies: {},
  settings: {
    privacy_policy: false,
    terms_of_service: false,
    data_processing: false,
    marketing: false,
    cookies: false,
    location: false,
    notifications: false,
    analytics: false,
    performance: false,
    functional: false,
  },
  analytics: null,
  loading: {
    fetch: false,
    update: false,
    policies: false,
    analytics: false,
  },
  error: null,
  showConsentModal: false,
  pendingConsents: [],
  hasUnreadPolicyUpdates: false,
  lastConsentCheck: null,
};

// Async Thunks
export const fetchUserConsents = createAsyncThunk(
  'consent/fetchUserConsents',
  async () => {
    const response = await fetch('/api/consent/user', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user consents');
    }

    return response.json();
  }
);

export const grantConsent = createAsyncThunk(
  'consent/grant',
  async (data: {
    consentType: string;
    method: 'explicit' | 'implicit' | 'opt_in';
    metadata?: Record<string, any>;
  }) => {
    const response = await fetch('/api/consent/grant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to grant consent');
    }

    return response.json();
  }
);

export const withdrawConsent = createAsyncThunk(
  'consent/withdraw',
  async (data: {
    consentType: string;
    reason?: string;
    metadata?: Record<string, any>;
  }) => {
    const response = await fetch('/api/consent/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to withdraw consent');
    }

    return response.json();
  }
);

export const bulkUpdateConsents = createAsyncThunk(
  'consent/bulkUpdate',
  async (consents: Array<{
    consentType: string;
    status: 'granted' | 'denied';
    method: 'explicit' | 'implicit' | 'opt_in' | 'opt_out';
    metadata?: Record<string, any>;
  }>) => {
    const response = await fetch('/api/consent/bulk-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ consents }),
    });

    if (!response.ok) {
      throw new Error('Failed to update consents');
    }

    return response.json();
  }
);

export const fetchPolicies = createAsyncThunk(
  'consent/fetchPolicies',
  async (params: { active?: boolean; language?: string } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.active !== undefined) queryParams.set('active', params.active.toString());
    if (params.language) queryParams.set('language', params.language);

    const response = await fetch(`/api/consent/policies?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch policies');
    }

    return response.json();
  }
);

export const checkConsentStatus = createAsyncThunk(
  'consent/checkStatus',
  async () => {
    const response = await fetch('/api/consent/status', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check consent status');
    }

    return response.json();
  }
);

export const fetchConsentAnalytics = createAsyncThunk(
  'consent/fetchAnalytics',
  async () => {
    const response = await fetch('/api/consent/analytics', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch consent analytics');
    }

    return response.json();
  }
);

export const recordConsentInteraction = createAsyncThunk(
  'consent/recordInteraction',
  async (data: {
    action: 'view' | 'click' | 'dismiss' | 'download';
    policyType: string;
    metadata?: Record<string, any>;
  }) => {
    const response = await fetch('/api/consent/interaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to record interaction');
    }

    return response.json();
  }
);

// Slice
const consentSlice = createSlice({
  name: 'consent',
  initialState,
  reducers: {
    setConsentSettings: (state, action: PayloadAction<Partial<ConsentSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    showConsentModal: (state) => {
      state.showConsentModal = true;
    },
    hideConsentModal: (state) => {
      state.showConsentModal = false;
    },
    addPendingConsent: (state, action: PayloadAction<string>) => {
      if (!state.pendingConsents.includes(action.payload)) {
        state.pendingConsents.push(action.payload);
      }
    },
    removePendingConsent: (state, action: PayloadAction<string>) => {
      state.pendingConsents = state.pendingConsents.filter(
        type => type !== action.payload
      );
    },
    clearPendingConsents: (state) => {
      state.pendingConsents = [];
    },
    markPolicyUpdatesAsRead: (state) => {
      state.hasUnreadPolicyUpdates = false;
    },
    updateLastConsentCheck: (state) => {
      state.lastConsentCheck = new Date().toISOString();
    },
    updateConsentStatus: (state, action: PayloadAction<{
      consentType: string;
      status: 'granted' | 'denied' | 'withdrawn';
    }>) => {
      const { consentType, status } = action.payload;
      if (state.currentConsents[consentType]) {
        state.currentConsents[consentType].status = status;
        state.currentConsents[consentType].updatedAt = new Date().toISOString();
        
        if (status === 'withdrawn') {
          state.currentConsents[consentType].withdrawnAt = new Date().toISOString();
        }
      }
      
      // Update settings
      if (consentType in state.settings) {
        state.settings[consentType as keyof ConsentSettings] = status === 'granted';
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch user consents
      .addCase(fetchUserConsents.pending, (state) => {
        state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchUserConsents.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.consents = action.payload.consents;
        state.currentConsents = action.payload.currentConsents || {};
        
        // Update settings based on current consents
        Object.entries(state.currentConsents).forEach(([type, consent]) => {
          if (type in state.settings) {
            state.settings[type as keyof ConsentSettings] = consent.status === 'granted';
          }
        });
      })
      .addCase(fetchUserConsents.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.error.message || 'Failed to fetch user consents';
      })
      
      // Grant consent
      .addCase(grantConsent.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(grantConsent.fulfilled, (state, action) => {
        state.loading.update = false;
        const consent = action.payload;
        state.currentConsents[consent.consentType] = consent;
        state.consents.unshift(consent);
        
        // Update settings
        if (consent.consentType in state.settings) {
          state.settings[consent.consentType as keyof ConsentSettings] = true;
        }
        
        // Remove from pending
        state.pendingConsents = state.pendingConsents.filter(
          type => type !== consent.consentType
        );
      })
      .addCase(grantConsent.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.error.message || 'Failed to grant consent';
      })
      
      // Withdraw consent
      .addCase(withdrawConsent.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(withdrawConsent.fulfilled, (state, action) => {
        state.loading.update = false;
        const consent = action.payload;
        state.currentConsents[consent.consentType] = consent;
        
        // Update in consents array
        const index = state.consents.findIndex(c => 
          c.consentType === consent.consentType && c.isActive
        );
        if (index !== -1) {
          state.consents[index] = consent;
        }
        
        // Update settings
        if (consent.consentType in state.settings) {
          state.settings[consent.consentType as keyof ConsentSettings] = false;
        }
      })
      .addCase(withdrawConsent.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.error.message || 'Failed to withdraw consent';
      })
      
      // Bulk update consents
      .addCase(bulkUpdateConsents.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(bulkUpdateConsents.fulfilled, (state, action) => {
        state.loading.update = false;
        const updatedConsents = action.payload;
        
        updatedConsents.forEach((consent: ConsentRecord) => {
          state.currentConsents[consent.consentType] = consent;
          
          // Update settings
          if (consent.consentType in state.settings) {
            state.settings[consent.consentType as keyof ConsentSettings] = 
              consent.status === 'granted';
          }
        });
        
        // Clear pending consents
        state.pendingConsents = [];
      })
      .addCase(bulkUpdateConsents.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.error.message || 'Failed to update consents';
      })
      
      // Fetch policies
      .addCase(fetchPolicies.pending, (state) => {
        state.loading.policies = true;
        state.error = null;
      })
      .addCase(fetchPolicies.fulfilled, (state, action) => {
        state.loading.policies = false;
        state.policies = action.payload.policies;
        state.currentPolicies = action.payload.currentPolicies || {};
      })
      .addCase(fetchPolicies.rejected, (state, action) => {
        state.loading.policies = false;
        state.error = action.error.message || 'Failed to fetch policies';
      })
      
      // Check consent status
      .addCase(checkConsentStatus.fulfilled, (state, action) => {
        const { pendingConsents, hasUnreadPolicyUpdates } = action.payload;
        state.pendingConsents = pendingConsents || [];
        state.hasUnreadPolicyUpdates = hasUnreadPolicyUpdates || false;
        state.lastConsentCheck = new Date().toISOString();
        
        // Show modal if there are pending consents
        if (pendingConsents && pendingConsents.length > 0) {
          state.showConsentModal = true;
        }
      })
      
      // Fetch analytics
      .addCase(fetchConsentAnalytics.pending, (state) => {
        state.loading.analytics = true;
        state.error = null;
      })
      .addCase(fetchConsentAnalytics.fulfilled, (state, action) => {
        state.loading.analytics = false;
        state.analytics = action.payload;
      })
      .addCase(fetchConsentAnalytics.rejected, (state, action) => {
        state.loading.analytics = false;
        state.error = action.error.message || 'Failed to fetch consent analytics';
      });
  },
});

export const {
  setConsentSettings,
  showConsentModal,
  hideConsentModal,
  addPendingConsent,
  removePendingConsent,
  clearPendingConsents,
  markPolicyUpdatesAsRead,
  updateLastConsentCheck,
  updateConsentStatus,
  clearError,
  resetState,
} = consentSlice.actions;

export default consentSlice.reducer;