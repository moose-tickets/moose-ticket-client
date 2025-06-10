// src/components/Layout.tsx
import React, { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { ThemedSafeArea } from "../components/ThemedSafeArea";
import useStatusBarFix from "../hooks/useStatusBarFix";

interface LayoutProps {
  children: ReactNode;
  scrollable?: boolean;
}

export default function AppLayout({ children, scrollable = true }: LayoutProps) {
  // Apply status bar fix to all screens using this layout
  useStatusBarFix();
  
  return (
    <ThemedSafeArea className="flex-1">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1  ">{children}</View>
          </ScrollView>
        ) : (
          <View className="flex-1">{children}</View>
        )}
      </KeyboardAvoidingView>
    </ThemedSafeArea>
  );
}
