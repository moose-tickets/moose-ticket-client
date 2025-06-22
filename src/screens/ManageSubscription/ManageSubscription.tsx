import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import { useSettingsStackNavigation } from '../../navigation/hooks';
import { ThemedView, ThemedText, ThemedCard, ThemedButton, ThemedScrollView } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  fetchCurrentSubscription, 
  cancelSubscription, 
  reactivateSubscription,
  fetchUsageQuota 
} from '../../store/slices/subscriptionSlice';
import { useTranslation } from 'react-i18next';

export default function ManageSubscription() {
  const navigation = useSettingsStackNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Redux state
  const currentSubscription = useAppSelector(state => state.subscriptions.currentSubscription);
  const usageQuota = useAppSelector(state => state.subscriptions.usageQuota);
  const loading = useAppSelector(state => state.subscriptions.loading);
  const error = useAppSelector(state => state.subscriptions.error);

  // Fetch subscription data on mount
  useEffect(() => {
    dispatch(fetchCurrentSubscription());
    dispatch(fetchUsageQuota());
  }, [dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), error);
    }
  }, [error]);

  const handleCancelSubscription = async () => {
    try {
      await dispatch(cancelSubscription({ cancelAtPeriodEnd: true })).unwrap();
      setShowCancelModal(false);
      Alert.alert(t('common.success'), t('subscription.subscriptionCancelledSuccess'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('subscription.cancelSubscriptionFailed'));
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      await dispatch(reactivateSubscription()).unwrap();
      Alert.alert(t('common.success'), t('subscription.subscriptionReactivatedSuccess'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('subscription.reactivateSubscriptionFailed'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100); // Assuming amount is in cents
  };

  if (loading.subscription && !currentSubscription) {
    return (
      <AppLayout scrollable={false}>
        <GoBackHeader screenTitle={t('subscription.manageSubscription')} />
        <ThemedView className='flex-1 justify-center items-center'>
          <ThemedText>{t('subscription.loadingSubscription')}</ThemedText>
        </ThemedView>
      </AppLayout>
    );
  }

  if (!currentSubscription) {
    return (
      <AppLayout scrollable={false}>
        <GoBackHeader screenTitle={t('subscription.manageSubscription')} />
        <ThemedView className='flex-1 justify-center items-center px-4'>
          <ThemedText size='lg' weight='semibold' className='mb-4 text-center'>
            {t('subscription.noActiveSubscription')}
          </ThemedText>
          <ThemedText variant='secondary' className='text-center mb-6'>
            {t('subscription.subscribeToUnlock')}
          </ThemedText>
          <ThemedButton
            variant='primary'
            size='lg'
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            {t('subscription.viewPlans')}
          </ThemedButton>
        </ThemedView>
      </AppLayout>
    );
  }

  return (
    <AppLayout scrollable={false}>
      {/* Header */}
      <GoBackHeader
        screenTitle={t('subscription.manageSubscription')}
      />
      <ThemedScrollView className='flex-1 p-5'>
        {/* Current Subscription Card */}
        <ThemedCard className='mb-6'>
          <ThemedView className='flex-row justify-between items-center mb-2'>
            <ThemedText weight='bold' size='lg'>{currentSubscription.plan.name}</ThemedText>
            <ThemedText weight='semibold' style={{ color: theme === 'dark' ? '#10B981' : '#10B981' }}>
              {formatPrice(currentSubscription.billing.amount, currentSubscription.billing.currency)}/{currentSubscription.billingCycle === 'monthly' ? t('subscription.month') : t('subscription.year')}
            </ThemedText>
          </ThemedView>
          <ThemedView className='flex-row justify-between items-center mb-3'>
            <ThemedText variant='tertiary'>
              {currentSubscription.cancelAtPeriodEnd 
                ? `${t('subscription.expiresOn')} ${formatDate(currentSubscription.currentPeriodEnd)}`
                : `${t('subscription.renewsOn')} ${formatDate(currentSubscription.currentPeriodEnd)}`
              }
            </ThemedText>
            <ThemedText 
              size='sm' 
              weight='medium'
              style={{ 
                color: currentSubscription.status === 'active' ? '#10B981' : 
                       currentSubscription.status === 'cancelled' ? '#EF4444' : '#F59E0B'
              }}
            >
              {currentSubscription.status.toUpperCase()}
            </ThemedText>
          </ThemedView>
          {currentSubscription.plan.features.map((feature, index) => (
            <ThemedText key={index}>✓ {feature}</ThemedText>
          ))}
          
          {/* Usage Quota */}
          {usageQuota && (
            <ThemedView className='mt-4 pt-4 border-t border-gray-200'>
              <ThemedText weight='semibold' className='mb-2'>{t('subscription.usageThisPeriod')}</ThemedText>
              <ThemedView className='space-y-1'>
                <ThemedView className='flex-row justify-between'>
                  <ThemedText size='sm'>{t('subscription.tickets')}</ThemedText>
                  <ThemedText size='sm'>{usageQuota.tickets.used}/{usageQuota.tickets.limit === -1 ? t('subscription.unlimited') : usageQuota.tickets.limit}</ThemedText>
                </ThemedView>
                <ThemedView className='flex-row justify-between'>
                  <ThemedText size='sm'>{t('subscription.vehicles')}</ThemedText>
                  <ThemedText size='sm'>{usageQuota.vehicles.used}/{usageQuota.vehicles.limit === -1 ? t('subscription.unlimited') : usageQuota.vehicles.limit}</ThemedText>
                </ThemedView>
                <ThemedView className='flex-row justify-between'>
                  <ThemedText size='sm'>{t('subscription.disputes')}</ThemedText>
                  <ThemedText size='sm'>{usageQuota.disputes.used}/{usageQuota.disputes.limit === -1 ? t('subscription.unlimited') : usageQuota.disputes.limit}</ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          )}
        </ThemedCard>

        <ThemedButton
          variant='primary'
          size='lg'
          className='mb-4'
          onPress={() => navigation.navigate('SubscriptionPlans')}
        >
          {t('subscription.changePlan')}
        </ThemedButton>

        <TouchableOpacity onPress={() => navigation.navigate('BillingHistory')}>
          <ThemedText 
            size='base' 
            className='underline text-center mb-6'
            style={{
              color: theme === 'dark' ? '#22C55E' : '#10472B'
            }}
          >
            {t('subscription.viewBillingHistory')}
          </ThemedText>
        </TouchableOpacity>

        {/* Subscription Actions */}
        {currentSubscription.status === 'active' && !currentSubscription.cancelAtPeriodEnd && (
          <>
            <ThemedText weight='semibold' size='lg' className='mb-2'>{t('subscription.cancelSubscription')}</ThemedText>
            <ThemedText variant='secondary' className='mb-4'>
              {t('subscription.loseAccessAfterPeriod')}
            </ThemedText>
            <TouchableOpacity
              className='border border-error py-3 rounded-xl items-center mb-4'
              onPress={() => setShowCancelModal(true)}
              disabled={loading.cancel}
            >
              <ThemedText weight='semibold' style={{ color: theme === 'dark' ? '#EF4444' : '#EF4444' }}>
                {loading.cancel ? t('subscription.cancelling') : t('subscription.cancelSubscription')}
              </ThemedText>
            </TouchableOpacity>
          </>
        )}

        {(currentSubscription.cancelAtPeriodEnd || currentSubscription.status === 'cancelled') && (
          <ThemedButton
            variant='primary'
            size='lg'
            onPress={handleReactivateSubscription}
            disabled={loading.update}
          >
            {loading.update ? t('subscription.reactivating') : t('subscription.reactivateSubscription')}
          </ThemedButton>
        )}
      </ThemedScrollView>

      {/* Cancel Modal */}
      <Modal visible={showCancelModal} transparent animationType='fade'>
        <ThemedView className='flex-1 justify-center items-center px-6' style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <ThemedCard className='w-full'>
            <ThemedText size='xl' weight='semibold' className='mb-3 text-center' style={{ color: '#EF4444' }}>
              {t('subscription.cancelSubscriptionConfirm')}
            </ThemedText>
            <ThemedText variant='secondary' className='text-center mb-6'>
              {t('subscription.cancelConfirmMessage')}{'\n'}{formatDate(currentSubscription.currentPeriodEnd)}.
            </ThemedText>

            <TouchableOpacity
              className='bg-error py-3 rounded-xl items-center mb-3'
              onPress={handleCancelSubscription}
              disabled={loading.cancel}
            >
              <ThemedText variant='inverse' weight='semibold'>
                {loading.cancel ? t('subscription.cancelling') : t('subscription.yesCancelSubscription')}
              </ThemedText>
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
                {t('subscription.noKeepPlan')}
              </ThemedText>
            </TouchableOpacity>
          </ThemedCard>
        </ThemedView>
      </Modal>
    </AppLayout>
  );
}
