import { TouchableOpacity } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../wrappers/ThemeProvider';
import { ThemedText, ThemedView } from './ThemedComponents';

export default function Header({screenTitle}: {screenTitle: string}) {
      const navigation = useNavigation();
      const { theme } = useTheme();
  return (
    <ThemedView className='flex-row justify-between items-center mb-6'>
      <ThemedText size="2xl" weight="bold" className='text-secondary'>
        {screenTitle}
      </ThemedText>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons 
          name='close' 
          size={24} 
          color={theme === 'dark' ? '#22C55E' : '#10472B'} 
        />
      </TouchableOpacity>
    </ThemedView>
  );
}
