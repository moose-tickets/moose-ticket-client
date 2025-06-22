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
import { useTranslation } from 'react-i18next';

export default function DisputeStatus() {
  const navigation = useTicketStackNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
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
      title: t('dispute.cancellationRequestSent'),
      message: t('dispute.cancellationRequestMessage'),
      type: 'success',
    });
    setDialogVisible(true);
  };

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5 '>
        {/* Header */}
        <GoBackHeader screenTitle={t('dispute.disputeStatus')} />
        {/* Ticket Info */}
        <View className='border border-gray-300 rounded-xl p-4 mb-4'>
          <Text className='font-semibold'>{t('tickets.ticketNumber')}: 123 456 789</Text>
          <Text className='text-gray-500'>{t('dispute.disputeSubmittedDate')}: May 31, 2025</Text>
          <Text className='text-[#E08631] mt-1 font-medium'>
            {t('dispute.currentStatus')}: {t('dispute.pendingReview')}
          </Text>
        </View>

        {/* Status Progress */}
        <View className='mb-6'>
          <View className='flex-row items-center mb-3'>
            <View className='w-3 h-3 rounded-full bg-[#E08631] mr-2' />
            <View>
              <Text className='text-sm font-medium'>{t('dispute.submitted')}</Text>
              <Text className='text-xs text-gray-500'>
                May 31, 2025 · 14:45
              </Text>
            </View>
          </View>

          <View className='flex-row items-center mb-3'>
            <View className='w-3 h-3 rounded-full border-2 border-[#014421] bg-white mr-2' />
            <View>
              <Text className='text-sm font-medium'>{t('dispute.inReview')}</Text>
              <Text className='text-xs text-gray-500'>
                {t('dispute.expectedDecisionBy')} Jun 7, 2025
              </Text>
            </View>
          </View>

          <View className='flex-row items-center mb-3'>
            <View className='w-3 h-3 rounded-full border border-gray-400 bg-white mr-2' />
            <Text className='text-sm text-gray-500'>{t('dispute.resolved')}</Text>
          </View>
        </View>

        {/* Notes */}
        <Text className='text-base font-semibold mb-1'>{t('dispute.notesFromCity')}</Text>
        <Text className='text-gray-600 mb-6'>
          {t('dispute.evidenceUnderReview')}
        </Text>

        {/* Contact / Cancel */}
        <ThemedView className='px-4'>
          <ThemedButton
            variant='primary'
            size='md'
            className='mb-3'
            onPress={() => console.log('Payment Contacting Support')}
          >
{t('support.contactSupport')}
          </ThemedButton>
          <ThemedButton
            variant='primary'
            size='md'
            className='mb-3'
            onPress={handleCancelDispute}
          >
{t('dispute.cancelDispute')}
          </ThemedButton>
        </ThemedView>

        <ThemedText variant='tertiary'  size='sm' className='text-center mb-8'>
          {t('dispute.emailNotificationDecision')}
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
