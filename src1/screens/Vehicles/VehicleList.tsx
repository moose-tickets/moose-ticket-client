import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import { ThemedView, ThemedText, ThemedCard, ThemedButton, StatusBadge } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';
import { useNavigation } from '@react-navigation/native';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  isDefault: boolean;
}

const dummyVehicles: Vehicle[] = [
  {
    id: '1',
    make: 'Honda',
    model: 'Civic',
    year: 2020,
    licensePlate: 'ABC1234',
    color: 'Blue',
    isDefault: true,
  },
  {
    id: '2',
    make: 'Toyota',
    model: 'Camry',
    year: 2019,
    licensePlate: 'XYZ5678',
    color: 'White',
    isDefault: false,
  },
  {
    id: '3',
    make: 'Ford',
    model: 'F-150',
    year: 2021,
    licensePlate: 'DEF9012',
    color: 'Red',
    isDefault: false,
  },
];

export default function VehicleList() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [vehicles, setVehicles] = useState<Vehicle[]>(dummyVehicles);

  const handleSetDefault = (vehicleId: string) => {
    setVehicles(prev =>
      prev.map(vehicle => ({
        ...vehicle,
        isDefault: vehicle.id === vehicleId,
      }))
    );
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
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
              <StatusBadge status="info" label="Default" size="sm" />
            )}
          </ThemedView>
          
          <ThemedView className="ml-8">
            <ThemedView className="flex-row justify-between mb-1">
              <ThemedText variant="secondary" size="sm">License Plate:</ThemedText>
              <ThemedText weight="medium" size="sm">{item.licensePlate}</ThemedText>
            </ThemedView>
            <ThemedView className="flex-row justify-between">
              <ThemedText variant="secondary" size="sm">Color:</ThemedText>
              <ThemedText size="sm">{item.color}</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        
        <ThemedView className="ml-4 items-center">
          {!item.isDefault && (
            <TouchableOpacity
              onPress={() => handleSetDefault(item.id)}
              className="mb-2"
            >
              <ThemedText 
                size="xs" 
                weight="medium"
                style={{ color: theme === 'dark' ? '#3B82F6' : '#2563EB' }}
              >
                Set Default
              </ThemedText>
            </TouchableOpacity>
          )}
          <TouchableOpacity>
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={theme === 'dark' ? '#94A3B8' : '#6B7280'}
            />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ThemedCard>
  );

  return (
    <AppLayout scrollable={false}>
      {/* Header */}
      <GoBackHeader screenTitle="My Vehicles" />
      
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
            No Vehicles Added
          </ThemedText>
          <ThemedText variant="secondary" className="text-center mb-6">
            Add your vehicles to easily manage parking tickets
          </ThemedText>
          <ThemedButton
            onPress={() => navigation.navigate('AddVehicle')}
            variant="primary"
            size="lg"
          >
            Add Your First Vehicle
          </ThemedButton>
        </ThemedView>
      ) : (
        <ThemedView className="flex-1">
          <FlatList
            data={vehicles}
            renderItem={renderVehicleItem}
            keyExtractor={(item) => item.id}
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
              Add Another Vehicle
            </ThemedButton>
          </ThemedView>
        </ThemedView>
      )}
    </AppLayout>
  );
}
