// src/components/InputField.tsx
import React, { useState, useCallback, useRef } from 'react';
import { 
  TextInput, 
  View, 
  TouchableOpacity, 
  TextInputProps,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView, ThemedText } from './ThemedComponents';
import { useTheme } from '../wrappers/ThemeProvider';

interface InputFieldProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  success?: boolean;
  icon?: string;
  isPassword?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  error,
  success,
  icon,
  isPassword = false,
  disabled = false,
  required = false,
  className = '',
  placeholder,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Use useCallback to prevent unnecessary re-renders that cause focus loss
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
  }, [onChangeText]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const focusInput = useCallback(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const getBorderColor = () => {
    if (error) return 'border-red-500';
    if (success) return 'border-green-500';
    if (isFocused) return 'border-blue-500';
    return theme === 'dark' ? 'border-gray-600' : 'border-gray-300';
  };

  const getBackgroundColor = () => {
    if (disabled) return theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
    return theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  };

  const getTextColor = () => {
    if (disabled) return theme === 'dark' ? 'text-gray-500' : 'text-gray-400';
    return theme === 'dark' ? 'text-white' : 'text-gray-900';
  };

  return (
    <View className={className}>
      {label && (
        <ThemedText className="text-sm font-medium mb-2">
          {label}
          {required && <ThemedText className="text-red-500 ml-1">*</ThemedText>}
        </ThemedText>
      )}
      
      <TouchableOpacity 
        onPress={focusInput}
        activeOpacity={disabled ? 1 : 0.7}
        className={`
          flex-row items-center border rounded-lg px-3 py-3
          ${getBorderColor()} ${getBackgroundColor()}
          ${disabled ? 'opacity-60' : ''}
        `}
      >
        {icon && (
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} 
            style={{ marginRight: 8 }}
          />
        )}
        
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
          secureTextEntry={isPassword && !showPassword}
          editable={!disabled}
          autoCorrect={false}
          autoCapitalize="none"
          blurOnSubmit={false}
          className={`
            flex-1 ${getTextColor()} text-base
            ${Platform.OS === 'ios' ? '' : 'font-normal'}
          `}
          style={{
            fontSize: 16,
            lineHeight: 20,
            paddingVertical: 0,
          }}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity 
            onPress={togglePasswordVisibility}
            className="ml-2 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={showPassword ? 'eye-off' : 'eye'} 
              size={20} 
              color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} 
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      
      {error && (
        <ThemedText className="text-red-500 text-sm mt-1">
          {error}
        </ThemedText>
      )}
    </View>
  );
};

export default InputField;