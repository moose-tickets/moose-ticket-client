import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    annually: number;
    currency: string;
  };
  features: string[];
  limits: {
    maxTickets: number;
    maxVehicles: number;
    maxDisputes: number;
    supportLevel: 'basic' | 'priority' | 'premium';
  };
  tier: 'basic' | 'standard' | 'premium' | 'enterprise';
  isActive: boolean;
  isPopular?: boolean;
  metadata: Record<string, any>;
}

export interface UserSubscription {
  _id: string;
  userId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing';
  billingCycle: 'monthly' | 'annually';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  trialStart?: string;
  trialEnd?: string;
  stripeSubscriptionId?: string;
  paymentMethodId?: string;
  usage: {
    tickets: number;
    vehicles: number;
    disputes: number;
    lastUpdated: string;
  };
  billing: {
    nextBillingDate: string;
    lastBillingDate?: string;
    amount: number;
    currency: string;
  };
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BillingHistory {
  _id: string;
  subscriptionId: string;
  userId: string;
  type: 'subscription' | 'refund' | 'payment';
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  amount: number;
  currency: string;
  totalAmount: number;
  tax: {
    amount: number;
    rate: number;
    jurisdiction?: string;
  };
  discount: {
    amount: number;
    code?: string;
    description?: string;
  };
  invoiceNumber: string;
  billingPeriod: {
    start: string;
    end: string;
  };
  dueDate: string;
  paidDate?: string;
  paymentMethod?: {
    type: string;
    last4: string;
    brand: string;
  };
  failureReason?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UsageQuota {
  tickets: {
    used: number;
    limit: number;
    percentage: number;
  };
  vehicles: {
    used: number;
    limit: number;
    percentage: number;
  };
  disputes: {
    used: number;
    limit: number;
    percentage: number;
  };
}

interface SubscriptionState {
  plans: SubscriptionPlan[];
  currentSubscription: UserSubscription | null;
  billingHistory: BillingHistory[];
  usageQuota: UsageQuota | null;
  loading: {
    plans: boolean;
    subscription: boolean;
    billing: boolean;
    usage: boolean;
    update: boolean;
    cancel: boolean;
  };
  error: string | null;
  selectedPlan: SubscriptionPlan | null;
  isUpgrading: boolean;
  isDowngrading: boolean;
  planComparison: {
    showModal: boolean;
    plans: SubscriptionPlan[];
  };
}

const initialState: SubscriptionState = {
  plans: [],
  currentSubscription: null,
  billingHistory: [],
  usageQuota: null,
  loading: {
    plans: false,
    subscription: false,
    billing: false,
    usage: false,
    update: false,
    cancel: false,
  },
  error: null,
  selectedPlan: null,
  isUpgrading: false,
  isDowngrading: false,
  planComparison: {
    showModal: false,
    plans: [],
  },
};

// Async Thunks
export const fetchSubscriptionPlans = createAsyncThunk(
  'subscriptions/fetchPlans',
  async () => {
    const response = await fetch('/api/subscriptions/plans', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subscription plans');
    }

    return response.json();
  }
);

export const fetchCurrentSubscription = createAsyncThunk(
  'subscriptions/fetchCurrent',
  async () => {
    const response = await fetch('/api/subscriptions/current', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch current subscription');
    }

    return response.json();
  }
);

export const createSubscription = createAsyncThunk(
  'subscriptions/create',
  async (data: {
    planId: string;
    billingCycle: 'monthly' | 'annually';
    paymentMethodId: string;
    trialDays?: number;
  }) => {
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create subscription');
    }

    return response.json();
  }
);

export const updateSubscription = createAsyncThunk(
  'subscriptions/update',
  async (data: {
    planId?: string;
    billingCycle?: 'monthly' | 'annually';
    paymentMethodId?: string;
  }) => {
    const response = await fetch('/api/subscriptions/current', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update subscription');
    }

    return response.json();
  }
);

export const cancelSubscription = createAsyncThunk(
  'subscriptions/cancel',
  async (data: { cancelAtPeriodEnd: boolean; reason?: string }) => {
    const response = await fetch('/api/subscriptions/current/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    return response.json();
  }
);

export const reactivateSubscription = createAsyncThunk(
  'subscriptions/reactivate',
  async () => {
    const response = await fetch('/api/subscriptions/current/reactivate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to reactivate subscription');
    }

    return response.json();
  }
);

export const fetchBillingHistory = createAsyncThunk(
  'subscriptions/fetchBillingHistory',
  async (params: { page?: number; limit?: number } = {}, { getState }) => {
    const state = getState() as any;
    const currentSubscription = state.subscriptions.currentSubscription;
    
    if (!currentSubscription) {
      throw new Error('No active subscription found');
    }

    const queryParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 20).toString(),
    });

    const response = await fetch(`/api/subscriptions/${currentSubscription._id}/billing?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch billing history');
    }

    const data = await response.json();
    return data.data; // Extract the data from the response
  }
);

export const fetchUsageQuota = createAsyncThunk(
  'subscriptions/fetchUsage',
  async () => {
    const response = await fetch('/api/subscriptions/usage', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch usage quota');
    }

    return response.json();
  }
);

export const updatePaymentMethod = createAsyncThunk(
  'subscriptions/updatePaymentMethod',
  async (paymentMethodId: string) => {
    const response = await fetch('/api/subscriptions/current/payment-method', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ paymentMethodId }),
    });

    if (!response.ok) {
      throw new Error('Failed to update payment method');
    }

    return response.json();
  }
);

// Slice
const subscriptionSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {
    setSelectedPlan: (state, action: PayloadAction<SubscriptionPlan | null>) => {
      state.selectedPlan = action.payload;
    },
    setUpgrading: (state, action: PayloadAction<boolean>) => {
      state.isUpgrading = action.payload;
    },
    setDowngrading: (state, action: PayloadAction<boolean>) => {
      state.isDowngrading = action.payload;
    },
    showPlanComparison: (state, action: PayloadAction<SubscriptionPlan[]>) => {
      state.planComparison.showModal = true;
      state.planComparison.plans = action.payload;
    },
    hidePlanComparison: (state) => {
      state.planComparison.showModal = false;
      state.planComparison.plans = [];
    },
    updateUsage: (state, action: PayloadAction<Partial<UsageQuota>>) => {
      if (state.usageQuota) {
        state.usageQuota = { ...state.usageQuota, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch subscription plans
      .addCase(fetchSubscriptionPlans.pending, (state) => {
        state.loading.plans = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action) => {
        state.loading.plans = false;
        state.plans = action.payload;
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
        state.loading.plans = false;
        state.error = action.error.message || 'Failed to fetch subscription plans';
      })
      
      // Fetch current subscription
      .addCase(fetchCurrentSubscription.pending, (state) => {
        state.loading.subscription = true;
        state.error = null;
      })
      .addCase(fetchCurrentSubscription.fulfilled, (state, action) => {
        state.loading.subscription = false;
        state.currentSubscription = action.payload;
      })
      .addCase(fetchCurrentSubscription.rejected, (state, action) => {
        state.loading.subscription = false;
        state.error = action.error.message || 'Failed to fetch current subscription';
      })
      
      // Create subscription
      .addCase(createSubscription.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.loading.update = false;
        state.currentSubscription = action.payload;
        state.selectedPlan = null;
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.error.message || 'Failed to create subscription';
      })
      
      // Update subscription
      .addCase(updateSubscription.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        state.loading.update = false;
        state.currentSubscription = action.payload;
        state.isUpgrading = false;
        state.isDowngrading = false;
      })
      .addCase(updateSubscription.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.error.message || 'Failed to update subscription';
        state.isUpgrading = false;
        state.isDowngrading = false;
      })
      
      // Cancel subscription
      .addCase(cancelSubscription.pending, (state) => {
        state.loading.cancel = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.loading.cancel = false;
        state.currentSubscription = action.payload;
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.loading.cancel = false;
        state.error = action.error.message || 'Failed to cancel subscription';
      })
      
      // Reactivate subscription
      .addCase(reactivateSubscription.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(reactivateSubscription.fulfilled, (state, action) => {
        state.loading.update = false;
        state.currentSubscription = action.payload;
      })
      .addCase(reactivateSubscription.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.error.message || 'Failed to reactivate subscription';
      })
      
      // Fetch billing history
      .addCase(fetchBillingHistory.pending, (state) => {
        state.loading.billing = true;
        state.error = null;
      })
      .addCase(fetchBillingHistory.fulfilled, (state, action) => {
        state.loading.billing = false;
        // Handle both array and object with billings array
        state.billingHistory = Array.isArray(action.payload) 
          ? action.payload 
          : action.payload.billings || [];
      })
      .addCase(fetchBillingHistory.rejected, (state, action) => {
        state.loading.billing = false;
        state.error = action.error.message || 'Failed to fetch billing history';
      })
      
      // Fetch usage quota
      .addCase(fetchUsageQuota.pending, (state) => {
        state.loading.usage = true;
        state.error = null;
      })
      .addCase(fetchUsageQuota.fulfilled, (state, action) => {
        state.loading.usage = false;
        state.usageQuota = action.payload;
      })
      .addCase(fetchUsageQuota.rejected, (state, action) => {
        state.loading.usage = false;
        state.error = action.error.message || 'Failed to fetch usage quota';
      })
      
      // Update payment method
      .addCase(updatePaymentMethod.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updatePaymentMethod.fulfilled, (state, action) => {
        state.loading.update = false;
        if (state.currentSubscription) {
          state.currentSubscription.paymentMethodId = action.payload.paymentMethodId;
        }
      })
      .addCase(updatePaymentMethod.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.error.message || 'Failed to update payment method';
      });
  },
});

export const {
  setSelectedPlan,
  setUpgrading,
  setDowngrading,
  showPlanComparison,
  hidePlanComparison,
  updateUsage,
  clearError,
  resetState,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;