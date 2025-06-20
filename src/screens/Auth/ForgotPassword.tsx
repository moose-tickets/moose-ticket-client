import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStackNavigation } from "../../navigation/hooks";
import { useTheme } from "../../wrappers/ThemeProvider";
import useStatusBarFix from '../../hooks/useStatusBarFix';
import { ThemedView, ThemedText, ThemedButton, ThemedInput } from "../../components/ThemedComponents";
import AppLayout from "../../wrappers/layout";

export default function ForgotPassword() {
  const navigation = useAuthStackNavigation();
  const { theme } = useTheme();
  
  // Fix status bar styling during navigation
  useStatusBarFix();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  function handleReset() {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email.");
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", "Password reset link sent.");
      navigation.navigate("SignIn");
    }, 1500);
  }

  return (
    <AppLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 px-6 pt-10"
      >
        <ThemedText variant="primary" size="2xl" weight="bold" className="text-center mb-2">
          Forgot Password
        </ThemedText>
        <ThemedText variant="secondary" className="text-center mb-6">
          Enter your email and we'll send you a reset link.
        </ThemedText>

        {/* Label */}
        <ThemedText variant="primary" size="sm" className="mb-1">
          Email Address
        </ThemedText>

        {/* Input */}
        <ThemedView className="flex-row items-center border border-border bg-background-secondary rounded-xl px-4 py-3 mb-6">
          <Ionicons 
            name="mail-outline" 
            size={20} 
            color={theme === 'dark' ? '#9CA3AF' : '#A0A0A0'} 
          />
          <ThemedInput
            placeholder="e.g., user@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            className="ml-2 flex-1 border-0 bg-transparent p-0"
          />
        </ThemedView>

        {/* Reset Button */}
        <ThemedButton
          variant="primary"
          size="lg"
          onPress={handleReset}
          disabled={loading}
          className="mb-8"
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </ThemedButton>

        {/* Footer Link */}
        <ThemedText variant="secondary" size="sm" className="text-center">
          Remembered your password?{" "}
          <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
            <ThemedText variant="primary" size="sm" weight="semibold" className="text-secondary underline">
              Sign In
            </ThemedText>
          </TouchableOpacity>
        </ThemedText>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}