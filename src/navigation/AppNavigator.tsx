// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../store';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import Splash from '../screens/splash';
import ToggleScreen from '../screens/Commons/Toggle';
import AuthWatcher from '../components/AuthWatcher';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  // We’re not deciding here based on token—Splash will do that later.
  return (
    <>
      <AuthWatcher />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name='Splash' component={Splash} />
        <Stack.Screen name='Auth' component={AuthNavigator} />
        <Stack.Screen name='Main' component={MainNavigator} />
      </Stack.Navigator>
    </>
  );
}
