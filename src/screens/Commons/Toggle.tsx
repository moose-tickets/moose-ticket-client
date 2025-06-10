// ToggleScreen.tsx
import React, { useState } from 'react';
import { View, Text, Switch } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectTheme, toggleTheme } from '../../redux/appSlice';

export default function ToggleScreen() {
  const [isEnabled, setIsEnabled] = useState(false);
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  const toggleSwitch = () => {
    const newValue = !isEnabled;
    console.log(`Switch toggled to: ${newValue}`);
    setIsEnabled(newValue);
    dispatch(toggleTheme());
  };
  console.log(`Color scheme changed to: ${theme}`);

  return (
    <View className='flex-1 items-center justify-center bg-white'>
      
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
          ios_backgroundColor='#3e3e3e'
          onValueChange={toggleSwitch}
          value={isEnabled} // Use colorScheme to determine switch state
        />
    </View>
  );
}
