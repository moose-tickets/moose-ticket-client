import React from "react";
import { Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from '../wrappers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { ThemedView, ThemedText } from './ThemedComponents';

type DialogType = "success" | "error" | "info" | "warning";

interface DialogProps {
  visible: boolean;
  type?: DialogType;
  title: string;
  message?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  messageComponent?: React.ReactNode | null;
}

const getIconConfig = (type: DialogType, theme: 'light' | 'dark') => {
  const configs = {
    success: { 
      name: "checkmark-circle", 
      color: theme === 'dark' ? '#10B981' : '#2ECC71' 
    },
    error: { 
      name: "close-circle", 
      color: theme === 'dark' ? '#EF4444' : '#E74C3C' 
    },
    info: { 
      name: "information-circle", 
      color: theme === 'dark' ? '#3B82F6' : '#3498DB' 
    },
    warning: { 
      name: "warning", 
      color: theme === 'dark' ? '#F59E0B' : '#F1C40F' 
    },
  };
  return configs[type];
};

export default function Dialog({
  visible,
  type = "info",
  title,
  message='',
  onClose,
  onConfirm,
  confirmText,
  cancelText,
  messageComponent
}: DialogProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const icon = getIconConfig(type, theme);
  
  const defaultConfirmText = confirmText || t('common.ok');

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <ThemedView className="flex-1 bg-overlay justify-center items-center px-6">
        <ThemedView variant="card" className="w-full rounded-xl p-6 shadow-lg">
          <ThemedView className="items-center mb-4">
            <Ionicons name={icon.name} size={48} color={icon.color} />
          </ThemedView>
          <ThemedText size="lg" weight="bold" className="text-center mb-2">
            {title}
          </ThemedText>
          {messageComponent ? (
            messageComponent
          ) : (
            <ThemedText variant="secondary" className="text-center mb-4">{message}</ThemedText>
          )}
          <ThemedView className="flex-row justify-end space-x-3">
            {cancelText && (
              <TouchableOpacity onPress={onClose}>
                <ThemedText variant="tertiary" weight="medium">{cancelText}</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                onConfirm?.();
                onClose();
              }}
            >
              <ThemedText weight="semibold" className="text-primary">{defaultConfirmText}</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}
