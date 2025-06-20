// src/screens/Payment/PayNowScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../wrappers/ThemeProvider';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import Dialog from '../../components/Dialog';
import { 
  ThemedView, 
  ThemedText, 
  ThemedInput, 
  ThemedButton, 
  ThemedCard 
} from '../../components/ThemedComponents';
import { useAppDispatch, useAppSelector } from '../../store';
import { payTicket, fetchTicket } from '../../store/slices/ticketSlice';
import { 
  fetchPaymentMethods, 
  createPaymentMethod,
  selectPaymentMethods,
  selectIsCreatingPaymentMethod,
  selectPaymentError,
} from '../../store/slices/paymentSlice';
import { 
  validateCreditCard, 
  validateCVV, 
  validateRequired 
} from '../../utils/validators';
import { 
  sanitizeCreditCard, 
  sanitizeCVV, 
  sanitizeName 
} from '../../utils/sanitize';

interface PayNowScreenParams {
  ticketId: string;
}

export default function PayNowScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const route = useRoute<RouteProp<{ PayNow: PayNowScreenParams }, 'PayNow'>>();
  const dispatch = useAppDispatch();
  
  const ticketId = route.params.ticketId;
  
  // Redux state
  const ticket = useAppSelector((state) => state.tickets.currentTicket);
  const paymentMethods = useAppSelector(selectPaymentMethods);
  const isCreatingPaymentMethod = useAppSelector(selectIsCreatingPaymentMethod);
  const isPaying = useAppSelector((state) => state.tickets.isPaying);
  const paymentError = useAppSelector(selectPaymentError);
  
  // Local state
  const [paymentMethod, setPaymentMethod] = useState<'existing' | 'new'>('existing');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
  });
  
  const [newCardForm, setNewCardForm] = useState({
    cardNumber: '',
    cardholderName: '',
    cardExpiry: '',
    cardCvv: '',
    billingAddress: {
      fullName: '',
      address: '',
      city: '',
      state: '',
      country: 'Canada',
      postalCode: '',
    },
  });

  // Load ticket and payment methods
  useEffect(() => {
    if (ticketId) {
      dispatch(fetchTicket(ticketId));
      dispatch(fetchPaymentMethods());
    }
  }, [ticketId, dispatch]);

  // Set default payment method if available
  useEffect(() => {
    if (paymentMethods.length > 0) {
      const defaultMethod = paymentMethods.find(pm => pm.isDefault);
      if (defaultMethod) {
        setSelectedPaymentMethodId(defaultMethod.id);
      } else {
        setSelectedPaymentMethodId(paymentMethods[0].id);
      }
    } else {
      setPaymentMethod('new');
    }
  }, [paymentMethods]);

  // Handle errors
  useEffect(() => {
    if (paymentError) {
      setDialogProps({
        title: 'Payment Error',
        message: paymentError,
        type: 'error',
      });
      setDialogVisible(true);
    }
  }, [paymentError]);

  const validateNewCardForm = () => {
    const errors: Record<string, string[]> = {};

    // Validate card number
    const cardResult = validateCreditCard(newCardForm.cardNumber);
    if (!cardResult.isValid) {
      errors.cardNumber = cardResult.errors;
    }

    // Validate CVV
    const cvvResult = validateCVV(newCardForm.cardCvv);
    if (!cvvResult.isValid) {
      errors.cardCvv = cvvResult.errors;
    }

    // Validate cardholder name
    const nameResult = validateRequired(newCardForm.cardholderName, 'Cardholder name');
    if (!nameResult.isValid) {
      errors.cardholderName = nameResult.errors;
    }

    // Validate expiry date
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(newCardForm.cardExpiry)) {
      errors.cardExpiry = ['Invalid expiry date format (MM/YY)'];
    } else {
      const [month, year] = newCardForm.cardExpiry.split('/');
      const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
      if (expiryDate <= new Date()) {
        errors.cardExpiry = ['Card has expired'];
      }
    }

    // Validate billing address required fields
    const requiredAddressFields = [
      { key: 'fullName', label: 'Full name' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'postalCode', label: 'Postal code' },
    ];

    requiredAddressFields.forEach(({ key, label }) => {
      const value = newCardForm.billingAddress[key as keyof typeof newCardForm.billingAddress];
      if (!value || value.trim().length === 0) {
        errors[`billingAddress.${key}`] = [`${label} is required`];
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePayment = async () => {
    if (!ticket) return;

    try {
      let paymentMethodId = selectedPaymentMethodId;

      // Create new payment method if needed
      if (paymentMethod === 'new') {
        const isValid = validateNewCardForm();
        if (!isValid) {
          setDialogProps({
            title: 'Validation Error',
            message: 'Please correct the errors and try again.',
            type: 'error',
          });
          setDialogVisible(true);
          return;
        }

        const createPaymentResult = await dispatch(createPaymentMethod({
          cardNumber: sanitizeCreditCard(newCardForm.cardNumber),
          cardholderName: sanitizeName(newCardForm.cardholderName),
          cardExpiry: newCardForm.cardExpiry.trim(),
          cardCvv: sanitizeCVV(newCardForm.cardCvv),
          billingAddress: {
            fullName: sanitizeName(newCardForm.billingAddress.fullName),
            address: newCardForm.billingAddress.address.trim(),
            city: newCardForm.billingAddress.city.trim(),
            state: newCardForm.billingAddress.state.trim(),
            country: newCardForm.billingAddress.country.trim(),
            postalCode: newCardForm.billingAddress.postalCode.trim().toUpperCase(),
          },
          isDefault: savePaymentMethod,
        })).unwrap();

        paymentMethodId = createPaymentResult.id;
      }

      // Process payment
      await dispatch(payTicket({
        ticketId: ticket.id,
        amount: ticket.fineAmount || 0,
        paymentMethodId,
        currency: 'CAD',
        description: `Payment for ticket ${ticket.ticketNumber || ticket.id}`,
      })).unwrap();

      setDialogProps({
        title: 'Payment Successful',
        message: `Your payment of $${(ticket.fineAmount || 0).toFixed(2)} has been processed successfully.`,
        type: 'success',
      });
      setDialogVisible(true);

      // Navigate back after delay
      setTimeout(() => {
        navigation.goBack();
      }, 3000);

    } catch (error: any) {
      setDialogProps({
        title: 'Payment Failed',
        message: error.message || 'Payment could not be processed. Please try again.',
        type: 'error',
      });
      setDialogVisible(true);
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  if (!ticket) {
    return (
      <AppLayout>
        <GoBackHeader screenTitle="Pay Now" />
        <ThemedView className="flex-1 justify-center items-center">
          <ThemedText>Loading ticket details...</ThemedText>
        </ThemedView>
      </AppLayout>
    );
  }

  return (
    <AppLayout scrollable={false}>
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <GoBackHeader screenTitle="Pay Now" />

        {/* Ticket Summary */}
        <ThemedCard className="mb-6">
          <ThemedView className="flex-row justify-between items-center mb-4">
            <ThemedText variant="tertiary" size="sm">Ticket #</ThemedText>
            <ThemedText weight="medium">{ticket.ticketNumber || ticket.id}</ThemedText>
          </ThemedView>
          
          <ThemedView className="flex-row justify-between items-center mb-4">
            <ThemedText variant="tertiary" size="sm">License Plate</ThemedText>
            <ThemedText weight="medium">{ticket.licensePlate}</ThemedText>
          </ThemedView>
          
          <ThemedView className="flex-row justify-between items-center mb-4">
            <ThemedText variant="tertiary" size="sm">Violation</ThemedText>
            <ThemedText weight="medium">{ticket.violationType}</ThemedText>
          </ThemedView>
          
          <View className="border-t border-border pt-4 mt-4">
            <ThemedView className="flex-row justify-between items-center">
              <ThemedText weight="bold" size="lg">Total Amount</ThemedText>
              <ThemedText weight="bold" size="xl" style={{ color: theme === 'dark' ? '#FFA366' : '#E18743' }}>
                ${(ticket.fineAmount || 0).toFixed(2)}
              </ThemedText>
            </ThemedView>
          </View>
        </ThemedCard>

        {/* Payment Method Selection */}
        <ThemedView className="mb-6">
          <ThemedText weight="bold" size="lg" className="mb-4">Payment Method</ThemedText>
          
          {paymentMethods.length > 0 && (
            <ThemedView className="mb-4">
              <TouchableOpacity
                onPress={() => setPaymentMethod('existing')}
                className={`flex-row items-center p-4 rounded-xl border ${
                  paymentMethod === 'existing' ? 'border-primary bg-primary-light' : 'border-border bg-background-secondary'
                }`}
              >
                <ThemedView 
                  className={`w-5 h-5 rounded-full border-2 mr-3 ${
                    paymentMethod === 'existing' ? 'border-primary bg-primary' : 'border-border'
                  }`}
                >
                  {paymentMethod === 'existing' && (
                    <ThemedView className="w-2 h-2 rounded-full bg-background m-auto" />
                  )}
                </ThemedView>
                <ThemedText weight="medium">Use Saved Payment Method</ThemedText>
              </TouchableOpacity>
              
              {paymentMethod === 'existing' && (
                <ThemedView className="mt-4">
                  {paymentMethods.map((pm) => (
                    <TouchableOpacity
                      key={pm.id}
                      onPress={() => setSelectedPaymentMethodId(pm.id)}
                      className={`flex-row items-center p-4 rounded-xl border mb-2 ${
                        selectedPaymentMethodId === pm.id ? 'border-primary bg-primary-light' : 'border-border bg-background'
                      }`}
                    >
                      <MaterialCommunityIcons
                        name="credit-card"
                        size={24}
                        color={theme === 'dark' ? '#FFA366' : '#E18743'}
                        style={{ marginRight: 12 }}
                      />
                      <ThemedView className="flex-1">
                        <ThemedText weight="medium">
                          •••• •••• •••• {pm.last4}
                        </ThemedText>
                        <ThemedText variant="tertiary" size="sm">
                          {pm.brand?.toUpperCase()} • Expires {pm.expMonth}/{pm.expYear}
                        </ThemedText>
                      </ThemedView>
                      {pm.isDefault && (
                        <ThemedView className="bg-primary px-2 py-1 rounded">
                          <ThemedText variant="inverse" size="xs">Default</ThemedText>
                        </ThemedView>
                      )}
                    </TouchableOpacity>
                  ))}
                </ThemedView>
              )}
            </ThemedView>
          )}

          <TouchableOpacity
            onPress={() => setPaymentMethod('new')}
            className={`flex-row items-center p-4 rounded-xl border ${
              paymentMethod === 'new' ? 'border-primary bg-primary-light' : 'border-border bg-background-secondary'
            }`}
          >
            <ThemedView 
              className={`w-5 h-5 rounded-full border-2 mr-3 ${
                paymentMethod === 'new' ? 'border-primary bg-primary' : 'border-border'
              }`}
            >
              {paymentMethod === 'new' && (
                <ThemedView className="w-2 h-2 rounded-full bg-background m-auto" />
              )}
            </ThemedView>
            <ThemedText weight="medium">Add New Payment Method</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* New Card Form */}
        {paymentMethod === 'new' && (
          <ThemedCard className="mb-6">
            <ThemedText weight="bold" className="mb-4">Card Information</ThemedText>
            
            {/* Card Number */}
            <ThemedView className="mb-4">
              <ThemedText variant="tertiary" size="sm" className="mb-2">Card Number</ThemedText>
              <ThemedInput
                value={newCardForm.cardNumber}
                onChangeText={(text) => {
                  const formatted = formatCardNumber(text);
                  if (formatted.replace(/\s/g, '').length <= 16) {
                    setNewCardForm(prev => ({ ...prev, cardNumber: formatted }));
                    if (validationErrors.cardNumber) {
                      setValidationErrors(prev => ({ ...prev, cardNumber: [] }));
                    }
                  }
                }}
                placeholder="1234 5678 9012 3456"
                keyboardType="numeric"
              />
              {validationErrors.cardNumber && validationErrors.cardNumber.length > 0 && (
                <ThemedText variant="error" size="xs" className="mt-1">
                  {validationErrors.cardNumber[0]}
                </ThemedText>
              )}
            </ThemedView>

            {/* Cardholder Name */}
            <ThemedView className="mb-4">
              <ThemedText variant="tertiary" size="sm" className="mb-2">Cardholder Name</ThemedText>
              <ThemedInput
                value={newCardForm.cardholderName}
                onChangeText={(text) => {
                  setNewCardForm(prev => ({ ...prev, cardholderName: text }));
                  if (validationErrors.cardholderName) {
                    setValidationErrors(prev => ({ ...prev, cardholderName: [] }));
                  }
                }}
                placeholder="John Doe"
                autoCapitalize="words"
              />
              {validationErrors.cardholderName && validationErrors.cardholderName.length > 0 && (
                <ThemedText variant="error" size="xs" className="mt-1">
                  {validationErrors.cardholderName[0]}
                </ThemedText>
              )}
            </ThemedView>

            {/* Expiry and CVV */}
            <ThemedView className="flex-row space-x-4 mb-4">
              <ThemedView className="flex-1">
                <ThemedText variant="tertiary" size="sm" className="mb-2">Expiry Date</ThemedText>
                <ThemedInput
                  value={newCardForm.cardExpiry}
                  onChangeText={(text) => {
                    const formatted = formatExpiryDate(text);
                    if (formatted.length <= 5) {
                      setNewCardForm(prev => ({ ...prev, cardExpiry: formatted }));
                      if (validationErrors.cardExpiry) {
                        setValidationErrors(prev => ({ ...prev, cardExpiry: [] }));
                      }
                    }
                  }}
                  placeholder="MM/YY"
                  keyboardType="numeric"
                />
                {validationErrors.cardExpiry && validationErrors.cardExpiry.length > 0 && (
                  <ThemedText variant="error" size="xs" className="mt-1">
                    {validationErrors.cardExpiry[0]}
                  </ThemedText>
                )}
              </ThemedView>
              
              <ThemedView className="flex-1">
                <ThemedText variant="tertiary" size="sm" className="mb-2">CVV</ThemedText>
                <ThemedInput
                  value={newCardForm.cardCvv}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/\D/g, '');
                    if (cleaned.length <= 4) {
                      setNewCardForm(prev => ({ ...prev, cardCvv: cleaned }));
                      if (validationErrors.cardCvv) {
                        setValidationErrors(prev => ({ ...prev, cardCvv: [] }));
                      }
                    }
                  }}
                  placeholder="123"
                  keyboardType="numeric"
                  secureTextEntry
                />
                {validationErrors.cardCvv && validationErrors.cardCvv.length > 0 && (
                  <ThemedText variant="error" size="xs" className="mt-1">
                    {validationErrors.cardCvv[0]}
                  </ThemedText>
                )}
              </ThemedView>
            </ThemedView>

            {/* Billing Address */}
            <ThemedText weight="bold" className="mb-4 mt-4">Billing Address</ThemedText>
            
            <ThemedView className="mb-4">
              <ThemedText variant="tertiary" size="sm" className="mb-2">Full Name</ThemedText>
              <ThemedInput
                value={newCardForm.billingAddress.fullName}
                onChangeText={(text) => 
                  setNewCardForm(prev => ({ 
                    ...prev, 
                    billingAddress: { ...prev.billingAddress, fullName: text }
                  }))
                }
                placeholder="John Doe"
                autoCapitalize="words"
              />
            </ThemedView>

            <ThemedView className="mb-4">
              <ThemedText variant="tertiary" size="sm" className="mb-2">Address</ThemedText>
              <ThemedInput
                value={newCardForm.billingAddress.address}
                onChangeText={(text) => 
                  setNewCardForm(prev => ({ 
                    ...prev, 
                    billingAddress: { ...prev.billingAddress, address: text }
                  }))
                }
                placeholder="123 Main Street"
                autoCapitalize="words"
              />
            </ThemedView>

            <ThemedView className="flex-row space-x-4 mb-4">
              <ThemedView className="flex-1">
                <ThemedText variant="tertiary" size="sm" className="mb-2">City</ThemedText>
                <ThemedInput
                  value={newCardForm.billingAddress.city}
                  onChangeText={(text) => 
                    setNewCardForm(prev => ({ 
                      ...prev, 
                      billingAddress: { ...prev.billingAddress, city: text }
                    }))
                  }
                  placeholder="Toronto"
                  autoCapitalize="words"
                />
              </ThemedView>
              
              <ThemedView className="flex-1">
                <ThemedText variant="tertiary" size="sm" className="mb-2">Postal Code</ThemedText>
                <ThemedInput
                  value={newCardForm.billingAddress.postalCode}
                  onChangeText={(text) => 
                    setNewCardForm(prev => ({ 
                      ...prev, 
                      billingAddress: { ...prev.billingAddress, postalCode: text.toUpperCase() }
                    }))
                  }
                  placeholder="M5V 3A1"
                  autoCapitalize="characters"
                />
              </ThemedView>
            </ThemedView>

            {/* Save Payment Method */}
            <TouchableOpacity
              onPress={() => setSavePaymentMethod(!savePaymentMethod)}
              className="flex-row items-center mt-4"
            >
              <ThemedView 
                className={`w-5 h-5 rounded border-2 mr-3 ${
                  savePaymentMethod ? 'border-primary bg-primary' : 'border-border'
                }`}
              >
                {savePaymentMethod && (
                  <Ionicons name="checkmark" size={12} color="white" style={{ alignSelf: 'center' }} />
                )}
              </ThemedView>
              <ThemedText>Save payment method for future use</ThemedText>
            </TouchableOpacity>
          </ThemedCard>
        )}

        {/* Payment Button */}
        <ThemedButton
          variant="primary"
          onPress={handlePayment}
          disabled={isPaying || isCreatingPaymentMethod}
          className="mb-8"
          size="lg"
        >
          {isPaying || isCreatingPaymentMethod 
            ? 'Processing...' 
            : `Pay $${(ticket.fineAmount || 0).toFixed(2)}`
          }
        </ThemedButton>

        {/* Security Notice */}
        <ThemedView className="flex-row items-center justify-center mb-8">
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={theme === 'dark' ? '#10B981' : '#16A34A'}
            style={{ marginRight: 8 }}
          />
          <ThemedText variant="tertiary" size="sm">
            Secure payment powered by Stripe
          </ThemedText>
        </ThemedView>
      </ScrollView>

      <Dialog
        visible={dialogVisible}
        title={dialogProps.title}
        message={dialogProps.message}
        type={dialogProps.type}
        onClose={() => setDialogVisible(false)}
      />
    </AppLayout>
  );
}