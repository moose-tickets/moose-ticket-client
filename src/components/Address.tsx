import React, { useState } from 'react';
import {
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { ThemedView, ThemedText, ThemedInput } from './ThemedComponents';
import { useTranslation } from 'react-i18next';


interface AddressFormProps {
  initialData?: {
    fullName?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  onSubmit: (data: AddressFormProps['initialData']) => void;
}

export default function AddressForm({
  initialData,
  onSubmit,
}: AddressFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    country: initialData?.country || '',
    postalCode: initialData?.postalCode || '',
  });

  const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onSubmit(updated);
  };

  return (
    <ThemedView variant="card" className='space-y-4 p-4 rounded-2xl mt-2'>
      <ThemedText size="lg" weight="bold" className='mb-2'>
        {t('payments.billingAddress')}
      </ThemedText>
      
      {/* Full Name Field */}
      <ThemedView className='mb-4'>
        <ThemedText variant="secondary" size="sm" className='mb-2'>{t('profile.fullName')}</ThemedText>
        <ThemedInput
          placeholder={t('profile.fullNamePlaceholder')}
          className='rounded-xl'
          value={formData.fullName}
          onChangeText={(v) => handleChange('fullName', v)}
        />
      </ThemedView>
      
      <ThemedView className='mb-4'>
        <ThemedText variant="secondary" size="sm" className='mb-2'>{t('profile.streetAddress')}</ThemedText>
        <ThemedInput
          placeholder={t('profile.streetAddressPlaceholder')}
          className='rounded-xl'
          value={formData.address}
          onChangeText={(v) => handleChange('address', v)}
        />
      </ThemedView>

      <ThemedView className='flex-row space-x-4'>
        <ThemedView className='flex-1'>
          <ThemedText variant="secondary" size="sm" className='mb-2'>{t('profile.city')}</ThemedText>
          <ThemedInput
            placeholder={t('profile.cityPlaceholder')}
            className='rounded-xl mb-4 mx-1'
            value={formData.city}
            onChangeText={(v) => handleChange('city', v)}
          />
        </ThemedView>

        <ThemedView className='flex-1'>
          <ThemedText variant="secondary" size="sm" className='mb-2'>{t('profile.stateProvince')}</ThemedText>
          <ThemedInput
            placeholder={t('profile.stateProvincePlaceholder')}
            className='rounded-xl mb-4'
            value={formData.state}
            onChangeText={(v) => handleChange('state', v)}
          />
        </ThemedView>
      </ThemedView>
      <ThemedView className='flex-row space-x-4'>
        <ThemedView className='flex-1'>
          <ThemedText variant="secondary" size="sm" className='mb-2'>{t('profile.country')}</ThemedText>
          <ThemedInput
            placeholder={t('profile.countryPlaceholder')}
            className='rounded-xl mb-4 mx-1'
            value={formData.country}
            onChangeText={(v) => handleChange('country', v)}
          />
        </ThemedView>

        <ThemedView className='w-50'>
          <ThemedText variant="secondary" size="sm" className='mb-2'>{t('profile.postalCode')}</ThemedText>
          <ThemedInput
            placeholder={t('profile.postalCodePlaceholder')}
            className='rounded-xl mb-4'
            value={formData.postalCode}
            onChangeText={(v) => handleChange('postalCode', v)}
          />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
