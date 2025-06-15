import React, { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useAuthStackNavigation } from "../../navigation/hooks";
import { useTheme } from "../../wrappers/ThemeProvider";
import useStatusBarFix from '../../hooks/useStatusBarFix';
import { ThemedView, ThemedText, ThemedButton } from "../../components/ThemedComponents";
import InputField from "../../components/InputField";
import AppLayout from "../../wrappers/layout";
import Passport from "./Passport";
import Dialog from "../../components/Dialog";
import { useAppDispatch, useAppSelector } from "../../store";
import { signUp, clearError } from "../../store/slices/authSlice";
import { validateEmail, validatePassword, validateRequired } from "../../utils/validators";
import { sanitizeEmail, sanitizePassword, sanitizeName } from "../../utils/sanitize";

export default function SignUp() {
  const navigation = useAuthStackNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  
  // Redux state
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  
  // Fix status bar styling during navigation
  useStatusBarFix();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info" | "warning",
  });

  const [validLength, setValidLength] = useState(false);
  const [hasUpper, setHasUpper] = useState(false);
  const [hasLower, setHasLower] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecial, setHasSpecial] = useState(false);

  const validatePasswordRules = (pw: string) => {
    setValidLength(pw.length >= 8);
    setHasUpper(/[A-Z]/.test(pw));
    setHasLower(/[a-z]/.test(pw));
    setHasNumber(/\d/.test(pw));
    setHasSpecial(/[^A-Za-z0-9]/.test(pw));
  };

  // Handle errors from Redux
  useEffect(() => {
    if (error) {
      setDialogProps({
        title: "Registration Error",
        message: error,
        type: "error",
      });
      setDialogVisible(true);
    }
  }, [error]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigation.getParent()?.navigate("Main" as never);
    }
  }, [isAuthenticated, navigation]);

  const validateForm = () => {
    const errors: Record<string, string[]> = {};

    // Validate email
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      errors.email = emailResult.errors;
    }

    // Validate password
    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) {
      errors.password = passwordResult.errors;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      errors.confirmPassword = ["Passwords do not match"];
    }

    // Validate required fields
    const requiredFields = [
      { key: "fullName", value: fullName, label: "Full name" },
      { key: "licenseNumber", value: licenseNumber, label: "License number" },
    ];

    requiredFields.forEach(({ key, value, label }) => {
      const result = validateRequired(value, label);
      if (!result.isValid) {
        errors[key] = result.errors;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignUp = async () => {
    // Validate form
    const isValid = validateForm();
    if (!isValid) {
      setDialogProps({
        title: "Validation Error",
        message: "Please correct the errors and try again.",
        type: "error",
      });
      setDialogVisible(true);
      return;
    }

    try {
      // Prepare sanitized data
      const signUpData = {
        email: sanitizeEmail(email),
        password: sanitizePassword(password),
        fullName: sanitizeName(fullName),
        licenseNumber: licenseNumber.trim().toUpperCase(),
        phone: phone.trim(),
      };

      // Dispatch sign up action
      await dispatch(signUp(signUpData)).unwrap();

      setDialogProps({
        title: "Account Created",
        message: "Your account has been created successfully. Welcome to MooseTickets!",
        type: "success",
      });
      setDialogVisible(true);

    } catch (error: any) {
      setDialogProps({
        title: "Registration Failed",
        message: error.message || "Failed to create account. Please try again.",
        type: "error",
      });
      setDialogVisible(true);
    }
  };


  return (
    <AppLayout>
      <KeyboardAvoidingView
        className="flex-1 px-6 pt-10"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ThemedText variant="primary" size="2xl" weight="bold" className="text-center mb-1">
          Create Account
        </ThemedText>
        <ThemedText variant="secondary" className="text-center mb-6">
          Join our community
        </ThemedText>

        <InputField
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
          icon="person-outline"
          required
          className="mb-4"
        />

        <InputField
          label="Email"
          placeholder="Enter your email address"
          value={email}
          onChangeText={setEmail}
          icon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          required
          className="mb-4"
        />

        <InputField
          label="Password"
          placeholder="Create password"
          value={password}
          onChangeText={(txt: string) => {
            setPassword(txt);
            validatePasswordRules(txt);
          }}
          isPassword
          icon="lock-closed-outline"
          required
          className="mb-4"
        />

        <InputField
          label="Confirm Password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
          icon="lock-closed-outline"
          required
          className="mb-4"
        />

        <InputField
          label="Phone Number (Optional)"
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={setPhone}
          icon="call-outline"
          keyboardType="phone-pad"
          className="mb-4"
        />

        <InputField
          label="License Number"
          placeholder="Enter your license number"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          icon="card-outline"
          required
          className="mb-4"
        />

        <ThemedText variant="primary" size="sm" weight="medium" className="mt-2 mb-1">
          Password must contain:
        </ThemedText>
        {[
          { flag: validLength, label: "At least 8 characters" },
          { flag: hasUpper, label: "One uppercase letter" },
          { flag: hasLower, label: "One lowercase letter" },
          { flag: hasNumber, label: "One number" },
          { flag: hasSpecial, label: "One special character" },
        ].map(({ flag, label }) => (
          <ThemedView key={label} className="flex-row items-center mb-1">
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={flag ? (theme === 'dark' ? '#22C55E' : '#2B70F7') : (theme === 'dark' ? '#4A5568' : '#C5C5C5')}
              className="mr-2"
            />
            <ThemedText variant="secondary" size="sm">{label}</ThemedText>
          </ThemedView>
        ))}

        <ThemedButton
          variant="primary"
          size="lg"
          onPress={handleSignUp}
          disabled={isLoading}
          className="mt-6"
        >
          {isLoading ? "Creating Account…" : "Create Account"}
        </ThemedButton>

        <Passport text="Or sign up with" />

        <ThemedText variant="secondary" size="xs" className="text-center mb-2">
          By signing up, you agree to our{" "}
          <ThemedText variant="primary" size="xs" className="text-secondary underline">
            Terms of Service
          </ThemedText>
          {" "}and{" "}
          <ThemedText variant="primary" size="xs" className="text-secondary underline">
            Privacy Policy
          </ThemedText>
          .
        </ThemedText>

        <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
          <ThemedText variant="primary" size="sm" className="text-center mt-2">
            Already have an account?{" "}
            <ThemedText variant="primary" size="sm" weight="medium" className="text-secondary">
              Sign in
            </ThemedText>
          </ThemedText>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <Dialog
        visible={dialogVisible}
        title={dialogProps.title}
        message={dialogProps.message}
        type={dialogProps.type}
        onClose={() => {
          setDialogVisible(false);
          if (error) {
            dispatch(clearError());
          }
        }}
      />
    </AppLayout>
  );
}