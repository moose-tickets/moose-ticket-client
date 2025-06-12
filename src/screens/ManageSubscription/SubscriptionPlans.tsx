import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSettingsStackNavigation } from '../../navigation/hooks';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import { ThemedView, ThemedText, ThemedCard, ThemedButton, ThemedScrollView } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchSubscriptionPlans, setSelectedPlan } from '../../store/slices/subscriptionSlice';

export default function SubscriptionPlans() {
  const navigation = useSettingsStackNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

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
      Alert.alert('Error', error);
    }
  }, [error]);

  const handleSelectPlan = (plan: any) => {
    dispatch(setSelectedPlan(plan));
    navigation.navigate('ConfirmSubscription', { planId: plan._id });
  };

  const formatPrice = (price: any) => {
    if (typeof price === 'object') {
      return `$${(price.monthly / 100).toFixed(2)}/month`;
    }
    return price; // fallback for old format
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.planId === planId;
  };

  if (loading.plans && plans.length === 0) {
    return (
      <AppLayout scrollable={false}>
        <GoBackHeader screenTitle='Choose a Plan' />
        <ThemedView className='flex-1 justify-center items-center'>
          <ThemedText>Loading plans...</ThemedText>
        </ThemedView>
      </AppLayout>
    );
  }

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5'>
        <GoBackHeader screenTitle='Choose a Plan' />
        <ThemedText variant='tertiary' className='text-center mb-6'>
          Unlock premium features and real-time alerts
        </ThemedText>

        {plans.map((plan, idx) => {
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
                    MOST POPULAR
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
                    CURRENT PLAN
                  </ThemedText>
                </ThemedView>
              )}

              <ThemedView className='flex-row justify-between items-center mb-2 p-2' variant='secondary'>
                <ThemedText weight='bold' size='lg'>{plan.name}</ThemedText>
                <ThemedText weight='semibold'>{formatPrice(plan.price)}</ThemedText>
              </ThemedView>
              
              <ThemedText variant='secondary' className='mb-1 px-3'>
                {plan.features.join('\n')}
              </ThemedText>
              
              <ThemedText className='mb-4 px-3' variant='tertiary' size='sm'>
                {plan.description}
              </ThemedText>
              
              <ThemedButton
                variant={isCurrent ? 'secondary' : 'primary'}
                size='lg'
                onPress={() => handleSelectPlan(plan)}
                disabled={isCurrent || loading.update}
              >
                {isCurrent ? 'Current Plan' : `Select ${plan.name}`}
              </ThemedButton>
            </ThemedCard>
          );
        })}

        <ThemedText variant='tertiary' size='sm' className='text-center'>
          Cancel anytime. Payments are secure.
        </ThemedText>
      </ThemedScrollView>
    </AppLayout>
  );
}
