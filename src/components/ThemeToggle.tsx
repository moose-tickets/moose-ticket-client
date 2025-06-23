import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../wrappers/ThemeProvider";
import { ThemeMode } from "../utils/color-theme";

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "toggle" | "selector";
}

export const ThemeToggle = ({ 
  showLabel = false, 
  size = "md",
  variant = "toggle" 
}: ThemeToggleProps) => {
  const { theme, themeMode, setThemeMode, toggleTheme, forceStatusBarUpdate } = useTheme();
  const { t } = useTranslation();

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const iconSize = iconSizes[size];

  if (variant === "selector") {
    return (
      <View className="flex-row space-x-2">
        {(["light", "dark", "auto"] as ThemeMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            onPress={() => {
              setThemeMode(mode);
              // Force status bar update after theme change
              setTimeout(() => forceStatusBarUpdate(), 150);
            }}
            className={`p-2 rounded-lg border ${
              themeMode === mode
                ? "bg-primary border-primary"
                : "bg-background-secondary border-border"
            }`}
          >
            <Ionicons
              name={
                mode === "light"
                  ? "sunny"
                  : mode === "dark"
                  ? "moon"
                  : "phone-portrait"
              }
              size={iconSize}
              color={
                themeMode === mode
                  ? "#FFFFFF"
                  : theme === "dark"
                  ? "#F9FAFB"
                  : "#1E1E1E"
              }
            />
            {showLabel && (
              <Text
                className={`text-xs mt-1 text-center ${
                  themeMode === mode ? "text-white" : "text-text-secondary"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // Toggle variant
  return (
    <TouchableOpacity
      onPress={() => {
        toggleTheme();
        // Force status bar update after theme change
        setTimeout(() => forceStatusBarUpdate(), 150);
      }}
      className="flex-row items-center space-x-2 p-2 rounded-lg bg-background-secondary"
    >
      <Ionicons
        name={theme === "dark" ? "moon" : "sunny"}
        size={iconSize}
        color={theme === "dark" ? "#FF8C2E" : "#FF7F11"}
      />
      {showLabel && (
        <Text className="text-text-primary font-medium">
          {theme === "dark" ? t('settings.darkMode') : t('settings.lightMode')}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Simplified toggle button for quick access
export const QuickThemeToggle = () => {
  const { theme, toggleTheme, forceStatusBarUpdate } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => {
        toggleTheme();
        // Force status bar update after theme change
        setTimeout(() => forceStatusBarUpdate(), 150);
      }}
      className="w-10 h-10 rounded-full bg-background-secondary border border-border items-center justify-center"
    >
      <Ionicons
        name={theme === "dark" ? "moon" : "sunny"}
        size={20}
        color={theme === "dark" ? "#FF8C2E" : "#FF7F11"}
      />
    </TouchableOpacity>
  );
};

// Theme selection modal/sheet component
export const ThemeSelector = ({ onClose }: { onClose?: () => void }) => {
  const { theme, themeMode, setThemeMode, forceStatusBarUpdate } = useTheme();
  const { t } = useTranslation();

  const themeOptions = [
    {
      mode: "light" as ThemeMode,
      label: t('settings.lightMode'),
      description: t('settings.alwaysLightTheme'),
      icon: "sunny",
    },
    {
      mode: "dark" as ThemeMode,
      label: t('settings.darkMode'), 
      description: t('settings.alwaysDarkTheme'),
      icon: "moon",
    },
    {
      mode: "auto" as ThemeMode,
      label: t('settings.system'),
      description: t('settings.followSystemPreference'),
      icon: "phone-portrait",
    },
  ];

  const handleSelection = (mode: ThemeMode) => {
    setThemeMode(mode);
    // Force status bar update after theme change
    setTimeout(() => forceStatusBarUpdate(), 150);
    onClose?.();
  };

  return (
    <View className="bg-background rounded-xl p-4 border border-border">
      <Text className="text-lg font-bold text-text-primary mb-4">
        {t('settings.chooseTheme')}
      </Text>
      
      {themeOptions.map((option) => (
        <TouchableOpacity
          key={option.mode}
          onPress={() => handleSelection(option.mode)}
          className={`flex-row items-center p-3 rounded-lg mb-2 ${
            themeMode === option.mode
              ? "bg-primary-50 border border-primary"
              : "bg-background-secondary"
          }`}
        >
          <View
            className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
              themeMode === option.mode ? "bg-primary" : "bg-neutral-200"
            }`}
          >
            <Ionicons
              name={option.icon as any}
              size={20}
              color={themeMode === option.mode ? "#FFFFFF" : "#6B7280"}
            />
          </View>
          
          <View className="flex-1">
            <Text
              className={`font-medium ${
                themeMode === option.mode
                  ? "text-primary"
                  : "text-text-primary"
              }`}
            >
              {option.label}
            </Text>
            <Text className="text-text-secondary text-sm">
              {option.description}
            </Text>
          </View>
          
          {themeMode === option.mode && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#FF7F11"
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ThemeToggle;