// src/store/slices/paymentSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import paymentService from '../../services/paymentService';
import { 
  PaymentMethod,
  CreatePaymentMethodRequest,
  Payment,
  PaymentRequest,
  BillingHistory,
  Subscription,
  SubscriptionPlan,
  CreateSubscriptionRequest,
  ApiResponse,
  PaginationParams 
} from '../../types/api';

export interface PaymentAnalytics {
  totalPaid: number;
  totalRefunded: number;
  totalPending: number;
  monthlySpending: number;
  yearlySpending: number;
  averageTicketCost: number;
  paymentMethodUsage: { [type: string]: number };
}

export interface PaymentPlan {
  id: string;
  ticketId: string;
  totalAmount: number;
  installments: number;
  remainingInstallments: number;
  nextPaymentDate: string;
  paymentAmount: number;
  status: 'active' | 'completed' | 'cancelled' | 'failed';
}

export interface PaymentState {
  paymentMethods: PaymentMethod[];
  defaultPaymentMethod: PaymentMethod | null;
  payments: Payment[];
  currentPayment: Payment | null;
  billingHistory: BillingHistory[];
  subscriptions: Subscription[];
  currentSubscription: Subscription | null;
  subscriptionPlans: SubscriptionPlan[];
  paymentPlans: PaymentPlan[];
  analytics: PaymentAnalytics | null;
  stripePaymentIntent: any | null;
  stripeSetupIntent: any | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  isLoadingPaymentMethods: boolean;
  isLoadingPayments: boolean;
  isLoadingBilling: boolean;
  isLoadingSubscriptions: boolean;
  isCreatingPaymentMethod: boolean;
  isUpdatingPaymentMethod: boolean;
  isDeletingPaymentMethod: boolean;
  isSettingDefaultPayment: boolean;
  isProcessingPayment: boolean;
  isProcessingRefund: boolean;
  isCreatingSubscription: boolean;
  isCancellingSubscription: boolean;
  isCreatingPaymentIntent: boolean;
  isCreatingSetupIntent: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: PaymentState = {
  paymentMethods: [],
  defaultPaymentMethod: null,
  payments: [],
  currentPayment: null,
  billingHistory: [],
  subscriptions: [],
  currentSubscription: null,
  subscriptionPlans: [],
  paymentPlans: [],
  analytics: null,
  stripePaymentIntent: null,
  stripeSetupIntent: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  isLoadingPaymentMethods: false,
  isLoadingPayments: false,
  isLoadingBilling: false,
  isLoadingSubscriptions: false,
  isCreatingPaymentMethod: false,
  isUpdatingPaymentMethod: false,
  isDeletingPaymentMethod: false,
  isSettingDefaultPayment: false,
  isProcessingPayment: false,
  isProcessingRefund: false,
  isCreatingSubscription: false,
  isCancellingSubscription: false,
  isCreatingPaymentIntent: false,
  isCreatingSetupIntent: false,
  error: null,
  lastUpdated: null,
};

// Async Thunks - Payment Methods
export const fetchPaymentMethods = createAsyncThunk(
  'payments/fetchPaymentMethods',
  async (params?: PaginationParams, { rejectWithValue }) => {
    try {
      const response = await paymentService.getPaymentMethods(params);
      if (response.success && response.data) {
        return {
          paymentMethods: response.data,
          pagination: response.pagination || {
            page: params?.page || 1,
            limit: params?.limit || 20,
            total: response.data.length,
            totalPages: Math.ceil(response.data.length / (params?.limit || 20)),
          }
        };
      } else {
        return rejectWithValue(response.message || 'Failed to fetch payment methods');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createPaymentMethod = createAsyncThunk(
  'payments/createPaymentMethod',
  async (paymentData: CreatePaymentMethodRequest, { rejectWithValue }) => {
    try {
      const response = await paymentService.createPaymentMethod(paymentData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to create payment method');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updatePaymentMethod = createAsyncThunk(
  'payments/updatePaymentMethod',
  async ({ paymentMethodId, updates }: { paymentMethodId: string; updates: Partial<CreatePaymentMethodRequest> }, { rejectWithValue }) => {
    try {
      const response = await paymentService.updatePaymentMethod(paymentMethodId, updates);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to update payment method');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deletePaymentMethod = createAsyncThunk(
  'payments/deletePaymentMethod',
  async (paymentMethodId: string, { rejectWithValue }) => {
    try {
      const response = await paymentService.deletePaymentMethod(paymentMethodId);
      if (response.success) {
        return paymentMethodId;
      } else {
        return rejectWithValue(response.message || 'Failed to delete payment method');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const setDefaultPaymentMethod = createAsyncThunk(
  'payments/setDefaultPaymentMethod',
  async (paymentMethodId: string, { rejectWithValue }) => {
    try {
      const response = await paymentService.setDefaultPaymentMethod(paymentMethodId);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to set default payment method');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Payments
export const fetchPayments = createAsyncThunk(
  'payments/fetchPayments',
  async (params?: PaginationParams, { rejectWithValue }) => {
    try {
      const response = await paymentService.getPayments(params);
      if (response.success && response.data) {
        return {
          payments: response.data,
          pagination: response.pagination || {
            page: params?.page || 1,
            limit: params?.limit || 20,
            total: response.data.length,
            totalPages: Math.ceil(response.data.length / (params?.limit || 20)),
          }
        };
      } else {
        return rejectWithValue(response.message || 'Failed to fetch payments');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchPayment = createAsyncThunk(
  'payments/fetchPayment',
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const response = await paymentService.getPayment(paymentId);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch payment');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const refundPayment = createAsyncThunk(
  'payments/refundPayment',
  async ({ paymentId, reason }: { paymentId: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await paymentService.refundPayment(paymentId, reason);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to refund payment');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Billing History
export const fetchBillingHistory = createAsyncThunk(
  'payments/fetchBillingHistory',
  async (params?: PaginationParams & { dateFrom?: string; dateTo?: string }, { rejectWithValue }) => {
    try {
      const response = await paymentService.getBillingHistory(params);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch billing history');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Subscriptions
export const fetchSubscriptions = createAsyncThunk(
  'payments/fetchSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await paymentService.getSubscriptions();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch subscriptions');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchSubscriptionPlans = createAsyncThunk(
  'payments/fetchSubscriptionPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await paymentService.getSubscriptionPlans();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch subscription plans');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createSubscription = createAsyncThunk(
  'payments/createSubscription',
  async (subscriptionData: CreateSubscriptionRequest, { rejectWithValue }) => {
    try {
      const response = await paymentService.createSubscription(subscriptionData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to create subscription');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  'payments/cancelSubscription',
  async ({ subscriptionId, reason }: { subscriptionId: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await paymentService.cancelSubscription(subscriptionId, reason);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to cancel subscription');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Stripe Integration
export const createPaymentIntent = createAsyncThunk(
  'payments/createPaymentIntent',
  async ({ amount, currency, metadata }: { amount: number; currency?: string; metadata?: any }, { rejectWithValue }) => {
    try {
      const response = await paymentService.createPaymentIntent(amount, currency, metadata);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to create payment intent');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createSetupIntent = createAsyncThunk(
  'payments/createSetupIntent',
  async (customerId?: string, { rejectWithValue }) => {
    try {
      const response = await paymentService.createSetupIntent(customerId);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to create setup intent');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async Thunks - Analytics
export const fetchPaymentAnalytics = createAsyncThunk(
  'payments/fetchAnalytics',
  async (timeRange?: string, { rejectWithValue }) => {
    try {
      const response = await paymentService.getPaymentAnalytics(timeRange);
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

// Async Thunks - Payment Plans
export const fetchPaymentPlans = createAsyncThunk(
  'payments/fetchPaymentPlans',
  async (ticketId?: string, { rejectWithValue }) => {
    try {
      const response = await paymentService.getAvailablePaymentPlans(ticketId);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch payment plans');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createPaymentPlan = createAsyncThunk(
  'payments/createPaymentPlan',
  async (planData: any, { rejectWithValue }) => {
    try {
      const response = await paymentService.createPaymentPlan(planData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to create payment plan');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Payment Slice
const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
    },
    clearCurrentSubscription: (state) => {
      state.currentSubscription = null;
    },
    clearStripeIntents: (state) => {
      state.stripePaymentIntent = null;
      state.stripeSetupIntent = null;
    },
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    updatePaymentMethodInList: (state, action: PayloadAction<PaymentMethod>) => {
      const index = state.paymentMethods.findIndex(method => method.id === action.payload.id);
      if (index !== -1) {
        state.paymentMethods[index] = action.payload;
      }
    },
    removePaymentMethodFromList: (state, action: PayloadAction<string>) => {
      state.paymentMethods = state.paymentMethods.filter(method => method.id !== action.payload);
    },
    addPaymentMethodToList: (state, action: PayloadAction<PaymentMethod>) => {
      state.paymentMethods.unshift(action.payload);
    },
    setDefaultPaymentMethodInList: (state, action: PayloadAction<string>) => {
      // Clear previous default
      state.paymentMethods.forEach(method => {
        method.isDefault = false;
      });
      
      // Set new default
      const index = state.paymentMethods.findIndex(method => method.id === action.payload);
      if (index !== -1) {
        state.paymentMethods[index].isDefault = true;
        state.defaultPaymentMethod = state.paymentMethods[index];
      }
    },
    addPaymentToList: (state, action: PayloadAction<Payment>) => {
      state.payments.unshift(action.payload);
    },
    updatePaymentInList: (state, action: PayloadAction<Payment>) => {
      const index = state.payments.findIndex(payment => payment.id === action.payload.id);
      if (index !== -1) {
        state.payments[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch payment methods cases
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.isLoadingPaymentMethods = true;
        state.error = null;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.isLoadingPaymentMethods = false;
        state.paymentMethods = action.payload.paymentMethods;
        state.pagination = action.payload.pagination;
        
        // Set default payment method if found
        const defaultMethod = action.payload.paymentMethods.find(m => m.isDefault);
        if (defaultMethod) {
          state.defaultPaymentMethod = defaultMethod;
        }
        
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.isLoadingPaymentMethods = false;
        state.error = action.payload as string;
      })
      
      // Create payment method cases
      .addCase(createPaymentMethod.pending, (state) => {
        state.isCreatingPaymentMethod = true;
        state.error = null;
      })
      .addCase(createPaymentMethod.fulfilled, (state, action) => {
        state.isCreatingPaymentMethod = false;
        state.paymentMethods.unshift(action.payload);
        
        // Set as default if specified
        if (action.payload.isDefault) {
          // Clear previous default
          state.paymentMethods.forEach(method => {
            if (method.id !== action.payload.id) {
              method.isDefault = false;
            }
          });
          state.defaultPaymentMethod = action.payload;
        }
        
        state.error = null;
      })
      .addCase(createPaymentMethod.rejected, (state, action) => {
        state.isCreatingPaymentMethod = false;
        state.error = action.payload as string;
      })
      
      // Update payment method cases
      .addCase(updatePaymentMethod.pending, (state) => {
        state.isUpdatingPaymentMethod = true;
        state.error = null;
      })
      .addCase(updatePaymentMethod.fulfilled, (state, action) => {
        state.isUpdatingPaymentMethod = false;
        const index = state.paymentMethods.findIndex(method => method.id === action.payload.id);
        if (index !== -1) {
          state.paymentMethods[index] = action.payload;
        }
        
        // Update default if needed
        if (action.payload.isDefault) {
          state.defaultPaymentMethod = action.payload;
        } else if (state.defaultPaymentMethod && state.defaultPaymentMethod.id === action.payload.id) {
          state.defaultPaymentMethod = null;
        }
        
        state.error = null;
      })
      .addCase(updatePaymentMethod.rejected, (state, action) => {
        state.isUpdatingPaymentMethod = false;
        state.error = action.payload as string;
      })
      
      // Delete payment method cases
      .addCase(deletePaymentMethod.pending, (state) => {
        state.isDeletingPaymentMethod = true;
        state.error = null;
      })
      .addCase(deletePaymentMethod.fulfilled, (state, action) => {
        state.isDeletingPaymentMethod = false;
        state.paymentMethods = state.paymentMethods.filter(method => method.id !== action.payload);
        
        if (state.defaultPaymentMethod && state.defaultPaymentMethod.id === action.payload) {
          state.defaultPaymentMethod = null;
        }
        
        state.error = null;
      })
      .addCase(deletePaymentMethod.rejected, (state, action) => {
        state.isDeletingPaymentMethod = false;
        state.error = action.payload as string;
      })
      
      // Set default payment method cases
      .addCase(setDefaultPaymentMethod.pending, (state) => {
        state.isSettingDefaultPayment = true;
        state.error = null;
      })
      .addCase(setDefaultPaymentMethod.fulfilled, (state, action) => {
        state.isSettingDefaultPayment = false;
        
        // Clear all defaults
        state.paymentMethods.forEach(method => {
          method.isDefault = false;
        });
        
        // Set new default
        const index = state.paymentMethods.findIndex(method => method.id === action.payload.id);
        if (index !== -1) {
          state.paymentMethods[index] = action.payload;
        }
        
        state.defaultPaymentMethod = action.payload;
        state.error = null;
      })
      .addCase(setDefaultPaymentMethod.rejected, (state, action) => {
        state.isSettingDefaultPayment = false;
        state.error = action.payload as string;
      })
      
      // Fetch payments cases
      .addCase(fetchPayments.pending, (state) => {
        state.isLoadingPayments = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.isLoadingPayments = false;
        state.payments = action.payload.payments;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.isLoadingPayments = false;
        state.error = action.payload as string;
      })
      
      // Fetch single payment cases
      .addCase(fetchPayment.fulfilled, (state, action) => {
        state.currentPayment = action.payload;
        state.error = null;
      })
      .addCase(fetchPayment.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Refund payment cases
      .addCase(refundPayment.pending, (state) => {
        state.isProcessingRefund = true;
        state.error = null;
      })
      .addCase(refundPayment.fulfilled, (state, action) => {
        state.isProcessingRefund = false;
        const index = state.payments.findIndex(payment => payment.id === action.payload.id);
        if (index !== -1) {
          state.payments[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(refundPayment.rejected, (state, action) => {
        state.isProcessingRefund = false;
        state.error = action.payload as string;
      })
      
      // Billing history cases
      .addCase(fetchBillingHistory.pending, (state) => {
        state.isLoadingBilling = true;
        state.error = null;
      })
      .addCase(fetchBillingHistory.fulfilled, (state, action) => {
        state.isLoadingBilling = false;
        state.billingHistory = action.payload;
        state.error = null;
      })
      .addCase(fetchBillingHistory.rejected, (state, action) => {
        state.isLoadingBilling = false;
        state.error = action.payload as string;
      })
      
      // Subscription cases
      .addCase(fetchSubscriptions.pending, (state) => {
        state.isLoadingSubscriptions = true;
        state.error = null;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.isLoadingSubscriptions = false;
        state.subscriptions = action.payload;
        
        // Set current subscription if there's an active one
        const activeSubscription = action.payload.find((sub: Subscription) => sub.status === 'active');
        if (activeSubscription) {
          state.currentSubscription = activeSubscription;
        }
        
        state.error = null;
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.isLoadingSubscriptions = false;
        state.error = action.payload as string;
      })
      
      // Subscription plans cases
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action) => {
        state.subscriptionPlans = action.payload;
        state.error = null;
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Create subscription cases
      .addCase(createSubscription.pending, (state) => {
        state.isCreatingSubscription = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.isCreatingSubscription = false;
        state.subscriptions.unshift(action.payload);
        state.currentSubscription = action.payload;
        state.error = null;
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.isCreatingSubscription = false;
        state.error = action.payload as string;
      })
      
      // Cancel subscription cases
      .addCase(cancelSubscription.pending, (state) => {
        state.isCancellingSubscription = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.isCancellingSubscription = false;
        const index = state.subscriptions.findIndex(sub => sub.id === action.payload.id);
        if (index !== -1) {
          state.subscriptions[index] = action.payload;
        }
        
        if (state.currentSubscription && state.currentSubscription.id === action.payload.id) {
          state.currentSubscription = action.payload;
        }
        
        state.error = null;
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.isCancellingSubscription = false;
        state.error = action.payload as string;
      })
      
      // Stripe payment intent cases
      .addCase(createPaymentIntent.pending, (state) => {
        state.isCreatingPaymentIntent = true;
        state.error = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.isCreatingPaymentIntent = false;
        state.stripePaymentIntent = action.payload;
        state.error = null;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.isCreatingPaymentIntent = false;
        state.error = action.payload as string;
      })
      
      // Stripe setup intent cases
      .addCase(createSetupIntent.pending, (state) => {
        state.isCreatingSetupIntent = true;
        state.error = null;
      })
      .addCase(createSetupIntent.fulfilled, (state, action) => {
        state.isCreatingSetupIntent = false;
        state.stripeSetupIntent = action.payload;
        state.error = null;
      })
      .addCase(createSetupIntent.rejected, (state, action) => {
        state.isCreatingSetupIntent = false;
        state.error = action.payload as string;
      })
      
      // Analytics cases
      .addCase(fetchPaymentAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
        state.error = null;
      })
      .addCase(fetchPaymentAnalytics.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Payment plans cases
      .addCase(fetchPaymentPlans.fulfilled, (state, action) => {
        state.paymentPlans = action.payload;
        state.error = null;
      })
      .addCase(fetchPaymentPlans.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      .addCase(createPaymentPlan.fulfilled, (state, action) => {
        state.paymentPlans.unshift(action.payload);
        state.error = null;
      })
      .addCase(createPaymentPlan.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentPayment,
  clearCurrentSubscription,
  clearStripeIntents,
  setPagination,
  updatePaymentMethodInList,
  removePaymentMethodFromList,
  addPaymentMethodToList,
  setDefaultPaymentMethodInList,
  addPaymentToList,
  updatePaymentInList,
} = paymentSlice.actions;

export default paymentSlice.reducer;

// Selectors
export const selectPaymentMethods = (state: { payments: PaymentState }) => state.payments.paymentMethods;
export const selectDefaultPaymentMethod = (state: { payments: PaymentState }) => state.payments.defaultPaymentMethod;
export const selectPayments = (state: { payments: PaymentState }) => state.payments.payments;
export const selectCurrentPayment = (state: { payments: PaymentState }) => state.payments.currentPayment;
export const selectBillingHistory = (state: { payments: PaymentState }) => state.payments.billingHistory;
export const selectSubscriptions = (state: { payments: PaymentState }) => state.payments.subscriptions;
export const selectCurrentSubscription = (state: { payments: PaymentState }) => state.payments.currentSubscription;
export const selectSubscriptionPlans = (state: { payments: PaymentState }) => state.payments.subscriptionPlans;
export const selectPaymentPlans = (state: { payments: PaymentState }) => state.payments.paymentPlans;
export const selectPaymentAnalytics = (state: { payments: PaymentState }) => state.payments.analytics;
export const selectStripePaymentIntent = (state: { payments: PaymentState }) => state.payments.stripePaymentIntent;
export const selectStripeSetupIntent = (state: { payments: PaymentState }) => state.payments.stripeSetupIntent;
export const selectPaymentPagination = (state: { payments: PaymentState }) => state.payments.pagination;
export const selectPaymentLoading = (state: { payments: PaymentState }) => state.payments.isLoading;
export const selectPaymentError = (state: { payments: PaymentState }) => state.payments.error;
export const selectIsCreatingPaymentMethod = (state: { payments: PaymentState }) => state.payments.isCreatingPaymentMethod;
export const selectIsUpdatingPaymentMethod = (state: { payments: PaymentState }) => state.payments.isUpdatingPaymentMethod;
export const selectIsDeletingPaymentMethod = (state: { payments: PaymentState }) => state.payments.isDeletingPaymentMethod;
export const selectIsSettingDefaultPayment = (state: { payments: PaymentState }) => state.payments.isSettingDefaultPayment;
export const selectIsProcessingPayment = (state: { payments: PaymentState }) => state.payments.isProcessingPayment;
export const selectIsProcessingRefund = (state: { payments: PaymentState }) => state.payments.isProcessingRefund;