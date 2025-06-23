import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import { useSettingsStackNavigation } from '../../navigation/hooks';
import {
  ThemedView,
  ThemedText,
  ThemedCard,
  ThemedButton,
  ThemedScrollView,
} from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchCurrentSubscription,
  cancelSubscription,
  reactivateSubscription,
  fetchUsageQuota,
} from '../../store/slices/subscriptionSlice';
import { useTranslation } from 'react-i18next';
import { current } from '@reduxjs/toolkit';
import i18n from '../../locales';

export default function ManageSubscription() {
  const navigation = useSettingsStackNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const currentLanguage = i18n.language as 'en' | 'fr' | 'ar' | 'es';
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Redux state
  const currentSubscription = useAppSelector(
    (state) => state.subscriptions.currentSubscription
  );
  const loading = useAppSelector((state) => state.subscriptions.loading);
  const error = useAppSelector((state) => state.subscriptions.error);

  // Helper function to get localized text
  const getLocalizedText = (textObj: {
    en: string;
    fr: string;
    ar: string;
    es?: string;
  }) => {
    return textObj[currentLanguage] || textObj.en;
  };

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
    if (!currentSubscription?._id) {
      Alert.alert(t('common.error'), 'No subscription found');
      return;
    }

    try {
      await dispatch(
        cancelSubscription({
          subscriptionId: currentSubscription._id,
          cancelAtPeriodEnd: true,
        })
      ).unwrap();
      setShowCancelModal(false);
      Alert.alert(
        t('common.success'),
        t('subscription.subscriptionCancelledSuccess')
      );
    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        error.message || t('subscription.cancelSubscriptionFailed')
      );
    }
  };

  const handleReactivateSubscription = async () => {
    if (!currentSubscription?._id) {
      Alert.alert(t('common.error'), 'No subscription found');
      return;
    }

    try {
      await dispatch(reactivateSubscription(currentSubscription._id)).unwrap();
      Alert.alert(
        t('common.success'),
        t('subscription.subscriptionReactivatedSuccess')
      );
    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        error.message || t('subscription.reactivateSubscriptionFailed')
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100); // Assuming amount is in cents
  };
  
  
  console.log('♦️ Current Subscription:', currentSubscription);
  console.log('♦️ Subscription Plan:', currentSubscription?.plan);
  console.log('♦️ Plan Name:', currentSubscription?.plan?.name);
  console.log('♦️ Subscription Billing:', currentSubscription?.billing);
  console.log('♦️ Price at Subscription:', currentSubscription?.priceAtSubscription);
  console.log('♦️ Subscription currentPeriodEnd:', currentSubscription?.currentPeriodEnd);
  console.log('♦️ Subscription Status:', currentSubscription?.status);
  console.log('♦️ Billing Cycle:', currentSubscription?.billingCycle);
  console.log('♦️ Auto Renew:', currentSubscription?.autoRenew);
  console.log('♦️ Cancel at Period End:', currentSubscription?.cancelAtPeriodEnd);

  return (
    <AppLayout scrollable={false}>
      {/* Header */}
      <GoBackHeader screenTitle={t('subscription.manageSubscription')} />

      {loading.subscription && !currentSubscription && (
        <ThemedView className='flex-1 justify-center items-center'>
          <ThemedText>{t('subscription.loadingSubscription')}</ThemedText>
        </ThemedView>
      )}

      {currentSubscription && currentSubscription.plan ? (
        <ThemedScrollView className='flex-1 p-5 '>
          {/* Current Subscription Card */}
          <ThemedCard className='mb-6'>
            <ThemedView className='flex-row justify-between items-center mb-2'>
              <ThemedText weight='bold' size='lg'>
                {currentSubscription.plan?.name && typeof currentSubscription.plan.name === 'object' 
                  ? getLocalizedText(currentSubscription.plan.name)
                  : currentSubscription.plan?.name || 'Subscription Plan'}
              </ThemedText>
              <ThemedText
                weight='semibold'
                style={{ color: theme === 'dark' ? '#10B981' : '#10B981' }}
              >
                {currentSubscription.billing?.amount ? 
                  formatPrice(
                    currentSubscription.billing.amount,
                    currentSubscription.billing.currency || 'USD'
                  ) : 
                  currentSubscription.priceAtSubscription ? 
                    formatPrice(currentSubscription.priceAtSubscription, 'USD') :
                    currentSubscription.plan?.price?.monthly ?
                      formatPrice(currentSubscription.plan.price.monthly, currentSubscription.plan.price.currency || 'USD') :
                      'N/A'
                }
                /
                {(currentSubscription.billingCycle === 'monthly' || currentSubscription.billingCycle === 'annually')
                  ? (currentSubscription.billingCycle === 'monthly' ? t('subscription.month') : t('subscription.year'))
                  : 'month'}
              </ThemedText>
            </ThemedView>
            <ThemedView className='flex-row justify-between items-center mb-3'>
              <ThemedText variant='tertiary'>
                {currentSubscription.currentPeriodEnd ? (
                  (currentSubscription.cancelAtPeriodEnd || !currentSubscription.autoRenew)
                    ? `${t('subscription.expiresOn')} ${formatDate(currentSubscription.currentPeriodEnd)}`
                    : `${t('subscription.renewsOn')} ${formatDate(currentSubscription.currentPeriodEnd)}`
                ) : 'Period information not available'}
              </ThemedText>
              <ThemedText
                size='sm'
                weight='medium'
                style={{
                  color:
                    currentSubscription.status === 'active'
                      ? '#10B981'
                      : currentSubscription.status === 'cancelled'
                      ? '#EF4444'
                      : '#F59E0B',
                }}
              >
                {(currentSubscription.status || 'unknown').toUpperCase()}
              </ThemedText>
            </ThemedView>
            {currentSubscription.plan?.features?.map((feature, index) => (
              <ThemedText key={index}>
                ✓ {typeof feature === 'object' ? getLocalizedText(feature) : feature}
              </ThemedText>
            ))}
          </ThemedCard>

          <ThemedButton
            variant='primary'
            size='lg'
            className='mb-4'
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            {t('subscription.changePlan')}
          </ThemedButton>

          <TouchableOpacity
            onPress={() => navigation.navigate('BillingHistory')}
          >
            <ThemedText
              size='base'
              className='underline text-center mb-6'
              style={{
                color: theme === 'dark' ? '#22C55E' : '#10472B',
              }}
            >
              {t('subscription.viewBillingHistory')}
            </ThemedText>
          </TouchableOpacity>

          {/* Subscription Actions */}
          {currentSubscription.status === 'active' &&
            !(currentSubscription.cancelAtPeriodEnd || (currentSubscription.autoRenew === false)) && (
              <>
                <ThemedText weight='semibold' size='lg' className='mb-2'>
                  {t('subscription.cancelSubscription')}
                </ThemedText>
                <ThemedText variant='secondary' className='mb-4'>
                  {t('subscription.loseAccessAfterPeriod')}
                </ThemedText>
                <TouchableOpacity
                  className='border border-error py-3 rounded-xl items-center mb-4'
                  onPress={() => setShowCancelModal(true)}
                  disabled={loading.cancel}
                >
                  <ThemedText
                    weight='semibold'
                    style={{ color: theme === 'dark' ? '#EF4444' : '#EF4444' }}
                  >
                    {loading.cancel
                      ? t('subscription.cancelling')
                      : t('subscription.cancelSubscription')}
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}

          {((currentSubscription.cancelAtPeriodEnd || (currentSubscription.autoRenew === false)) ||
            currentSubscription.status === 'cancelled') && (
            <ThemedButton
              variant='primary'
              size='lg'
              onPress={handleReactivateSubscription}
              disabled={loading.update}
            >
              {loading.update
                ? t('subscription.reactivating')
                : t('subscription.reactivateSubscription')}
            </ThemedButton>
          )}
        </ThemedScrollView>
      ) : currentSubscription && !currentSubscription.plan ? (
        <ThemedView className='flex-1 justify-center items-center px-4'>
          <ThemedText size='lg' weight='semibold' className='mb-4 text-center'>
            {t('subscription.loadingPlanDetails')}
          </ThemedText>
          <ThemedText variant='secondary' className='text-center mb-6'>
            {t('subscription.planDetailsUnavailable')}
          </ThemedText>
          <ThemedButton
            variant='primary'
            size='lg'
            onPress={() => dispatch(fetchCurrentSubscription())}
          >
            {t('common.retry')}
          </ThemedButton>
        </ThemedView>
      ) : null}

      {/* No Subscription Card */}
      {!currentSubscription && !loading.subscription && (
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
      )}

      {/* Cancel Modal */}
      <Modal visible={showCancelModal} transparent animationType='fade'>
        <ThemedView
          className='flex-1 justify-center items-center px-6'
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <ThemedCard className='w-full'>
            <ThemedText
              size='xl'
              weight='semibold'
              className='mb-3 text-center'
              style={{ color: '#EF4444' }}
            >
              {t('subscription.cancelSubscriptionConfirm')}
            </ThemedText>
            <ThemedText variant='secondary' className='text-center mb-6'>
              {t('subscription.cancelConfirmMessage')}
              {'\n'}
              {currentSubscription?.currentPeriodEnd && formatDate(currentSubscription.currentPeriodEnd)}.
            </ThemedText>

            <TouchableOpacity
              className='bg-error py-3 rounded-xl items-center mb-3'
              onPress={handleCancelSubscription}
              disabled={loading.cancel}
            >
              <ThemedText variant='inverse' weight='semibold'>
                {loading.cancel
                  ? t('subscription.cancelling')
                  : t('subscription.yesCancelSubscription')}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowCancelModal(false)}
              className='py-3 items-center'
            >
              <ThemedText
                weight='semibold'
                style={{
                  color: theme === 'dark' ? '#22C55E' : '#10472B',
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
