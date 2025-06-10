import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSettingsStackNavigation } from '../../../navigation/hooks';
import { SettingsStackParamList } from '../../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import GoBackHeader from '../../../components/GoBackHeader';
import AppLayout from '../../../wrappers/layout';
import Checkbox from 'expo-checkbox';
import { ThemedView, ThemedText, ThemedButton, ThemedInput, ThemedScrollView } from '../../../components/ThemedComponents';
import { useTheme } from '../../../wrappers/ThemeProvider';

export default function AddEditAddress() {
  const navigation = useSettingsStackNavigation();
  const route = useRoute<RouteProp<SettingsStackParamList, 'EditAddress'>>();
  const { theme, presets } = useTheme();
  const userId = route.params.userId;
  const [street, setStreet] = useState('');
  const [apt, setApt] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('ON');
  const [postalCode, setPostalCode] = useState('');
  const [isBilling, setIsBilling] = useState(false);

  const handleSave = () => {
    if (!street || !city || !province || !postalCode) {
      alert('Please fill all required fields.');
      return;
    }

    // TODO: Save logic here (e.g. API call)
    navigation.goBack();
  };

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5'>
        {/* Header */}
        <GoBackHeader screenTitle={userId ? 'Edit Address' : 'Add Address'} />

        {/* Input Fields */}
        <ThemedView className='space-y-4 py-10'>
          <ThemedView>
            <ThemedText variant='primary' size='base' className='mb-1'>Street Address</ThemedText>
            <ThemedInput
              placeholder='e.g., 123 Main St'
              value={street}
              onChangeText={setStreet}
            />
          </ThemedView>

          <ThemedView>
            <ThemedText variant='primary' size='base' className='mb-1'>
              Apt, Suite, Unit (Optional)
            </ThemedText>
            <ThemedInput
              placeholder='e.g., Apt 4B'
              value={apt}
              onChangeText={setApt}
            />
          </ThemedView>

          <ThemedView>
            <ThemedText variant='primary' size='base' className='mb-1'>City</ThemedText>
            <ThemedInput
              placeholder='e.g., Toronto'
              value={city}
              onChangeText={setCity}
            />
          </ThemedView>

          <ThemedView>
            <ThemedText variant='primary' size='base' className='mb-1'>Province / State</ThemedText>
            <ThemedView className='border border-border rounded-lg p-3'>
              <ThemedText variant='primary'>{province}</ThemedText>
              {/* You can expand this to a dropdown later */}
            </ThemedView>
          </ThemedView>

          <ThemedView>
            <ThemedText variant='primary' size='base' className='mb-1'>Zip/Postal Code</ThemedText>
            <ThemedInput
              placeholder='e.g., M1A 2B3'
              value={postalCode}
              onChangeText={setPostalCode}
            />
          </ThemedView>
          <ThemedView className='flex-row items-center space-x-3 mt-2'>
            <Checkbox
              value={isBilling}
              onValueChange={setIsBilling}
              color={isBilling ? (theme === 'dark' ? '#22C55E' : '#E08631') : undefined}
              className=''
            />
            <ThemedText variant='primary' size='base' className='mx-2'>
              Use as billing address
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Save Button */}
        <ThemedButton
          onPress={handleSave}
          variant='primary'
          size='lg'
          className='mt-8'
        >
          {userId ? 'Update Address' : 'Save Address'}
        </ThemedButton>

        {/* Cancel */}
        <ThemedButton
          onPress={() => navigation.goBack()}
          variant='ghost'
          className='mt-4'
        >
          Cancel
        </ThemedButton>
      </ThemedScrollView>
    </AppLayout>
  );
}
