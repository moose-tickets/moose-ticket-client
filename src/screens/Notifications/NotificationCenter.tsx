import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNotificationsStackNavigation } from '../../navigation/hooks';
import { ThemedView, ThemedText, ThemedCard } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';

// notifications data moved inside component for translation access


export default function NotificationCenter() {
  const navigation = useNotificationsStackNavigation();
  const { theme, presets } = useTheme();
  const { t } = useTranslation();
  const [tab, setTab] = useState('All');
  
  const notifications = [
    {
      id: "1",
      type: "ticket",
      title: t('notifications.newParkingTicket'),
      time: "May 30, 2025 · 14:30",
      message: t('notifications.plateReceivedTicket', { plate: 'ABC1234' }),
      iconColor: "#E18743",
      read: false,
    },
    {
      id: "2",
      type: "payment",
      title: t('notifications.paymentSuccessful'),
      time: "May 29, 2025 · 09:15",
      message: t('notifications.paymentAmount', { amount: '$75.00', ticket: '#12345' }),
      iconColor: "#34A853",
      read: true,
    },
    {
      id: "3",
      type: "dispute",
      title: t('notifications.disputeStatusUpdated'),
      time: "May 28, 2025 · 16:45",
      message: t('notifications.disputeForTicket', { ticket: '#12346' }),
      iconColor: "#6B7280",
      read: true,
    },
  ];

  return (
    <ThemedView className='flex-1 pt-14 px-4'>
      {/* Header */}
      <ThemedView className='flex-row items-center justify-between mb-4'>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons 
            name='chevron-back' 
            size={24} 
            color={theme === 'dark' ? '#22C55E' : '#10472B'} 
          />
        </TouchableOpacity>
        <ThemedText size='lg' weight='bold'>{t('navigation.notifications')}</ThemedText>
        <View className='w-6' />
      </ThemedView>

      {/* Tabs */}
      <ThemedView variant='secondary' className='flex-row rounded-full mb-4'>
        {[t('notifications.all'), t('notifications.unread')].map((label, index) => {
          const tabValue = ['All', 'Unread'][index];
          return (
            <TouchableOpacity
              key={tabValue}
              onPress={() => setTab(tabValue)}
              className={`flex-1 py-2 rounded-full items-center ${
                tab === tabValue ? 'bg-primary' : ''
              }`}
            >
              <ThemedText
                weight='medium'
                variant={tab === tabValue ? 'inverse' : 'primary'}
              >
                {label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ThemedView>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('NotificationDetails')
            }
          >
            <ThemedCard 
              variant='default'
              className={`mb-3 flex-row ${
                !item.read ? 'bg-primary-50' : ''
              }`}
            >
              <ThemedView
                className='w-10 h-10 rounded-full mr-4 items-center justify-center'
                style={{ 
                  backgroundColor: theme === 'dark' 
                    ? `${item.iconColor}30` 
                    : `${item.iconColor}20` 
                }}
              >
                <FontAwesome
                  name={
                    item.type === 'ticket'
                      ? 'ticket'
                      : item.type === 'payment'
                      ? 'check'
                      : 'info'
                  }
                  size={16}
                  color={item.iconColor}
                />
              </ThemedView>
              <ThemedView className={`flex-1 px-2 ${
                !item.read ? 'bg-primary-50' : ''
              }` }>
                <ThemedText
                  weight='semibold'
                  size='base'
                  numberOfLines={1}
                >
                  {item.title}
                </ThemedText>
                <ThemedText variant='tertiary' size='xs'>{item.time}</ThemedText>
                <ThemedText variant='secondary' size='sm' numberOfLines={1}>
                  {item.message}
                </ThemedText>
              </ThemedView>
              <Ionicons
                name='chevron-forward'
                size={18}
                color={theme === 'dark' ? '#94A3B8' : '#9CA3AF'}
                style={{ alignSelf: 'center' }}
              />
            </ThemedCard>
          </TouchableOpacity>
        )}
      />
    </ThemedView>
  );
}
