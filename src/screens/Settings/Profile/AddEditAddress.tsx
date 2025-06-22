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
import { useTranslation } from 'react-i18next';

export default function AddEditAddress() {
  const navigation = useSettingsStackNavigation();
  const route = useRoute<RouteProp<SettingsStackParamList, 'EditAddress'>>();
  const { theme, presets } = useTheme();
  const { t } = useTranslation();
  const userId = route.params.userId;
  const [street, setStreet] = useState('');
  const [apt, setApt] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('ON');
  const [postalCode, setPostalCode] = useState('');
  const [isBilling, setIsBilling] = useState(false);

  const handleSave = () => {
    if (!street || !city || !province || !postalCode) {
      alert(t('profile.fillRequiredFields'));
      return;
    }

    // TODO: Save logic here (e.g. API call)
    navigation.goBack();
  };

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5'>
        {/* Header */}
        <GoBackHeader screenTitle={userId ? t('profile.editAddress') : t('profile.addAddress')} />

        {/* Input Fields */}
        <ThemedView className='space-y-4 py-10'>
          <ThemedView>
            <ThemedText variant='primary' size='base' className='mb-1'>{t('profile.streetAddress')}</ThemedText>
            <ThemedInput
              placeholder={t('profile.streetAddressExample')}
              value={street}
              onChangeText={setStreet}
            />
          </ThemedView>

          <ThemedView>
            <ThemedText variant='primary' size='base' className='mb-1'>
              {t('profile.aptSuiteUnit')}
            </ThemedText>
            <ThemedInput
              placeholder={t('profile.aptSuiteUnitExample')}
              value={apt}
              onChangeText={setApt}
            />
          </ThemedView>

          <ThemedView>
            <ThemedText variant='primary' size='base' className='mb-1'>{t('profile.city')}</ThemedText>
            <ThemedInput
              placeholder={t('profile.cityExample')}
              value={city}
              onChangeText={setCity}
            />
          </ThemedView>

          <ThemedView>
            <ThemedText variant='primary' size='base' className='mb-1'>{t('profile.provinceState')}</ThemedText>
            <ThemedView className='border border-border rounded-lg p-3'>
              <ThemedText variant='primary'>{province}</ThemedText>
              {/* You can expand this to a dropdown later */}
            </ThemedView>
          </ThemedView>

          <ThemedView>
            <ThemedText variant='primary' size='base' className='mb-1'>{t('profile.zipPostalCode')}</ThemedText>
            <ThemedInput
              placeholder={t('profile.postalCodeExample')}
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
              {t('profile.useAsBillingAddress')}
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
{userId ? t('profile.updateAddress') : t('profile.saveAddress')}
        </ThemedButton>

        {/* Cancel */}
        <ThemedButton
          onPress={() => navigation.goBack()}
          variant='ghost'
          className='mt-4'
        >
{t('common.cancel')}
        </ThemedButton>
      </ThemedScrollView>
    </AppLayout>
  );
}
