/**
 * Backend Configuration
 * This file contains all backend-related configuration for the MooseTicket app
 */

// Environment-based API URL configuration
const getApiUrl = (): string => {
  // Check for Expo environment variable first
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Fallback to development URL
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiUrl();

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    signIn: '/api/auth/signin',
    signUp: '/api/auth/signup',
    signOut: '/api/auth/signout',
    refreshToken: '/api/auth/refresh-token',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    changePassword: '/api/auth/change-password',
    verifyEmail: '/api/auth/verify-email',
  },
  
  // OAuth
  oauth: {
    google: '/api/oauth/google',
    facebook: '/api/oauth/facebook',
    apple: '/api/oauth/apple',
  },
  
  // Users
  users: {
    profile: '/api/users/profile',
    updateProfile: '/api/users/profile',
    deleteAccount: '/api/users/account',
    addresses: '/api/users/addresses',
  },
  
  // Tickets
  tickets: {
    list: '/api/tickets',
    create: '/api/tickets',
    details: (id: string) => `/api/tickets/${id}`,
    update: (id: string) => `/api/tickets/${id}`,
    delete: (id: string) => `/api/tickets/${id}`,
    stats: '/api/tickets/stats',
  },
  
  // Vehicles
  vehicles: {
    list: '/api/vehicles',
    create: '/api/vehicles',
    details: (id: string) => `/api/vehicles/${id}`,
    update: (id: string) => `/api/vehicles/${id}`,
    delete: (id: string) => `/api/vehicles/${id}`,
  },
  
  // Payments
  payments: {
    methods: '/api/payments/methods',
    addMethod: '/api/payments/methods',
    deleteMethod: (id: string) => `/api/payments/methods/${id}`,
    processPayment: '/api/payments/process',
    history: '/api/payments/history',
  },
  
  // Disputes
  disputes: {
    list: '/api/disputes',
    create: '/api/disputes',
    details: (id: string) => `/api/disputes/${id}`,
    update: (id: string) => `/api/disputes/${id}`,
    submit: (id: string) => `/api/disputes/${id}/submit`,
  },
  
  // Notifications
  notifications: {
    list: '/api/notifications',
    markAsRead: (id: string) => `/api/notifications/${id}/read`,
    markAllAsRead: '/api/notifications/mark-all-read',
    unreadCount: '/api/notifications/unread-count',
    deviceToken: '/api/notifications/device-token',
  },
  
  // Subscriptions
  subscriptions: {
    plans: '/api/subscriptions/plans',
    planDetail: (id: string) => `/api/subscriptions/plans/${id}`,
    current: '/api/subscriptions',
    create: '/api/subscriptions',
    update: (id: string) => `/api/subscriptions/${id}`,
    cancel: (id: string) => `/api/subscriptions/${id}`,
    resume: (id: string) => `/api/subscriptions/${id}`,
    upgrade: (id: string) => `/api/subscriptions/${id}/upgrade`,
    billingHistory: (id: string) => `/api/subscriptions/${id}/billing`,
    quotas: (id: string) => `/api/subscriptions/${id}/usage`,
    validatePromo: '/api/subscriptions/validate-promo',
    analytics: '/api/subscriptions/analytics',
    usageAnalytics: (id: string) => `/api/subscriptions/${id}/usage`,
  },
  
  // Infraction Types
  infractionTypes: {
    list: '/api/infraction-types',
    details: (id: string) => `/api/infraction-types/${id}`,
    categories: '/api/infraction-types/categories',
    provinces: '/api/infraction-types/provinces',
  },
  
  // Consent
  consent: {
    record: '/api/consent',
    withdraw: '/api/consent/withdraw',
    history: '/api/consent/history',
  },
  
  // Audit
  audit: {
    logs: '/api/audit/logs',
  },
};

// Request timeout configuration
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryDelayMultiplier: 2,
};

// File upload configuration
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  disputeEvidenceMaxFiles: 5,
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  REQUEST_TIMEOUT,
  RETRY_CONFIG,
  UPLOAD_CONFIG,
};