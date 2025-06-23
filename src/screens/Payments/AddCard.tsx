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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Redux state
  const isCreatingPaymentMethod = useAppSelector(state => state.payments.isCreatingPaymentMethod);

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
    title: t('payments.missingInformation'),
    message: t('payments.fillRequiredFields'),
    type: "warning" as "success" | "error" | "info" | "warning",
  });

  // Security hooks
  const { checkBot, isHuman, riskLevel } = useBotCheck({
    onBotDetected: (context) => {
      setDialogProps({
        title: t('payments.securityCheckFailed'),
        message: t('payments.suspiciousActivity'),
        type: "error",
      });
      setDialogVisible(true);
    }
  });


  const validateForm = () => {
    const errors: Record<string, string[]> = {};

    // Validate cardholder name
    const nameResult = validateRequired(cardName, t('payments.cardholderName'));
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
      errors.expiry = [t('payments.validExpiryDate')];
    }

    // Validate billing address
    if (!billingAddress.fullName) {
      errors.billingFullName = [t('payments.fullNameRequired')];
    }
    if (!billingAddress.address) {
      errors.billingAddress = [t('payments.addressRequired')];
    }
    if (!billingAddress.city) {
      errors.billingCity = [t('payments.cityRequired')];
    }
    if (!billingAddress.postalCode) {
      errors.billingPostalCode = [t('payments.postalCodeRequired')];
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCard = async () => {
    if (isCreatingPaymentMethod) return;

    setValidationErrors({});

    try {
      // 1. Validate form
      const isFormValid = validateForm();
      if (!isFormValid) {
        setDialogProps({
          title: t('auth.validationFailed'),
          message: t('payments.correctErrors'),
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
        title: t('payments.cardAddedSuccess'),
        message: t('payments.paymentMethodAdded'),
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
        title: t('payments.paymentError'),
        message: error.message || t('payments.addPaymentMethodFailed'),
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
          <GoBackHeader screenTitle={t('payments.addCard')} />

          {/* Inputs */}
          <ThemedView className='px-4'>
            <ThemedText size='sm' variant='secondary' className='mb-2'>{t('payments.cardholderName')}</ThemedText>
            <ThemedInput
              placeholder={t('payments.cardholderNamePlaceholder')}
              value={cardName}
              onChangeText={setCardName}
              className='mb-4'
            />

            <ThemedText size='sm' variant='secondary' className='mb-2'>{t('payments.cardNumber')}</ThemedText>
            <ThemedInput
              keyboardType='number-pad'
              maxLength={19}
              placeholder={t('payments.cardNumberPlaceholder')}
              value={cardNumber}
              onChangeText={setCardNumber}
              className='mb-4'
            />

            <ThemedView className='flex-row space-x-4'>
              <ThemedView className='flex-1'>
                <ThemedText size='sm' variant='secondary' className='mb-2'>{t('payments.expiryDate')}</ThemedText>
                <ThemedInput
                  placeholder={t('payments.expiryPlaceholder')}
                  maxLength={5}
                  keyboardType='numeric'
                  value={expiry}
                  onChangeText={setExpiry}
                  className='mb-4'
                />
              </ThemedView>

              <ThemedView className='flex-1'>
                <ThemedText size='sm' variant='secondary' className='mb-2'>{t('payments.cvv')}</ThemedText>
                <ThemedInput
                  placeholder={t('payments.cvvPlaceholder')}
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
              {t('payments.billingAddressOptional')}
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
                {t('payments.billingAddress')}
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
                {t('payments.saveCardForFuture')}
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
              disabled={isCreatingPaymentMethod}
            >
              {isCreatingPaymentMethod ? t('payments.addingCard') : t('payments.addCard')}
            </ThemedButton>

            <ThemedButton
              onPress={() => navigation.goBack()}
              variant='outline'
              size='lg'
            >
              {t('common.cancel')}
            </ThemedButton>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dialog */}
      <Dialog
        visible={dialogVisible}
        title={dialogProps.title}
        message={dialogProps.message}
        type={dialogProps.type}
        onClose={() => setDialogVisible(false)}
        onConfirm={() => {
          setDialogVisible(false);
          navigation.goBack();
        }}
        confirmText={t('common.ok')}
      />
    </AppLayout>
  );
}
