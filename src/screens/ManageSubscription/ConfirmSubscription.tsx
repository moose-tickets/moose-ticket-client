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
import { createSubscription, updateSubscription, fetchCurrentSubscription } from '../../store/slices/subscriptionSlice';
import { useTranslation } from 'react-i18next';
import i18n from '../../locales';

export default function ConfirmSubscription() {
  const navigation = useSettingsStackNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const route = useRoute<RouteProp<SettingsStackParamList, 'ConfirmSubscription'>>();
  const planId = route.params.planId;
  const currentLanguage = i18n.language as 'en' | 'fr' | 'ar' | 'es';

  // Helper function to get localized text
  const getLocalizedText = (textObj: { en: string; fr: string; ar: string; es?: string }) => {
    return textObj[currentLanguage] || textObj.en;
  };
  
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
    // For now, use a default payment method ID if none is selected
    // In a real app, this should be selected by the user
    const effectivePaymentMethodId = paymentMethodId || 'default_payment_method';
    
    if (!effectivePaymentMethodId) {
      Alert.alert(t('common.error'), 'Please select a payment method');
      return;
    }

    if (!billingAddress.fullName || !billingAddress.address) {
      Alert.alert(t('common.error'), t('payments.billingAddressRequired'));
      return;
    }

    try {
      if (currentSubscription) {
        // Update existing subscription
        const updateData = {
          subscriptionId: currentSubscription._id,
          planId,
          billingCycle,
          // Include billing address and payment method in metadata
          metadata: {
            billingAddress,
            paymentMethodId: effectivePaymentMethodId,
          },
        };

        console.log('🔄 Updating subscription with data:', updateData);
        
        const result = await dispatch(updateSubscription(updateData)).unwrap();
        
        console.log('🔄 Subscription update result:', result);
        
        setDialogProps({
          title: t('subscription.planUpdated'),
          message: t('subscription.planUpdatedSuccessfully'),
          type: 'success',
        });
      } else {
        // Create new subscription
        // Convert frontend billingCycle to backend format
        const backendBillingCycle = billingCycle === 'annually' ? 'annual' : 'monthly';
        
        const subscriptionData = {
          planId,
          billingCycle: backendBillingCycle,
          paymentMethodId: effectivePaymentMethodId,
          billingEmail: billingAddress.fullName, // Use fullName as billing email fallback
          // Include billing address in metadata
          metadata: {
            billingAddress,
          },
        };

        console.log('🔄 Creating subscription with data:', subscriptionData);
        
        const result = await dispatch(createSubscription(subscriptionData)).unwrap();
        
        console.log('🔄 Subscription creation result:', result);
        
        setDialogProps({
          title: t('subscription.subscribed'),
          message: t('subscription.welcomeToPremium'),
          type: 'success',
        });
      }
      
      // Refresh subscription data after successful update/creation
      setTimeout(() => {
        dispatch(fetchCurrentSubscription());
      }, 1000);
      
      setDialogVisible(true);
    } catch (error: any) {
      console.error('🔄 Subscription operation failed:', error);
      setDialogProps({
        title: t('subscription.subscriptionFailed'),
        message: error.message || t('subscription.subscriptionFailedMessage'),
        type: 'error',
      });
      setDialogVisible(true);
    }
  };

  const calculateTotal = () => {
    if (!selectedPlan || !selectedPlan.price) return '$0.00';
    
    const price = billingCycle === 'monthly' 
      ? selectedPlan.price.monthly 
      : selectedPlan.price.annually;
      
    if (!price || typeof price !== 'number') return '$0.00';
    
    const currency = selectedPlan.price.currency || 'USD';
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(price / 100);
    } catch (error) {
      console.error('Currency formatting error:', error);
      // Fallback to simple dollar formatting
      return `$${(price / 100).toFixed(2)}`;
    }
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
              {selectedPlan?.name && typeof selectedPlan.name === 'object' 
                ? getLocalizedText(selectedPlan.name)
                : selectedPlan?.name || 'Premium Plan'}
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
          
          {selectedPlan?.features?.map((feature, index) => (
            <ThemedText key={index}>
              ✓ {typeof feature === 'object' ? getLocalizedText(feature) : feature}
            </ThemedText>
          ))}
        </ThemedCard>
        <ThemedCard className='mb-4'>
          <Payments/>
        </ThemedCard>
        <AddressForm
          onSubmit={(address) => {
            setBillingAddress(address); // Store full address state here
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
          disabled={loading.update || loading.subscription}
        >
          {loading.update || loading.subscription 
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
            // Navigate back to ManageSubscription to show updated subscription
            navigation.navigate('ManageSubscription');
          }
        }}
        onConfirm={() => {
          setDialogVisible(false);
          if (dialogProps.type === 'success') {
            navigation.navigate('ManageSubscription');
          }
        }}
      />
    </AppLayout>
  );
}
