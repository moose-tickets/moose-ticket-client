// src/screens/Notifications/NotificationsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../wrappers/ThemeProvider';
import AppLayout from '../../wrappers/layout';
import Header from '../../components/Header';
import Dialog from '../../components/Dialog';
import { 
  ThemedView, 
  ThemedText, 
  ThemedCard, 
  ThemedButton 
} from '../../components/ThemedComponents';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  registerPushToken,
  clearError,
  setFilters,
  clearFilters,
  selectNotifications,
  selectUnreadCount,
  selectNotificationLoading,
  selectNotificationError,
  selectNotificationPagination,
  selectNotificationFilters,
  selectIsMarkingAsRead,
  selectIsMarkingAllAsRead,
  selectIsDeletingNotification,
} from '../../store/slices/notificationSlice';
import { Notification } from '../../types/api';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  
  // Redux state
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const isLoading = useAppSelector(selectNotificationLoading);
  const error = useAppSelector(selectNotificationError);
  const pagination = useAppSelector(selectNotificationPagination);
  const filters = useAppSelector(selectNotificationFilters);
  const isMarkingAsRead = useAppSelector(selectIsMarkingAsRead);
  const isMarkingAllAsRead = useAppSelector(selectIsMarkingAllAsRead);
  const isDeleting = useAppSelector(selectIsDeletingNotification);
  
  // Local state
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
  });

  // Load notifications on mount
  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 20 }));
    dispatch(fetchUnreadCount());
    registerForPushNotifications();
  }, [dispatch]);

  // Update filters when tab changes
  useEffect(() => {
    const filterParams = filter === 'all' ? {} : { isRead: filter === 'read' };
    dispatch(setFilters(filterParams));
    dispatch(fetchNotifications({ page: 1, limit: 20, ...filterParams }));
  }, [filter, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setDialogProps({
        title: 'Error',
        message: error,
        type: 'error',
      });
      setDialogVisible(true);
    }
  }, [error]);

  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      const platform = Platform.OS as 'ios' | 'android';
      
      await dispatch(registerPushToken({ token, platform }));
      console.log('Push token registered:', token);
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const filterParams = filter === 'all' ? {} : { isRead: filter === 'read' };
    await Promise.all([
      dispatch(fetchNotifications({ page: 1, limit: 20, ...filterParams })),
      dispatch(fetchUnreadCount()),
    ]);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isLoading && pagination.page < pagination.totalPages) {
      const filterParams = filter === 'all' ? {} : { isRead: filter === 'read' };
      dispatch(fetchNotifications({ 
        page: pagination.page + 1, 
        limit: 20, 
        ...filterParams 
      }));
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await dispatch(markAsRead(notification.id)).unwrap();
      } catch (error: any) {
        setDialogProps({
          title: 'Error',
          message: error.message || 'Failed to mark notification as read',
          type: 'error',
        });
        setDialogVisible(true);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      setDialogProps({
        title: 'No Unread Notifications',
        message: 'All notifications are already marked as read.',
        type: 'info',
      });
      setDialogVisible(true);
      return;
    }

    try {
      await dispatch(markAllAsRead()).unwrap();
      setDialogProps({
        title: 'Success',
        message: `Marked ${unreadCount} notifications as read.`,
        type: 'success',
      });
      setDialogVisible(true);
    } catch (error: any) {
      setDialogProps({
        title: 'Error',
        message: error.message || 'Failed to mark all notifications as read',
        type: 'error',
      });
      setDialogVisible(true);
    }
  };

  const handleDeleteNotification = (notification: Notification) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteNotification(notification.id)).unwrap();
              setDialogProps({
                title: 'Success',
                message: 'Notification deleted successfully.',
                type: 'success',
              });
              setDialogVisible(true);
            } catch (error: any) {
              setDialogProps({
                title: 'Error',
                message: error.message || 'Failed to delete notification',
                type: 'error',
              });
              setDialogVisible(true);
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ticket_reminder':
        return 'time-outline';
      case 'payment_confirmation':
        return 'checkmark-circle-outline';
      case 'dispute_update':
        return 'document-text-outline';
      case 'system_update':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'ticket_reminder':
        return theme === 'dark' ? '#F59E0B' : '#D97706';
      case 'payment_confirmation':
        return theme === 'dark' ? '#10B981' : '#16A34A';
      case 'dispute_update':
        return theme === 'dark' ? '#3B82F6' : '#2563EB';
      case 'system_update':
        return theme === 'dark' ? '#8B5CF6' : '#7C3AED';
      default:
        return theme === 'dark' ? '#9CA3AF' : '#6B7280';
    }
  };

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handleMarkAsRead(item)}
      onLongPress={() => handleDeleteNotification(item)}
      activeOpacity={0.7}
    >
      <ThemedCard 
        className={`mb-3 ${!item.isRead ? 'border-l-4 border-l-primary' : ''}`}
        variant={theme === 'dark' ? 'elevated' : 'default'}
      >
        <ThemedView className="flex-row items-start">
          <ThemedView 
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: getNotificationColor(item.type) + '20' }}
          >
            <Ionicons
              name={getNotificationIcon(item.type) as any}
              size={20}
              color={getNotificationColor(item.type)}
            />
          </ThemedView>
          
          <ThemedView className="flex-1">
            <ThemedView className="flex-row justify-between items-start mb-1">
              <ThemedText 
                weight={!item.isRead ? 'bold' : 'medium'} 
                size="sm"
                className="flex-1"
              >
                {item.title}
              </ThemedText>
              <ThemedText variant="tertiary" size="xs">
                {formatNotificationDate(item.createdAt)}
              </ThemedText>
            </ThemedView>
            
            <ThemedText 
              variant="secondary" 
              size="sm" 
              className="mb-2"
              numberOfLines={2}
            >
              {item.message}
            </ThemedText>
            
            {item.actionUrl && (
              <TouchableOpacity className="self-start">
                <ThemedText 
                  size="sm" 
                  style={{ color: theme === 'dark' ? '#FFA366' : '#E18743' }}
                >
                  View Details →
                </ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
          
          {!item.isRead && (
            <ThemedView 
              className="w-2 h-2 rounded-full ml-2 mt-1"
              style={{ backgroundColor: theme === 'dark' ? '#FFA366' : '#E18743' }}
            />
          )}
        </ThemedView>
      </ThemedCard>
    </TouchableOpacity>
  );

  return (
    <AppLayout scrollable={false}>
      <ThemedView className="flex-1 px-4">
        {/* Header */}
        <Header 
          screenTitle="Notifications" 
          rightComponent={
            unreadCount > 0 ? (
              <TouchableOpacity 
                onPress={handleMarkAllAsRead}
                disabled={isMarkingAllAsRead}
              >
                <ThemedText 
                  size="sm" 
                  style={{ color: theme === 'dark' ? '#FFA366' : '#E18743' }}
                >
                  {isMarkingAllAsRead ? 'Marking...' : 'Mark All Read'}
                </ThemedText>
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <ThemedCard className="mb-4">
            <ThemedView className="flex-row items-center justify-between">
              <ThemedView className="flex-row items-center">
                <ThemedView 
                  className="w-6 h-6 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: theme === 'dark' ? '#FFA366' : '#E18743' }}
                >
                  <ThemedText variant="inverse" size="xs" weight="bold">
                    {unreadCount > 99 ? '99+' : unreadCount.toString()}
                  </ThemedText>
                </ThemedView>
                <ThemedText weight="medium">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </ThemedText>
              </ThemedView>
              <TouchableOpacity 
                onPress={handleMarkAllAsRead}
                disabled={isMarkingAllAsRead}
              >
                <Ionicons
                  name="checkmark-done-outline"
                  size={24}
                  color={theme === 'dark' ? '#FFA366' : '#E18743'}
                />
              </TouchableOpacity>
            </ThemedView>
          </ThemedCard>
        )}

        {/* Filter Tabs */}
        <ThemedView className="flex-row justify-between items-center mb-4">
          <ThemedView className="flex-row">
            {['all', 'unread', 'read'].map((filterOption) => (
              <TouchableOpacity
                key={filterOption}
                onPress={() => setFilter(filterOption as any)}
                className={`px-4 py-2 mr-2 rounded-full ${
                  filter === filterOption ? 'bg-primary' : 'bg-background-secondary border border-border'
                }`}
              >
                <ThemedText
                  variant={filter === filterOption ? 'inverse' : 'secondary'}
                  size="sm"
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>

        {/* Notifications List */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor={theme === 'dark' ? '#FFA366' : '#E18743'}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <ThemedView className="py-8 items-center">
              {isLoading ? (
                <ThemedText variant="secondary" className="text-center">
                  Loading notifications...
                </ThemedText>
              ) : error ? (
                <ThemedView className="items-center">
                  <Ionicons
                    name="alert-circle-outline"
                    size={48}
                    color={theme === 'dark' ? '#EF4444' : '#DC2626'}
                  />
                  <ThemedText variant="secondary" className="text-center mt-2 mb-4">
                    {error}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={handleRefresh}
                    className="px-4 py-2 bg-primary rounded-lg"
                  >
                    <ThemedText variant="inverse" size="sm">
                      Try Again
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              ) : (
                <ThemedView className="items-center">
                  <Ionicons
                    name="notifications-outline"
                    size={48}
                    color={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  />
                  <ThemedText variant="secondary" className="text-center mt-2">
                    {filter === 'all' 
                      ? 'No notifications yet.' 
                      : filter === 'unread'
                      ? 'No unread notifications.'
                      : 'No read notifications.'
                    }
                  </ThemedText>
                  <ThemedText variant="tertiary" size="sm" className="text-center mt-1">
                    We'll notify you when important updates arrive.
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          }
        />
      </ThemedView>

      <Dialog
        visible={dialogVisible}
        title={dialogProps.title}
        message={dialogProps.message}
        type={dialogProps.type}
        onClose={() => {
          setDialogVisible(false);
          if (error) {
            dispatch(clearError());
          }
        }}
      />
    </AppLayout>
  );
}