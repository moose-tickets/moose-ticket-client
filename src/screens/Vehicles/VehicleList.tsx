import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import { ThemedView, ThemedText, ThemedCard, ThemedButton, StatusBadge } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  fetchVehicles, 
  setDefaultVehicle, 
  deleteVehicle, 
  selectVehicles, 
  selectVehicleLoading, 
  selectVehicleError 
} from '../../store/slices/vehicleSlice';

export default function VehicleList() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  // Redux state
  const vehicles = useAppSelector(selectVehicles);
  const isLoading = useAppSelector(selectVehicleLoading);
  const error = useAppSelector(selectVehicleError);

  // Fetch vehicles on mount
  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  // Handle error display
  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), error, [
        { text: t('common.ok'), onPress: () => {} }
      ]);
    }
  }, [error, t]);

  const handleSetDefault = async (vehicleId: string) => {
    try {
      await dispatch(setDefaultVehicle(vehicleId)).unwrap();
    } catch (error) {
      Alert.alert(t('common.error'), t('vehicles.setDefaultError'));
    }
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    Alert.alert(
      t('vehicles.deleteVehicle'),
      t('vehicles.deleteVehicleConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteVehicle(vehicleId)).unwrap();
            } catch (error) {
              Alert.alert(t('common.error'), t('vehicles.deleteVehicleError'));
            }
          }
        }
      ]
    );
  };

  const renderVehicleItem = ({ item }: { item: any }) => (
    <ThemedCard className="mb-3">
      <ThemedView className="flex-row items-center justify-between">
        <ThemedView className="flex-1">
          <ThemedView className="flex-row items-center mb-2">
            <MaterialIcons
              name="directions-car"
              size={24}
              color={theme === 'dark' ? '#94A3B8' : '#6B7280'}
              style={{ marginRight: 8 }}
            />
            <ThemedText weight="semibold" size="lg">
              {item.year} {item.make} {item.model}
            </ThemedText>
            {item.isDefault && (
              <StatusBadge status="info" label={t('vehicles.default')} size="sm" />
            )}
          </ThemedView>
          
          <ThemedView className="ml-8">
            <ThemedView className="flex-row justify-between mb-1">
              <ThemedText variant="secondary" size="sm">{t('vehicles.licensePlate')}:</ThemedText>
              <ThemedText weight="medium" size="sm">{item.licensePlate}</ThemedText>
            </ThemedView>
            <ThemedView className="flex-row justify-between">
              <ThemedText variant="secondary" size="sm">{t('vehicles.color')}:</ThemedText>
              <ThemedText size="sm">{item.color}</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        
        <ThemedView className="ml-4 items-center">
          {!item.isDefault && (
            <TouchableOpacity
              onPress={() => handleSetDefault(item._id)}
              className="mb-2"
            >
              <ThemedText 
                size="xs" 
                weight="medium"
                style={{ color: theme === 'dark' ? '#3B82F6' : '#2563EB' }}
              >
                {t('vehicles.setDefault')}
              </ThemedText>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleDeleteVehicle(item._id)}>
            <Ionicons
              name="trash-outline"
              size={20}
              color={theme === 'dark' ? '#EF4444' : '#DC2626'}
            />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ThemedCard>
  );

  return (
    <AppLayout scrollable={false}>
      {/* Header */}
      <GoBackHeader screenTitle={t('vehicles.myVehicles')} />
      
      {/* Empty State or Vehicle List */}
      {vehicles.length === 0 ? (
        <ThemedView className="flex-1 justify-center items-center px-4">
          <MaterialIcons
            name="directions-car"
            size={64}
            color={theme === 'dark' ? '#4A5158' : '#9CA3AF'}
            style={{ marginBottom: 16 }}
          />
          <ThemedText size="lg" weight="semibold" className="mb-2 text-center">
            {t('vehicles.noVehiclesAdded')}
          </ThemedText>
          <ThemedText variant="secondary" className="text-center mb-6">
            {t('vehicles.addVehiclesDescription')}
          </ThemedText>
          <ThemedButton
            onPress={() => navigation.navigate('AddVehicle')}
            variant="primary"
            size="lg"
          >
            {t('vehicles.addFirstVehicle')}
          </ThemedButton>
        </ThemedView>
      ) : (
        <ThemedView className="flex-1">
          <FlatList
            data={vehicles}
            renderItem={renderVehicleItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ 
              paddingHorizontal: 16, 
              paddingBottom: 100 
            }}
            showsVerticalScrollIndicator={false}
          />
          
          {/* Add Vehicle Button */}
          <ThemedView className="absolute bottom-6 left-6 right-6">
            <ThemedButton
              onPress={() => navigation.navigate('AddVehicle')}
              variant="secondary"
              size="lg"
            >
              {t('vehicles.addAnotherVehicle')}
            </ThemedButton>
          </ThemedView>
        </ThemedView>
      )}
    </AppLayout>
  );
}
