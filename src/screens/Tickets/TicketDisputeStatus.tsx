import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../../wrappers/layout';
import Dialog from '../../components/Dialog';
import GoBackHeader from '../../components/GoBackHeader';
import {
  ThemedButton,
  ThemedScrollView,
  ThemedText,
  ThemedView,
} from '../../components/ThemedComponents';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTicketStackNavigation } from '../../navigation/hooks';
import { TicketStackParamList } from '../../navigation/types';
import { useTheme } from '../../wrappers/ThemeProvider';

export default function DisputeStatus() {
  const navigation = useTicketStackNavigation();
  const { theme } = useTheme();
  const [dialogVisible, setDialogVisible] = useState(false);
  const route =
    useRoute<RouteProp<TicketStackParamList, 'TicketDisputeStatus'>>();
  const ticketId = route.params.ticketId;

  const [dialogProps, setDialogProps] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
  });

  const handleCancelDispute = () => {
    setDialogProps({
      title: 'Dispute Cancellation Request Sent',
      message:
        'Your request to cancel the dispute has been submitted. We will notify you once the cancellation is processed.',
      type: 'success',
    });
    setDialogVisible(true);
  };

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5 '>
        {/* Header */}
        <GoBackHeader screenTitle='Dispute Status' />
        {/* Ticket Info */}
        <View className='border border-gray-300 rounded-xl p-4 mb-4'>
          <Text className='font-semibold'>Ticket #: 123 456 789</Text>
          <Text className='text-gray-500'>Dispute Submitted: May 31, 2025</Text>
          <Text className='text-[#E08631] mt-1 font-medium'>
            Current Status: Pending Review
          </Text>
        </View>

        {/* Status Progress */}
        <View className='mb-6'>
          <View className='flex-row items-center mb-3'>
            <View className='w-3 h-3 rounded-full bg-[#E08631] mr-2' />
            <View>
              <Text className='text-sm font-medium'>Submitted</Text>
              <Text className='text-xs text-gray-500'>
                May 31, 2025 · 14:45
              </Text>
            </View>
          </View>

          <View className='flex-row items-center mb-3'>
            <View className='w-3 h-3 rounded-full border-2 border-[#014421] bg-white mr-2' />
            <View>
              <Text className='text-sm font-medium'>In Review</Text>
              <Text className='text-xs text-gray-500'>
                Expected decision by Jun 7, 2025
              </Text>
            </View>
          </View>

          <View className='flex-row items-center mb-3'>
            <View className='w-3 h-3 rounded-full border border-gray-400 bg-white mr-2' />
            <Text className='text-sm text-gray-500'>Resolved</Text>
          </View>
        </View>

        {/* Notes */}
        <Text className='text-base font-semibold mb-1'>Notes from City</Text>
        <Text className='text-gray-600 mb-6'>
          Your evidence is under review. We may contact you for additional
          details if necessary.
        </Text>

        {/* Contact / Cancel */}
        <ThemedView className='px-4'>
          <ThemedButton
            variant='primary'
            size='md'
            className='mb-3'
            onPress={() => console.log('Payment Contacting Support')}
          >
            Contact Support
          </ThemedButton>
          <ThemedButton
            variant='primary'
            size='md'
            className='mb-3'
            onPress={handleCancelDispute}
          >
            Cancel Dispute
          </ThemedButton>
        </ThemedView>

        <ThemedText variant='tertiary'  size='sm' className='text-center mb-8'>
          You'll be notified by email once a decision is made.
        </ThemedText>
      </ThemedScrollView>
      <Dialog
        visible={dialogVisible}
        title={dialogProps.title}
        message={dialogProps.message}
        type={dialogProps.type}
        onClose={() => {
          setDialogVisible(false);

          navigation.goBack();
        }}
      />
    </AppLayout>
  );
}
