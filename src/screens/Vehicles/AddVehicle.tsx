import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SettingsStackParamList, TicketStackParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import Dialog from '../../components/Dialog';
import { ThemedView, ThemedText, ThemedInput, ThemedButton, ThemedScrollView } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';

export default function AddVehicle() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const route = useRoute<RouteProp<SettingsStackParamList | TicketStackParamList, 'AddVehicle'>>();
  const vehicleId = route.params?.vehicleId;
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

  const handleSave = () => {
    if (!licensePlate || !make || !year || !model) {
      alert('Please fill all required fields.');
      return;
    }

    const vehicle = { licensePlate, make, year, color, model };
    console.log('Saving vehicle:', vehicle);

    setDialogProps({
      title: 'New Vehicle Added',
      message: 'Vehicle added successfully',
      type: 'success',
    });
    setDialogVisible(true);
  };

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5'>
        {/* Header */}
        <GoBackHeader
          screenTitle={vehicleId ? 'Edit Vehicle' : 'Add Vehicle'}
        />

        <ThemedView className='space-y-4'>
          <ThemedText size='base' weight='medium' className='mt-4'>Plate Number</ThemedText>
          <ThemedInput
            placeholder='ABC1234'
            value={licensePlate}
            onChangeText={setLicensePlate}
            className='mb-3'
          />
          <ThemedText size='base' weight='medium' className='mt-4'>Make</ThemedText>
          <ThemedInput
            placeholder='Honda'
            value={make}
            onChangeText={setMake}
            className='mb-3'
          />
          <ThemedText size='base' weight='medium' className='mt-4'>Year</ThemedText>
          <ThemedInput
            placeholder={`${new Date().getFullYear() - 1}`}
            keyboardType='numeric'
            value={year}
            onChangeText={setYear}
            className='mb-3'
          />
          <ThemedText size='base' weight='medium' className='mt-4'>Model</ThemedText>
          <ThemedInput
            placeholder='Civic'
            value={model}
            onChangeText={setModel}
            className='mb-3'
          />
          <ThemedText size='base' weight='medium' className='mt-4'>Color (Optional)</ThemedText>
          <ThemedInput
            placeholder='Midnight Blue'
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
        >
          {vehicleId ? 'Update Vehicle' : 'Save Vehicle'}
        </ThemedButton>
        {!vehicleId && (
          <ThemedText variant='tertiary' className='text-center mt-2'>
            You can add up to 2 vehicles.
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
