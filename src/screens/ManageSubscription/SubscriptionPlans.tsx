import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useSettingsStackNavigation } from '../../navigation/hooks';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import { ThemedView, ThemedText, ThemedCard, ThemedButton, ThemedScrollView } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchSubscriptionPlans, setSelectedPlan, updateSubscription, upgradeSubscription } from '../../store/slices/subscriptionSlice';
import { useTranslation } from 'react-i18next';
import i18n from '../../locales';

export default function SubscriptionPlans() {
  const navigation = useSettingsStackNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const currentLanguage = i18n.language as 'en' | 'fr' | 'ar' | 'es';

  // Helper function to get localized text
  const getLocalizedText = (textObj: { en: string; fr: string; ar: string; es?: string }) => {
    return textObj[currentLanguage] || textObj.en;
  };

  // Redux state
  const plans = useAppSelector(state => state.subscriptions.plans);
  const loading = useAppSelector(state => state.subscriptions.loading);
  const error = useAppSelector(state => state.subscriptions.error);
  const currentSubscription = useAppSelector(state => state.subscriptions.currentSubscription);

  // Fetch plans on mount
  useEffect(() => {
    dispatch(fetchSubscriptionPlans());
  }, [dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), error);
    }
  }, [error]);

  const handleSelectPlan = async (plan: any) => {
    console.log('🔄 handleSelectPlan called with plan:', plan._id);
    console.log('🔄 Current subscription planId:', currentSubscription?.planId);
    console.log('🔄 Current subscription plan._id:', currentSubscription?.plan?._id);
    console.log('🔄 Current subscription _id:', currentSubscription?._id);
    
    // Get the current plan ID - could be from planId field or plan._id
    const currentPlanId = currentSubscription?.planId || currentSubscription?.plan?._id;
    
    if (currentSubscription && currentPlanId === plan._id) {
      Alert.alert(t('common.info'), t('subscription.alreadyOnThisPlan'));
      return;
    }
    
    // Always go to confirmation screen for both new subscriptions and plan changes
    dispatch(setSelectedPlan(plan));
    navigation.navigate('ConfirmSubscription', { planId: plan._id });
  };
  
  const isUpgrade = (newPlan: any) => {
    if (!currentSubscription) return false;
    const currentPlanId = currentSubscription.planId || currentSubscription.plan?._id;
    const currentPlan = plans.find(p => p._id === currentPlanId);
    if (!currentPlan) return false;
    
    const tierOrder = { basic: 1, standard: 2, premium: 3, enterprise: 4 };
    return tierOrder[newPlan.tier] > tierOrder[currentPlan.tier];
  };

  const formatPrice = (price: any) => {
    if (typeof price === 'object') {
      return `$${(price.monthly / 100).toFixed(2)}/month`;
    }
    return price; // fallback for old format
  };

  const isCurrentPlan = (planId: string) => {
    const currentPlanId = currentSubscription?.planId || currentSubscription?.plan?._id;
    return currentPlanId === planId;
  };

  if (loading.plans && plans.length === 0) {
    return (
      <AppLayout scrollable={false}>
        <GoBackHeader screenTitle={t('subscription.choosePlan')} />
        <ThemedView className='flex-1 justify-center items-center'>
          <ThemedText>{t('subscription.loadingPlans')}</ThemedText>
        </ThemedView>
      </AppLayout>
    );
  }

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5'>
        <GoBackHeader screenTitle={t('subscription.choosePlan')} />
        <ThemedText variant='tertiary' className='text-center mb-6'>
          {t('subscription.unlockPremiumFeatures')}
        </ThemedText>

        {plans && Array.isArray(plans) && plans.map((plan, idx) => {
          const isPopular = plan.isPopular;
          const isCurrent = isCurrentPlan(plan._id);
          
          return (
            <ThemedCard
              key={plan._id}
              className='mb-4'
              style={
                isPopular
                  ? { borderColor: '#10B981', borderWidth: 2 }
                  : isCurrent
                  ? { borderColor: '#3B82F6', borderWidth: 2 }
                  : undefined
              }
              variant={theme === 'dark' ? 'elevated': 'default'}
            >
              {/* Popular Badge */}
              {isPopular && (
                <ThemedView 
                  className='absolute -top-3 left-4 px-3 py-1 rounded-full' 
                  style={{ backgroundColor: '#10B981' }}
                >
                  <ThemedText size='xs' weight='bold' style={{ color: 'white' }}>
                    {t('subscription.mostPopular')}
                  </ThemedText>
                </ThemedView>
              )}
              
              {/* Current Plan Badge */}
              {isCurrent && (
                <ThemedView 
                  className='absolute -top-3 right-4 px-3 py-1 rounded-full' 
                  style={{ backgroundColor: '#3B82F6' }}
                >
                  <ThemedText size='xs' weight='bold' style={{ color: 'white' }}>
                    {t('subscription.currentPlanBadge')}
                  </ThemedText>
                </ThemedView>
              )}

              <ThemedView className='flex-row justify-between items-center mb-2 p-2' variant='secondary'>
                <ThemedText weight='bold' size='lg'>
                  {plan.name && typeof plan.name === 'object' 
                    ? getLocalizedText(plan.name)
                    : plan.name || 'N/A'}
                </ThemedText>
                <ThemedText weight='semibold'>{formatPrice(plan.price)}</ThemedText>
              </ThemedView>
              
              <ThemedText variant='secondary' className='mb-1 px-3'>
                {plan.features?.map(feature => 
                  typeof feature === 'object' ? getLocalizedText(feature) : feature
                ).join('\n')}
              </ThemedText>
              
              <ThemedText className='mb-4 px-3' variant='tertiary' size='sm'>
                {plan.description && typeof plan.description === 'object' 
                  ? getLocalizedText(plan.description)
                  : plan.description || ''}
              </ThemedText>
              
              <ThemedButton
                variant={isCurrent ? 'secondary' : 'primary'}
                size='lg'
                onPress={() => handleSelectPlan(plan)}
                disabled={isCurrent || loading.update || loading.upgrade}
              >
                {isCurrent 
                  ? t('subscription.currentPlan') 
                  : currentSubscription
                    ? (isUpgrade(plan) ? t('subscription.upgradePlan') : t('subscription.changePlan'))
                    : t('subscription.selectPlanButton', { 
                        planName: plan.name && typeof plan.name === 'object' 
                          ? getLocalizedText(plan.name)
                          : plan.name || 'Plan'
                      })
                }
              </ThemedButton>
            </ThemedCard>
          );
        })}

        {(!plans || !Array.isArray(plans) || plans.length === 0) && !loading.plans && (
          <ThemedView className='flex-1 justify-center items-center py-12'>
            <ThemedText size='lg' weight='semibold' className='mb-2'>
              {t('subscription.noPlansAvailable')}
            </ThemedText>
            <ThemedText variant='secondary' className='text-center'>
              {t('subscription.pleaseCheckBackLater')}
            </ThemedText>
          </ThemedView>
        )}

        <ThemedText variant='tertiary' size='sm' className='text-center'>
          {t('subscription.cancelAnytime')}
        </ThemedText>
      </ThemedScrollView>
    </AppLayout>
  );
}
