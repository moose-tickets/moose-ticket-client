// src/screens/Tickets/TicketListScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTicketStackNavigation } from '../../navigation/hooks';
import { useTheme } from '../../wrappers/ThemeProvider';

import AppLayout from '../../wrappers/layout';
import Header from '../../components/Header';
import {
  Ticket,
  allTickets,
} from '../../../dummyDb/ticketresponse';
import TicketFilter from './TicketFilter';
import { ThemedView, ThemedText, ThemedCard, StatusBadge } from '../../components/ThemedComponents';

const STATUS_MAPPING: Record<string, 'success' | 'error' | 'warning'> = {
  Paid: 'success',
  Outstanding: 'error',
  Disputed: 'warning',
};

export default function TicketListScreen() {
  const navigation = useTicketStackNavigation();
  const { theme } = useTheme();
  const [tab, setTab] = useState<'All' | 'Paid' | 'Outstanding' | 'Disputed'>(
    'All'
  );
  // const [allTickets] = useState<Ticket[]>(() => generateRandomTickets(20));
  const [filtered, setFiltered] = useState<Ticket[]>(allTickets);

  const [isFilterVisible, setFilterVisible] = useState(false);

  useEffect(() => {
    if (tab === 'All') {
      setFiltered(allTickets);
    } else {
      setFiltered(allTickets.filter((t) => t.status === tab));
    }
  }, [tab, allTickets]);

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
          data={filtered}
          keyExtractor={(item) => item.ticket_id}
          showsVerticalScrollIndicator={false}
          className='bg-background'
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('TicketDetail', { ticketId: item.ticket_id })
              }
            >
              <ThemedCard className='mb-3' variant={theme === 'dark' ? 'elevated': 'default'}>
                {/* Plate & Amount */}
                <ThemedView className='flex-row justify-between items-center mb-1'>
                  <ThemedText weight='bold'>
                    {item.vehicle.plate}
                  </ThemedText>
                  <ThemedText size='base'>
                    {item.fine.currency} {item.fine.amount.toFixed(2)}
                  </ThemedText>
                </ThemedView>

                {/* Date, Status */}
                <ThemedView className='flex-row justify-between items-center mb-2'>
                  <ThemedText variant='secondary' size='sm'>
                    {new Date(item.issue_date).toLocaleDateString('en-CA', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    · {item.location.street}
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
                    name={item.infraction.icon as any}
                    size={20}
                    color={theme === 'dark' ? '#FFA366' : '#E18743'}
                    style={{ marginRight: 8 }}
                  />
                  <ThemedText>{item.infraction.type}</ThemedText>
                </ThemedView>
              </ThemedCard>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <ThemedView className='py-8'>
              <ThemedText variant='secondary' className='text-center'>
                No tickets found.
              </ThemedText>
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
