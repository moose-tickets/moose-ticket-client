import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../wrappers/ThemeProvider';
import { ThemedText, ThemedView } from './ThemedComponents';

const GoBackHeader = ({screenTitle}: {screenTitle: string}) => {
    const navigation = useNavigation();
    const { theme } = useTheme();

    return (
       <ThemedView className='flex-row items-center justify-between px-4 py-4'>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons 
                name='chevron-back' 
                size={24} 
                color={theme === 'dark' ? '#F8FAFC' : '#1E1E1E'} 
              />
            </TouchableOpacity>
            <ThemedText size="lg" weight="bold">
              {screenTitle}
            </ThemedText>
            <View className='w-6' />
          </ThemedView>
    );
}

export default GoBackHeader;
