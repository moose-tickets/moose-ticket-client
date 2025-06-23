import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import subscriptionService from '../../services/subscriptionService';

// Types
export interface SubscriptionPlan {
  _id: string;
  name: any; // Support multiple languages
  description: {[key: string]: string};
  price: {
    monthly: number;
    annually: number;
    currency: string;
  };
  features: {[key: string]: string}[];
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
  cancelAtPeriodEnd?: boolean;
  autoRenew?: boolean;
  cancelledAt?: string;
  cancelationReason?: string;
  trialStart?: string;
  trialEnd?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  paymentMethodId?: string;
  priceAtSubscription: number;
  usage?: {
    currentPeriod?: {
      eventsCreated: number;
      ticketsSold: number;
      emailsSent: number;
      smsSent: number;
      lastUpdated: string;
    };
    historical?: {
      totalEventsCreated: number;
      totalTicketsSold: number;
      totalEmailsSent: number;
      totalSmsSent: number;
    };
  };
  billing?: {
    nextBillingDate: string;
    lastBillingDate?: string;
    amount: number;
    currency: string;
  };
  metadata?: Record<string, any>;
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
  analytics: any;
  usageAnalytics: any;
  promoCodeValidation: {
    isValid: boolean;
    discount?: number;
    code?: string;
    error?: string;
  };
  loading: {
    plans: boolean;
    subscription: boolean;
    billing: boolean;
    usage: boolean;
    update: boolean;
    cancel: boolean;
    upgrade: boolean;
    promoValidation: boolean;
    analytics: boolean;
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
  analytics: null,
  usageAnalytics: null,
  promoCodeValidation: {
    isValid: false,
    discount: undefined,
    code: undefined,
    error: undefined,
  },
  loading: {
    plans: false,
    subscription: false,
    billing: false,
    usage: false,
    update: false,
    cancel: false,
    upgrade: false,
    promoValidation: false,
    analytics: false,
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
    const result = await subscriptionService.getSubscriptionPlans();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch subscription plans');
    }
    
    return result.data;
  }
);

export const fetchCurrentSubscription = createAsyncThunk(
  'subscriptions/fetchCurrent',
  async () => {
    const result = await subscriptionService.getCurrentSubscription();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch current subscription');
    }
    
    return result.data;
  }
);

export const createSubscription = createAsyncThunk(
  'subscriptions/create',
  async (data: {
    planId: string;
    billingCycle: 'monthly' | 'annually';
    paymentMethodId: string;
    trialDays?: number;
    billingEmail?: string;
    promoCode?: string;
  }) => {
    const result = await subscriptionService.createSubscription({
      planId: data.planId,
      paymentMethodId: data.paymentMethodId,
      billingEmail: data.billingEmail,
      promoCode: data.promoCode,
      metadata: {
        billingCycle: data.billingCycle,
        trialDays: data.trialDays
      }
    });
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to create subscription');
    }
    
    return result.data;
  }
);

export const updateSubscription = createAsyncThunk(
  'subscriptions/update',
  async (data: {
    subscriptionId: string;
    planId?: string;
    billingCycle?: 'monthly' | 'annually';
    paymentMethodId?: string;
    billingEmail?: string;
  }) => {
    const result = await subscriptionService.updateSubscription(data.subscriptionId, {
      planId: data.planId,
      paymentMethodId: data.paymentMethodId,
      billingEmail: data.billingEmail,
      metadata: data.billingCycle ? { billingCycle: data.billingCycle } : undefined
    });
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to update subscription');
    }
    
    return result.data;
  }
);

export const cancelSubscription = createAsyncThunk(
  'subscriptions/cancel',
  async (data: { subscriptionId: string; cancelAtPeriodEnd: boolean; reason?: string }) => {
    const result = await subscriptionService.cancelSubscription(
      data.subscriptionId,
      data.reason,
      data.cancelAtPeriodEnd
    );
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to cancel subscription');
    }
    
    return result.data;
  }
);

export const reactivateSubscription = createAsyncThunk(
  'subscriptions/reactivate',
  async (subscriptionId: string) => {
    const result = await subscriptionService.resumeSubscription(subscriptionId);
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to reactivate subscription');
    }
    
    return result.data;
  }
);

export const fetchBillingHistory = createAsyncThunk(
  'subscriptions/fetchBillingHistory',
  async (params: { page?: number; limit?: number; dateFrom?: string; dateTo?: string } = {}) => {
    const result = await subscriptionService.getBillingHistory(params);
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch billing history');
    }
    
    return result.data;
  }
);

export const fetchUsageQuota = createAsyncThunk(
  'subscriptions/fetchUsage',
  async () => {
    const result = await subscriptionService.getQuotas();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch usage quota');
    }
    
    return result.data;
  }
);

export const updatePaymentMethod = createAsyncThunk(
  'subscriptions/updatePaymentMethod',
  async (data: { subscriptionId: string; paymentMethodId: string }) => {
    const result = await subscriptionService.updateSubscription(data.subscriptionId, {
      paymentMethodId: data.paymentMethodId
    });
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to update payment method');
    }
    
    return result.data;
  }
);

// Add new thunks for comprehensive subscription management
export const upgradeSubscription = createAsyncThunk(
  'subscriptions/upgrade',
  async (data: { subscriptionId: string; newPlanId: string; promoCode?: string }) => {
    const result = await subscriptionService.upgradeSubscription(
      data.subscriptionId,
      data.newPlanId,
      data.promoCode
    );
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to upgrade subscription');
    }
    
    return result.data;
  }
);

export const validatePromoCode = createAsyncThunk(
  'subscriptions/validatePromo',
  async (data: { promoCode: string; planId?: string }) => {
    const result = await subscriptionService.validatePromoCode(data.promoCode, data.planId);
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to validate promo code');
    }
    
    return result.data;
  }
);

export const fetchSubscriptionAnalytics = createAsyncThunk(
  'subscriptions/fetchAnalytics',
  async () => {
    const result = await subscriptionService.getSubscriptionAnalytics();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch subscription analytics');
    }
    
    return result.data;
  }
);

export const fetchUsageAnalytics = createAsyncThunk(
  'subscriptions/fetchUsageAnalytics',
  async (timeRange?: string) => {
    const result = await subscriptionService.getUsageAnalytics(timeRange);
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch usage analytics');
    }
    
    return result.data;
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
        // Handle both old and new response formats
        state.plans = action.payload.plans || action.payload || [];
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
        // Handle both old and new response formats
        state.currentSubscription = action.payload.subscription || action.payload;
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
        // Handle both old and new response formats
        state.currentSubscription = action.payload.subscription || action.payload;
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
        // Handle both old and new response formats
        state.currentSubscription = action.payload.subscription || action.payload;
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
      })
      
      // Upgrade subscription
      .addCase(upgradeSubscription.pending, (state) => {
        state.loading.upgrade = true;
        state.error = null;
      })
      .addCase(upgradeSubscription.fulfilled, (state, action) => {
        state.loading.upgrade = false;
        state.currentSubscription = action.payload;
        state.isUpgrading = false;
      })
      .addCase(upgradeSubscription.rejected, (state, action) => {
        state.loading.upgrade = false;
        state.error = action.error.message || 'Failed to upgrade subscription';
        state.isUpgrading = false;
      })
      
      // Validate promo code
      .addCase(validatePromoCode.pending, (state) => {
        state.loading.promoValidation = true;
        state.promoCodeValidation.error = undefined;
      })
      .addCase(validatePromoCode.fulfilled, (state, action) => {
        state.loading.promoValidation = false;
        state.promoCodeValidation = {
          isValid: true,
          discount: action.payload.discount,
          code: action.payload.code,
          error: undefined,
        };
      })
      .addCase(validatePromoCode.rejected, (state, action) => {
        state.loading.promoValidation = false;
        state.promoCodeValidation = {
          isValid: false,
          discount: undefined,
          code: undefined,
          error: action.error.message || 'Failed to validate promo code',
        };
      })
      
      // Fetch subscription analytics
      .addCase(fetchSubscriptionAnalytics.pending, (state) => {
        state.loading.analytics = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionAnalytics.fulfilled, (state, action) => {
        state.loading.analytics = false;
        state.analytics = action.payload;
      })
      .addCase(fetchSubscriptionAnalytics.rejected, (state, action) => {
        state.loading.analytics = false;
        state.error = action.error.message || 'Failed to fetch subscription analytics';
      })
      
      // Fetch usage analytics
      .addCase(fetchUsageAnalytics.pending, (state) => {
        state.loading.analytics = true;
        state.error = null;
      })
      .addCase(fetchUsageAnalytics.fulfilled, (state, action) => {
        state.loading.analytics = false;
        state.usageAnalytics = action.payload;
      })
      .addCase(fetchUsageAnalytics.rejected, (state, action) => {
        state.loading.analytics = false;
        state.error = action.error.message || 'Failed to fetch usage analytics';
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