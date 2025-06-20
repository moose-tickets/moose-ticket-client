import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AppLayout from '../../wrappers/layout';
import { useHomeStackNavigation } from '../../navigation/hooks';
import {
  ThemedView,
  ThemedText,
  ThemedButton,
  ThemedCard,
  ThemedScrollView,
  StatusBadge,
} from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchDashboardStats,
  fetchRecentTickets,
  fetchUpcomingDueDates,
  fetchRecentActivity,
  refreshDashboard,
  selectDashboardStats,
  selectRecentTickets,
  selectUpcomingDueDates,
  selectRecentActivity,
  selectIsRefreshing,
  selectIsLoadingStats,
  selectTimeRange,
  selectLastRefresh,
} from '../../store/slices/dashboardSlice';
import {
  fetchVehicles,
  selectVehicles,
  selectVehicleLoading,
} from '../../store/slices/vehicleSlice';
import {
  fetchNotifications,
  fetchUnreadCount,
  selectUnreadCount,
} from '../../store/slices/notificationSlice';
import {
  selectUser,
} from '../../store/slices/authSlice';

export default function HomeScreen() {
  const navigation = useHomeStackNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  // Redux state selectors with safe defaults
  const user = useAppSelector(selectUser);
  const dashboardStats = useAppSelector(selectDashboardStats);
  const recentTickets = useAppSelector(selectRecentTickets) || [];
  const upcomingDueDates = useAppSelector(selectUpcomingDueDates) || [];
  const recentActivity = useAppSelector(selectRecentActivity) || [];
  const vehicles = useAppSelector(selectVehicles) || [];
  const unreadCount = useAppSelector(selectUnreadCount) || 0;
  const isRefreshing = useAppSelector(selectIsRefreshing) || false;
  const isLoadingStats = useAppSelector(selectIsLoadingStats) || false;
  const vehicleLoading = useAppSelector(selectVehicleLoading) || false;
  const timeRange = useAppSelector(selectTimeRange) || '30d';
  const lastRefresh = useAppSelector(selectLastRefresh);

  // Get today's date
  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Get greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Get next due ticket
  const nextDueTicket = useMemo(() => {
    if (!upcomingDueDates || upcomingDueDates.length === 0) return null;
    return upcomingDueDates.sort((a, b) => a.daysDue - b.daysDue)[0];
  }, [upcomingDueDates]);

  // Format time remaining for active ticket
  const formatTimeRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m left`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m left`;
    } else {
      return 'Overdue';
    }
  };

  // Load dashboard data with freshness check
  useEffect(() => {
    const loadDashboardData = () => {
      // Check if data is fresh (less than 5 minutes old)
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      const shouldRefresh = !lastRefresh || (now - lastRefresh > fiveMinutes);
      
      if (shouldRefresh) {
        dispatch(fetchDashboardStats(timeRange));
        dispatch(fetchRecentTickets());
        dispatch(fetchUpcomingDueDates());
        dispatch(fetchRecentActivity());
        dispatch(fetchUnreadCount());
        
        // Only fetch vehicles if we don't have any or they're very stale (30 minutes)
        const thirtyMinutes = 30 * 60 * 1000;
        const shouldRefreshVehicles = vehicles.length === 0 || !lastRefresh || (now - lastRefresh > thirtyMinutes);
        if (shouldRefreshVehicles) {
          dispatch(fetchVehicles({ limit: 5 }));
        }
      }
    };

    loadDashboardData();
  }, [dispatch, timeRange]); // Keep timeRange dependency as it should trigger refresh

  // Handle refresh
  const handleRefresh = () => {
    dispatch(refreshDashboard(timeRange));
  };

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView 
        className='flex-1 px-4 pt-4'
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh}
            tintColor={theme === 'dark' ? '#FFA366' : '#10472B'}
          />
        }
      >
        {/* Header */}
        <ThemedView className='flex-row justify-between items-center mb-4'>
          <ThemedView>
            <ThemedText size='xl' weight='bold' className='text-primary'>
              MooseTicket
            </ThemedText>
          </ThemedView>

          <TouchableOpacity
            onPress={() => {
              navigation.navigate('Notifications');
            }}
            className='relative mr-4'
            activeOpacity={0.7}
          >
            <Ionicons
              name='notifications-outline'
              size={24}
              color={theme === 'dark' ? '#FFA366' : '#10472B'}
            />
            {unreadCount > 0 && (
              <ThemedView
                className='absolute -top-1 -right-3 bg-danger rounded-full w-5 h-5 items-center justify-center'
                style={{ minWidth: 20, minHeight: 20 }}
              >
                <ThemedText size='xs' weight='bold' variant='error'>
                  {unreadCount > 99 ? '99+' : unreadCount.toString()}
                </ThemedText>
              </ThemedView>
            )}
          </TouchableOpacity>
        </ThemedView>

        {/* Greeting */}
        <ThemedView className='mb-6'>
          <ThemedView className='flex-row justify-between items-start'>
            <ThemedView className='flex-1'>
              <ThemedText size='2xl' weight='bold' variant='primary'>
                {greeting}, {user?.firstName || 'User'}
              </ThemedText>
              <ThemedText variant='secondary' className='mt-1'>
                {dashboardStats ? `${dashboardStats.outstandingTickets} outstanding tickets` : 'Your parking status at a glance'}
              </ThemedText>
              <ThemedText variant='tertiary' size='sm'>
                {formattedDate}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Active/Next Due Ticket */}
        {nextDueTicket ? (
          <ThemedCard className='mb-4'>
            <ThemedText size='sm' weight='semibold' className='mb-1 text-primary'>
              {nextDueTicket.daysDue <= 0 ? 'Overdue Ticket' : 'Next Due Ticket'}
            </ThemedText>
            <ThemedText
              size='lg'
              weight='bold'
              variant='primary'
              className='mb-1'
            >
              Ticket #{nextDueTicket.ticketNumber}
            </ThemedText>
            <ThemedText 
              weight='semibold' 
              size='lg' 
              className={`mb-2 ${nextDueTicket.daysDue <= 0 ? 'text-danger' : nextDueTicket.daysDue <= 3 ? 'text-warning' : 'text-success'}`}
            >
              {nextDueTicket.daysDue <= 0 ? 'Overdue' : `${nextDueTicket.daysDue} days left`}
            </ThemedText>
            <ThemedText variant='secondary' size='sm' className='mb-2'>
              {nextDueTicket.vehicle.make} {nextDueTicket.vehicle.model} • {nextDueTicket.vehicle.licensePlate}
            </ThemedText>
            <ThemedText weight='semibold' size='base' className='mb-2'>
              ${nextDueTicket.amount.toFixed(2)}
            </ThemedText>
            <ThemedView className='h-2 w-full bg-background-secondary rounded-full overflow-hidden'>
              <ThemedView 
                className={`h-2 rounded-full ${
                  nextDueTicket.daysDue <= 0 ? 'bg-danger' : 
                  nextDueTicket.daysDue <= 3 ? 'bg-warning' : 'bg-success'
                }`}
                style={{ 
                  width: `${Math.max(10, Math.min(100, ((30 - nextDueTicket.daysDue) / 30) * 100))}%` 
                }} 
              />
            </ThemedView>
          </ThemedCard>
        ) : dashboardStats?.outstandingTickets === 0 ? (
          <ThemedCard className='mb-4'>
            <ThemedView className='items-center py-4'>
              <Ionicons
                name='checkmark-circle-outline'
                size={48}
                color={theme === 'dark' ? '#4ADE80' : '#16A34A'}
              />
              <ThemedText size='lg' weight='bold' variant='primary' className='mt-2'>
                All Clear!
              </ThemedText>
              <ThemedText variant='secondary' size='sm' className='text-center mt-1'>
                You have no outstanding tickets
              </ThemedText>
            </ThemedView>
          </ThemedCard>
        ) : (
          <ThemedCard className='mb-4'>
            <ThemedView className='items-center py-4'>
              <ThemedText variant='secondary' size='sm'>
                Loading ticket information...
              </ThemedText>
            </ThemedView>
          </ThemedCard>
        )}

        {/* Action Buttons */}
        <ThemedView className='flex-row justify-between mb-6'>
          {[
            { icon: 'time-outline', label: 'Extend\nTime', route: '' },
            { icon: 'add', label: 'New\nTicket', route: 'AddTicket' },
            {
              icon: 'calendar-outline',
              label: 'Billing History',
              route: 'BillingHistory',
            },
          ].map(({ icon, label, route }, i) => (
            <ThemedButton
              key={i}
              variant={theme === 'dark' ? 'outline' : 'outline'}
              className='flex-1 mx-1 rounded-xl items-center justify-center'
              onPress={() => route && navigation.navigate(route as any)}
            >
              <ThemedView className='flex-col items-center justify-between w-full h-20 rounded-xl bg-background-tertiary py-1'>
                <Ionicons
                  name={icon as any}
                  size={22}
                  color={theme === 'dark' ? '#FFA366' : '#10472B'}
                />
                <ThemedText
                  variant='secondary'
                  size='sm'
                  className='text-center mt-1 w-14'
                  weight='semibold'
                >
                  {label}
                </ThemedText>
              </ThemedView>
            </ThemedButton>
          ))}
        </ThemedView>

        {/* Recent Activity */}
        <ThemedText weight='bold' size='lg' className='mb-2'>
          Recent Activity
        </ThemedText>
        <ThemedView className='mb-6'>
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.slice(0, 3).map((activity) => (
              <TouchableOpacity
                key={activity.id}
                className='flex-row items-center justify-between'
                onPress={() => {
                  // Navigate based on activity type
                  if (activity.type === 'ticket_created' && activity.metadata?.ticketId) {
                    navigation.navigate('TicketDetail', { ticketId: activity.metadata.ticketId });
                  }
                }}
              >
                <ThemedCard
                  variant='flat'
                  className='flex-1 mb-3 bg-background-secondary'
                >
                  <ThemedView className='flex-row items-center justify-between rounded-xl'>
                    <ThemedView className='flex-row items-center rounded-xl px-2'>
                      <ThemedView className='bg-success-light p-2 rounded-xl mr-3'>
                        <Ionicons
                          name={
                            activity.type === 'ticket_created' ? 'document-text-outline' :
                            activity.type === 'payment_made' ? 'card-outline' :
                            activity.type === 'dispute_filed' ? 'alert-circle-outline' :
                            activity.type === 'vehicle_added' ? 'car-outline' :
                            'notifications-outline'
                          }
                          size={18}
                          color={theme === 'dark' ? '#FFA366' : '#10472B'}
                        />
                      </ThemedView>
                      <ThemedView>
                        <ThemedText
                          size='base'
                          weight='semibold'
                          variant='primary'
                        >
                          {activity.title}
                        </ThemedText>
                        <ThemedText variant='secondary' size='sm'>
                          {activity.description}
                        </ThemedText>
                        <ThemedText variant='tertiary' size='xs' className='my-1'>
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                    <Ionicons
                      name='chevron-forward'
                      size={18}
                      color={theme === 'dark' ? '#9CA3AF' : '#A0A0A0'}
                    />
                  </ThemedView>
                </ThemedCard>
              </TouchableOpacity>
            ))
          ) : (
            <ThemedCard variant='flat' className='bg-background-secondary p-4'>
              <ThemedText variant='secondary' size='sm' className='text-center'>
                No recent activity
              </ThemedText>
            </ThemedCard>
          )}
        </ThemedView>

        {/* Vehicles */}
        <ThemedText weight='bold' size='lg' className='mb-2'>
          Your Vehicles
        </ThemedText>
        <FlatList
          data={vehicles}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
            >
              <ThemedCard
                variant='flat'
                className='mr-4 w-40 bg-background-secondary'
              >
                <ThemedView className='mb-3 w-5 bg-inherit'>
                  <Ionicons
                    name='car-outline'
                    size={20}
                    color={theme === 'dark' ? '#FFA366' : '#10472B'}
                    className='bg-background-secondary'
                  />
                  {item.isDefault && (
                    <ThemedView className='absolute -top-1 -right-1'>
                      <Ionicons
                        name='star'
                        size={12}
                        color={theme === 'dark' ? '#FCD34D' : '#F59E0B'}
                      />
                    </ThemedView>
                  )}
                </ThemedView>
                <ThemedText size='base' weight='semibold' variant='primary'>
                  {item.make} {item.model}
                </ThemedText>
                <ThemedText variant='secondary' size='sm'>
                  {item.licensePlate}
                </ThemedText>
                <ThemedText variant='tertiary' size='xs'>
                  {item.year}
                </ThemedText>
              </ThemedCard>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <ThemedCard variant='flat' className='w-40 bg-background-secondary items-center justify-center py-6'>
              <Ionicons
                name='add-circle-outline'
                size={32}
                color={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
              />
              <ThemedText variant='secondary' size='sm' className='text-center mt-2'>
                Add your first vehicle
              </ThemedText>
            </ThemedCard>
          }
        />
      </ThemedScrollView>
    </AppLayout>
  );
}
