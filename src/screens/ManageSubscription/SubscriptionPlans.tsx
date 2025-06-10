import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSettingsStackNavigation } from '../../navigation/hooks';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import { ThemedView, ThemedText, ThemedCard, ThemedButton, ThemedScrollView } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';

const subscriptionPlans = [
  {
    _id: 'nkddf34rr3',
    name: 'Basic',
    price: '$4.99/mo',
    features: ['Real-time ticket alerts', 'View & pay tickets'],
    highlight: false,
    highlightText: '',
    borderColor: '',
    buttonText: 'Select Basic',
  },
  {
    _id: 'nkddf34rr3fddf',
    name: 'Pro',
    price: '$9.99/mo',
    features: [
      'All Basic features',
      'Priority support',
      'Dispute auto-generation',
    ],
    highlight: false,
    highlightText: '',
    borderColor: '#E08631',
    buttonText: 'Select Pro',
  },
  {
    _id: 'nkddf34rr334r3',
    name: 'Annual',
    price: '$99.99/yr',
    features: ['All Pro features'],
    highlight: true,
    highlightText: '2 months free',
    borderColor: '',
    buttonText: 'Select Annual',
  },
];

export default function SubscriptionPlans() {
  const navigation = useSettingsStackNavigation();
  const { theme } = useTheme();

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5'>
        <GoBackHeader screenTitle='Choose a Plan' />
        <ThemedText variant='tertiary' className='text-center mb-6'>
          Unlock premium features and real-time alerts
        </ThemedText>

        {subscriptionPlans.map((plan, idx) => (
          <ThemedCard
            key={plan._id}
            className='mb-4'
            style={
              plan.borderColor
                ? { borderColor: plan.borderColor, borderWidth: 2 }
                : undefined
            }
            variant={theme === 'dark' ? 'elevated': 'default'}
          >
            <ThemedView className='flex-row justify-between items-center mb-2 p-2' variant='secondary'>
              <ThemedText weight='bold' size='lg'>{plan.name}</ThemedText>
              <ThemedText weight='semibold'>{plan.price}</ThemedText>
            </ThemedView>
            <ThemedText variant='secondary' className='mb-1 px-3'>
              {plan.features.join('\n')}
            </ThemedText>
            {plan.highlight && (
              <ThemedText className='mb-4 px-3' style={{ color: theme === 'dark' ? '#10B981' : '#16A34A' }}>{plan.highlightText}</ThemedText>
            )}
            <ThemedButton
              variant='primary'
              size='lg'
              onPress={() => navigation.navigate('ConfirmSubscription', { planId: plan._id })}
            >
              {plan.buttonText}
            </ThemedButton>
          </ThemedCard>
        ))}

        <ThemedText variant='tertiary' size='sm' className='text-center'>
          Cancel anytime. Payments are secure.
        </ThemedText>
      </ThemedScrollView>
    </AppLayout>
  );
}
