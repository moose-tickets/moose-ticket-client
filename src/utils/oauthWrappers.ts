// src/utils/oauthWrappers.ts
// Wrapper functions to handle OAuth in Expo Go vs standalone builds
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

export const isExpoGo = Constants.appOwnership === 'expo';

// Check if we're running in Expo Go
export const showExpoGoMessage = (provider: string) => {
  if (isExpoGo) {
    Alert.alert(
      `${provider} Sign-In Not Available`,
      `${provider} Sign-In requires a development build or standalone app. It's not available in Expo Go.\n\nTo test OAuth:\n1. Create a development build with 'npx expo run:ios' or 'npx expo run:android'\n2. Or build a standalone app`,
      [{ text: 'OK' }]
    );
    return true;
  }
  return false;
};

// Wrapper for Google Sign-In
export const safeGoogleSignIn = async () => {
  if (showExpoGoMessage('Google')) {
    return { success: false, error: 'Google Sign-In not available in Expo Go' };
  }
  
  try {
    const { signInWithGoogle } = await import('./oauthHelpers');
    return await signInWithGoogle();
  } catch (error: any) {
    console.error('Google Sign-In error:', error);
    return { success: false, error: error.message || 'Google Sign-In failed' };
  }
};

// Wrapper for Apple Sign-In
export const safeAppleSignIn = async () => {
  if (Platform.OS !== 'ios') {
    Alert.alert('Not Available', 'Apple Sign-In is only available on iOS devices');
    return { success: false, error: 'Apple Sign-In only available on iOS' };
  }
  
  if (showExpoGoMessage('Apple')) {
    return { success: false, error: 'Apple Sign-In not available in Expo Go' };
  }
  
  try {
    const { signInWithApple } = await import('./oauthHelpers');
    return await signInWithApple();
  } catch (error: any) {
    console.error('Apple Sign-In error:', error);
    return { success: false, error: error.message || 'Apple Sign-In failed' };
  }
};

// Wrapper for Facebook Sign-In
export const safeFacebookSignIn = async () => {
  if (showExpoGoMessage('Facebook')) {
    return { success: false, error: 'Facebook Sign-In not available in Expo Go' };
  }
  
  try {
    const { signInWithFacebook } = await import('./oauthHelpers');
    return await signInWithFacebook();
  } catch (error: any) {
    console.error('Facebook Sign-In error:', error);
    return { success: false, error: error.message || 'Facebook Sign-In failed' };
  }
};

// Check if OAuth provider is available
export const isOAuthAvailable = (provider: 'google' | 'facebook' | 'apple'): boolean => {
  if (isExpoGo) return false;
  if (provider === 'apple' && Platform.OS !== 'ios') return false;
  return true;
};