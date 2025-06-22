import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SettingsStackParamList, TicketStackParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import Dialog from '../../components/Dialog';
import { ThemedView, ThemedText, ThemedInput, ThemedButton, ThemedScrollView } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store';
import { createVehicle, updateVehicle, selectVehicleLoading } from '../../store/slices/vehicleSlice';

export default function AddVehicle() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const route = useRoute<RouteProp<SettingsStackParamList | TicketStackParamList, 'AddVehicle'>>();
  const vehicleId = route.params?.vehicleId;
  
  // Redux state
  const isLoading = useAppSelector(selectVehicleLoading);
  
  // Form state
  const [licensePlate, setLicensePlate] = useState('');
  const [make, setMake] = useState('');
  const [year, setYear] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
  });

  const handleSave = async () => {
    if (!licensePlate || !make || !year || !model) {
      Alert.alert(t('auth.validationFailed'), t('vehicles.fillRequiredFields'));
      return;
    }

    const vehicleData = { 
      licensePlate: licensePlate.toUpperCase(), 
      make, 
      year: parseInt(year), 
      model, 
      color: color || undefined 
    };

    try {
      if (vehicleId) {
        await dispatch(updateVehicle({ vehicleId, ...vehicleData })).unwrap();
        setDialogProps({
          title: t('vehicles.vehicleUpdated'),
          message: t('vehicles.vehicleUpdatedSuccess'),
          type: 'success',
        });
      } else {
        await dispatch(createVehicle(vehicleData)).unwrap();
        setDialogProps({
          title: t('vehicles.vehicleAdded'),
          message: t('vehicles.vehicleAddedSuccess'),
          type: 'success',
        });
      }
      setDialogVisible(true);
    } catch (error: any) {
      setDialogProps({
        title: t('common.error'),
        message: error.message || t('vehicles.saveVehicleError'),
        type: 'error',
      });
      setDialogVisible(true);
    }
  };

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5'>
        {/* Header */}
        <GoBackHeader
          screenTitle={vehicleId ? t('vehicles.editVehicle') : t('vehicles.addVehicle')}
        />

        <ThemedView className='space-y-4'>
          <ThemedText size='base' weight='medium' className='mt-4'>{t('vehicles.plateNumber')}</ThemedText>
          <ThemedInput
            placeholder={t('vehicles.plateNumberPlaceholder')}
            value={licensePlate}
            onChangeText={setLicensePlate}
            className='mb-3'
          />
          <ThemedText size='base' weight='medium' className='mt-4'>{t('vehicles.make')}</ThemedText>
          <ThemedInput
            placeholder={t('vehicles.makePlaceholder')}
            value={make}
            onChangeText={setMake}
            className='mb-3'
          />
          <ThemedText size='base' weight='medium' className='mt-4'>{t('vehicles.year')}</ThemedText>
          <ThemedInput
            placeholder={`${new Date().getFullYear() - 1}`}
            keyboardType='numeric'
            value={year}
            onChangeText={setYear}
            className='mb-3'
          />
          <ThemedText size='base' weight='medium' className='mt-4'>{t('vehicles.model')}</ThemedText>
          <ThemedInput
            placeholder={t('vehicles.modelPlaceholder')}
            value={model}
            onChangeText={setModel}
            className='mb-3'
          />
          <ThemedText size='base' weight='medium' className='mt-4'>{t('vehicles.colorOptional')}</ThemedText>
          <ThemedInput
            placeholder={t('vehicles.colorPlaceholder')}
            value={color}
            onChangeText={setColor}
            className='mb-3'
          />
        </ThemedView>

        <ThemedButton
          onPress={handleSave}
          variant='primary'
          size='lg'
          className='mt-8'
          disabled={isLoading}
        >
          {isLoading ? t('common.loading') : (vehicleId ? t('vehicles.updateVehicle') : t('vehicles.saveVehicle'))}
        </ThemedButton>
        {!vehicleId && (
          <ThemedText variant='tertiary' className='text-center mt-2'>
            {t('vehicles.vehicleLimit')}
          </ThemedText>
        )}
      </ThemedScrollView>
      <Dialog
        visible={dialogVisible}
        title={dialogProps.title}
        message={dialogProps.message}
        type={dialogProps.type}
        onClose={() => {
          setDialogVisible(false);
          if (dialogProps.type === 'success') {
            navigation.goBack();
          }
        }}
      />
    </AppLayout>
  );
}
