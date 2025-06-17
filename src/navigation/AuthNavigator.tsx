// SignIn, SignUp, ForgotPassword

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignIn from '../screens/Auth/SignIn';
import SignUp from '../screens/Auth/SignUp';
import ForgotPassword from '../screens/Auth/ForgotPassword';
import EmailVerified from '../screens/Auth/EmailVerified';
import OnboardingCarousel from '../screens/Onboarding/Onboarding';
import Terms from '../screens/Settings/HelpSupport/Terms';
import Privacy from '../screens/Settings/HelpSupport/Privacy';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName='Onboarding'
      screenOptions={{
        headerShown: false, // hide headers if you’re using custom headers in each screen
      }}
    >
      <Stack.Screen name='Onboarding' component={OnboardingCarousel} />
      <Stack.Screen name='SignIn' component={SignIn} />
      <Stack.Screen name='SignUp' component={SignUp} />
      <Stack.Screen name='ForgotPassword' component={ForgotPassword} />
      <Stack.Screen name='EmailVerified' component={EmailVerified} />
      <Stack.Screen name='Terms' component={Terms} />
      <Stack.Screen name='Privacy' component={Privacy} />
    </Stack.Navigator>
  );
}
