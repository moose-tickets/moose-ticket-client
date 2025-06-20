import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { ThemedSafeArea } from '../../components/ThemedSafeArea';

type EmailVerifiedScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'EmailVerified'
>;

interface RouteParams {
  success?: string | boolean;
  email?: string;
  error?: string;
}

export default function EmailVerified() {
  const navigation = useNavigation<EmailVerifiedScreenNavigationProp>();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [countdown, setCountdown] = useState(3);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Determine if verification was successful
    const success = params?.success === 'true' || params?.success === true;
    setIsSuccess(success);

    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Start countdown and redirect
    if (success) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Navigate to SignIn screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'SignIn' }],
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      // If verification failed, redirect after 5 seconds
      const timer = setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'SignIn' }],
        });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [fadeAnim, scaleAnim, navigation, params]);

  const renderSuccessContent = () => (
    <>
      <Animated.View
        style={[
          styles.iconContainer,
          styles.successIcon,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.checkMark}>✓</Text>
      </Animated.View>
      
      <Text style={[styles.title, styles.successTitle]}>
        Email Verified Successfully!
      </Text>
      
      <Text style={styles.message}>
        Your email address has been verified. You can now sign in to your account.
      </Text>
      
      {params?.email && (
        <Text style={styles.emailText}>
          {params.email}
        </Text>
      )}
      
      <View style={styles.countdownContainer}>
        <Text style={styles.countdownText}>
          Redirecting to sign in in {countdown} second{countdown !== 1 ? 's' : ''}...
        </Text>
        <ActivityIndicator 
          size="small" 
          color="#28a745" 
          style={styles.spinner}
        />
      </View>
    </>
  );

  const renderErrorContent = () => (
    <>
      <Animated.View
        style={[
          styles.iconContainer,
          styles.errorIcon,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.errorMark}>✗</Text>
      </Animated.View>
      
      <Text style={[styles.title, styles.errorTitle]}>
        Verification Failed
      </Text>
      
      <Text style={styles.message}>
        {params?.error || 'The email verification link is invalid or has expired. Please try again.'}
      </Text>
      
      <Text style={styles.helpText}>
        You can request a new verification email from the sign-in screen.
      </Text>
      
      <View style={styles.countdownContainer}>
        <Text style={styles.countdownText}>
          Redirecting to sign in...
        </Text>
        <ActivityIndicator 
          size="small" 
          color="#dc3545" 
          style={styles.spinner}
        />
      </View>
    </>
  );

  return (
    <ThemedSafeArea style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={isSuccess ? '#d4edda' : '#f8d7da'} 
      />
      
      <Animated.View 
        style={[
          styles.content,
          { 
            opacity: fadeAnim,
            backgroundColor: isSuccess ? '#d4edda' : '#f8d7da'
          }
        ]}
      >
        {isSuccess ? renderSuccessContent() : renderErrorContent()}
      </Animated.View>
    </ThemedSafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  successIcon: {
    backgroundColor: '#28a745',
  },
  errorIcon: {
    backgroundColor: '#dc3545',
  },
  checkMark: {
    fontSize: 50,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  errorMark: {
    fontSize: 40,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  successTitle: {
    color: '#155724',
  },
  errorTitle: {
    color: '#721c24',
  },
  message: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    maxWidth: 300,
  },
  emailText: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  helpText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 30,
    maxWidth: 280,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  countdownText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  spinner: {
    marginLeft: 10,
  },
});