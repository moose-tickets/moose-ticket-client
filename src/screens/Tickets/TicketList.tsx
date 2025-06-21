// src/screens/Tickets/TicketListScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTicketStackNavigation } from '../../navigation/hooks';
import { useTheme } from '../../wrappers/ThemeProvider';

import AppLayout from '../../wrappers/layout';
import Header from '../../components/Header';
import TicketFilter from './TicketFilter';
import { ThemedView, ThemedText, ThemedCard, ThemedButton, StatusBadge } from '../../components/ThemedComponents';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchTickets,
  setFilters,
  clearFilters,
  clearError,
  selectTickets,
  selectTicketFilters,
  selectTicketLoading,
  selectTicketLoadingMore,
  selectTicketError,
  selectTicketPagination,
} from '../../store/slices/ticketSlice';

const STATUS_MAPPING: Record<string, 'success' | 'error' | 'warning'> = {
  paid: 'success',
  outstanding: 'error',
  disputed: 'warning',
};

export default function TicketListScreen() {
  const navigation = useTicketStackNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  
  // Redux state
  const tickets = useAppSelector(selectTickets);
  const filters = useAppSelector(selectTicketFilters);
  const isLoading = useAppSelector(selectTicketLoading);
  const isLoadingMore = useAppSelector(selectTicketLoadingMore);
  const error = useAppSelector(selectTicketError);
  const pagination = useAppSelector(selectTicketPagination);
  
  // Local state
  // 'pending' | 'paid' | 'disputed' | 'cancelled' | 'overdue';
  const [tab, setTab] = useState<'All' | 'Paid' | 'Outstanding' | 'Disputed'>('All');
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load tickets
  useEffect(() => {
    dispatch(fetchTickets({ page: 1, limit: 20 }));
  }, [dispatch]);

  // Update filters when tab changes
  useEffect(() => {
    if (tab === 'All') {
      dispatch(clearFilters());
    } else {
      dispatch(setFilters({ status: tab.toLocaleLowerCase() as any }));
    }
    dispatch(fetchTickets({ page: 1, limit: 20, status: tab === 'All' ? undefined : tab.toLocaleLowerCase() as any }));
  }, [tab, dispatch]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchTickets({ 
      page: 1, 
      limit: 20, 
      status: tab === 'All' ? undefined : tab.toLocaleLowerCase() as any 
    }));
    setRefreshing(false);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && (pagination.hasNextPage || pagination.page < pagination.totalPages)) {
      dispatch(fetchTickets({ 
        page: pagination.page + 1, 
        limit: 20, 
        status: tab === 'All' ? undefined : tab as any 
      }));
    }
  };

  console.log('Tickets:', tickets.length);

  // Render loading footer
  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <ThemedView className='py-4 items-center'>
        <ThemedText variant='secondary' size='sm'>
          Loading more tickets...
        </ThemedText>
      </ThemedView>
    );
  };

  return (
    <AppLayout scrollable={false}>
      <ThemedView className='flex-1 px-4'>
        {/* Header */}
        <Header screenTitle='My Tickets' />

        {/* Filter Tabs */}
        <ThemedView className='flex-row justify-between items-center mb-4'>
          <ThemedView className='flex-row'>
            {['All', 'Outstanding', 'Disputed', 'Paid'].map((label) => (
              <TouchableOpacity
                key={label}
                onPress={() => setTab(label as any)}
                className={`px-4 py-2 mr-2 rounded-full ${
                  tab === label ? 'bg-primary' : 'bg-background-secondary border border-border'
                }`}
              >
                <ThemedText
                  variant={tab === label ? 'inverse' : 'secondary'}
                  size='sm'
                >
                  {label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
          <TouchableOpacity onPress={() => setFilterVisible(true)}>
            <Ionicons name='filter' size={20} color={theme === 'dark' ? '#FFFFFF' : '#10472B'} />
          </TouchableOpacity>
        </ThemedView>
        {/* <TicketFilter
          visible={isFilterVisible}
          onClose={() => setFilterVisible(false)}
        /> */}

        {/* Ticket List */}
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          className='bg-background'
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor={theme === 'dark' ? '#FFA366' : '#10472B'}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('TicketDetail', { ticketId: item._id })
              }
            >
              <ThemedCard className='mb-3' variant={theme === 'dark' ? 'elevated': 'default'}>
                {/* Plate & Amount */}
                <ThemedView className='flex-row justify-between items-center mb-1'>
                  <ThemedText weight='bold'>
                    {item.vehicle.licensePlate}
                  </ThemedText>
                  <ThemedText size='base'>
                    {item.fine?.currency || '$'} {(item.fine?.amount || item.amount || 0).toFixed(2)}
                  </ThemedText>
                </ThemedView>

                {/* Date, Status */}
                <ThemedView className='flex-row justify-between items-center mb-2'>
                  <ThemedText variant='secondary' size='sm'>
                    {new Date(item.issueDate || item.createdAt).toLocaleDateString('en-CA', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    · {item.location?.address?.street1 || item.location?.street || 'Location'}
                  </ThemedText>
                  <StatusBadge
                    status={STATUS_MAPPING[item.status] ?? 'info'}
                    label={item.status}
                    size='sm'
                  />
                </ThemedView>

                {/* Infraction Icon & Label */}
                <ThemedView className='flex-row items-center'>
                  <MaterialCommunityIcons
                    name={(item.infractionType?.icon as any) || 'alert-circle-outline'}
                    size={20}
                    color={theme === 'dark' ? '#FFA366' : '#E18743'}
                    style={{ marginRight: 8 }}
                  />
                  <ThemedText>{item.infractionType?.type || item.violationType || 'Traffic Violation'}</ThemedText>
                </ThemedView>
              </ThemedCard>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <ThemedView className='py-8'>
              {isLoading ? (
                <ThemedText variant='secondary' className='text-center'>
                  Loading tickets...
                </ThemedText>
              ) : error ? (
                <ThemedView className='items-center'>
                  <Ionicons
                    name='alert-circle-outline'
                    size={48}
                    color={theme === 'dark' ? '#EF4444' : '#DC2626'}
                  />
                  <ThemedText variant='secondary' className='text-center mt-2'>
                    {error}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={handleRefresh}
                    className='mt-4 px-4 py-2 bg-primary rounded-lg'
                  >
                    <ThemedText variant='inverse' size='sm'>
                      Try Again
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              ) : (
                <ThemedView className='items-center'>
                  <Ionicons
                    name='document-outline'
                    size={48}
                    color={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  />
                  <ThemedText variant='secondary' className='text-center mt-2'>
                    {tab === 'All' ? 'No tickets found.' : `No ${tab.toLowerCase()} tickets found.`}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('AddTicket')}
                    className='mt-4 px-4 py-2 bg-primary rounded-lg'
                  >
                    <ThemedText variant='inverse' size='sm'>
                      Add First Ticket
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              )}
            </ThemedView>
          }
        />

        {/* Floating Add Button */}
        <TouchableOpacity
          className='absolute bottom-10 right-6 bg-primary p-4 rounded-full shadow-theme'
          onPress={() => navigation.navigate('AddTicket')}
        >
          <Ionicons name='add' size={24} color='white' />
        </TouchableOpacity>
      </ThemedView>
    </AppLayout>
  );
}
