// src/utils/sanitize.ts
import ArcjetSecurity from '../services/arcjetSecurity';

export interface SanitizationOptions {
  allowHTML?: boolean;
  maxLength?: number;
  removeEmojis?: boolean;
  trimWhitespace?: boolean;
  convertToLowercase?: boolean;
  removeSpecialChars?: boolean;
  allowedChars?: RegExp;
  stripTags?: boolean;
}

// Basic input sanitization
export const sanitizeInput = (
  input: string, 
  options: SanitizationOptions = {}
): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Trim whitespace if enabled (default: true)
  if (options.trimWhitespace !== false) {
    sanitized = sanitized.trim();
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove or escape HTML tags if not allowed
  if (!options.allowHTML) {
    if (options.stripTags) {
      // Completely remove HTML tags
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    } else {
      // Escape HTML entities
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
  }

  // Remove script-related content
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove emojis if specified
  if (options.removeEmojis) {
    sanitized = sanitized.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '');
  }

  // Convert to lowercase if specified
  if (options.convertToLowercase) {
    sanitized = sanitized.toLowerCase();
  }

  // Remove special characters if specified
  if (options.removeSpecialChars) {
    sanitized = sanitized.replace(/[^\w\s]/g, '');
  }

  // Apply allowed characters filter
  if (options.allowedChars) {
    sanitized = sanitized.replace(options.allowedChars, '');
  }

  // Truncate to max length if specified
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
};

// Sanitize email input
export const sanitizeEmail = (email: string): string => {
  return sanitizeInput(email, {
    trimWhitespace: true,
    convertToLowercase: true,
    maxLength: 254, // RFC 5321 limit
    removeSpecialChars: false,
    allowHTML: false,
    stripTags: true
  });
};

// Sanitize password input (minimal sanitization to preserve security)
export const sanitizePassword = (password: string): string => {
  if (!password || typeof password !== 'string') {
    return '';
  }

  // Only remove null bytes and control characters
  return password.replace(/[\0\x08\x09\x1a\n\r\t\x0B\x0C]+/g, '');
};

// Sanitize name fields
export const sanitizeName = (name: string): string => {
  return sanitizeInput(name, {
    trimWhitespace: true,
    maxLength: 100,
    removeEmojis: true,
    allowHTML: false,
    stripTags: true,
    allowedChars: /[^a-zA-Z\s'-]/g // Remove everything except letters, spaces, hyphens, and apostrophes
  });
};

// Sanitize phone number
export const sanitizePhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all characters except digits, spaces, hyphens, parentheses, and plus
  return phone.replace(/[^\d\s\-\(\)\+]/g, '').trim();
};

// Sanitize address fields
export const sanitizeAddress = (address: string): string => {
  return sanitizeInput(address, {
    trimWhitespace: true,
    maxLength: 200,
    removeEmojis: true,
    allowHTML: false,
    stripTags: true,
    allowedChars: /[^a-zA-Z0-9\s\-.,#]/g // Allow alphanumeric, spaces, hyphens, periods, commas, and #
  });
};

// Sanitize license plate
export const sanitizeLicensePlate = (plate: string): string => {
  if (!plate || typeof plate !== 'string') {
    return '';
  }

  return plate
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Only allow alphanumeric characters
    .substring(0, 8); // Max length for license plates
};

// Sanitize credit card number (for display purposes only)
export const sanitizeCreditCard = (cardNumber: string): string => {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return '';
  }

  // Remove all non-digit characters
  const digitsOnly = cardNumber.replace(/\D/g, '');
  
  // Limit to 19 characters (longest possible card number)
  return digitsOnly.substring(0, 19);
};

// Sanitize CVV
export const sanitizeCVV = (cvv: string): string => {
  if (!cvv || typeof cvv !== 'string') {
    return '';
  }

  // Only allow digits, max 4 characters
  return cvv.replace(/\D/g, '').substring(0, 4);
};

// Sanitize search queries
export const sanitizeSearchQuery = (query: string): string => {
  return sanitizeInput(query, {
    trimWhitespace: true,
    maxLength: 100,
    removeEmojis: false,
    allowHTML: false,
    stripTags: true,
    removeSpecialChars: false
  });
};

// Sanitize user-generated content (comments, notes, etc.)
export const sanitizeUserContent = (content: string): string => {
  return sanitizeInput(content, {
    trimWhitespace: true,
    maxLength: 1000,
    removeEmojis: false,
    allowHTML: false,
    stripTags: true,
    removeSpecialChars: false
  });
};

// Sanitize file names
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  return fileName
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid file name characters
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length
};

// Batch sanitization for form data
export const sanitizeFormData = (
  formData: Record<string, any>,
  fieldSanitizers: Record<string, (value: any) => string> = {}
): Record<string, any> => {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      // Use custom sanitizer if provided, otherwise use basic sanitization
      if (fieldSanitizers[key]) {
        sanitized[key] = fieldSanitizers[key](value);
      } else {
        sanitized[key] = sanitizeInput(value);
      }
    } else {
      // Non-string values pass through unchanged
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Deep sanitization with Arcjet protection
export const sanitizeWithArcjetProtection = async (
  input: string,
  options: SanitizationOptions = {}
): Promise<{ sanitized: string; threat: 'none' | 'low' | 'medium' | 'high' | 'critical'; blocked: boolean }> => {
  // First, perform basic sanitization
  const basicSanitized = sanitizeInput(input, options);

  try {
    // Then check with Arcjet for advanced threats
    const attackResult = await ArcjetSecurity.protectAgainstAttacks(basicSanitized);

    return {
      sanitized: basicSanitized,
      threat: attackResult.threat,
      blocked: attackResult.blocked
    };
  } catch (error) {
    console.error('Arcjet protection error:', error);
    return {
      sanitized: basicSanitized,
      threat: 'none',
      blocked: false
    };
  }
};

// Redact sensitive data for logging
export const redactForLogging = (data: Record<string, any>): Record<string, any> => {
  return ArcjetSecurity.redactSensitiveData(data, [
    'password',
    'confirmPassword',
    'currentPassword',
    'newPassword',
    'creditCard',
    'cardNumber',
    'cvv',
    'ssn',
    'socialSecurityNumber',
    'bankAccount',
    'routingNumber'
  ]);
};

// URL sanitization
export const sanitizeURL = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerURL = url.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerURL.startsWith(protocol)) {
      return '';
    }
  }

  // Basic URL validation and sanitization
  try {
    const urlObj = new URL(url);
    // Only allow http and https
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return '';
    }
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return empty string
    return '';
  }
};