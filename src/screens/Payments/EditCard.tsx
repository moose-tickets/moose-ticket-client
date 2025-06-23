import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../../wrappers/layout';
import Dialog from '../../components/Dialog';
import { useNavigation, useRoute } from '@react-navigation/native';
import AddressForm from '../../components/Address';
import GoBackHeader from '../../components/GoBackHeader';
import { ThemedView, ThemedText, ThemedInput, ThemedButton, ThemedScrollView } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  updatePaymentMethod, 
  fetchPaymentMethodById,
  setDefaultPaymentMethod 
} from '../../store/slices/paymentSlice';

export default function EditCard() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { cardId } = route.params as { cardId: string };

  // Redux state
  const paymentMethods = useAppSelector(state => state.payments.paymentMethods);
  const loading = useAppSelector(state => state.payments.loading);
  const error = useAppSelector(state => state.payments.error);

  // Form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingAddress, setBillingAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });

  const [isDefault, setIsDefault] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);

  // Load payment method data
  useEffect(() => {
    const paymentMethod = paymentMethods.find(pm => pm._id === cardId);
    if (paymentMethod) {
      setCardName(paymentMethod.cardholderName || '');
      setCardNumber(`**** **** **** ${paymentMethod.last4}`);
      setExpiry(`${paymentMethod.expiryMonth.toString().padStart(2, '0')}/${paymentMethod.expiryYear.toString().slice(-2)}`);
      setBillingAddress(paymentMethod.billingAddress || {
        fullName: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      });
      setIsDefault(paymentMethod.isDefault || false);
    }
  }, [cardId, paymentMethods]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), error);
    }
  }, [error]);

  const handleUpdateCard = async () => {
    if (!cardName || !expiry) {
      Alert.alert(t('auth.validationFailed'), t('payments.fillRequiredFields'));
      return;
    }

    try {
      // Parse expiry date
      const [month, year] = expiry.split('/');
      const expiryMonth = parseInt(month, 10);
      const expiryYear = parseInt(`20${year}`, 10);

      const updateData = {
        cardholderName: cardName.trim(),
        expiryMonth,
        expiryYear,
        billingAddress,
        // CVV is optional for updates
        ...(cvv && { cvv }),
      };

      await dispatch(updatePaymentMethod({ paymentMethodId: cardId, ...updateData })).unwrap();

      // Set as default if requested
      if (isDefault) {
        await dispatch(setDefaultPaymentMethod(cardId)).unwrap();
      }

      setDialogVisible(true);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('payments.addPaymentMethodFailed'));
    }
  };

  return (
    <AppLayout scrollable={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className='flex-1'
      >
        <ThemedScrollView
          contentContainerStyle={{ paddingBottom: 80 }}
          keyboardShouldPersistTaps='handled'
        >
          {/* Header */}
          <GoBackHeader screenTitle='Edit Card' />

          {/* Inputs */}
          <ThemedView className='px-4'>
            <ThemedText size='sm' variant='secondary' className='mb-2'>Cardholder Name</ThemedText>
            <ThemedInput
              placeholder='John Doe'
              value={cardName}
              onChangeText={setCardName}
              className='mb-4'
            />

            <ThemedText size='sm' variant='secondary' className='mb-2'>Card Number</ThemedText>
            <ThemedInput
              editable={false}
              placeholder='**** **** **** 1234'
              value={cardNumber}
              className='mb-4 opacity-50'
            />

            <ThemedView className='flex-row space-x-4'>
              <ThemedView className='flex-1'>
                <ThemedText size='sm' variant='secondary' className='mb-2'>Expiry</ThemedText>
                <ThemedInput
                  placeholder='MM/YY'
                  maxLength={5}
                  keyboardType='numeric'
                  value={expiry}
                  onChangeText={setExpiry}
                  className='mb-4'
                />
              </ThemedView>

              <ThemedView className='flex-1'>
                <ThemedText size='sm' variant='secondary' className='mb-2'>CVV</ThemedText>
                <ThemedInput
                  placeholder='123'
                  secureTextEntry
                  maxLength={4}
                  keyboardType='number-pad'
                  value={cvv}
                  onChangeText={setCvv}
                  className='mb-4'
                />
              </ThemedView>
            </ThemedView>

            <ThemedView className='mt-4'>
              <ThemedText size='sm' variant='secondary' className='mb-2'>
                Billing Address
              </ThemedText>
              <AddressForm
                initialValues={billingAddress}
                onSubmit={(address) => {
                  setBillingAddress(address);
                }}
              />
            </ThemedView>

            {/* Default toggle */}
            <ThemedView className='flex-row items-center justify-between mb-6'>
              <ThemedText weight='medium'>
                Set as default payment method
              </ThemedText>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{ 
                  false: theme === 'dark' ? '#4A5568' : '#ccc', 
                  true: theme === 'dark' ? '#22C55E' : '#10472B' 
                }}
                thumbColor='#ffffff'
              />
            </ThemedView>
          </ThemedView>

          {/* Buttons */}
          <ThemedView className='px-4'>
            <ThemedButton
              onPress={handleUpdateCard}
              variant='secondary'
              size='lg'
              className='mb-3'
              disabled={loading.update}
            >
              {loading.update ? 'Updating...' : 'Update Card'}
            </ThemedButton>

            <ThemedButton
              onPress={() => navigation.goBack()}
              variant='outline'
              size='lg'
            >
              Cancel
            </ThemedButton>
          </ThemedView>
        </ThemedScrollView>
      </KeyboardAvoidingView>

      {/* Dialog */}
      <Dialog
        visible={dialogVisible}
        title='Card Updated'
        message='Your card information has been updated successfully.'
        type='success'
        onClose={() => setDialogVisible(false)}
        onConfirm={() => {
          setDialogVisible(false);
          navigation.goBack();
        }}
        confirmText='OK'
      />
    </AppLayout>
  );
}
