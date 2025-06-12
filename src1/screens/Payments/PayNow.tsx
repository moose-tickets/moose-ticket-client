import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import AppLayout from '../../wrappers/layout';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTicketStackNavigation } from '../../navigation/hooks';
import { TicketStackParamList } from '../../navigation/types';
import GoBackHeader from '../../components/GoBackHeader';
import Payments from '../../components/Payments';
import { ThemedView, ThemedText, ThemedCard, ThemedInput, ThemedButton, ThemedScrollView } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';

export default function PayNow() {
  const navigation = useTicketStackNavigation();
  const { theme } = useTheme();
  const route = useRoute<RouteProp<TicketStackParamList, 'PayNow'>>();
  const ticketId = route.params.ticketId;

  const ticket = {
    plate: 'ABC1234',
    date: 'May 30, 2025 · Toronto',
    amount: 75.0,
  };

  const total = 75;
  const promoDiscount = 10;

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <GoBackHeader screenTitle='Pay Ticket' />

        {/* Ticket Summary */}
        <ThemedCard className='mx-4 mb-4'>
          <ThemedText size='sm' variant='tertiary'>Ticket #</ThemedText>
          <ThemedText weight='bold' size='base' className='mb-2'>
            12345678
          </ThemedText>
          <ThemedText size='sm' variant='tertiary' className='mb-1'>License Plate</ThemedText>
          <ThemedText size='base' weight='semibold' className='mb-2'>
            {ticket.plate}
          </ThemedText>
          <ThemedText size='sm' variant='tertiary' className='mb-1'>Date</ThemedText>
          <ThemedText size='sm'>{ticket.date}</ThemedText>
        </ThemedCard>

        {/* Payment Method */}
        <ThemedCard className='mx-4 mb-4'>
          <Payments/>
        </ThemedCard>

        <ThemedView className='mx-4 px-4 mb-4'>
          <TouchableOpacity onPress={() => navigation.navigate('PaymentMethods')}>
            <ThemedText
              size='sm'
              weight='medium'
              className='underline'
              style={{
                color: theme === 'dark' ? '#22C55E' : '#10472B'
              }}
              
            >
              Use a different payment method
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Promo and Billing */}
        <ThemedCard className='mx-4 mb-4'>
          <ThemedText weight='semibold' size='base' className='mb-3'>Billing Info</ThemedText>

          <ThemedText size='sm' variant='tertiary' className='mb-1'>Address</ThemedText>
          <ThemedInput
            placeholder='123 Street Name, Toronto, ON'
            className='mb-4'
            value=''
            onChangeText={() => ''}
          />

          <ThemedText size='sm' variant='tertiary' className='mb-1'>Promo Code</ThemedText>
          <ThemedInput
            placeholder='Optional'
            value=''
            onChangeText={() => ''}
          />
        </ThemedCard>

        {/* Total Summary */}
        <ThemedView className='mx-4 mb-4'>
          <ThemedView className='flex-row justify-between mb-1'>
            <ThemedText variant='tertiary'>Subtotal</ThemedText>
            <ThemedText>${total.toFixed(2)}</ThemedText>
          </ThemedView>
          <ThemedView className='flex-row justify-between mb-1'>
            <ThemedText variant='tertiary'>Promo Discount</ThemedText>
            <ThemedText style={{ color: theme === 'dark' ? '#10B981' : '#16A34A' }}>
              - ${promoDiscount.toFixed(2)}
            </ThemedText>
          </ThemedView>
          <ThemedView className='border-t border-border my-2' />
          <ThemedView className='flex-row justify-between mt-1'>
            <ThemedText weight='bold'>Total</ThemedText>
            <ThemedText weight='bold'>
              ${(total - promoDiscount).toFixed(2)}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Pay Button */}
        <ThemedView className='px-4'>
          <ThemedButton
            variant='primary'
            size='lg'
            className='mb-3'
            onPress={() => console.log('Payment processed')}
          >
            Pay $65.00
          </ThemedButton>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ThemedText 
              size='sm' 
              weight='medium' 
              className='text-center underline'
              style={{
                color: theme === 'dark' ? '#22C55E' : '#10472B'
              }}
            >
              Cancel Payment
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedScrollView>
    </AppLayout>
  );
}
