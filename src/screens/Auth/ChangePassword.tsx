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
import { useTranslation } from 'react-i18next';
import { ThemedView, ThemedText, ThemedButton, ThemedInput } from "../../components/ThemedComponents";
import AppLayout from "../../wrappers/layout";
import Header from "../../components/Header";
import GoBackHeader from "../../components/GoBackHeader";
import authService from "../../services/authService";

export default function ChangePassword() {
  const navigation = useSettingsStackNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [current, setCurrent] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!current || !newPassword || !confirm) {
      return Alert.alert(t('common.error'), t('profile.fillRequiredFields'));
    }
    if (newPassword.length < 8) {
      return Alert.alert(t('common.error'), t('validation.passwordTooShort'));
    }
    if (newPassword !== confirm) {
      return Alert.alert(t('common.error'), t('validation.passwordsDoNotMatch'));
    }

    setLoading(true);
    try {
      const result = await authService.changePassword({
        currentPassword: current,
        newPassword: newPassword,
        confirmPassword: confirm,
      });

      if (result.success) {
        Alert.alert(t('common.success'), t('settings.passwordUpdated'), [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack(),
          },
        ]);
        // Clear form
        setCurrent("");
        setNewPassword("");
        setConfirm("");
      } else {
        Alert.alert(t('common.error'), result.message || t('common.errorOccurred'));
      }
    } catch (error) {
      console.error('Password change error:', error);
      Alert.alert(t('common.error'), t('common.errorOccurred'));
    } finally {
      setLoading(false);
    }
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
      <GoBackHeader screenTitle={t('settings.changePassword')} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className='flex-1 justify-center px-6 '
      >

        <PasswordInput
          label={t('settings.currentPassword')}
          value={current}
          onChangeText={setCurrent}
          secure
          show={showCurrent}
          setShow={setShowCurrent}
        />

        <PasswordInput
          label={t('settings.newPassword')}
          value={newPassword}
          onChangeText={setNewPassword}
          secure
          show={showNew}
          setShow={setShowNew}
        />

        <ThemedText variant="tertiary" size="xs" className="mb-2">
          {t('settings.passwordRequirement')}
        </ThemedText>

        <PasswordInput
          label={t('auth.confirmPassword')}
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
          disabled={loading}
          className="mt-2 mb-6"
        >
          {loading ? t('common.saving') : t('settings.saveChanges')}
        </ThemedButton>

        <TouchableOpacity onPress={() => navigation.navigate('SettingsHome')}>
          <ThemedText variant="primary" size="sm" weight="medium" className="text-center text-secondary underline">
            {t('common.cancel')}
          </ThemedText>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}