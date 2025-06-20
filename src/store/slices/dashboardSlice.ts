// src/store/slices/dashboardSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ticketService from '../../services/ticketService';
import vehicleService from '../../services/vehicleService';
import paymentService from '../../services/paymentService';
import notificationService from '../../services/notificationService';
import { Ticket, Vehicle, Payment, Notification } from '../../types/api';

export interface DashboardStats {
  totalTickets: number;
  outstandingTickets: number;
  paidTickets: number;
  disputedTickets: number;
  totalAmount: number;
  outstandingAmount: number;
  paidAmount: number;
  thisMonthTickets: number;
  thisMonthAmount: number;
  avgTicketAmount: number;
}

export interface RecentActivity {
  id: string;
  type: 'ticket_created' | 'payment_made' | 'dispute_filed' | 'vehicle_added' | 'notification_received';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface UpcomingDueDates {
  id: string;
  ticketId: string;
  ticketNumber: string;
  amount: number;
  dueDate: string;
  daysDue: number;
  vehicle: {
    make: string;
    model: string;
    licensePlate: string;
  };
}

export interface QuickActions {
  newTicket: boolean;
  makePayment: boolean;
  addVehicle: boolean;
  fileDispute: boolean;
  viewReports: boolean;
}

export interface ChartData {
  ticketsByMonth: { month: string; count: number; amount: number }[];
  ticketsByType: { type: string; count: number; percentage: number }[];
  paymentsByMonth: { month: string; amount: number; count: number }[];
  vehicleStats: { vehicleId: string; make: string; model: string; licensePlate: string; ticketCount: number; totalFines: number }[];
}

export interface DashboardWidgets {
  stats: boolean;
  recentTickets: boolean;
  upcomingDueDates: boolean;
  recentActivity: boolean;
  quickActions: boolean;
  charts: boolean;
  notifications: boolean;
  vehicleOverview: boolean;
}

export interface DashboardState {
  stats: DashboardStats | null;
  recentTickets: Ticket[];
  recentActivity: RecentActivity[];
  upcomingDueDates: UpcomingDueDates[];
  recentPayments: Payment[];
  recentNotifications: Notification[];
  chartData: ChartData | null;
  quickActions: QuickActions;
  widgets: DashboardWidgets;
  refreshing: boolean;
  timeRange: '7d' | '30d' | '90d' | '1y';
  lastRefresh: number | null;
  isLoading: boolean;
  isLoadingStats: boolean;
  isLoadingActivity: boolean;
  isLoadingCharts: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  recentTickets: [],
  recentActivity: [],
  upcomingDueDates: [],
  recentPayments: [],
  recentNotifications: [],
  chartData: null,
  quickActions: {
    newTicket: true,
    makePayment: true,
    addVehicle: true,
    fileDispute: true,
    viewReports: true,
  },
  widgets: {
    stats: true,
    recentTickets: true,
    upcomingDueDates: true,
    recentActivity: true,
    quickActions: true,
    charts: true,
    notifications: true,
    vehicleOverview: true,
  },
  refreshing: false,
  timeRange: '30d',
  lastRefresh: null,
  isLoading: false,
  isLoadingStats: false,
  isLoadingActivity: false,
  isLoadingCharts: false,
  error: null,
};

// Async Thunks
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (timeRange: string = '30d', { rejectWithValue }) => {
    try {
      const response = await ticketService.getTicketStats(timeRange);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch dashboard stats');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchRecentTickets = createAsyncThunk(
  'dashboard/fetchRecentTickets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ticketService.getTickets({ 
        page: 1, 
        limit: 5, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch recent tickets');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchUpcomingDueDates = createAsyncThunk(
  'dashboard/fetchUpcomingDueDates',
  async (_, { rejectWithValue }) => {
    try {
      // Get tickets with upcoming due dates
      const response = await ticketService.getTickets({ 
        page: 1, 
        limit: 10,
        status: 'Outstanding' as any,
        sortBy: 'dueDate',
        sortOrder: 'asc'
      });
      
      if (response.success && response.data) {
        // Transform tickets to upcoming due dates format
        const upcomingDueDates = response.data
          .filter(ticket => {
            const dueDate = new Date(ticket.dueDate || ticket.issueDate);
            const today = new Date();
            const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            return daysDiff <= 30 && daysDiff >= 0; // Due within 30 days
          })
          .map(ticket => {
            const dueDate = new Date(ticket.dueDate || ticket.issueDate);
            const today = new Date();
            const daysDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            
            return {
              id: ticket.id,
              ticketId: ticket.id,
              ticketNumber: ticket.ticketNumber || ticket.id,
              amount: ticket.fine.amount,
              dueDate: dueDate.toISOString(),
              daysDue,
              vehicle: {
                make: ticket.vehicle.make,
                model: ticket.vehicle.model,
                licensePlate: ticket.vehicle.plate,
              },
            };
          });
          
        return upcomingDueDates;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch upcoming due dates');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchRecentActivity = createAsyncThunk(
  'dashboard/fetchRecentActivity',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const activities: RecentActivity[] = [];
      
      // Fetch recent tickets
      const ticketsResponse = await ticketService.getTickets({ 
        page: 1, 
        limit: 3, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      
      if (ticketsResponse.success && ticketsResponse.data) {
        ticketsResponse.data.forEach(ticket => {
          activities.push({
            id: `ticket_${ticket.id}`,
            type: 'ticket_created',
            title: 'New Ticket Created',
            description: `${ticket.infraction.type} - ${ticket.vehicle.plate}`,
            timestamp: ticket.createdAt,
            metadata: { ticketId: ticket.id },
          });
        });
      }
      
      // Fetch recent payments
      const paymentsResponse = await paymentService.getPayments({ 
        page: 1, 
        limit: 3, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      
      if (paymentsResponse.success && paymentsResponse.data) {
        paymentsResponse.data.forEach(payment => {
          activities.push({
            id: `payment_${payment.id}`,
            type: 'payment_made',
            title: 'Payment Processed',
            description: `$${payment.amount} paid for ticket`,
            timestamp: payment.createdAt,
            metadata: { paymentId: payment.id },
          });
        });
      }
      
      // Fetch recent notifications
      const notificationsResponse = await notificationService.getNotifications({ 
        page: 1, 
        limit: 2, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      
      if (notificationsResponse.success && notificationsResponse.data) {
        notificationsResponse.data.forEach(notification => {
          activities.push({
            id: `notification_${notification.id}`,
            type: 'notification_received',
            title: notification.title,
            description: notification.message,
            timestamp: notification.createdAt,
            metadata: { notificationId: notification.id },
          });
        });
      }
      
      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return activities.slice(0, 10); // Return top 10 activities
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchDashboardCharts = createAsyncThunk(
  'dashboard/fetchCharts',
  async (timeRange: string = '30d', { rejectWithValue }) => {
    try {
      const [ticketStats, vehicleAnalytics, paymentAnalytics] = await Promise.all([
        ticketService.getTicketStats(timeRange),
        vehicleService.getVehicleAnalytics(),
        paymentService.getPaymentAnalytics(timeRange),
      ]);
      
      const chartData: ChartData = {
        ticketsByMonth: [],
        ticketsByType: [],
        paymentsByMonth: [],
        vehicleStats: [],
      };
      
      // Process ticket stats
      if (ticketStats.success && ticketStats.data) {
        chartData.ticketsByMonth = ticketStats.data.ticketsByMonth || [];
        chartData.ticketsByType = ticketStats.data.ticketsByType || [];
      }
      
      // Process payment analytics
      if (paymentAnalytics.success && paymentAnalytics.data) {
        chartData.paymentsByMonth = paymentAnalytics.data.paymentsByMonth || [];
      }
      
      // Process vehicle analytics
      if (vehicleAnalytics.success && vehicleAnalytics.data) {
        chartData.vehicleStats = vehicleAnalytics.data.vehicleStats || [];
      }
      
      return chartData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const refreshDashboard = createAsyncThunk(
  'dashboard/refresh',
  async (timeRange: string = '30d', { dispatch, rejectWithValue }) => {
    try {
      await Promise.all([
        dispatch(fetchDashboardStats(timeRange)),
        dispatch(fetchRecentTickets()),
        dispatch(fetchUpcomingDueDates()),
        dispatch(fetchRecentActivity()),
        dispatch(fetchDashboardCharts(timeRange)),
      ]);
      
      return Date.now();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Dashboard Slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    setTimeRange: (state, action: PayloadAction<'7d' | '30d' | '90d' | '1y'>) => {
      state.timeRange = action.payload;
    },
    
    updateQuickActions: (state, action: PayloadAction<Partial<QuickActions>>) => {
      state.quickActions = { ...state.quickActions, ...action.payload };
    },
    
    updateWidgets: (state, action: PayloadAction<Partial<DashboardWidgets>>) => {
      state.widgets = { ...state.widgets, ...action.payload };
    },
    
    addRecentActivity: (state, action: PayloadAction<RecentActivity>) => {
      state.recentActivity.unshift(action.payload);
      
      // Keep only last 20 activities
      if (state.recentActivity.length > 20) {
        state.recentActivity = state.recentActivity.slice(0, 20);
      }
    },
    
    updateStats: (state, action: PayloadAction<Partial<DashboardStats>>) => {
      if (state.stats) {
        state.stats = { ...state.stats, ...action.payload };
      }
    },
    
    markAsRefreshed: (state) => {
      state.lastRefresh = Date.now();
    },
    
    resetDashboard: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard stats cases
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoadingStats = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoadingStats = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoadingStats = false;
        state.error = action.payload as string;
      })
      
      // Fetch recent tickets cases
      .addCase(fetchRecentTickets.fulfilled, (state, action) => {
        state.recentTickets = action.payload;
        state.error = null;
      })
      .addCase(fetchRecentTickets.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Fetch upcoming due dates cases
      .addCase(fetchUpcomingDueDates.fulfilled, (state, action) => {
        state.upcomingDueDates = action.payload;
        state.error = null;
      })
      .addCase(fetchUpcomingDueDates.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Fetch recent activity cases
      .addCase(fetchRecentActivity.pending, (state) => {
        state.isLoadingActivity = true;
        state.error = null;
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.isLoadingActivity = false;
        state.recentActivity = action.payload;
        state.error = null;
      })
      .addCase(fetchRecentActivity.rejected, (state, action) => {
        state.isLoadingActivity = false;
        state.error = action.payload as string;
      })
      
      // Fetch dashboard charts cases
      .addCase(fetchDashboardCharts.pending, (state) => {
        state.isLoadingCharts = true;
        state.error = null;
      })
      .addCase(fetchDashboardCharts.fulfilled, (state, action) => {
        state.isLoadingCharts = false;
        state.chartData = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardCharts.rejected, (state, action) => {
        state.isLoadingCharts = false;
        state.error = action.payload as string;
      })
      
      // Refresh dashboard cases
      .addCase(refreshDashboard.pending, (state) => {
        state.refreshing = true;
        state.error = null;
      })
      .addCase(refreshDashboard.fulfilled, (state, action) => {
        state.refreshing = false;
        state.lastRefresh = action.payload;
        state.error = null;
      })
      .addCase(refreshDashboard.rejected, (state, action) => {
        state.refreshing = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setTimeRange,
  updateQuickActions,
  updateWidgets,
  addRecentActivity,
  updateStats,
  markAsRefreshed,
  resetDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;

// Selectors
export const selectDashboardStats = (state: { dashboard: DashboardState }) => state.dashboard.stats;
export const selectRecentTickets = (state: { dashboard: DashboardState }) => state.dashboard.recentTickets;
export const selectRecentActivity = (state: { dashboard: DashboardState }) => state.dashboard.recentActivity;
export const selectUpcomingDueDates = (state: { dashboard: DashboardState }) => state.dashboard.upcomingDueDates;
export const selectRecentPayments = (state: { dashboard: DashboardState }) => state.dashboard.recentPayments;
export const selectRecentNotifications = (state: { dashboard: DashboardState }) => state.dashboard.recentNotifications;
export const selectChartData = (state: { dashboard: DashboardState }) => state.dashboard.chartData;
export const selectQuickActions = (state: { dashboard: DashboardState }) => state.dashboard.quickActions;
export const selectWidgets = (state: { dashboard: DashboardState }) => state.dashboard.widgets;
export const selectIsRefreshing = (state: { dashboard: DashboardState }) => state.dashboard.refreshing;
export const selectTimeRange = (state: { dashboard: DashboardState }) => state.dashboard.timeRange;
export const selectLastRefresh = (state: { dashboard: DashboardState }) => state.dashboard.lastRefresh;
export const selectDashboardLoading = (state: { dashboard: DashboardState }) => state.dashboard.isLoading;
export const selectIsLoadingStats = (state: { dashboard: DashboardState }) => state.dashboard.isLoadingStats;
export const selectIsLoadingActivity = (state: { dashboard: DashboardState }) => state.dashboard.isLoadingActivity;
export const selectIsLoadingCharts = (state: { dashboard: DashboardState }) => state.dashboard.isLoadingCharts;
export const selectDashboardError = (state: { dashboard: DashboardState }) => state.dashboard.error;