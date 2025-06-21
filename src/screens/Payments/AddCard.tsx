import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../../wrappers/layout';
import Dialog from '../../components/Dialog';
import { useNavigation } from '@react-navigation/native';
import AddressForm from '../../components/Address';
import GoBackHeader from '../../components/GoBackHeader';
import { ThemedView, ThemedText, ThemedInput, ThemedButton, ThemedScrollView } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';
import { useBotCheck } from '../../hooks/UseBotCheck';
import { validateCreditCard, validateCVV, validateRequired } from '../../utils/validators';
import { sanitizeCreditCard, sanitizeCVV, sanitizeName, sanitizeFormData, redactForLogging } from '../../utils/sanitize';
import { useAppDispatch, useAppSelector } from '../../store';
import { createPaymentMethod } from '../../store/slices/paymentSlice';

export default function AddCard() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  // Redux state
  const loading = useAppSelector(state => state.payments.loading);

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

  const [saveCard, setSaveCard] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: "Missing Information",
    message: "Please fill in all required fields.",
    type: "warning" as "success" | "error" | "info" | "warning",
  });

  // Security hooks
  const { checkBot, isHuman, riskLevel } = useBotCheck({
    onBotDetected: (context) => {
      setDialogProps({
        title: "Security Check Failed",
        message: "Suspicious activity detected. Please try again later.",
        type: "error",
      });
      setDialogVisible(true);
    }
  });


  const validateForm = () => {
    const errors: Record<string, string[]> = {};

    // Validate cardholder name
    const nameResult = validateRequired(cardName, 'Cardholder name');
    if (!nameResult.isValid) {
      errors.cardName = nameResult.errors;
    }

    // Validate card number
    const cardResult = validateCreditCard(cardNumber);
    if (!cardResult.isValid) {
      errors.cardNumber = cardResult.errors;
    }

    // Validate CVV
    const cvvResult = validateCVV(cvv);
    if (!cvvResult.isValid) {
      errors.cvv = cvvResult.errors;
    }

    // Validate expiry (basic validation)
    if (!expiry || expiry.length < 5) {
      errors.expiry = ['Please enter a valid expiry date (MM/YY)'];
    }

    // Validate billing address
    if (!billingAddress.fullName) {
      errors.billingFullName = ['Full name is required'];
    }
    if (!billingAddress.address) {
      errors.billingAddress = ['Address is required'];
    }
    if (!billingAddress.city) {
      errors.billingCity = ['City is required'];
    }
    if (!billingAddress.postalCode) {
      errors.billingPostalCode = ['Postal code is required'];
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCard = async () => {
    if (loading.create) return;

    setValidationErrors({});

    try {
      // 1. Validate form
      const isFormValid = validateForm();
      if (!isFormValid) {
        setDialogProps({
          title: "Validation Error",
          message: "Please correct the errors below and try again.",
          type: "error",
        });
        setDialogVisible(true);
        return;
      }

      // 2. Parse expiry date
      const [month, year] = expiry.split('/');
      const expiryMonth = parseInt(month, 10);
      const expiryYear = parseInt(`20${year}`, 10);

      // 3. Sanitize payment data
      const sanitizedData = {
        cardholderName: sanitizeName(cardName),
        cardNumber: sanitizeCreditCard(cardNumber),
        expiryMonth,
        expiryYear,
        cvv: sanitizeCVV(cvv),
        billingAddress: sanitizeFormData(billingAddress, {
          fullName: sanitizeName,
          address: (val) => val.trim(),
          city: (val) => val.trim(),
          state: (val) => val.trim(),
          country: (val) => val.trim(),
          postalCode: (val) => val.trim().toUpperCase(),
        }),
        setAsDefault: saveCard
      };

      // 4. Perform security checks
      // Bot detection
      const botContext = await checkBot();
      if (!botContext.isHuman && botContext.riskLevel === 'critical') {
        throw new Error('Security verification failed');
      }

      // Log sanitized data (with sensitive info redacted)
      const logData = redactForLogging(sanitizedData);
      console.log('Adding card with sanitized data:', logData);

      // Dispatch Redux action
      await dispatch(createPaymentMethod(sanitizedData)).unwrap();

      // Success
      setDialogProps({
        title: "Card Added Successfully",
        message: "Your payment method has been added securely.",
        type: "success",
      });
      setDialogVisible(true);

      // Navigate back after delay
      setTimeout(() => {
        setDialogVisible(false);
        navigation.goBack();
      }, 2000);

    } catch (error: any) {
      console.error('Add card error:', error);
      
      setDialogProps({
        title: "Payment Error",
        message: error.message || "Failed to add payment method. Please try again.",
        type: "error",
      });
      setDialogVisible(true);
    }
  };

  return (
    <AppLayout scrollable={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className='flex-1'
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 80 }}
          keyboardShouldPersistTaps='handled'
        >
          {/* Header */}
          <GoBackHeader screenTitle='Add Card' />

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
              keyboardType='number-pad'
              maxLength={19}
              placeholder='1234 5678 9012 3456'
              value={cardNumber}
              onChangeText={setCardNumber}
              className='mb-4'
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

            <ThemedText size='sm' variant='secondary' className='mb-2'>
              Billing Address (Optional)
            </ThemedText>
            {/* 
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-white text-[#1E1E1E]"
              placeholder="123 Main St, Toronto"
              value={billingAddress}
              onChangeText={setBillingAddress}
            /> */}
            <ThemedView className='mt-4'>
              <ThemedText size='sm' variant='secondary' className='mb-2'>
                Billing Address
              </ThemedText>
              <AddressForm
                onSubmit={(address) => {
                  setBillingAddress(billingAddress); // Store full address state here
                }}
              />
            </ThemedView>

            {/* Save toggle */}
            <ThemedView className='flex-row items-center justify-between mb-6'>
              <ThemedText weight='medium'>
                Save this card for future payments
              </ThemedText>
              <Switch
                value={saveCard}
                onValueChange={setSaveCard}
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
              onPress={handleAddCard}
              variant='primary'
              size='lg'
              className='mb-3'
              disabled={loading.create}
            >
              {loading.create ? 'Adding Card...' : 'Add Card'}
            </ThemedButton>

            <ThemedButton
              onPress={() => navigation.goBack()}
              variant='outline'
              size='lg'
            >
              Cancel
            </ThemedButton>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dialog */}
      <Dialog
        visible={dialogVisible}
        title='Card Added'
        message='Your card has been saved successfully.'
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
