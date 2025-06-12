import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import {
  ThemedView,
  ThemedText,
  ThemedButton,
  ThemedCard,
  ThemedScrollView,
  StatusBadge,
} from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';

const billingData = [
  {
    id: 'INV001',
    date: 'June 1, 2025',
    plan: 'Premium Plan',
    amount: '$9.99',
    method: 'Visa •••• 1234',
    status: 'Paid',
    dateValue: new Date('2025-06-01'),
  },
  {
    id: 'INV002',
    date: 'May 1, 2025',
    plan: 'Basic Plan',
    amount: '$4.99',
    method: 'Visa •••• 1234',
    status: 'Paid',
    dateValue: new Date('2025-05-01'),
  },
  {
    id: 'INV003',
    date: 'April 1, 2025',
    plan: 'Premium Plan',
    amount: '$9.99',
    method: 'Visa •••• 1234',
    status: 'Refunded',
    dateValue: new Date('2025-04-01'),
  },
];

const dateRangeOptions = ['All', 'Last 30 Days', 'Last 3 Months'];

export default function BillingHistory() {
  const [filter, setFilter] = useState('All');
  const { theme } = useTheme();

  const now = new Date();

const filteredData = billingData.filter((item) => {
    if (filter === 'All') {
        return true;
    } else if (filter === 'Last 30 Days') {
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - 30);
        return item.dateValue >= cutoff;
    } else if (filter === 'Last 3 Months') {
        const cutoff = new Date();
        cutoff.setMonth(now.getMonth() - 3);
        return item.dateValue >= cutoff;
    }
    return false;
});

  return (
    <AppLayout scrollable={false}>
    <ThemedScrollView className="flex-1 px-5">
      {/* Header */}
      <GoBackHeader screenTitle='Billing History' />

      {/* Filters */}
      <ThemedView className="mb-6">
        {/* Date Range */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dateRangeOptions.map((range) => (
            <ThemedButton
              key={range}
              variant={filter === range ? 'primary' : 'outline'}
              size='sm'
              onPress={() => setFilter(range)}
              className='mr-2 rounded-full'
            >
              <ThemedText
                size='sm'
                variant={filter === range ? 'inverse' : 'primary'}
              >
                {range}
              </ThemedText>
            </ThemedButton>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Billing Items */}
      {filteredData.length > 0 ? (
        filteredData.map((item) => (
          <ThemedCard
            key={item.id}
            className="mb-4"
          >
            <ThemedView className="flex-row justify-between items-center mb-1">
              <ThemedText size='base' weight='semibold' variant='primary'>{item.date}</ThemedText>
              <StatusBadge 
                status={item.status === 'Paid' ? 'success' : item.status === 'Refunded' ? 'warning' : 'info'}
                label={item.status}
                size='sm'
              />
            </ThemedView>
            <ThemedText variant='secondary'>{item.plan}</ThemedText>
            <ThemedText variant='secondary' className='mt-1'>Amount: {item.amount}</ThemedText>
            <ThemedText variant='secondary'>Paid with: {item.method}</ThemedText>
            {/* <TouchableOpacity className="mt-2 items-end">
              <ThemedText className="text-primary underline" size='sm'>Download Receipt</ThemedText>
            </TouchableOpacity> */}
          </ThemedCard>
        ))
      ) : (
        <ThemedView className="mt-20 items-center">
          <ThemedText variant='tertiary' size='lg'>No billing records found.</ThemedText>
        </ThemedView>
      )}
    </ThemedScrollView>
    </AppLayout>
  );
}
