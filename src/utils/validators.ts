// src/utils/validators.ts
// Email validation now handled internally without external dependencies

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface EmailValidationOptions {
  required?: boolean;
  allowDisposable?: boolean;
  minScore?: number;
}

export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  blacklistedPasswords?: string[];
}

export interface PhoneValidationOptions {
  required?: boolean;
  allowInternational?: boolean;
  country?: string;
}

// Email validation with basic checks
export const validateEmail = async (
  email: string, 
  options: EmailValidationOptions = {}
): Promise<ValidationResult> => {
  const { required = true, allowDisposable = false } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic required check
  if (required && (!email || email.trim().length === 0)) {
    errors.push('Email is required');
    return { isValid: false, errors, warnings };
  }

  if (!email || email.trim().length === 0) {
    return { isValid: true, errors, warnings };
  }

  try {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim().toLowerCase();

    // Basic format validation
    if (!emailRegex.test(trimmedEmail)) {
      errors.push('Invalid email format');
    }

    // Basic disposable email check (simplified)
    if (!allowDisposable) {
      const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
      const domain = trimmedEmail.split('@')[1];
      if (domain && disposableDomains.includes(domain)) {
        errors.push('Disposable email addresses are not allowed');
      }
    }

    // Domain validation
    const domain = trimmedEmail.split('@')[1];
    if (domain && domain.length < 3) {
      errors.push('Invalid email domain');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    console.error('Email validation error:', error);
    
    // Fallback to basic regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
};

// Password validation
export const validatePassword = (
  password: string, 
  options: PasswordValidationOptions = {}
): ValidationResult => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    blacklistedPasswords = ['password', '123456', 'qwerty', 'abc123']
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!password || password.length === 0) {
    errors.push('Password is required');
    return { isValid: false, errors, warnings };
  }

  // Length check
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  // Character requirements
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Blacklisted passwords
  if (blacklistedPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common and not secure');
  }

  // Additional security checks
  if (password.length < 12) {
    warnings.push('Consider using a longer password for better security');
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    warnings.push('Avoid repeating the same character multiple times');
  }

  return { isValid: errors.length === 0, errors, warnings };
};


// Credit card validation (Luhn algorithm)
export const validateCreditCard = (cardNumber: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!cardNumber || cardNumber.trim().length === 0) {
    errors.push('Card number is required');
    return { isValid: false, errors, warnings };
  }

  // Remove spaces and dashes
  const cleanNumber = cardNumber.replace(/[\s-]/g, '');

  // Check if all characters are digits
  if (!/^\d+$/.test(cleanNumber)) {
    errors.push('Card number must contain only digits');
    return { isValid: false, errors, warnings };
  }

  // Check length
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    errors.push('Card number must be between 13-19 digits');
    return { isValid: false, errors, warnings };
  }

  // Luhn algorithm validation
  let sum = 0;
  let alternate = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);
    
    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit = (digit % 10) + 1;
      }
    }
    
    sum += digit;
    alternate = !alternate;
  }

  if (sum % 10 !== 0) {
    errors.push('Invalid card number');
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// Phone number validation
export const validatePhone = (phone: string, options: PhoneValidationOptions = {}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { required = false, allowInternational = true } = options;

  if (!phone || phone.trim().length === 0) {
    if (required) {
      errors.push('Phone number is required');
    }
    return { isValid: !required, errors, warnings };
  }

  const cleanPhone = phone.trim();

  if (allowInternational) {
    // International format validation: +[country code][number]
    const internationalPattern = /^\+[1-9]\d{1,14}$/;
    if (!internationalPattern.test(cleanPhone)) {
      errors.push('Phone number must be in international format (e.g., +1234567890)');
    }
  } else {
    // Basic phone validation for local numbers
    const phonePattern = /^[\d\s\-\(\)]{10,15}$/;
    if (!phonePattern.test(cleanPhone)) {
      errors.push('Please enter a valid phone number');
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// CVV validation
export const validateCVV = (cvv: string, cardType?: string): ValidationResult => {
  const errors: string[] = [];

  if (!cvv || cvv.trim().length === 0) {
    errors.push('CVV is required');
    return { isValid: false, errors };
  }

  if (!/^\d+$/.test(cvv)) {
    errors.push('CVV must contain only digits');
    return { isValid: false, errors };
  }

  // American Express has 4-digit CVV, others have 3-digit
  const expectedLength = cardType === 'amex' ? 4 : 3;
  
  if (cvv.length !== expectedLength) {
    errors.push(`CVV must be ${expectedLength} digits`);
  }

  return { isValid: errors.length === 0, errors };
};

// License plate validation
export const validateLicensePlate = (plate: string, state?: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!plate || plate.trim().length === 0) {
    errors.push('License plate is required');
    return { isValid: false, errors, warnings };
  }

  // Remove spaces and convert to uppercase
  const cleanPlate = plate.replace(/\s/g, '').toUpperCase();

  // Basic validation (2-8 characters, alphanumeric)
  if (!/^[A-Z0-9]{2,8}$/.test(cleanPlate)) {
    errors.push('License plate must be 2-8 alphanumeric characters');
  }

  // State-specific validation could be added here
  if (state && cleanPlate.length > 8) {
    warnings.push('This license plate format may not be valid for the selected state');
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// Generic required field validation
export const validateRequired = (value: any, fieldName: string): ValidationResult => {
  const errors: string[] = [];

  if (value === null || value === undefined || value === '' || 
      (Array.isArray(value) && value.length === 0)) {
    errors.push(`${fieldName} is required`);
  }

  return { isValid: errors.length === 0, errors };
};

// Batch validation for forms
export const validateForm = async (
  formData: Record<string, any>,
  validationRules: Record<string, (value: any) => Promise<ValidationResult> | ValidationResult>
): Promise<{ isValid: boolean; errors: Record<string, string[]>; warnings: Record<string, string[]> }> => {
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};

  for (const [field, validator] of Object.entries(validationRules)) {
    try {
      const result = await validator(formData[field]);
      
      if (!result.isValid) {
        errors[field] = result.errors;
      }
      
      if (result.warnings && result.warnings.length > 0) {
        warnings[field] = result.warnings;
      }
    } catch (error) {
      console.error(`Validation error for field ${field}:`, error);
      errors[field] = ['Validation failed'];
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
};