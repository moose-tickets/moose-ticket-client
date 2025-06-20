// src/config/firebase.config.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';
import { Platform } from 'react-native';

// Firebase config from GoogleService-Info.plist / google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyB5J8J8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q", // Replace with actual API key
  authDomain: "moose-ticket.firebaseapp.com",
  projectId: "moose-ticket",
  storageBucket: "moose-ticket.appspot.com",
  messagingSenderId: "102228583179518875570",
  appId: "1:102228583179518875570:ios:abcdef1234567890abcdef", // Replace with actual app ID
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

// Initialize FCM (only for web, React Native uses different approach)
export const getFirebaseMessaging = async () => {
  if (Platform.OS === 'web') {
    const supported = await isSupported();
    if (supported) {
      return getMessaging(firebaseApp);
    }
  }
  return null;
};

export default firebaseApp;