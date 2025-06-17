import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStackNavigation } from '../../navigation/hooks';
import { useAppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import App from '../../App';
import AppLayout from '../../wrappers/layout';
import Header from '../../components/Header';
import { authenticateWithBiometrics } from '../../utils/authUtils';
import Dialog from '../../components/Dialog';
import { ThemeToggle, ThemeSelector } from '../../components/ThemeToggle';
import { useTheme } from '../../wrappers/ThemeProvider';
import { ThemedView, ThemedText, ThemedScrollView } from '../../components/ThemedComponents';

export default function SettingsScreen() {
  const navigation = useSettingsStackNavigation();
  const { theme, themeMode } = useTheme();
  const dispatch = useAppDispatch();

  // Toggle states
  const [ticketAlerts, setTicketAlerts] = useState(false);
  const [paymentReminders, setPaymentReminders] = useState(false);
  const [disputeUpdates, setDisputeUpdates] = useState(false);
  const [faceIdEnabled, setFaceIdEnabled] = useState(true);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning', 
  });

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await dispatch(logoutUser()).unwrap();
              // Navigation will be handled automatically by AuthWatcher
            } catch (error) {
              setIsSigningOut(false);
              Alert.alert(
                'Error',
                'There was a problem signing out. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <AppLayout>
      <ThemedScrollView className='flex-1  px-6 '>
        {/* Header */}
        <Header screenTitle='Settings' />
        
        {/* Notifications */}
        <ThemedText variant='primary' weight='semibold' className='mb-2'>Notifications</ThemedText>
        {[
          {
            label: 'Ticket Alerts',
            state: ticketAlerts,
            setter: setTicketAlerts,
          },
          {
            label: 'Payment Reminders',
            state: paymentReminders,
            setter: setPaymentReminders,
          },
          {
            label: 'Dispute Updates',
            state: disputeUpdates,
            setter: setDisputeUpdates,
          },
        ].map((item, i) => (
          <ThemedView
            key={i}
            className='flex-row justify-between items-center py-3 border-b border-border'
          >
            <ThemedText variant='primary' size='base'>{item.label}</ThemedText>
            <Switch
              value={item.state}
              onValueChange={item.setter}
              trackColor={{ false: theme === 'dark' ? '#374151' : '#ccc', true: theme === 'dark' ? '#22C55E' : '#10472B' }}
              thumbColor={item.state ? '#fff' : '#f4f3f4'}
            />
          </ThemedView>
        ))}

        {/* Account */}
        <ThemedText variant='primary' weight='semibold' className='mt-6 mb-2'>Account</ThemedText>
        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => navigation.navigate('Profile')}
        >
          <ThemedText variant='primary' size='base'>Profile</ThemedText>
          <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#C4C4C4'} />
        </TouchableOpacity>
        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => navigation.navigate('ManageSubscription')}
        >
          <ThemedText variant='primary' size='base'>Manage Subscription</ThemedText>
          <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#C4C4C4'} />
        </TouchableOpacity>
        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <ThemedText variant='primary' size='base'>Change Password</ThemedText>
          <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#C4C4C4'} />
        </TouchableOpacity>

        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => navigation.navigate('LanguageRegion')}
        >
          <ThemedText variant='primary' size='base'>Language & Region</ThemedText>
          <ThemedText variant='secondary' size='sm'>English (Canada)</ThemedText>
        </TouchableOpacity>

        {/* Privacy & Security */}
        <ThemedText variant='primary' weight='semibold' className='mt-6 mb-2'>
          Privacy & Security
        </ThemedText>
        <ThemedView className='flex-row justify-between items-center py-3 border-b border-border'>
          <ThemedText variant='primary' size='base'>
            Enable Face/Touch ID
          </ThemedText>
          <Switch
            value={faceIdEnabled}
            onValueChange={async () => {
              if (!faceIdEnabled) {
                const success = await authenticateWithBiometrics();
                if (success) {
                  setFaceIdEnabled(true);
                } else {
                  setDialogProps({
                    title: 'Error!',
                    message: 'Authentication failed or cancelled.',
                    type: 'error',
                  });
                  setDialogVisible(true);
                }
              } else {
                setFaceIdEnabled(false);
              }
            }}
            trackColor={{ false: theme === 'dark' ? '#374151' : '#ccc', true: theme === 'dark' ? '#22C55E' : '#10472B' }}
            thumbColor={faceIdEnabled ? '#fff' : '#f4f3f4'}
          />
        </ThemedView>


        {/* Support & Legal */}
        <ThemedText variant='primary' weight='semibold' className='mt-6 mb-2'>
          Support & Legal
        </ThemedText>
        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => navigation.navigate('HelpSupport')}
        >
          <ThemedText variant='primary' size='base'>Help Center</ThemedText>
          <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#C4C4C4'} />
        </TouchableOpacity>
        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => navigation.navigate('Terms')}
        >
          <ThemedText variant='primary' size='base'>Terms of Service</ThemedText>
          <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#C4C4C4'} />
        </TouchableOpacity>
        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => navigation.navigate('Privacy')}
        >
          <ThemedText variant='primary' size='base'>Privacy Policy</ThemedText>
          <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#C4C4C4'} />
        </TouchableOpacity>

        {/* Appearance */}
        <Text className='text-text-primary font-semibold mt-6 mb-2'>
          Appearance
        </Text>
        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => setShowThemeSelector(true)}
        >
          <Text className='text-[15px] text-text-primary'>Theme</Text>
          <View className='flex-row items-center'>
            <Text className='text-text-secondary text-[14px] mr-2'>
              {themeMode === 'auto' ? 'System' : themeMode === 'light' ? 'Light' : 'Dark'}
            </Text>
            <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#C4C4C4'} />
          </View>
        </TouchableOpacity>
        
        <View className='flex-row justify-between items-center py-3'>
          <Text className='text-[15px] text-text-primary'>Quick Toggle</Text>
          <ThemeToggle showLabel={false} size="md" />
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          className='mt-10 mb-5 items-center'
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <View className='flex-row items-center'>
              <ActivityIndicator size="small" color="#EF4444" style={{ marginRight: 8 }} />
              <ThemedText className='text-red-500 font-medium text-[16px]'>Signing Out...</ThemedText>
            </View>
          ) : (
            <ThemedText className='text-red-500 font-medium text-[16px]'>Sign Out</ThemedText>
          )}
        </TouchableOpacity>
        {/* Version info */}
        <ThemedText variant='tertiary' size='sm' className='text-center mb-10'>
          Version 1.0.0
        </ThemedText>
      </ThemedScrollView>
      <Dialog
        visible={dialogVisible}
        title={dialogProps.title}
        message={dialogProps.message}
        type={dialogProps.type}
        onClose={() => {
          setDialogVisible(false);
        }}
      />
      
      {/* Theme Selector Modal */}
      <Dialog
        visible={showThemeSelector}
        title="Choose Theme"
        onClose={() => setShowThemeSelector(false)}
        messageComponent={
          <ThemeSelector onClose={() => setShowThemeSelector(false)} />
        }
      />
    </AppLayout>
  );
}
