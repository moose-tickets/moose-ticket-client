// src/components/SecureInput.tsx
import React, { useState, useEffect } from 'react';
import { TextInputProps } from 'react-native';
import { ThemedInput, ThemedView, ThemedText } from './ThemedComponents';
import { validateEmail, validateCreditCard, validateCVV, validateRequired, ValidationResult } from '../utils/validators';
import { sanitizeInput, sanitizeEmail, sanitizeCreditCard, sanitizeCVV } from '../utils/sanitize';

export interface SecureInputProps extends Omit<TextInputProps, 'onChangeText'> {
  label?: string;
  errorMessage?: string;
  type?: 'text' | 'email' | 'creditCard' | 'cvv' | 'password';
  required?: boolean;
  onChangeText?: (value: string) => void;
  onValidationChange?: (result: ValidationResult) => void;
  showValidationIcon?: boolean;
  realTimeValidation?: boolean;
  maxLength?: number;
  className?: string;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  label,
  errorMessage,
  type = 'text',
  required = false,
  onChangeText,
  onValidationChange,
  showValidationIcon = true,
  realTimeValidation = true,
  maxLength,
  className = '',
  value,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [isTouched, setIsTouched] = useState(false);

  // Sanitization function based on input type
  const sanitizeValue = (inputValue: string): string => {
    switch (type) {
      case 'email':
        return sanitizeEmail(inputValue);
      case 'creditCard':
        return sanitizeCreditCard(inputValue);
      case 'cvv':
        return sanitizeCVV(inputValue);
      default:
        return sanitizeInput(inputValue, { maxLength });
    }
  };

  // Validation function based on input type
  const validateValue = async (inputValue: string): Promise<ValidationResult> => {
    if (required && (!inputValue || inputValue.trim().length === 0)) {
      return { isValid: false, errors: [`${label || 'Field'} is required`] };
    }

    if (!inputValue || inputValue.trim().length === 0) {
      return { isValid: true, errors: [] };
    }

    switch (type) {
      case 'email':
        return await validateEmail(inputValue, { required, allowDisposable: false });
      case 'creditCard':
        return validateCreditCard(inputValue);
      case 'cvv':
        return validateCVV(inputValue);
      default:
        return validateRequired(inputValue, label || 'Field');
    }
  };

  // Format input value for display (e.g., credit card spacing)
  const formatValue = (inputValue: string): string => {
    switch (type) {
      case 'creditCard':
        // Add spaces every 4 digits for credit cards
        const cleaned = inputValue.replace(/\s/g, '');
        const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
        return formatted;
      default:
        return inputValue;
    }
  };

  // Handle input change
  const handleChangeText = async (text: string) => {
    // Sanitize input first
    const sanitizedText = sanitizeValue(text);
    
    setInternalValue(sanitizedText);
    setIsTouched(true);

    // Call parent's onChangeText with sanitized value
    if (onChangeText) {
      onChangeText(sanitizedText);
    }

    // Perform real-time validation if enabled
    if (realTimeValidation && isTouched) {
      const result = await validateValue(sanitizedText);
      setValidationResult(result);
      
      if (onValidationChange) {
        onValidationChange(result);
      }
    }
  };

  // Validate on blur
  const handleBlur = async () => {
    setIsTouched(true);
    const result = await validateValue(internalValue);
    setValidationResult(result);
    
    if (onValidationChange) {
      onValidationChange(result);
    }
  };

  // Update internal value when prop value changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Determine input props based on type
  const getInputProps = () => {
    const baseProps = {
      ...props,
      value: formatValue(internalValue),
      onChangeText: handleChangeText,
      onBlur: handleBlur,
    };

    switch (type) {
      case 'email':
        return {
          ...baseProps,
          keyboardType: 'email-address' as const,
          autoCapitalize: 'none' as const,
          autoComplete: 'email' as const,
          textContentType: 'emailAddress' as const,
        };
      case 'creditCard':
        return {
          ...baseProps,
          keyboardType: 'numeric' as const,
          maxLength: 19, // Includes spaces
          autoComplete: 'cc-number' as const,
          textContentType: 'creditCardNumber' as const,
        };
      case 'cvv':
        return {
          ...baseProps,
          keyboardType: 'numeric' as const,
          maxLength: 4,
          secureTextEntry: true,
          autoComplete: 'cc-csc' as const,
        };
      case 'password':
        return {
          ...baseProps,
          secureTextEntry: true,
          autoComplete: 'password' as const,
          textContentType: 'password' as const,
        };
      default:
        return baseProps;
    }
  };

  const inputProps = getInputProps();
  const hasError = isTouched && (!validationResult.isValid || errorMessage);
  const showError = hasError && (validationResult.errors.length > 0 || errorMessage);

  return (
    <ThemedView className={`${className}`}>
      {label && (
        <ThemedText size="sm" weight="medium" className="mb-2">
          {label}
          {required && <ThemedText variant="error"> *</ThemedText>}
        </ThemedText>
      )}
      
      <ThemedView className={`relative ${hasError ? 'border-error' : ''}`}>
        <ThemedInput
          {...inputProps}
          className={`${hasError ? 'border-error focus:border-error' : ''}`}
        />
        
        {/* Validation icon */}
        {showValidationIcon && isTouched && (
          <ThemedView className="absolute right-3 top-1/2 -translate-y-1/2">
            {validationResult.isValid && !errorMessage ? (
              <ThemedText variant="success" size="lg">✓</ThemedText>
            ) : hasError ? (
              <ThemedText variant="error" size="lg">✕</ThemedText>
            ) : null}
          </ThemedView>
        )}
      </ThemedView>

      {/* Error message */}
      {showError && (
        <ThemedText variant="error" size="xs" className="mt-1 ml-1">
          {errorMessage || validationResult.errors[0]}
        </ThemedText>
      )}

      {/* Warnings */}
      {validationResult.warnings && validationResult.warnings.length > 0 && (
        <ThemedText variant="warning" size="xs" className="mt-1 ml-1">
          {validationResult.warnings[0]}
        </ThemedText>
      )}
    </ThemedView>
  );
};

export default SecureInput;