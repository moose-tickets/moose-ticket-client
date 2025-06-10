// src/screens/Profile/Profile.tsx

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../../../wrappers/layout';
import GoBackHeader from '../../../components/GoBackHeader';
import ConfirmationDialog from '../../../components/Dialog'; // Reuse your dialog component
import { useSettingsStackNavigation } from '../../../navigation/hooks';
import {
  ThemedView,
  ThemedText,
  ThemedButton,
  ThemedCard,
} from '../../../components/ThemedComponents';
import { useTheme } from '../../../wrappers/ThemeProvider';

export default function Profile() {
  const navigation = useSettingsStackNavigation();
  const { theme, presets } = useTheme();
  const [vehicles, setVehicles] = useState([
    {
      _id: '1',
      plate: 'ABC1234',
      year: '2019',
      make: ' Honda',
      model: 'Civic',
      color: 'Moonlight blue',
    },
    {
      _id: '2',
      plate: 'XYZ7890',
      year: '2021',
      make: ' Toyota',
      model: 'RAV4',
      color: 'White',
    },
  ]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null
  );

  const user = {
    _id: '93893373743847',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+1 (416) 555-0123',
    address: {
      street: '123 Main St',
      city: 'Toronto',
      state: 'ON',
      country: 'Canada',
      postalCode: 'M5H 2N2',
    },
    initials: 'JD',
  };

  const confirmDelete = (id: string) => {
    setSelectedVehicleId(id);
    setShowDialog(true);
  };

  const deleteVehicle = () => {
    setVehicles((prev) => prev.filter((v) => v._id !== selectedVehicleId));
    setShowDialog(false);
  };

  //check if user has an address

  return (
    <AppLayout scrollable={false}>
      {/* Header */}
      <GoBackHeader screenTitle='Profile' />

      {/* User Info */}
      <ThemedCard
        className='py-12 mb-4  items-start'
        variant={theme === 'dark' ? 'elevated' : 'default'}
      >
        <ThemedView
          variant='secondary'
          className=' w-full rounded-lg px-4 py-3  mb-2'
        >
          <ThemedView className='flex-row rounded-lg p-4'>
            <ThemedView className='bg-primary w-12 h-12 rounded-full justify-center items-center mr-4'>
              <ThemedText variant='inverse' weight='semibold'>
                {user.initials}
              </ThemedText>
            </ThemedView>
            <ThemedView className='flex-1'>
              <ThemedText variant='primary' weight='semibold' className='mb-1'>
                {user.name}
              </ThemedText>
              <ThemedText variant='secondary' size='sm' className='mb-1'>
                {user.email}
              </ThemedText>
              <ThemedText variant='secondary' size='sm' className='mb-1'>
                {user.phone}
              </ThemedText>
            </ThemedView>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('EditProfile', { userId: user._id })
              }
            >
              <Ionicons
                name='create-outline'
                size={18}
                color={theme === 'dark' ? '#22C55E' : '#10472B'}
              />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedCard>

      {/* Address */}
      {user.address && (
        <>
          <ThemedCard
            className=' mb-4 flex-row justify-between'
            variant={theme === 'dark' ? 'elevated' : 'default'}
          >
            <ThemedView
              variant='secondary'
              className=' w-full rounded-lg px-4 py-3  mb-2'
            >
              <ThemedView className='flex-row rounded-lg p-3'>
                <ThemedView className=' flex-1 rounded-xl px-3'>
                  <ThemedText variant='secondary' size='sm' className='mb-3'>
                    Address
                  </ThemedText>
                  <ThemedText variant='primary' className='mb-2'>
                    {user.address.street}
                  </ThemedText>
                  <ThemedText variant='primary' className='mb-2'>
                    {user.address.city}, {user.address.state}
                  </ThemedText>
                  <ThemedText variant='primary' className='mb-2'>
                    {user.address.postalCode}, {user.address.country}
                  </ThemedText>
                </ThemedView>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('EditAddress', { userId: user._id })
                  }
                >
                  <Ionicons
                    name='create-outline'
                    size={18}
                    color={theme === 'dark' ? '#22C55E' : '#10472B'}
                  />
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ThemedCard>
        </>
      )}

      {!user.address && (
        <ThemedButton
          variant='secondary'
          className='mt-2 mx-4'
          onPress={() => navigation.navigate('AddAddress')}
        >
          Add Address
        </ThemedButton>
      )}

      {/* Vehicles */}
      <ThemedView className='px-4 mb-2 my-10'>
        <ThemedView className='flex-row mb-2'>
          <ThemedText
            variant='primary'
            size='base'
            weight='semibold'
            className='flex-1 mb-2'
          >
            My Vehicles
          </ThemedText>
          <ThemedView className='mx-4 mb-4'>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddVehicle', {})}
            >
              <ThemedText
                size='sm'
                weight='medium'
                variant='underline'
                style={{
                  color: theme === 'dark' ? '#22C55E' : '#10472B',
                }}
              >
                + Add Vehicle
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        <FlatList
          data={vehicles}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ThemedView
              variant='secondary'
              className='rounded-lg px-4 py-3  mb-2'
            >
              <ThemedView className='w-full flex-row justify-between items-start rounded-xl p-4'>
                <ThemedView>
                  <ThemedText variant='primary' className='mb-2'>
                    {item.plate}
                  </ThemedText>
                  <ThemedText variant='primary' className='mb-2'>
                    {item.year} {item.color}
                  </ThemedText>
                  <ThemedText variant='primary' className='mb-2'>
                    {item.make} {item.model}
                  </ThemedText>
                </ThemedView>
                <ThemedView className='flex-row'>
                  <TouchableOpacity
                    onPress={() => confirmDelete(item._id)}
                    className='mx-4'
                  >
                    <Ionicons name='trash-outline' size={20} color='red' />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('EditVehicle', {
                        vehicleId: item._id,
                      })
                    }
                  >
                    <Ionicons
                      name='create-outline'
                      size={18}
                      color={theme === 'dark' ? '#22C55E' : '#10472B'}
                    />
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          )}
        />
      </ThemedView>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={showDialog}
        title='Delete Vehicle?'
        message='Are you sure you want to delete this vehicle from your profile?'
        onClose={() => setShowDialog(false)}
        onConfirm={deleteVehicle}
      />
    </AppLayout>
  );
}
