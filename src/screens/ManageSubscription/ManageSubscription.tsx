import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import { useSettingsStackNavigation } from '../../navigation/hooks';
import { ThemedView, ThemedText, ThemedCard, ThemedButton, ThemedScrollView } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';

export default function ManageSubscription() {
  const navigation = useSettingsStackNavigation();
  const { theme } = useTheme();
  const [showCancelModal, setShowCancelModal] = useState(false);

  return (
    <AppLayout scrollable={false}>
      {/* Header */}
      <GoBackHeader
        screenTitle='Manage Subscription'
      />
      <ThemedScrollView className='flex-1 p-5'>
        <ThemedCard className='mb-6'>
          <ThemedView className='flex-row justify-between items-center mb-2'>
            <ThemedText weight='bold' size='lg'>Premium Plan</ThemedText>
            <ThemedText weight='semibold' style={{ color: theme === 'dark' ? '#10B981' : '#10B981' }}>$9.99/month</ThemedText>
          </ThemedView>
          <ThemedText variant='tertiary' className='mb-3'>Renews on Jun 01, 2025</ThemedText>
          <ThemedText>✓ Unlimited project access</ThemedText>
          <ThemedText>✓ Priority support</ThemedText>
          <ThemedText>✓ Advanced analytics</ThemedText>
          <ThemedText>✓ Custom exports</ThemedText>
        </ThemedCard>

        <ThemedButton
          variant='primary'
          size='lg'
          className='mb-4'
          onPress={() => navigation.navigate('SubscriptionPlans')}
        >
          Change Plan
        </ThemedButton>

        <TouchableOpacity onPress={() => navigation.navigate('BillingHistory')}>
          <ThemedText 
            size='base' 
            className='underline text-center mb-6'
            style={{
              color: theme === 'dark' ? '#22C55E' : '#10472B'
            }}
          >
            View Billing History
          </ThemedText>
        </TouchableOpacity>

        <ThemedText weight='semibold' size='lg' className='mb-2'>Cancel Subscription</ThemedText>
        <ThemedText variant='secondary' className='mb-4'>
          You will lose access to premium features after current billing period
          ends.
        </ThemedText>

        <TouchableOpacity
          className='border border-error py-3 rounded-xl items-center mb-4'
          onPress={() => setShowCancelModal(true)}
        >
          <ThemedText weight='semibold' style={{ color: theme === 'dark' ? '#EF4444' : '#EF4444' }}>
            Cancel Subscription
          </ThemedText>
        </TouchableOpacity>

        <ThemedButton
          variant='primary'
          size='lg'
          onPress={() => console.log('Reactivate subscription')}
        >
          Reactivate Subscription
        </ThemedButton>
      </ThemedScrollView>

      {/* Cancel Modal */}
      <Modal visible={showCancelModal} transparent animationType='fade'>
        <ThemedView className='flex-1 justify-center items-center px-6' style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <ThemedCard className='w-full'>
            <ThemedText size='xl' weight='semibold' className='mb-3 text-center' style={{ color: '#EF4444' }}>
              Cancel Subscription?
            </ThemedText>
            <ThemedText variant='secondary' className='text-center mb-6'>
              Are you sure you want to cancel?{'\n'}You'll keep benefits until
              Jun 01, 2025.
            </ThemedText>

            <TouchableOpacity
              className='bg-error py-3 rounded-xl items-center mb-3'
              onPress={() => setShowCancelModal(false)}
            >
              <ThemedText variant='inverse' weight='semibold'>Yes, Cancel</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowCancelModal(false)}
              className='py-3 items-center'
            >
              <ThemedText 
                weight='semibold'
                style={{
                  color: theme === 'dark' ? '#22C55E' : '#10472B'
                }}
              >
                No, Keep Plan
              </ThemedText>
            </TouchableOpacity>
          </ThemedCard>
        </ThemedView>
      </Modal>
    </AppLayout>
  );
}
