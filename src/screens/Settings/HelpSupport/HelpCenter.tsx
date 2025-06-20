import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
} from '@expo/vector-icons';
import { useSettingsStackNavigation } from '../../../navigation/hooks';
import AppLayout from '../../../wrappers/layout';
import GoBackHeader from '../../../components/GoBackHeader';
import { ThemedView, ThemedText, ThemedScrollView } from '../../../components/ThemedComponents';
import { useTheme } from '../../../wrappers/ThemeProvider';

export default function HelpSupport() {
  const navigation = useSettingsStackNavigation();
  const theme = useTheme()

  const topics = [
    { question: 'How do I pay a ticket?' },
    { question: 'How do I dispute a ticket?' },
    { question: "Why didn't I get a notification?" },
    { question: 'How to update my payment method?' },
    { question: 'How to add a vehicle?' },
  ];

  const openEmail = () => Linking.openURL('mailto:support@mooseticket.ca');
  //   const callSupport = () => Linking.openURL('tel:+14161234567');
  const openBugReport = () => console.log('Navigating to Bug Report screen');
  //   const openLiveChat = () => console.log('Navigating to Live Chat');

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5'>
        {/* Header */}
        <GoBackHeader screenTitle='Help & Support' />

        {/* Search */}
        <ThemedView className='border border-gray-300 rounded-xl p-3 flex-row items-center mb-4'>
          <Ionicons name='search' size={20} color='gray' className='mr-2' />
          <TextInput
            placeholder='Search for help topics...'
            className='flex-1 text-base'
          />
        </ThemedView>

        {/* Popular Topics */}
        <ThemedText className='font-medium mb-2'>Popular Topics</ThemedText>
        <ThemedView className='space-y-3 mb-10'>
          {topics.map((item, index) => (
            <TouchableOpacity
              key={index}
              className='flex-row items-center justify-between p-4 rounded-xl bg-background-secondary border border-border mb-4'
            >
              <ThemedView className='flex-row items-center space-x-2 bg-background-secondary'>
                <Ionicons
                  name='help-circle-outline'
                  size={20}
                  color={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  className='mr-1 '
                />
                <ThemedText variant='primary' size='base'>{item.question}</ThemedText>
              </ThemedView>
              <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          ))}
        </ThemedView>

        {/* <TouchableOpacity
          onPress={openLiveChat}
          className='flex-row items-center justify-between p-4 border border-gray-200 rounded-xl mb-6'
        >
          <View className='flex-row items-center space-x-2'>
            <MaterialCommunityIcons
              name='chat-outline'
              size={20}
              color='#014421'
            />
            <Text className='text-base'>Start Live Chat</Text>
          </ThemedView>
          <Ionicons name='chevron-forward' size={20} color='gray' />
        </TouchableOpacity> */}

        {/* Call Us
        <Text className='text-base font-medium mb-2'>Call Us</Text>
        <TouchableOpacity
          onPress={callSupport}
          className='flex-row items-center justify-between p-4 border border-gray-200 rounded-xl mb-6'
        >
          <View className='flex-row items-center space-x-2'>
            <FontAwesome name='phone' size={20} color='green' />
            <Text className='text-base'>+1 (416) 123-4567</Text>
          </ThemedView>
          <Ionicons name='chevron-forward' size={20} color='gray' />
        </TouchableOpacity> */}

        {/* Resources & Policies */}
        <ThemedText variant='primary' size='base' weight='medium' className='mb-2'>Resources & Policies</ThemedText>
        <ThemedView className='space-y-3 mb-10'>
          <TouchableOpacity className='flex-row items-center justify-between p-4 border border-border rounded-xl mb-4' onPress={() => navigation.navigate('Privacy')}>
            <ThemedView className='flex-row items-center space-x-2'>
              <Ionicons name='lock-closed-outline' size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} className='mr-1'/>
              <ThemedText variant='primary' size='base'>Privacy Policy</ThemedText>
            </ThemedView>
            <Ionicons name='chevron-forward' size={20} ccolor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>

          <TouchableOpacity className='flex-row items-center justify-between p-4 border border-border rounded-xl mb-4' onPress={() => navigation.navigate('Terms')}>
            <ThemedView className='flex-row items-center space-x-2'>
              <Ionicons name='document-text-outline' size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} className='mr-1'/>
              <ThemedText variant='primary' size='base'>Terms of Service</ThemedText>
            </ThemedView>
            <Ionicons name='chevron-forward' size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        </ThemedView>

        {/* Contact Us */}
        <ThemedText variant='primary' size='base' weight='medium' className='mb-2'>Contact Us</ThemedText>
        <TouchableOpacity
          onPress={openEmail}
          className='flex-row items-center justify-between p-4 border border-border rounded-xl mb-3'
        >
          <ThemedView className='flex-row items-center space-x-2'>
            <MaterialCommunityIcons
              name='email-outline'
              size={20}
              color='#E08631'
            />
            <ThemedText variant='primary' size='base'>support@mooseticket.com</ThemedText>
          </ThemedView>
          <Ionicons name='link-outline' size={18} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>

        {/* Report Bug */}
        <TouchableOpacity
          onPress={openBugReport}
          className='items-center mt-4 mb-2'
        >
          <ThemedText className='text-red-600 font-medium'>Report a Bug</ThemedText>
        </TouchableOpacity>

        {/* App Version */}
        <ThemedText variant='tertiary' className='text-center mb-8'>Version 1.0.0</ThemedText>
      </ThemedScrollView>
    </AppLayout>
  );
}
