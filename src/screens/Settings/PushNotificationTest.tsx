// src/screens/Settings/PushNotificationTest.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { pushNotificationManager } from '../../utils/pushNotifications';
import { selectPushToken } from '../../store/slices/notificationSlice';

const PushNotificationTest: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUnregistering, setIsUnregistering] = useState(false);
  
  const pushTokenData = useSelector(selectPushToken);

  useEffect(() => {
    // Initialize push notifications when component mounts
    const initializePushNotifications = async () => {
      try {
        await pushNotificationManager.initialize();
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
      }
    };

    initializePushNotifications();

    // Cleanup on unmount
    return () => {
      pushNotificationManager.cleanup();
    };
  }, []);

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      await pushNotificationManager.registerForPushNotifications();
      Alert.alert('Success', 'Push notifications registered successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to register push notifications');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      const result = await pushNotificationManager.testNotification();
      if (result.success) {
        Alert.alert('Success', 'Test notification sent successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to send test notification');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send test notification');
    } finally {
      setIsTesting(false);
    }
  };

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    try {
      await pushNotificationManager.refreshToken();
      Alert.alert('Success', 'Push token refreshed successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to refresh token');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUnregister = async () => {
    setIsUnregistering(true);
    try {
      await pushNotificationManager.unregisterToken();
      Alert.alert('Success', 'Push token unregistered successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to unregister token');
    } finally {
      setIsUnregistering(false);
    }
  };

  const handleScheduleTestReminder = async () => {
    try {
      const testDate = new Date(Date.now() + 10000); // 10 seconds from now
      await pushNotificationManager.scheduleTicketReminder('test-ticket-123', testDate);
      Alert.alert('Success', 'Test reminder scheduled for 10 seconds from now!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to schedule test reminder');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6 text-center">Push Notification Test</Text>
      
      {/* Token Status */}
      <View className="bg-gray-100 p-4 rounded-lg mb-6">
        <Text className="text-lg font-semibold mb-2">Token Status</Text>
        {pushTokenData?.token ? (
          <View>
            <Text className="text-green-600 mb-2">✅ Registered</Text>
            <Text className="text-sm text-gray-600 mb-1">
              Platform: {pushTokenData.platform}
            </Text>
            <Text className="text-sm text-gray-600 mb-1">
              Device: {pushTokenData.deviceInfo?.model} ({pushTokenData.deviceInfo?.osVersion})
            </Text>
            <Text className="text-sm text-gray-600 mb-1">
              Registered: {pushTokenData.registeredAt ? new Date(pushTokenData.registeredAt).toLocaleString() : 'Unknown'}
            </Text>
            <Text className="text-xs text-gray-500 mt-2">
              Token: {pushTokenData.token.substring(0, 30)}...
            </Text>
          </View>
        ) : (
          <Text className="text-red-600">❌ Not registered</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View className="space-y-4">
        <TouchableOpacity
          onPress={handleRegister}
          disabled={isRegistering}
          className={`p-4 rounded-lg ${
            isRegistering 
              ? 'bg-gray-300' 
              : 'bg-blue-500'
          }`}
        >
          <Text className="text-white text-center font-semibold">
            {isRegistering ? 'Registering...' : 'Register for Push Notifications'}
          </Text>
        </TouchableOpacity>

        {pushTokenData?.token && (
          <>
            <TouchableOpacity
              onPress={handleTestNotification}
              disabled={isTesting}
              className={`p-4 rounded-lg ${
                isTesting 
                  ? 'bg-gray-300' 
                  : 'bg-green-500'
              }`}
            >
              <Text className="text-white text-center font-semibold">
                {isTesting ? 'Sending...' : 'Send Test Notification'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRefreshToken}
              disabled={isRefreshing}
              className={`p-4 rounded-lg ${
                isRefreshing 
                  ? 'bg-gray-300' 
                  : 'bg-orange-500'
              }`}
            >
              <Text className="text-white text-center font-semibold">
                {isRefreshing ? 'Refreshing...' : 'Refresh Token'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleScheduleTestReminder}
              className="p-4 rounded-lg bg-purple-500"
            >
              <Text className="text-white text-center font-semibold">
                Schedule Test Reminder
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleUnregister}
              disabled={isUnregistering}
              className={`p-4 rounded-lg ${
                isUnregistering 
                  ? 'bg-gray-300' 
                  : 'bg-red-500'
              }`}
            >
              <Text className="text-white text-center font-semibold">
                {isUnregistering ? 'Unregistering...' : 'Unregister Token'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Instructions */}
      <View className="mt-8 p-4 bg-blue-50 rounded-lg">
        <Text className="text-lg font-semibold mb-2 text-blue-800">Testing Instructions</Text>
        <Text className="text-blue-700 mb-2">
          1. First, tap "Register for Push Notifications" to get your device token
        </Text>
        <Text className="text-blue-700 mb-2">
          2. Once registered, you can send a test notification to verify it works
        </Text>
        <Text className="text-blue-700 mb-2">
          3. Use "Refresh Token" to update your token registration
        </Text>
        <Text className="text-blue-700 mb-2">
          4. "Schedule Test Reminder" will send a local notification in 10 seconds
        </Text>
        <Text className="text-blue-700">
          5. "Unregister Token" will remove your device from push notifications
        </Text>
      </View>
    </ScrollView>
  );
};

export default PushNotificationTest;