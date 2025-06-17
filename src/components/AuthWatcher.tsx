// src/components/AuthWatcher.tsx
import { useEffect, useRef } from 'react';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAppSelector } from '../store';
import { selectIsAuthenticated } from '../store/slices/authSlice';

/**
 * AuthWatcher monitors authentication state changes and handles navigation
 * when user logs out to ensure they're redirected to the sign in screen
 */
export default function AuthWatcher() {
  const navigation = useNavigation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const previousAuthState = useRef<boolean | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Skip the first render to avoid interfering with app initialization
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      previousAuthState.current = isAuthenticated;
      return;
    }

    // Check if user just logged out (was authenticated, now not)
    if (previousAuthState.current === true && isAuthenticated === false) {
      console.log('🚪 User logged out, navigating to sign in screen');
      
      // Use reset to clear the navigation stack and go to auth
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Auth', params: { screen: 'SignIn' } }],
        })
      );
    }

    // Update previous state
    previousAuthState.current = isAuthenticated;
  }, [isAuthenticated, navigation]);

  // This component doesn't render anything
  return null;
}