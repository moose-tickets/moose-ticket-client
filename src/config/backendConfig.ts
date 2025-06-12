// src/config/backendConfig.ts
/**
 * Backend Configuration for MooseTicket Mobile App
 * 
 * This file manages all backend integration settings including:
 * - API endpoints and base URLs
 * - Service mappings
 * - OAuth configuration
 * - Environment-specific settings
 */

import { Platform } from 'react-native';

// Environment detection
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

// Base configuration
export const API_CONFIG = {
  // API Gateway URL (handles routing to all microservices)
  BASE_URL: isDevelopment 
    ? "http://localhost:3000/api"  // Local development
    : "https://api.mooseticket.com/api",  // Production
  
  // Direct service URLs (for development/debugging)
  SERVICES: {
    API_GATEWAY: isDevelopment ? 'http://localhost:3000' : 'https://api.mooseticket.com',
    AUTH_SERVICE: isDevelopment ? 'http://localhost:3001' : 'https://auth.mooseticket.com',
    USER_SERVICE: isDevelopment ? 'http://localhost:3002' : 'https://users.mooseticket.com',
    VEHICLE_SERVICE: isDevelopment ? 'http://localhost:3003' : 'https://vehicles.mooseticket.com',
    TICKET_SERVICE: isDevelopment ? 'http://localhost:3004' : 'https://tickets.mooseticket.com',
    DISPUTE_SERVICE: isDevelopment ? 'http://localhost:3005' : 'https://disputes.mooseticket.com',
    SUBSCRIPTION_SERVICE: isDevelopment ? 'http://localhost:3006' : 'https://subscriptions.mooseticket.com',
    PAYMENT_SERVICE: isDevelopment ? 'http://localhost:3007' : 'https://payments.mooseticket.com',
    NOTIFICATION_SERVICE: isDevelopment ? 'http://localhost:3008' : 'https://notifications.mooseticket.com',
    CONSENT_SERVICE: isDevelopment ? 'http://localhost:3009' : 'https://consent.mooseticket.com',
    AUDIT_SERVICE: isDevelopment ? 'http://localhost:3010' : 'https://audit.mooseticket.com',
  },
  
  // Request timeouts
  TIMEOUT: {
    DEFAULT: 30000,     // 30 seconds
    UPLOAD: 60000,      // 1 minute for file uploads
    PAYMENT: 45000,     // 45 seconds for payment operations
    AUTH: 15000,        // 15 seconds for auth operations
  },
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
    EXPONENTIAL_BACKOFF: true,
  },
};

// OAuth Configuration
export const OAUTH_CONFIG = {
  // OAuth provider endpoints (through API Gateway)
  PROVIDERS: {
    GOOGLE: {
      CLIENT_ID: isDevelopment 
        ? "your-dev-google-client-id" 
        : "your-prod-google-client-id",
      REDIRECT_URI: isDevelopment 
        ? "http://localhost:3000/auth/google/callback"
        : "https://api.mooseticket.com/auth/google/callback",
      SCOPES: ['profile', 'email'],
      LOGIN_URL: `${API_CONFIG.SERVICES.API_GATEWAY}/auth/google`,
    },
    FACEBOOK: {
      CLIENT_ID: isDevelopment 
        ? "your-dev-facebook-client-id" 
        : "your-prod-facebook-client-id",
      REDIRECT_URI: isDevelopment 
        ? "http://localhost:3000/auth/facebook/callback"
        : "https://api.mooseticket.com/auth/facebook/callback",
      SCOPES: ['email'],
      LOGIN_URL: `${API_CONFIG.SERVICES.API_GATEWAY}/auth/facebook`,
    },
    APPLE: {
      CLIENT_ID: isDevelopment 
        ? "your-dev-apple-client-id" 
        : "your-prod-apple-client-id",
      REDIRECT_URI: isDevelopment 
        ? "http://localhost:3000/auth/apple/callback"
        : "https://api.mooseticket.com/auth/apple/callback",
      SCOPES: ['name', 'email'],
      LOGIN_URL: `${API_CONFIG.SERVICES.API_GATEWAY}/auth/apple`,
    },
  },
  
  // OAuth flow configuration
  FLOW: {
    USE_PKCE: true,           // Use PKCE for security
    STATE_LENGTH: 32,         // Length of state parameter
    NONCE_LENGTH: 32,         // Length of nonce parameter
    TOKEN_STORAGE_KEY: 'oauth_tokens',
  },
};

// Payment Configuration
export const PAYMENT_CONFIG = {
  // Stripe configuration
  STRIPE: {
    PUBLISHABLE_KEY: isDevelopment 
      ? "pk_test_your_dev_stripe_key" 
      : "pk_live_your_prod_stripe_key",
    MERCHANT_ID: "merchant.com.mooseticket.app",
    COUNTRY_CODE: "CA",
    CURRENCY_CODE: "CAD",
  },
  
  // Payment method configuration
  METHODS: {
    SUPPORTED_CARDS: ['visa', 'mastercard', 'amex', 'discover'],
    MINIMUM_AMOUNT: 1.00,     // Minimum payment amount in CAD
    MAXIMUM_AMOUNT: 10000.00, // Maximum payment amount in CAD
    INSTALLMENT_PLANS: [2, 3, 6, 12], // Available installment options
  },
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  // Maximum file sizes (in bytes)
  MAX_FILE_SIZE: {
    IMAGE: 10 * 1024 * 1024,    // 10MB for images
    VIDEO: 50 * 1024 * 1024,    // 50MB for videos
    DOCUMENT: 5 * 1024 * 1024,  // 5MB for documents
  },
  
  // Supported file types
  SUPPORTED_TYPES: {
    IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    VIDEOS: ['video/mp4', 'video/quicktime'],
    DOCUMENTS: ['application/pdf', 'text/plain'],
  },
  
  // Upload endpoints
  ENDPOINTS: {
    EVIDENCE: '/disputes/{disputeId}/evidence',
    AVATAR: '/users/avatar',
    TICKET_IMAGES: '/tickets/{ticketId}/images',
  },
};

// Push Notification Configuration
export const PUSH_CONFIG = {
  // Firebase configuration
  FIREBASE: {
    PROJECT_ID: isDevelopment ? "mooseticket-dev" : "mooseticket-prod",
    MESSAGING_SENDER_ID: isDevelopment ? "123456789" : "987654321",
    API_KEY: isDevelopment ? "your-dev-firebase-key" : "your-prod-firebase-key",
  },
  
  // Notification topics
  TOPICS: {
    TICKET_REMINDERS: 'ticket_reminders',
    PAYMENT_CONFIRMATIONS: 'payment_confirmations',
    DISPUTE_UPDATES: 'dispute_updates',
    SYSTEM_UPDATES: 'system_updates',
  },
};

// Security Configuration
export const SECURITY_CONFIG = {
  // API Security
  API: {
    USE_CERTIFICATE_PINNING: isProduction,
    CERTIFICATE_HASHES: [
      // Production certificate hashes
      "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    ],
    VERIFY_HOSTNAME: isProduction,
  },
  
  // Biometric authentication
  BIOMETRICS: {
    ENABLED: Platform.OS === 'ios' || Platform.OS === 'android',
    FALLBACK_TITLE: "Use Passcode",
    BIOMETRY_TYPE: Platform.OS === 'ios' ? 'TouchID' : 'Fingerprint',
  },
  
  // Session management
  SESSION: {
    TIMEOUT_MINUTES: 30,        // Auto-logout after 30 minutes
    REFRESH_THRESHOLD_MINUTES: 5, // Refresh token when 5 minutes left
    MAX_CONCURRENT_SESSIONS: 3,   // Maximum concurrent sessions
  },
};

// Feature Flags
export const FEATURE_FLAGS = {
  // OAuth providers
  OAUTH_GOOGLE: true,
  OAUTH_FACEBOOK: true,
  OAUTH_APPLE: Platform.OS === 'ios', // Apple Sign-In only on iOS
  
  // Payment features
  STRIPE_PAYMENTS: true,
  INSTALLMENT_PLANS: true,
  SUBSCRIPTION_MANAGEMENT: true,
  
  // Advanced features
  BIOMETRIC_AUTH: true,
  PUSH_NOTIFICATIONS: true,
  OFFLINE_MODE: false, // Future feature
  DARK_MODE: true,
  
  // Regional features
  CANADIAN_LICENSE_VALIDATION: true,
  GOVERNMENT_API_INTEGRATION: true,
  
  // Debug features (development only)
  DEBUG_LOGGING: isDevelopment,
  API_MOCKING: false,
  PERFORMANCE_MONITORING: true,
};

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  // Analytics providers
  PROVIDERS: {
    MIXPANEL: {
      TOKEN: isDevelopment ? "dev_mixpanel_token" : "prod_mixpanel_token",
      ENABLED: true,
    },
    GOOGLE_ANALYTICS: {
      TRACKING_ID: isDevelopment ? "UA-XXXXXXXX-1" : "UA-XXXXXXXX-2",
      ENABLED: isProduction,
    },
  },
  
  // Event tracking
  EVENTS: {
    TRACK_SCREEN_VIEWS: true,
    TRACK_USER_ACTIONS: true,
    TRACK_API_CALLS: isDevelopment,
    TRACK_ERRORS: true,
  },
};

// Error Handling Configuration
export const ERROR_CONFIG = {
  // Error reporting
  REPORTING: {
    ENABLED: isProduction,
    SERVICE: "Sentry", // or "Bugsnag", "Rollbar"
    DSN: isDevelopment ? "dev_sentry_dsn" : "prod_sentry_dsn",
  },
  
  // User-friendly error messages
  MESSAGES: {
    NETWORK_ERROR: "Unable to connect to the server. Please check your internet connection.",
    TIMEOUT_ERROR: "Request timed out. Please try again.",
    SERVER_ERROR: "Something went wrong on our end. Please try again later.",
    VALIDATION_ERROR: "Please check your input and try again.",
    AUTH_ERROR: "Authentication failed. Please sign in again.",
    PERMISSION_ERROR: "You don't have permission to perform this action.",
  },
};

// Regional Configuration
export const REGIONAL_CONFIG = {
  // Canadian-specific settings
  CANADA: {
    PROVINCES: ['ON', 'QC', 'BC', 'AB', 'SK', 'MB', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU'],
    DEFAULT_PROVINCE: 'ON',
    LICENSE_PLATE_FORMATS: {
      ON: /^[A-Z]{4}\s?[0-9]{3}$|^[A-Z]{3}\s?[0-9]{4}$/,
      QC: /^[A-Z]{3}\s?[0-9]{3}$/,
      BC: /^[A-Z]{3}\s?[0-9]{3}$/,
      // Add other province formats as needed
    },
    PHONE_FORMAT: /^\+1[0-9]{10}$/,
    POSTAL_CODE_FORMAT: /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/,
  },
  
  // Localization
  LOCALIZATION: {
    DEFAULT_LANGUAGE: 'en',
    SUPPORTED_LANGUAGES: ['en', 'fr'], // English and French for Canada
    DATE_FORMAT: 'YYYY-MM-DD',
    TIME_FORMAT: 'HH:mm',
    CURRENCY_FORMAT: 'CAD',
  },
};

// Export the complete configuration
export const APP_CONFIG = {
  API: API_CONFIG,
  OAUTH: OAUTH_CONFIG,
  PAYMENT: PAYMENT_CONFIG,
  UPLOAD: UPLOAD_CONFIG,
  PUSH: PUSH_CONFIG,
  SECURITY: SECURITY_CONFIG,
  FEATURES: FEATURE_FLAGS,
  ANALYTICS: ANALYTICS_CONFIG,
  ERROR: ERROR_CONFIG,
  REGIONAL: REGIONAL_CONFIG,
  
  // Environment info
  ENVIRONMENT: {
    IS_DEV: isDevelopment,
    IS_PROD: isProduction,
    PLATFORM: Platform.OS,
    VERSION: Platform.Version,
  },
};

export default APP_CONFIG;