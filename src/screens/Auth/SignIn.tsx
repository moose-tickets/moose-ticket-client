import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuthStackNavigation } from '../../navigation/hooks';
import { useTheme } from '../../wrappers/ThemeProvider';
import useStatusBarFix from '../../hooks/useStatusBarFix';
import { ThemedView, ThemedText, ThemedButton, ThemedInput } from '../../components/ThemedComponents';
import App from '../../App';
import AppLayout from '../../wrappers/layout';
import Passport from './Passport';
import Dialog from '../../components/Dialog';
import { useBotCheck } from '../../hooks/UseBotCheck';
import { useRateLimit } from '../../hooks/useRateLimit';
import { RateLimitType } from '../../services/arcjetSecurity';
import { validateEmail, validateRequired } from '../../utils/validators';
import { sanitizeEmail, sanitizePassword } from '../../utils/sanitize';

export default function SignIn() {
  const navigation = useAuthStackNavigation();
  const { theme } = useTheme();
  
  // Fix status bar styling during navigation
  useStatusBarFix();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info" | "warning",
  });

  // Arcjet security hooks
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

  const { executeWithRateLimit, isRateLimited, remaining } = useRateLimit({
    type: RateLimitType.AUTH_LOGIN,
    onRateLimited: (result) => {
      setDialogProps({
        title: "Too Many Attempts",
        message: `Please wait before trying again. You can try again after ${result.resetTime.toLocaleTimeString()}`,
        type: "warning",
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

  const handleSignIn = async () => {
    if (isLoading || isRateLimited) return;

    setIsLoading(true);
    setValidationErrors({});

    try {
      // 1. Validate form inputs
      const isFormValid = await validateForm();
      if (!isFormValid) {
        setIsLoading(false);
        return;
      }

      // 2. Sanitize inputs
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedPassword = sanitizePassword(password);

      // 3. Perform security checks with rate limiting
      await executeWithRateLimit(async () => {
        // Bot detection
        const botContext = await checkBot();
        if (!botContext.isHuman && botContext.riskLevel === 'critical') {
          throw new Error('Security check failed');
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Success
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
      });

    } catch (error: any) {
      console.error('Sign in error:', error);
      
      setDialogProps({
        title: "Sign In Failed",
        message: error.message || "An error occurred during sign in. Please try again.",
        type: "error",
      });
      setDialogVisible(true);
    } finally {
      setIsLoading(false);
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

        {/* Email */}
        <ThemedView className="mb-4 ">
        <ThemedView className="flex-row items-center border border-border bg-background-secondary rounded-xl px-2">
            <ThemedInput
              placeholder='e.g., user@example.com'
              value={email}
              onChangeText={(text) => {
                setEmail(sanitizeEmail(text));
                // Clear email errors when user starts typing
                if (validationErrors.email) {
                  setValidationErrors(prev => ({ ...prev, email: [] }));
                }
              }}
              keyboardType='email-address'
              autoCapitalize='none'
              className='flex-1'
            />
                <Ionicons
                      name='mail'
                      size={20}
                      color={theme === 'dark' ? '#9CA3AF' : '#A0A0A0'}
                    />
              </ThemedView>
            {validationErrors.email && validationErrors.email.length > 0 && (
              <ThemedText variant="error" size="xs" className="mt-1 ml-1 px-2">
                {validationErrors.email[0]}
              </ThemedText>
            )}
        </ThemedView>

        {/* Password */}
        <ThemedView className="mb-2">
          <ThemedView className="flex-row items-center border border-border bg-background-secondary rounded-xl px-2">
            <ThemedInput
              placeholder='Password'
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                // Clear password errors when user starts typing
                if (validationErrors.password) {
                  setValidationErrors(prev => ({ ...prev, password: [] }));
                }
              }}
              className="flex-1 border-0 bg-transparent p-0"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme === 'dark' ? '#9CA3AF' : '#A0A0A0'}
              />
            </TouchableOpacity>
          </ThemedView>
          {validationErrors.password && validationErrors.password.length > 0 && (
            <ThemedText variant="error" size="xs" className="mt-1 ml-1 px-2">
              {validationErrors.password[0]}
            </ThemedText>
          )}
        </ThemedView>

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

        {/* Rate Limit Warning */}
        {isRateLimited && (
          <ThemedView className="mb-4 p-3 bg-error-light rounded-xl">
            <ThemedText variant="error" size="xs" className="text-center">
              Too many attempts. {remaining} attempts remaining.
            </ThemedText>
          </ThemedView>
        )}

        {/* Sign In Button */}
        <ThemedButton
          variant="primary"
          size="lg"
          onPress={handleSignIn}
          disabled={isLoading || isRateLimited || (!isHuman && riskLevel === 'critical')}
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
        onClose={() => setDialogVisible(false)}
      />
      </KeyboardAvoidingView>
    </AppLayout>
  );
}