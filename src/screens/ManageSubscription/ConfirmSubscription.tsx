import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import AddressForm from '../../components/Address';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSettingsStackNavigation } from '../../navigation/hooks';
import { SettingsStackParamList } from '../../navigation/types';
import Dialog from '../../components/Dialog';
import Payments from '../../components/Payments';
import { ThemedView, ThemedText, ThemedCard, ThemedButton, ThemedScrollView } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store';
import { createSubscription, updateSubscription } from '../../store/slices/subscriptionSlice';

export default function ConfirmSubscription() {
  const navigation = useSettingsStackNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const route = useRoute<RouteProp<SettingsStackParamList, 'ConfirmSubscription'>>();
  const planId = route.params.planId;
  
  // Redux state
  const selectedPlan = useAppSelector(state => state.subscriptions.selectedPlan);
  const currentSubscription = useAppSelector(state => state.subscriptions.currentSubscription);
  const loading = useAppSelector(state => state.subscriptions.loading);
  const error = useAppSelector(state => state.subscriptions.error);
  
  // Form state
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [billingAddress, setBillingAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });
  const [dialogProps, setDialogProps] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
  });
  const [dialogVisible, setDialogVisible] = useState(false);

  // Handle errors
  useEffect(() => {
    if (error) {
      setDialogProps({
        title: 'Error',
        message: error,
        type: 'error',
      });
      setDialogVisible(true);
    }
  }, [error]);

  const handleConfirm = async () => {
    if (!paymentMethodId) {
      Alert.alert('Payment Required', 'Please select a payment method');
      return;
    }

    if (!billingAddress.fullName || !billingAddress.address) {
      Alert.alert('Address Required', 'Please complete your billing address');
      return;
    }

    try {
      const subscriptionData = {
        planId,
        billingCycle,
        paymentMethodId,
        // Include billing address in metadata
        metadata: {
          billingAddress,
        },
      };

      if (currentSubscription) {
        // Update existing subscription
        await dispatch(updateSubscription(subscriptionData)).unwrap();
        setDialogProps({
          title: 'Plan Updated!',
          message: 'Your subscription plan has been updated successfully.',
          type: 'success',
        });
      } else {
        // Create new subscription
        await dispatch(createSubscription(subscriptionData)).unwrap();
        setDialogProps({
          title: 'Subscribed!',
          message: 'Welcome to premium! You now have access to all premium features.',
          type: 'success',
        });
      }
      
      setDialogVisible(true);
    } catch (error: any) {
      setDialogProps({
        title: 'Subscription Failed',
        message: error.message || 'Failed to process subscription. Please try again.',
        type: 'error',
      });
      setDialogVisible(true);
    }
  };

  const calculateTotal = () => {
    if (!selectedPlan) return '$0.00';
    
    const price = billingCycle === 'monthly' 
      ? selectedPlan.price.monthly 
      : selectedPlan.price.annually;
      
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedPlan.price.currency
    }).format(price / 100);
  };

  const messageComponent = () =>
    dialogProps.type === 'success' ? (
      <View className='items-center justify-center'>
        <Text className='text-center text-sm font-medium mb-2 text-gray-600'>
          You're all set!
        </Text>
        <Text className='text-center text-gray-600 mb-6 text-sm'>
          Thank you for subscribing. You now have access to all premium
          features.
        </Text>
      </View>
    ) : (
      'Something Went Wrong!.'
    );

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5'>
        <GoBackHeader screenTitle='Confirm Subscription' />

        {/* Plan Details */}
        <ThemedCard className='my-4'>
          <ThemedView className='flex-row justify-between items-center mb-2'>
            <ThemedText weight='bold' size='lg'>
              {selectedPlan?.name || 'Premium Plan'}
            </ThemedText>
            <ThemedText weight='bold' size='lg' style={{ color: theme === 'dark' ? '#10B981' : '#10B981' }}>
              {calculateTotal()}
            </ThemedText>
          </ThemedView>
          <ThemedText variant='secondary' className='mb-2'>
            Billed {billingCycle} as {calculateTotal()}
          </ThemedText>
          
          {/* Billing Cycle Toggle */}
          <ThemedView className='flex-row mb-4 p-2 rounded-lg' style={{ backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6' }}>
            <TouchableOpacity
              className={`flex-1 py-2 px-4 rounded ${billingCycle === 'monthly' ? 'bg-primary' : ''}`}
              onPress={() => setBillingCycle('monthly')}
            >
              <ThemedText weight='medium' className='text-center' style={{ color: billingCycle === 'monthly' ? 'white' : undefined }}>
                Monthly
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 px-4 rounded ${billingCycle === 'annually' ? 'bg-primary' : ''}`}
              onPress={() => setBillingCycle('annually')}
            >
              <ThemedText weight='medium' className='text-center' style={{ color: billingCycle === 'annually' ? 'white' : undefined }}>
                Annually
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          {selectedPlan?.features.map((feature, index) => (
            <ThemedText key={index}>✓ {feature}</ThemedText>
          ))}
        </ThemedCard>
        <ThemedCard className='mb-4'>
          <Payments/>
        </ThemedCard>
        <AddressForm
          onSubmit={(address) => {
            setBillingAddress(billingAddress); // Store full address state here
          }}
        />

        <ThemedText variant='secondary' weight='medium' className='text-center mt-2'>
          You will be charged {calculateTotal()} today
        </ThemedText>

        <ThemedButton
          variant='primary'
          size='lg'
          className='mt-6'
          onPress={handleConfirm}
          disabled={loading.update || loading.create}
        >
          {loading.update || loading.create 
            ? 'Processing...' 
            : (currentSubscription ? 'Update Subscription' : 'Confirm & Subscribe')
          }
        </ThemedButton>

        <TouchableOpacity
          className='mt-4 items-center'
          onPress={() => navigation.goBack()}
        >
          <ThemedText 
            weight='medium' 
            className='underline'
            style={{
              color: theme === 'dark' ? '#22C55E' : '#10472B'
            }}
          >
            Cancel
          </ThemedText>
        </TouchableOpacity>
      </ThemedScrollView>
      <Dialog
        visible={dialogVisible}
        title={dialogProps.title}
        messageComponent={messageComponent()}
        type={dialogProps.type}
        onClose={() => {
          setDialogVisible(false);
          if (dialogProps.type === 'success') {
            navigation.navigate('ManageSubscription');
          }
        }}
      />
    </AppLayout>
  );
}
