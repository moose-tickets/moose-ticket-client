import React from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { useTheme } from "../wrappers/ThemeProvider";

// Themed View Component
interface ThemedViewProps {
  children: React.ReactNode;
  variant?: "default" | "card" | "secondary" | "tertiary";
  className?: string;
}

export const ThemedView = ({ 
  children, 
  variant = "default", 
  className = "" 
}: ThemedViewProps) => {
  const { theme } = useTheme();

  const getVariantClasses = () => {
    switch (variant) {
      case "card":
        return "bg-background border border-border rounded-xl p-4 shadow-theme";
      case "secondary":
        return "bg-background-secondary";
      case "tertiary":
        return "bg-background-tertiary";
      default:
        return "bg-background";
    }
  };

  return (
    <View className={`${getVariantClasses()} ${className}`}>
      {children}
    </View>
  );
};

// Themed Text Component
interface ThemedTextProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "inverse"| "error";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  weight?: "normal" | "medium" | "semibold" | "bold";
  className?: string;
}

export const ThemedText = ({
  children,
  variant = "primary",
  size = "base",
  weight = "normal",
  className = "",
}: ThemedTextProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "secondary":
        return "text-text-secondary";
      case "tertiary":
        return "text-text-tertiary";
      case "inverse":
        return "text-text-inverse";
      case "error":
        return "text-error";
      default:
        return "text-text-primary";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "xs":
        return "text-xs";
      case "sm":
        return "text-sm";
      case "lg":
        return "text-lg";
      case "xl":
        return "text-xl";
      case "2xl":
        return "text-2xl";
      case "3xl":
        return "text-3xl";
      default:
        return "text-base";
    }
  };

  const getWeightClasses = () => {
    switch (weight) {
      case "medium":
        return "font-medium";
      case "semibold":
        return "font-semibold";
      case "bold":
        return "font-bold";
      default:
        return "font-normal";
    }
  };

  return (
    <Text className={`${getVariantClasses()} ${getSizeClasses()} ${getWeightClasses()} ${className}`}>
      {children}
    </Text>
  );
};

// Themed Button Component
interface ThemedButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export const ThemedButton = ({
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}: ThemedButtonProps) => {
  const { presets } = useTheme();

  const getVariantClasses = () => {
    switch (variant) {
      case "secondary":
        return presets.button.secondary;
      case "outline":
        return presets.button.outline;
      case "ghost":
        return "bg-transparent text-text-primary";
      default:
        return presets.button.primary;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-3 py-2 text-sm";
      case "lg":
        return "px-6 py-4 text-lg";
      default:
        return "px-4 py-3";
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`
        ${getVariantClasses()} 
        ${getSizeClasses()} 
        rounded-lg items-center justify-center
        ${disabled ? "opacity-50" : ""}
        ${className}
      `}
    >
      {typeof children === "string" ? (
        <ThemedText variant={variant === "outline" || variant === "ghost" ? "primary" : "inverse"} weight="medium">
          {children}
        </ThemedText>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

// Themed Input Component
interface ThemedInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  variant?: "default" | "focused";
  multiline?: boolean;
  className?: string;
  [key: string]: any; // For additional TextInput props
}

export const ThemedInput = ({
  value,
  onChangeText,
  placeholder,
  variant = "default",
  multiline = false,
  className = "",
  ...props
}: ThemedInputProps) => {
  const { presets, theme } = useTheme();

  const getVariantClasses = () => {
    switch (variant) {
      case "focused":
        return presets.input.focused;
      default:
        return presets.input.default;
    }
  };

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme === "dark" ? "#9CA3AF" : "#6B7280"}
      multiline={multiline}
      className={`
        ${getVariantClasses()}
        px-4 py-3 rounded-lg
        ${multiline ? "min-h-[100px] text-top" : ""}
        ${className}
      `}
      {...props}
    />
  );
};

// Themed Card Component
interface ThemedCardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "flat";
  className?: string;
}

export const ThemedCard = ({
  children,
  variant = "default",
  className = "",
}: ThemedCardProps) => {
  const { presets } = useTheme();

  const getVariantClasses = () => {
    switch (variant) {
      case "elevated":
        return `${presets.card.background} ${presets.card.border} ${presets.card.shadow} shadow-theme-lg`;
      case "flat":
        return `${presets.card.background} border-0`;
      default:
        return `${presets.card.background} ${presets.card.border} ${presets.card.shadow}`;
    }
  };

  return (
    <View className={`${getVariantClasses()} rounded-xl p-4 ${className}`}>
      {children}
    </View>
  );
};

// Themed ScrollView Component
interface ThemedScrollViewProps {
  children: React.ReactNode;
  variant?: "default" | "secondary";
  className?: string;
  [key: string]: any; // For additional ScrollView props
}

export const ThemedScrollView = ({
  children,
  variant = "default",
  className = "",
  ...props
}: ThemedScrollViewProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "secondary":
        return "bg-background-secondary";
      default:
        return "bg-background";
    }
  };

  return (
    <ScrollView
      className={`${getVariantClasses()} ${className}`}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

// Status Badge Component
interface StatusBadgeProps {
  status: "success" | "warning" | "error" | "info";
  label: string;
  size?: "sm" | "md";
}

export const StatusBadge = ({ status, label, size = "md" }: StatusBadgeProps) => {
  const getStatusClasses = () => {
    switch (status) {
      case "success":
        return "bg-success-light text-success";
      case "warning":
        return "bg-warning-light text-warning";
      case "error":
        return "bg-error-light text-error";
      case "info":
        return "bg-info-light text-info";
      default:
        return "bg-neutral-100 text-neutral-600";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-2 py-1 text-xs";
      default:
        return "px-3 py-1 text-sm";
    }
  };

  return (
    <View className={`${getStatusClasses()} ${getSizeClasses()} rounded-full`}>
      <Text className="font-medium text-center">{label}</Text>
    </View>
  );
};