// src/navigation/types.ts
import type { NavigatorScreenParams } from '@react-navigation/native';

// Root App Navigator
export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Auth Stack
export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Onboarding: undefined;
  Terms: undefined;
  Privacy: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Tickets: NavigatorScreenParams<TicketStackParamList>;
  Notifications: NavigatorScreenParams<NotificationsStackParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

// Home Stack
export type HomeStackParamList = {
  Dashboard: undefined;
  BillingHistory: undefined;
  AddTicket: undefined;
};

// Ticket Stack
export type TicketStackParamList = {
  TicketList: undefined;
  TicketDetail: { ticketId: string };
  DisputeForm: { ticketId: string };
  PayNow: { ticketId: string };
  DisputeDialog: { status: 'success' | 'failed' | 'error' };
  VehicleList: undefined;
  AddVehicle: { vehicleId?: string };
  PaymentMethods: undefined;
  AddPaymentMethod: undefined;
  EditPaymentMethod: { cardId: string };
  AddTicket: undefined;
  TicketDisputeStatus: { ticketId: string };
};

// Settings Stack
export type SettingsStackParamList = {
  SettingsHome: undefined;
  PaymentMethods: undefined;
  AddCard: undefined;
  EditCard: { cardId: string };
  ChangePassword: undefined;
  VehicleList: undefined;
  AddVehicle: { vehicleId?: string };
  PaymentMethod: undefined;
  AddPaymentMethod: undefined;
  Profile: undefined;
  AddAddress: undefined;
  EditAddress: { userId: string };
  EditProfile: { userId: string };
  EditVehicle: { vehicleId: string };
  LanguageRegion: undefined;
  HelpSupport: undefined;
  Terms: undefined;
  Privacy: undefined;
  ManageSubscription: undefined;
  SubscriptionPlans: undefined;
  ConfirmSubscription: { planId: string };
  BillingHistory: undefined;
};

// Notifications Stack
export type NotificationsStackParamList = {
  NotificationCenter: undefined;
  NotificationDetails: undefined;
  TicketDetail: { ticketId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}