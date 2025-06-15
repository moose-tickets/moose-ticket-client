import { Text, TouchableOpacity, View, Alert, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { useAppDispatch, useAppSelector } from '../../store';
import { loginWithOAuth } from '../../store/slices/authSlice';
import { configureGoogleSignIn, isAppleSignInAvailable } from '../../utils/oauthHelpers';
import { safeGoogleSignIn, safeAppleSignIn, safeFacebookSignIn, isOAuthAvailable } from '../../utils/oauthWrappers';

export default function Passport({ text }: { text: string }) {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector(state => state.auth);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    // Configure Google Sign-In
    configureGoogleSignIn();
    
    // Check Apple Sign-In availability
    setAppleAvailable(isAppleSignInAvailable());
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const result = await safeGoogleSignIn();
      if (result.success && result.user && result.token) {
        await dispatch(loginWithOAuth({
          provider: 'google',
          token: result.token,
          userData: result.user
        })).unwrap();
        Alert.alert('Success', 'Successfully signed in with Google!');
      } else {
        Alert.alert('Error', result.error || 'Google Sign-In failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Google Sign-In failed');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const result = await safeAppleSignIn();
      if (result.success && result.user && result.token) {
        await dispatch(loginWithOAuth({
          provider: 'apple',
          token: result.token,
          userData: result.user
        })).unwrap();
        Alert.alert('Success', 'Successfully signed in with Apple!');
      } else {
        Alert.alert('Error', result.error || 'Apple Sign-In failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Apple Sign-In failed');
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      const result = await safeFacebookSignIn();
      if (result.success && result.user && result.token) {
        await dispatch(loginWithOAuth({
          provider: 'facebook',
          token: result.token,
          userData: result.user
        })).unwrap();
        Alert.alert('Success', 'Successfully signed in with Facebook!');
      } else {
        Alert.alert('Error', result.error || 'Facebook Sign-In failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Facebook Sign-In failed');
    }
  };

  return (
    <View>
      <View className='flex-row items-center justify-center my-5'>
        <View className='h-px w-16 bg-gray-300' />
        <Text className='mx-2 text-gray-500 text-sm'>{text}</Text>
        <View className='h-px w-16 bg-gray-300' />
      </View>

      <View className='flex-row justify-center space-x-6 mb-6'>
        <TouchableOpacity
          className={`bg-gray-200 py-2 rounded-xl items-center mb-6 px-6 mx-3 ${isLoading ? 'opacity-50' : ''}`}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
        >
          <View className='w-10 h-10 rounded-full items-center justify-center'>
            <GoogleGIcon />
          </View>
        </TouchableOpacity>

        {appleAvailable && (
          <TouchableOpacity
            className={`bg-gray-200 py-2 rounded-xl items-center mb-6 px-6 mx-3 ${isLoading ? 'opacity-50' : ''}`}
            onPress={handleAppleSignIn}
            disabled={isLoading}
          >
            <FontAwesome name='apple' size={26} color='black' />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className={`bg-gray-200 py-2 rounded-xl items-center mb-6 px-6 mx-3 ${isLoading ? 'opacity-50' : ''}`}
          onPress={handleFacebookSignIn}
          disabled={isLoading}
        >
          <FontAwesome name='facebook' size={26} color='#1877F2' />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const GoogleGIcon = () => (
  <Svg width={28} height={28} viewBox='0 0 48 48'>
    <Defs>
      <LinearGradient id='googleGradient' x1='0' y1='0' x2='1' y2='1'>
        <Stop offset='0%' stopColor='#E94134' />
        <Stop offset='25%' stopColor='#EA4335' />
        <Stop offset='50%' stopColor='#FBBC05' />
        <Stop offset='75%' stopColor='#34A853' />
      </LinearGradient>
    </Defs>
    <Path
      d='M44.5 20H24v8.5h11.9C34.1 33.2 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l6.4-6.4C34.4 5.2 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.7 0 20.4-7.7 20.4-21 0-1.3-.1-2.7-.4-4z'
      fill='url(#googleGradient)'
    />
  </Svg>
);
