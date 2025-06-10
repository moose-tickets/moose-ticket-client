import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
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

export default function ConfirmSubscription() {
  const navigation = useSettingsStackNavigation();
  const { theme } = useTheme();
  const route = useRoute<RouteProp<SettingsStackParamList, 'ConfirmSubscription'>>();
  const planId = route.params.planId;
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

  const handleConfirm = () => {
    setDialogProps({
      title: 'Subscribed!',
      message:
        'Your dispute has been submitted successfully and is now under review.',
      type: 'success',
    });
    setDialogVisible(true);
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

        <ThemedCard className='my-4'>
          <ThemedView className='flex-row justify-between items-center mb-2'>
            <ThemedText weight='bold' size='lg'>Premium Plan</ThemedText>
            <ThemedText weight='bold' size='lg' style={{ color: theme === 'dark' ? '#10B981' : '#10B981' }}>$1.99</ThemedText>
          </ThemedView>
          <ThemedText variant='secondary' className='mb-2'>Billed monthly as $1.99</ThemedText>
          <ThemedText>✓ Unlimited event tickets</ThemedText>
          <ThemedText>✓ Priority support</ThemedText>
          <ThemedText>✓ Early access to sales</ThemedText>
          <ThemedText>✓ Exclusive member benefits</ThemedText>
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
          You will be charged $1.99 today
        </ThemedText>

        <ThemedButton
          variant='primary'
          size='lg'
          className='mt-6'
          onPress={handleConfirm}
        >
          Confirm & Subscribe
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
