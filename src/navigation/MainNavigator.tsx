// src/navigation/MainNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  HomeStackParamList, 
  TicketStackParamList, 
  SettingsStackParamList, 
  NotificationsStackParamList,
  MainTabParamList 
} from './types';
import { useTheme } from '../wrappers/ThemeProvider';

import Dashboard from '../screens/Home/Dashboard';
import VehicleList from '../screens/Vehicles/VehicleList';
import AddVehicle from '../screens/Vehicles/AddVehicle';
import TicketList from '../screens/Tickets/TicketList';
import TicketDetail from '../screens/Tickets/TicketDetail';
import DisputeForm from '../screens/Dispute/DisputeForm';
import NotificationCenter from '../screens/Notifications/NotificationCenter';
import Settings from '../screens/Settings/Settings';
import PaymentMethod from '../screens/Payments/PaymentMethod';
import AddCard from '../screens/Payments/AddCard';
import EditCard from '../screens/Payments/EditCard';
import PayNow from '../screens/Payments/PayNow';
import DisputeDialog from '../screens/Dispute/DisputeDialog';

import { FontAwesome } from '@expo/vector-icons';
import NotificationDetails from '../screens/Notifications/NotificationDetail';
import ChangePassword from '../screens/Auth/ChangePassword';
import Profile from '../screens/Settings/Profile/Profile';
import AddEditAddress from '../screens/Settings/Profile/AddEditAddress';
import EditProfile from '../screens/Settings/Profile/EditProfile';
import LanguageAndRegion from '../screens/Settings/LanguageSelection';
import HelpSupport from '../screens/Settings/HelpSupport/HelpCenter';
import Privacy from '../screens/Settings/HelpSupport/Privacy';
import Terms from '../screens/Settings/HelpSupport/Terms';
import ManageSubscription from '../screens/ManageSubscription/ManageSubscription';
import ConfirmSubscription from '../screens/ManageSubscription/ConfirmSubscription';
import SubscriptionPlans from '../screens/ManageSubscription/SubscriptionPlans';
import BillingHistory from '../screens/Home/BillingHistory';
import AddTicket from '../screens/Tickets/AddTicket';
import TicketDisputeStatus from '../screens/Tickets/TicketDisputeStatus';

/* ---------------------------------------
   Stack Navigators for Tabs
----------------------------------------*/

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name='Dashboard' component={Dashboard} />
      <HomeStack.Screen name='BillingHistory' component={BillingHistory} />
      <HomeStack.Screen name='AddTicket' component={AddTicket} />
    </HomeStack.Navigator>
  );
}

const TicketStack = createNativeStackNavigator<TicketStackParamList>();
function TicketsStackNavigator() {
  return (
    <TicketStack.Navigator screenOptions={{ headerShown: false }}>
      <TicketStack.Screen name='TicketList' component={TicketList} />
      <TicketStack.Screen name='AddTicket' component={AddTicket} />
      <TicketStack.Screen name='TicketDetail' component={TicketDetail} />
      <TicketStack.Screen
        name='TicketDisputeStatus'
        component={TicketDisputeStatus}
      />
      <TicketStack.Screen name='DisputeForm' component={DisputeForm} />
      <TicketStack.Screen name='PayNow' component={PayNow} />
      <TicketStack.Screen name='DisputeDialog' component={DisputeDialog} />
      <TicketStack.Screen name='PaymentMethods' component={PaymentMethod} />
      <TicketStack.Screen name='AddPaymentMethod' component={AddCard} />
      <TicketStack.Screen name='EditPaymentMethod' component={AddCard} />
    </TicketStack.Navigator>
  );
}

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name='SettingsHome' component={Settings} />
      <SettingsStack.Screen name='PaymentMethods' component={PaymentMethod} />
      <SettingsStack.Screen name='AddPaymentMethod' component={AddCard} />
      <SettingsStack.Screen name='EditCard' component={EditCard} />
      <SettingsStack.Screen name='ChangePassword' component={ChangePassword} />
      <SettingsStack.Screen name='Profile' component={Profile} />
      <SettingsStack.Screen name='AddAddress' component={AddEditAddress} />
      <SettingsStack.Screen name='EditAddress' component={AddEditAddress} />
      <SettingsStack.Screen name='EditProfile' component={EditProfile} />
      <SettingsStack.Screen name='AddVehicle' component={AddVehicle} />
      <SettingsStack.Screen name='EditVehicle' component={AddVehicle} />
      <SettingsStack.Screen name='VehicleList' component={VehicleList} />
      <SettingsStack.Screen
        name='LanguageRegion'
        component={LanguageAndRegion}
      />
      <SettingsStack.Screen name='HelpSupport' component={HelpSupport} />
      <SettingsStack.Screen name='Terms' component={Terms} />
      <SettingsStack.Screen name='Privacy' component={Privacy} />
      <SettingsStack.Screen
        name='ManageSubscription'
        component={ManageSubscription}
      />
      <SettingsStack.Screen
        name='ConfirmSubscription'
        component={ConfirmSubscription}
      />
      <SettingsStack.Screen
        name='SubscriptionPlans'
        component={SubscriptionPlans}
      />
      <SettingsStack.Screen name='BillingHistory' component={BillingHistory} />
    </SettingsStack.Navigator>
  );
}

const NotificationsStack =
  createNativeStackNavigator<NotificationsStackParamList>();
function NotificationsStackNavigator() {
  return (
    <NotificationsStack.Navigator screenOptions={{ headerShown: false }}>
      <NotificationsStack.Screen
        name='NotificationCenter'
        component={NotificationCenter}
      />
      <NotificationsStack.Screen
        name='NotificationDetails'
        component={NotificationDetails}
      />
      <NotificationsStack.Screen name='TicketDetail' component={TicketDetail} />
    </NotificationsStack.Navigator>
  );
}

/* ---------------------------------------
   Bottom Tab Navigator
----------------------------------------*/

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  const { theme, forceStatusBarUpdate } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName='Home'
      screenOptions={({ route }) => ({
        headerShown: false,
        unmountOnBlur: true,
        tabBarIcon: ({ color, size }) => {
          let iconName: React.ComponentProps<typeof FontAwesome>['name'] =
            'circle';

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Tickets':
              iconName = 'ticket';
              break;
            case 'Notifications':
              iconName = 'bell';
              break;
            case 'Settings':
              iconName = 'gear';
              break;
          }

          return <FontAwesome name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme === 'dark' ? '#FF9A4A' : '#FF7F11', // Dynamic primary color
        tabBarInactiveTintColor: theme === 'dark' ? '#6B7480' : '#9CA3AF', // Dynamic inactive color
        tabBarStyle: { 
          backgroundColor: theme === 'dark' ? '#151820' : '#FFFFFF', // Dynamic background
          borderTopColor: theme === 'dark' ? '#2D3748' : '#E5E7EB', // Dynamic border
          borderTopWidth: 1,
        },
      })}
    >
      <Tab.Screen
        name='Home'
        component={HomeStackNavigator}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            // Prevent default tab behavior
            e.preventDefault();

            // Navigate to root screen of this tab
            navigation.navigate('Home', { screen: 'Dashboard' });

            // Force status bar update after navigation
            setTimeout(() => {
              forceStatusBarUpdate();
            }, 150);

            // Reset to root of stack
            const state = navigation.getState();
            const stackKey = state.routes.find(
              (r) => r.name === 'Home'
            )?.key;
            if (stackKey) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            }
          },
        })}
      />

      <Tab.Screen
        name='Tickets'
        component={TicketsStackNavigator}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            // Prevent default tab behavior
            e.preventDefault();

            // Navigate to root screen of this tab
            navigation.navigate('Tickets', { screen: 'TicketList' });

            // Force status bar update after navigation
            setTimeout(() => {
              forceStatusBarUpdate();
            }, 150);

            // Reset to root of stack
            const state = navigation.getState();
            const stackKey = state.routes.find(
              (r) => r.name === 'Tickets'
            )?.key;
            if (stackKey) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Tickets' }],
              });
            }
          },
        })}
      />
      <Tab.Screen
        name='Notifications'
        component={NotificationsStackNavigator}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            // Prevent default tab behavior
            e.preventDefault();

            // Navigate to root screen of this tab
            navigation.navigate('Notifications', { screen: 'NotificationCenter' });

            // Force status bar update after navigation
            setTimeout(() => {
              forceStatusBarUpdate();
            }, 150);

            // Reset to root of stack
            const state = navigation.getState();
            const stackKey = state.routes.find(
              (r) => r.name === 'Notifications'
            )?.key;
            if (stackKey) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Notifications' }],
              });
            }
          },
        })}
      />
      <Tab.Screen
        name='Settings'
        component={SettingsStackNavigator}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            // Prevent default tab behavior
            e.preventDefault();

            // Navigate to root screen of this tab
            navigation.navigate('Settings', { screen: 'SettingsHome' });

            // Force status bar update after navigation
            setTimeout(() => {
              forceStatusBarUpdate();
            }, 150);

            // Reset to root of stack
            const state = navigation.getState();
            const stackKey = state.routes.find(
              (r) => r.name === 'Settings'
            )?.key;
            if (stackKey) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Settings' }],
              });
            }
          },
        })}
      />
    </Tab.Navigator>
  );
}
