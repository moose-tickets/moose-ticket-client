import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../../store';
import { useSettingsStackNavigation } from '../../../navigation/hooks';
import { SettingsStackParamList } from '../../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import GoBackHeader from '../../../components/GoBackHeader';
import AppLayout from '../../../wrappers/layout';
import Checkbox from 'expo-checkbox';
import { ThemedView, ThemedText, ThemedButton, ThemedInput, ThemedScrollView } from '../../../components/ThemedComponents';
import { useTheme } from '../../../wrappers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import {
  createAddress,
  updateAddress,
  selectAddresses,
  selectIsCreatingAddress,
  selectIsUpdatingAddress,
} from '../../../store/slices/userSlice';

export default function AddEditAddress() {
  const navigation = useSettingsStackNavigation();
  const route = useRoute<RouteProp<SettingsStackParamList, 'EditAddress' | 'AddAddress'>>();
  const { theme, presets } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  
  // Get addressId from route params
  const addressId = (route.params as any)?.addressId;
  const isEditing = !!addressId;
  
  // Redux state
  const addresses = useSelector(selectAddresses);
  const isCreating = useSelector(selectIsCreatingAddress);
  const isUpdating = useSelector(selectIsUpdatingAddress);
  const isLoading = isCreating || isUpdating;
  
  // Form state
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('ON');
  const [country, setCountry] = useState('Canada');
  const [postalCode, setPostalCode] = useState('');
  const [type, setType] = useState<'home' | 'work' | 'billing' | 'other'>('home');
  const [isDefault, setIsDefault] = useState(false);
  
  // Load existing address data if editing
  useEffect(() => {
    if (isEditing && addresses.length > 0) {
      const existingAddress = addresses.find(addr => addr.id === addressId);
      if (existingAddress) {
        setStreet(existingAddress.street || '');
        setApartment(existingAddress.apartment || '');
        setCity(existingAddress.city || '');
        setState(existingAddress.state || 'ON');
        setCountry(existingAddress.country || 'Canada');
        setPostalCode(existingAddress.postalCode || '');
        setType(existingAddress.type || 'home');
        setIsDefault(existingAddress.isDefault || false);
      }
    }
  }, [isEditing, addressId, addresses]);

  const handleSave = async () => {
    if (!street.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
      Alert.alert(t('common.error'), t('profile.fillRequiredFields'));
      return;
    }

    const addressData = {
      street: street.trim(),
      apartment: apartment.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      postalCode: postalCode.trim().toUpperCase(),
      type,
      isDefault,
    };

    try {
      if (isEditing) {
        await dispatch(updateAddress({ addressId, updates: addressData })).unwrap();
        Alert.alert(t('common.success'), t('profile.addressUpdated'));
      } else {
        await dispatch(createAddress(addressData)).unwrap();
        Alert.alert(t('common.success'), t('profile.addressCreated'));
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(t('common.error'), error || t('profile.addressSaveError'));
    }
  };

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5'>
        {/* Header */}
        <GoBackHeader screenTitle={isEditing ? t('profile.editAddress') : t('profile.addAddress')} />

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
              value={apartment}
              onChangeText={setApartment}
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
            <ThemedInput
              placeholder={t('profile.provinceExample')}
              value={state}
              onChangeText={setState}
            />
          </ThemedView>

          <ThemedView>
            <ThemedText variant='primary' size='base' className='mb-1'>{t('profile.zipPostalCode')}</ThemedText>
            <ThemedInput
              placeholder={t('profile.postalCodeExample')}
              value={postalCode}
              onChangeText={setPostalCode}
            />
          </ThemedView>
          
          <ThemedView>
            <ThemedText variant='primary' size='base' className='mb-1'>{t('profile.country')}</ThemedText>
            <ThemedInput
              placeholder={t('profile.countryExample')}
              value={country}
              onChangeText={setCountry}
            />
          </ThemedView>
          
          <ThemedView>
            <ThemedText variant='primary' size='base' className='mb-1'>{t('profile.addressType')}</ThemedText>
            <ThemedView className='flex-row space-x-2 mt-2'>
              {(['home', 'work', 'billing', 'other'] as const).map((addressType) => (
                <TouchableOpacity
                  key={addressType}
                  onPress={() => setType(addressType)}
                  className={`px-3 py-2 rounded-lg border ${
                    type === addressType ? 'border-primary bg-primary-light' : 'border-border'
                  }`}
                >
                  <ThemedText
                    variant={type === addressType ? 'primary' : 'secondary'}
                    size='sm'
                    weight={type === addressType ? 'semibold' : 'normal'}
                  >
                    {t(`profile.addressType.${addressType}`)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          </ThemedView>
          
          <ThemedView className='flex-row items-center space-x-3 mt-2'>
            <Checkbox
              value={isDefault}
              onValueChange={setIsDefault}
              color={isDefault ? (theme === 'dark' ? '#22C55E' : '#E08631') : undefined}
              className=''
            />
            <ThemedText variant='primary' size='base' className='mx-2'>
              {t('profile.setAsDefault')}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Save Button */}
        <ThemedButton
          onPress={handleSave}
          variant='primary'
          size='lg'
          className='mt-8'
          disabled={isLoading}
        >
          {isLoading ? t('common.loading') : (isEditing ? t('profile.updateAddress') : t('profile.saveAddress'))}
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
