// src/types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp?: string;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
  // rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  // Legacy support for different response formats
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export interface UpdatePreferencesRequest {
  notifications?: Partial<UserPreferences['notifications']>;
  theme?: UserPreferences['theme'];
  language?: string;
  timezone?: string;
}

// Address Types
export interface Address {
  id: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
  type: 'billing' | 'shipping';
}

export interface CreateAddressRequest {
  fullName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault?: boolean;
  type: 'billing' | 'shipping';
}

// Payment Types
export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  cardLast4?: string;
  cardBrand?: string;
  cardExpiry?: string;
  isDefault: boolean;
  billingAddress?: Address;
  createdAt: string;
}

export interface CreatePaymentMethodRequest {
  type: 'card';
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardholderName: string;
  billingAddress: CreateAddressRequest;
  isDefault?: boolean;
}

export interface PaymentRequest {
  ticketId: string;
  paymentMethodId: string;
  amount: number;
  currency: string;
}

// Ticket Types
export interface Ticket {
  id: string;
  ticketNumber: string;
  licensePlate: string;
  violationType: string;
  violationCode: string;
  issueDate: string;
  dueDate: string;
  location: string;
  city: string;
  state: string;
  postalCode: string;
  fineAmount: number;
  lateFee: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'disputed' | 'overdue' | 'dismissed';
  notes?: string;
  images: string[];
  paymentHistory: Payment[];
  disputeHistory: Dispute[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  licensePlate: string;
  violationType: string;
  violationCode?: string;
  issueDate: string;
  location: string;
  city: string;
  state?: string;
  postalCode?: string;
  fineAmount: number;
  notes?: string;
  images?: File[];
}

export interface UpdateTicketRequest {
  licensePlate?: string;
  violationType?: string;
  location?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  fineAmount?: number;
  notes?: string;
}

export interface TicketFilters {
  status?: Ticket['status'][];
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  licensePlate?: string;
  city?: string;
}

// Payment Types
export interface Payment {
  id: string;
  ticketId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentMethodId: string;
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  processedAt?: string;
  createdAt: string;
}

// Dispute Types
export interface Dispute {
  id: string;
  ticketId: string;
  reason: string;
  reasonCode: string;
  description: string;
  evidence: DisputeEvidence[];
  status: 'pending' | 'under_review' | 'approved' | 'denied';
  submittedAt: string;
  reviewedAt?: string;
  resolution?: string;
}

export interface DisputeEvidence {
  id: string;
  type: 'document' | 'image' | 'video';
  filename: string;
  url: string;
  description?: string;
  uploadedAt: string;
}

export interface CreateDisputeRequest {
  ticketId: string;
  reason: string;
  reasonCode: string;
  description: string;
  evidence?: File[];
}

// Vehicle Types
export interface Vehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  state: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleRequest {
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  state: string;
  isDefault?: boolean;
}

export interface UpdateVehicleRequest {
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  state?: string;
  isDefault?: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'ticket_reminder' | 'payment_confirmation' | 'dispute_update' | 'system_update';
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

export interface CreateNotificationRequest {
  type: Notification['type'];
  title: string;
  message: string;
  data?: any;
}

// File Upload Types
export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  progress: number;
}

// Billing Types
export interface BillingHistory {
  id: string;
  ticketId?: string;
  type: 'payment' | 'fine' | 'late_fee' | 'refund';
  description: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  paymentMethod?: string;
  transactionId?: string;
}

// Subscription Types
export interface Subscription {
  id: string;
  plan: 'basic' | 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  features: string[];
  price: number;
  currency: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  isPopular?: boolean;
}

export interface CreateSubscriptionRequest {
  planId: string;
  paymentMethodId: string;
}

// Search Types
export interface SearchResult {
  type: 'ticket' | 'vehicle' | 'payment' | 'dispute';
  id: string;
  title: string;
  description: string;
  relevance: number;
  data: any;
}

export interface SearchRequest {
  query: string;
  types?: SearchResult['type'][];
  limit?: number;
}

// Analytics Types
export interface DashboardStats {
  totalTickets: number;
  pendingTickets: number;
  paidTickets: number;
  disputedTickets: number;
  totalFines: number;
  totalPaid: number;
  totalOutstanding: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  date: string;
  data?: any;
}