// src/utils/oauthHelpers.ts
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamic imports to handle module availability
let GoogleSignin: any = null;
let AppleAuthentication: any = null;
let FacebookAuth: any = null;

// Check if we're in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Safely load modules
const loadGoogleSignin = () => {
  if (isExpoGo) return null;
  try {
    return require('@react-native-google-signin/google-signin');
  } catch (error) {
    console.warn('Google Sign-In module not available:', error);
    return null;
  }
};

const loadAppleAuth = () => {
  if (isExpoGo) return null;
  try {
    return require('expo-apple-authentication');
  } catch (error) {
    console.warn('Apple Authentication module not available:', error);
    return null;
  }
};

const loadFacebookAuth = () => {
  if (isExpoGo) return null;
  try {
    return require('react-native-fbsdk-next');
  } catch (error) {
    console.warn('Facebook SDK module not available:', error);
    return null;
  }
};

export interface OAuthUser {
  id: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  provider: 'google' | 'facebook' | 'apple';
}

export interface OAuthResult {
  success: boolean;
  user?: OAuthUser;
  token?: string;
  error?: string;
}

// Google Sign-In Configuration
export const configureGoogleSignIn = () => {
  if (isExpoGo) {
    console.log('Skipping Google Sign-In configuration in Expo Go');
    return;
  }

  try {
    GoogleSignin = loadGoogleSignin();
    if (!GoogleSignin) {
      console.warn('Google Sign-In module not available');
      return;
    }

    const webClientId = Constants.expoConfig?.extra?.GOOGLE_WEB_CLIENT_ID || 'your-web-client-id';
    const iosClientId = Constants.expoConfig?.extra?.GOOGLE_IOS_CLIENT_ID || 'your-ios-client-id';
    
    GoogleSignin.GoogleSignin.configure({
      webClientId,
      iosClientId,
      scopes: ['email', 'profile'],
      offlineAccess: true,
    });
    
    console.log('Google Sign-In configured successfully');
  } catch (error) {
    console.warn('Google Sign-In configuration failed:', error);
  }
};

// Google Sign-In
export const signInWithGoogle = async (): Promise<OAuthResult> => {
  if (isExpoGo) {
    return {
      success: false,
      error: 'Google Sign-In not available in Expo Go',
    };
  }

  try {
    if (!GoogleSignin) {
      GoogleSignin = loadGoogleSignin();
    }
    
    if (!GoogleSignin) {
      return {
        success: false,
        error: 'Google Sign-In module not available',
      };
    }

    await GoogleSignin.GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.GoogleSignin.signIn();
    
    if (userInfo.data) {
      const { user, idToken } = userInfo.data;
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          firstName: user.givenName || undefined,
          lastName: user.familyName || undefined,
          avatar: user.photo || undefined,
          provider: 'google',
        },
        token: idToken || undefined,
      };
    }
    
    return {
      success: false,
      error: 'No user data received from Google',
    };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    return {
      success: false,
      error: error.message || 'Google Sign-In failed',
    };
  }
};

// Apple Sign-In
export const signInWithApple = async (): Promise<OAuthResult> => {
  if (isExpoGo) {
    return {
      success: false,
      error: 'Apple Sign-In not available in Expo Go',
    };
  }

  try {
    if (!AppleAuthentication) {
      AppleAuthentication = loadAppleAuth();
    }
    
    if (!AppleAuthentication) {
      return {
        success: false,
        error: 'Apple Authentication module not available',
      };
    }

    if (!await AppleAuthentication.isAvailableAsync()) {
      return {
        success: false,
        error: 'Apple Sign-In is not available on this device',
      };
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (credential.user) {
      const fullName = credential.fullName;
      return {
        success: true,
        user: {
          id: credential.user,
          email: credential.email || undefined,
          name: fullName 
            ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() 
            : undefined,
          firstName: fullName?.givenName || undefined,
          lastName: fullName?.familyName || undefined,
          provider: 'apple',
        },
        token: credential.identityToken || undefined,
      };
    }

    return {
      success: false,
      error: 'No user data received from Apple',
    };
  } catch (error: any) {
    console.error('Apple Sign-In Error:', error);
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return {
        success: false,
        error: 'Apple Sign-In was canceled',
      };
    }
    return {
      success: false,
      error: error.message || 'Apple Sign-In failed',
    };
  }
};

// Facebook Sign-In
export const signInWithFacebook = async (): Promise<OAuthResult> => {
  if (isExpoGo) {
    return {
      success: false,
      error: 'Facebook Sign-In not available in Expo Go',
    };
  }

  try {
    if (!FacebookAuth) {
      FacebookAuth = loadFacebookAuth();
    }
    
    if (!FacebookAuth) {
      return {
        success: false,
        error: 'Facebook SDK module not available',
      };
    }

    const { LoginManager, AccessToken } = FacebookAuth;
    const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
    
    if (result.isCancelled) {
      return {
        success: false,
        error: 'Facebook Sign-In was canceled',
      };
    }

    const data = await AccessToken.getCurrentAccessToken();
    if (!data) {
      return {
        success: false,
        error: 'Failed to get Facebook access token',
      };
    }

    // Fetch user profile
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture.type(large)&access_token=${data.accessToken}`
    );
    const userInfo = await response.json();

    return {
      success: true,
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        firstName: userInfo.first_name,
        lastName: userInfo.last_name,
        avatar: userInfo.picture?.data?.url,
        provider: 'facebook',
      },
      token: data.accessToken,
    };
  } catch (error: any) {
    console.error('Facebook Sign-In Error:', error);
    return {
      success: false,
      error: error.message || 'Facebook Sign-In failed',
    };
  }
};

// Sign out from all providers
export const signOutFromOAuth = async (): Promise<void> => {
  try {
    // Google Sign-Out
    if (GoogleSignin) {
      try {
        if (await GoogleSignin.GoogleSignin.isSignedIn()) {
          await GoogleSignin.GoogleSignin.signOut();
        }
      } catch (error) {
        console.warn('Google sign-out error:', error);
      }
    }

    // Facebook Sign-Out
    if (FacebookAuth) {
      try {
        FacebookAuth.LoginManager.logOut();
      } catch (error) {
        console.warn('Facebook sign-out error:', error);
      }
    }
  } catch (error) {
    console.error('OAuth Sign-Out Error:', error);
  }
};

// Check if Apple Sign-In is available
export const isAppleSignInAvailable = (): boolean => {
  return Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 13;
};