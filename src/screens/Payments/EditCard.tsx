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
import { useNavigation, useRoute } from '@react-navigation/native';
import AddressForm from '../../components/Address';
import GoBackHeader from '../../components/GoBackHeader';
import { ThemedView, ThemedText, ThemedInput, ThemedButton, ThemedScrollView } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';

export default function EditCard() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { cardId } = route.params as { cardId: string };

  // Pre-populate with existing card data
  const [cardName, setCardName] = useState('John Doe');
  const [cardNumber, setCardNumber] = useState('**** **** **** 1234');
  const [expiry, setExpiry] = useState('04/26');
  const [cvv, setCvv] = useState('');
  const [billingAddress, setBillingAddress] = useState({
    fullName: 'John Doe',
    address: '123 Main St',
    city: 'Toronto',
    state: 'ON',
    country: 'Canada',
    postalCode: 'M5V 3A8',
  });

  const [isDefault, setIsDefault] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);

  const handleUpdateCard = () => {
    if (!cardName || !expiry) {
      setDialogVisible(true);
      return;
    }

    console.log({
      cardId,
      cardName,
      expiry,
      cvv,
      billingAddress,
      isDefault
    });

    setDialogVisible(true);
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
            >
              Update Card
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
