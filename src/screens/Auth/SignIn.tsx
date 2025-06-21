import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuthStackNavigation } from '../../navigation/hooks';
import { useTheme } from '../../wrappers/ThemeProvider';
import useStatusBarFix from '../../hooks/useStatusBarFix';
import { ThemedView, ThemedText, ThemedButton } from '../../components/ThemedComponents';
import InputField from '../../components/InputField';
import AppLayout from '../../wrappers/layout';
import Passport from './Passport';
import Dialog from '../../components/Dialog';
import { useBotCheck } from '../../hooks/UseBotCheck';
import { validateEmail, validateRequired } from '../../utils/validators';
import { sanitizeEmail, sanitizePassword } from '../../utils/sanitize';
import { useAppDispatch, useAppSelector } from '../../store';
import { loginUser, clearError } from '../../store/slices/authSlice';

export default function SignIn() {
  const navigation = useAuthStackNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  
  // Redux state
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  
  // Fix status bar styling during navigation
  useStatusBarFix();
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('SecurePassword123!');
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info" | "warning",
  });

  // Security hooks
  const { checkBot, isHuman, riskLevel } = useBotCheck({
    onBotDetected: (context) => {
      setDialogProps({
        title: "Security Check Failed",
        message: "Suspicious activity detected. Please try again later.",
        type: "error",
      });
      setDialogVisible(true);
    }
  });



  const validateForm = async () => {
    const errors: Record<string, string[]> = {};

    // Validate email
    const emailResult = await validateEmail(email, { required: true, allowDisposable: false });
    if (!emailResult.isValid) {
      errors.email = emailResult.errors;
    }

    // Validate password
    const passwordResult = validateRequired(password, 'Password');
    if (!passwordResult.isValid) {
      errors.password = passwordResult.errors;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle authentication success
  useEffect(() => {
    if (isAuthenticated) {
      setDialogProps({
        title: "Success",
        message: "Welcome back! Redirecting to dashboard...",
        type: "success",
      });
      setDialogVisible(true);

      // Navigate after short delay
      setTimeout(() => {
        setDialogVisible(false);
        navigation.navigate("Main", { screen: "Home", params: { screen: "Dashboard" } });
      }, 1500);
    }
  }, [isAuthenticated, navigation]);

  // Handle authentication errors
  useEffect(() => {
    if (error) {
      setDialogProps({
        title: "Sign In Failed",
        message: error,
        type: "error",
      });
      setDialogVisible(true);
    }
  }, [error]);

  const handleSignIn = async () => {
    if (isLoading) return;

    // Clear previous errors
    dispatch(clearError());
    setValidationErrors({});

    try {
      // 1. Validate form inputs
      const isFormValid = await validateForm();
      if (!isFormValid) {
        return;
      }

      // 2. Sanitize inputs
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedPassword = sanitizePassword(password);

      // 3. Perform bot detection check
      const botContext = await checkBot();
      if (!botContext.isHuman && botContext.riskLevel === 'critical') {
        throw new Error('Security check failed');
      }

      // Dispatch Redux action to sign in
      dispatch(loginUser({
        email: sanitizedEmail,
        password: sanitizedPassword,
        // rememberMe: true
      }));

    } catch (error: any) {
      console.error('Sign in error:', error);
      
      setDialogProps({
        title: "Sign In Failed",
        message: error.message || "An error occurred during sign in. Please try again.",
        type: "error",
      });
      setDialogVisible(true);
    }
  };



  // const handleSignIn = () => {
  //   if (!email.trim() || !password.trim()) {
  //     return Alert.alert('Error', 'Please fill in all fields.');
  //   }
  //   const emailRegex = /^\S+@\S+\.\S+$/;
  //   if (!emailRegex.test(email)) {
  //     return Alert.alert('Error', 'Please enter a valid email address.');
  //   }
  //   // Simulate sign-in process
  //   setTimeout(() => {
  //     Alert.alert('Success', 'You are now signed in.');
  //     navigation.navigate('Main'); // Navigate to main app after sign-in
  //   }, 1500);
  // }

  return (
    <AppLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className='flex-1 justify-center px-6 '
      >
        {/* Header */}
        <ThemedText 
          variant="primary" 
          size="2xl" 
          weight="bold" 
          className="text-center mb-6"
        >
          Sign In
        </ThemedText>

        <InputField
          label="Email"
          placeholder="e.g., user@example.com"
          value={email}
          onChangeText={(text) => {
            setEmail(sanitizeEmail(text));
            // Clear email errors when user starts typing
            if (validationErrors.email) {
              setValidationErrors(prev => ({ ...prev, email: [] }));
            }
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
          error={validationErrors.email && validationErrors.email.length > 0 ? validationErrors.email[0] : undefined}
          className="mb-4"
        />

        <InputField
          label="Password"
          placeholder="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            // Clear password errors when user starts typing
            if (validationErrors.password) {
              setValidationErrors(prev => ({ ...prev, password: [] }));
            }
          }}
          isPassword
          icon="lock-closed-outline"
          error={validationErrors.password && validationErrors.password.length > 0 ? validationErrors.password[0] : undefined}
          className="mb-2"
        />

        {/* Forgot Password */}
        <ThemedView className="w-full items-end mb-6">
          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
            <ThemedText variant="primary" size="sm" className="text-secondary">
              Forgot Password?
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Security Status */}
        {!isHuman && riskLevel !== 'low' && (
          <ThemedView className="mb-4 p-3 bg-warning-light rounded-xl">
            <ThemedText variant="warning" size="xs" className="text-center">
              Security verification in progress...
            </ThemedText>
          </ThemedView>
        )}

        {/* Rate limiting removed */}

        {/* Sign In Button */}
        <ThemedButton
          variant="primary"
          size="lg"
          onPress={handleSignIn}
          disabled={isLoading || (!isHuman && riskLevel === 'critical')}
          className="mb-6"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </ThemedButton>

        <Passport text='Or sign in with' />

        {/* Footer */}
        <ThemedText 
          variant="secondary" 
          size="xs" 
          className="text-center mb-3"
        >
          By signing in, you agree to our{' '}
          <ThemedText variant="primary" size="xs" className="text-secondary underline">
            Terms of Service
          </ThemedText>
          {' '}and{' '}
          <ThemedText variant="primary" size="xs" className="text-secondary underline">
            Privacy Policy
          </ThemedText>
          .
        </ThemedText>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <ThemedText variant="primary" size="sm" className="text-center">
            Don't have an account?{' '}
            <ThemedText variant="primary" size="sm" weight="semibold" className="text-secondary">
              Sign Up
            </ThemedText>
          </ThemedText>
        </TouchableOpacity>
        
        <Dialog
        visible={dialogVisible}
        title={dialogProps.title}
        message={dialogProps.message}
        type={dialogProps.type}
        onClose={() => {
          setDialogVisible(false);
          // Clear error when dialog is closed
          if (error) {
            dispatch(clearError());
          }
        }}
      />
      </KeyboardAvoidingView>
    </AppLayout>
  );
}