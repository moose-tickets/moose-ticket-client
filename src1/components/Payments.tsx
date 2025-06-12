import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../wrappers/ThemeProvider';
import { ThemedText, ThemedView } from './ThemedComponents';

const Payments = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  return (
    <ThemedView>
      <ThemedText size="base" weight="semibold" className='mb-3'>
        Payment Method
      </ThemedText>

      <TouchableOpacity className='flex-row items-center justify-between mb-4'>
        <ThemedView className='flex-row items-center'>
          <Ionicons 
            name='card-outline' 
            size={20} 
            color={theme === 'dark' ? '#F8FAFC' : '#1E1E1E'} 
          />
          <ThemedText className='ml-3'>
            **** **** **** 1234
          </ThemedText>
        </ThemedView>
        <ThemedText variant="tertiary" size="sm">
          Expires 03/26
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('AddPaymentMethod')}>
        <ThemedText size="sm" weight="medium" className='text-secondary'>
          + Add New Card
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

export default Payments;
