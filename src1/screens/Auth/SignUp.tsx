import React, { useState } from "react";
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
import { ThemedView, ThemedText, ThemedButton, ThemedInput } from "../../components/ThemedComponents";
import AppLayout from "../../wrappers/layout";
import Passport from "./Passport";

export default function SignUp() {
  const navigation = useAuthStackNavigation();
  const { theme } = useTheme();
  
  // Fix status bar styling during navigation
  useStatusBarFix();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [license, setLicense] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleSignUp = () => {
    if (!email || !password || !confirmPassword || !license || !fullName) {
      return Alert.alert("Error", "All fields are required.");
    }
    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match.");
    }
    if (!validLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return Alert.alert("Error", "Password does not meet requirements.");
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", "Account created.");
    }, 1500);
  };

  const InputField = ({
    placeholder,
    value,
    onChangeText,
    secure,
    show,
    setShow,
    icon,
  }: any) => (
    <ThemedView className="flex-row items-center border border-border bg-background-secondary rounded-xl px-4 py-3 mb-4">
      {icon}
      <ThemedInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        className="flex-1 ml-2 border-0 bg-transparent p-0"
        secureTextEntry={secure && !show}
        autoCapitalize="none"
      />
      {secure && (
        <TouchableOpacity onPress={() => setShow(!show)}>
          <Ionicons
            name={show ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={theme === 'dark' ? '#9CA3AF' : '#A0A0A0'}
          />
        </TouchableOpacity>
      )}
    </ThemedView>
  );

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

        <ThemedText variant="primary" size="sm" className="mb-1">
          Full Name
        </ThemedText>
        <InputField
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
          icon={<Ionicons name="person-outline" size={20} color={theme === 'dark' ? '#9CA3AF' : '#A0A0A0'} />}
        />

        <ThemedText variant="primary" size="sm" className="mb-1">
          Email
        </ThemedText>
        <InputField
          placeholder="Enter your email address"
          value={email}
          onChangeText={setEmail}
          icon={<Ionicons name="mail-outline" size={20} color={theme === 'dark' ? '#9CA3AF' : '#A0A0A0'} />}
        />

        <ThemedText variant="primary" size="sm" className="mb-1">
          Password
        </ThemedText>
        <InputField
          placeholder="Create password"
          value={password}
          onChangeText={(txt: string) => {
            setPassword(txt);
            validatePasswordRules(txt);
          }}
          secure
          show={showPassword}
          setShow={setShowPassword}
          icon={<Ionicons name="lock-closed-outline" size={20} color={theme === 'dark' ? '#9CA3AF' : '#A0A0A0'} />}
        />

        <ThemedText variant="primary" size="sm" className="mb-1">
          Confirm Password
        </ThemedText>
        <InputField
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secure
          show={showConfirm}
          setShow={setShowConfirm}
          icon={<Ionicons name="lock-closed-outline" size={20} color={theme === 'dark' ? '#9CA3AF' : '#A0A0A0'} />}
        />

        <ThemedText variant="primary" size="sm" className="mb-1">
          License Number
        </ThemedText>
        <InputField
          placeholder="Enter your license number"
          value={license}
          onChangeText={setLicense}
          icon={<FontAwesome name="id-card-o" size={20} color={theme === 'dark' ? '#9CA3AF' : '#A0A0A0'} />}
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
          disabled={loading}
          className="mt-6"
        >
          {loading ? "Creating Account…" : "Create Account"}
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
    </AppLayout>
  );
}