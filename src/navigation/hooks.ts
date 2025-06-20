// src/navigation/hooks.ts
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';

import type { 
  RootStackParamList, 
  MainTabParamList, 
  HomeStackParamList,
  TicketStackParamList,
  SettingsStackParamList,
  NotificationsStackParamList,
  AuthStackParamList
} from './types';

// Root navigation type
export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Main tab navigation type
export type MainTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Stack navigation types
export type HomeStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  MainTabNavigationProp
>;

export type TicketStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<TicketStackParamList>,
  MainTabNavigationProp
>;

export type SettingsStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<SettingsStackParamList>,
  MainTabNavigationProp
>;

export type NotificationsStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<NotificationsStackParamList>,
  MainTabNavigationProp
>;

export type AuthStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<AuthStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Navigation hooks
export function useRootNavigation() {
  return useNavigation<RootNavigationProp>();
}

export function useMainTabNavigation() {
  return useNavigation<MainTabNavigationProp>();
}

export function useHomeStackNavigation() {
  return useNavigation<HomeStackNavigationProp>();
}

export function useTicketStackNavigation() {
  return useNavigation<TicketStackNavigationProp>();
}

export function useSettingsStackNavigation() {
  return useNavigation<SettingsStackNavigationProp>();
}

export function useNotificationsStackNavigation() {
  return useNavigation<NotificationsStackNavigationProp>();
}

export function useAuthStackNavigation() {
  return useNavigation<AuthStackNavigationProp>();
}