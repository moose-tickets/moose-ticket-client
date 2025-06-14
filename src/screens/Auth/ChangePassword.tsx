import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStackNavigation } from "../../navigation/hooks";
import { useTheme } from "../../wrappers/ThemeProvider";
import { ThemedView, ThemedText, ThemedButton, ThemedInput } from "../../components/ThemedComponents";
import AppLayout from "../../wrappers/layout";
import Header from "../../components/Header";
import GoBackHeader from "../../components/GoBackHeader";

export default function ChangePassword() {
  const navigation = useSettingsStackNavigation();
  const { theme } = useTheme();

  const [current, setCurrent] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = () => {
    if (!current || !newPassword || !confirm) {
      return Alert.alert("Error", "Please fill in all fields.");
    }
    if (newPassword.length < 8) {
      return Alert.alert("Error", "Password must be at least 8 characters.");
    }
    if (newPassword !== confirm) {
      return Alert.alert("Error", "Passwords do not match.");
    }
    Alert.alert("Success", "Password updated.");
  };

  const PasswordInput = ({
    label,
    value,
    onChangeText,
    secure,
    show,
    setShow,
  }: any) => (
    <>
      <ThemedText variant="primary" size="sm" className="mb-1">
        {label}
      </ThemedText>
      <ThemedView className="flex-row items-center border border-border bg-background-secondary rounded-xl px-4  mb-4">
        <ThemedInput
          value={value}
          onChangeText={onChangeText}
          placeholder=""
          secureTextEntry={secure && !show}
          className="flex-1 border-0 bg-transparent p-0"
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
    </>
  );

  return (
    <AppLayout>
      <GoBackHeader screenTitle="Change Password" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className='flex-1 justify-center px-6 '
      >

        <PasswordInput
          label="Current Password"
          value={current}
          onChangeText={setCurrent}
          secure
          show={showCurrent}
          setShow={setShowCurrent}
        />

        <PasswordInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secure
          show={showNew}
          setShow={setShowNew}
        />

        <ThemedText variant="tertiary" size="xs" className="mb-2">
          Must be at least 8 characters.
        </ThemedText>

        <PasswordInput
          label="Confirm New Password"
          value={confirm}
          onChangeText={setConfirm}
          secure
          show={showConfirm}
          setShow={setShowConfirm}
        />

        <ThemedButton
          variant="primary"
          size="lg"
          onPress={handleSave}
          className="mt-2 mb-6"
        >
          Save Changes
        </ThemedButton>

        <TouchableOpacity onPress={() => navigation.navigate('SettingsHome')}>
          <ThemedText variant="primary" size="sm" weight="medium" className="text-center text-secondary underline">
            Cancel
          </ThemedText>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}