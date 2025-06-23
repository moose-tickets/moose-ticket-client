import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      t('auth.signOut'),
      t('settings.signOutConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('auth.signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await dispatch(logoutUser()).unwrap();
              // Navigation will be handled automatically by AuthWatcher
            } catch (error) {
              setIsSigningOut(false);
              Alert.alert(
                t('common.error'),
                t('settings.signOutError'),
                [{ text: t('common.ok') }]
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
        <Header screenTitle={t('navigation.settings')} />
        
        {/* Notifications */}
        <ThemedText variant='primary' weight='semibold' className='mb-2'>{t('navigation.notifications')}</ThemedText>
        {[
          {
            label: t('notifications.ticketReminders'),
            state: ticketAlerts,
            setter: setTicketAlerts,
          },
          {
            label: t('notifications.paymentReminders'),
            state: paymentReminders,
            setter: setPaymentReminders,
          },
          {
            label: t('notifications.disputeUpdates'),
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
        <ThemedText variant='primary' weight='semibold' className='mt-6 mb-2'>{t('settings.account')}</ThemedText>
        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => navigation.navigate('Profile')}
        >
          <ThemedText variant='primary' size='base'>{t('navigation.profile')}</ThemedText>
          <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#C4C4C4'} />
        </TouchableOpacity>
        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => navigation.navigate('ManageSubscription')}
        >
          <ThemedText variant='primary' size='base'>{t('settings.manageSubscription')}</ThemedText>
          <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#C4C4C4'} />
        </TouchableOpacity>
        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <ThemedText variant='primary' size='base'>{t('settings.changePassword')}</ThemedText>
          <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#C4C4C4'} />
        </TouchableOpacity>

        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => navigation.navigate('LanguageRegion')}
        >
          <ThemedText variant='primary' size='base'>{t('settings.languageAndRegion')}</ThemedText>
          <ThemedText variant='secondary' size='sm'>{t('settings.currentLanguage')}</ThemedText>
        </TouchableOpacity>

        {/* Privacy & Security */}
        <ThemedText variant='primary' weight='semibold' className='mt-6 mb-2'>
          {t('settings.privacySecurity')}
        </ThemedText>
        <ThemedView className='flex-row justify-between items-center py-3 border-b border-border'>
          <ThemedText variant='primary' size='base'>
            {t('settings.enableBiometrics')}
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
                    title: t('common.error'),
                    message: t('settings.authenticationFailed'),
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
          {t('settings.supportLegal')}
        </ThemedText>
        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => navigation.navigate('HelpSupport')}
        >
          <ThemedText variant='primary' size='base'>{t('settings.helpCenter')}</ThemedText>
          <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#C4C4C4'} />
        </TouchableOpacity>
        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => navigation.navigate('Terms')}
        >
          <ThemedText variant='primary' size='base'>{t('legal.termsOfService')}</ThemedText>
          <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#C4C4C4'} />
        </TouchableOpacity>
        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => navigation.navigate('Privacy')}
        >
          <ThemedText variant='primary' size='base'>{t('legal.privacyPolicy')}</ThemedText>
          <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#C4C4C4'} />
        </TouchableOpacity>

        {/* Appearance */}
        <Text className='text-text-primary font-semibold mt-6 mb-2'>
          {t('settings.appearance')}
        </Text>
        <TouchableOpacity
          className='flex-row justify-between items-center py-3 border-b border-border'
          onPress={() => setShowThemeSelector(true)}
        >
          <Text className='text-[15px] text-text-primary'>{t('settings.theme')}</Text>
          <View className='flex-row items-center'>
            <Text className='text-text-secondary text-[14px] mr-2'>
              {themeMode === 'auto' ? t('settings.system') : themeMode === 'light' ? t('settings.lightMode') : t('settings.darkMode')}
            </Text>
            <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#C4C4C4'} />
          </View>
        </TouchableOpacity>
        
        <View className='flex-row justify-between items-center py-3'>
          <Text className='text-[15px] text-text-primary'>{t('settings.quickToggle')}</Text>
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
              <ThemedText className='text-red-500 font-medium text-[16px]'>{t('settings.signingOut')}</ThemedText>
            </View>
          ) : (
            <ThemedText className='text-red-500 font-medium text-[16px]'>{t('auth.signOut')}</ThemedText>
          )}
        </TouchableOpacity>
        {/* Version info */}
        <ThemedText variant='tertiary' size='sm' className='text-center mb-10'>
          {t('settings.version')}
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
        title={t('settings.chooseTheme')}
        onClose={() => setShowThemeSelector(false)}
        messageComponent={
          <ThemeSelector onClose={() => setShowThemeSelector(false)} />
        }
      />
    </AppLayout>
  );
}
