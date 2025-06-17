// src/App.tsx

// Core polyfills must come first, before any other imports
import { Buffer } from "buffer";
import process from "process";

// Set up global polyfills immediately
(global as any).Buffer = Buffer;
(global as any).process = process;

// setImmediate polyfill for Hermes
if (typeof (global as any).setImmediate === 'undefined') {
  (global as any).setImmediate = (callback: Function, ...args: any[]) => {
    return setTimeout(() => callback(...args), 0);
  };
}

if (typeof (global as any).clearImmediate === 'undefined') {
  (global as any).clearImmediate = (id: any) => {
    clearTimeout(id);
  };
}

// window polyfill for Hermes
if (typeof (global as any).window === 'undefined') {
  (global as any).window = global;
}

// document polyfill for Hermes
if (typeof (global as any).document === 'undefined') {
  (global as any).document = {
    createElement: () => ({}),
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    getElementsByTagName: () => [],
    getElementsByClassName: () => [],
    cookie: '',
    readyState: 'complete',
    location: { href: '', origin: '', protocol: 'https:', host: '' }
  };
}

// navigator polyfill for Hermes
if (typeof (global as any).navigator === 'undefined') {
  (global as any).navigator = {
    userAgent: 'React Native',
    language: 'en-US',
    languages: ['en-US'],
    platform: 'React Native',
    onLine: true,
    cookieEnabled: false
  };
}

// location polyfill for Hermes
if (typeof (global as any).location === 'undefined') {
  (global as any).location = {
    href: '',
    origin: '',
    protocol: 'https:',
    host: '',
    hostname: '',
    port: '',
    pathname: '/',
    search: '',
    hash: ''
  };
}

// localStorage polyfill for Hermes
if (typeof (global as any).localStorage === 'undefined') {
  const storage = new Map();
  (global as any).localStorage = {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    get length() { return storage.size; },
    key: (index: number) => Array.from(storage.keys())[index] || null
  };
}

// sessionStorage polyfill for Hermes
if (typeof (global as any).sessionStorage === 'undefined') {
  (global as any).sessionStorage = (global as any).localStorage;
}

// XMLHttpRequest polyfill for Hermes
if (typeof (global as any).XMLHttpRequest === 'undefined') {
  (global as any).XMLHttpRequest = class XMLHttpRequest {
    readyState = 0;
    status = 0;
    statusText = '';
    responseText = '';
    response = '';
    onreadystatechange = null;
    open() {}
    send() {}
    setRequestHeader() {}
    abort() {}
  };
}

// FormData polyfill for Hermes - use form-data package
if (typeof (global as any).FormData === 'undefined') {
  try {
    const FormDataPolyfill = require('form-data');
    (global as any).FormData = FormDataPolyfill;
  } catch (error) {
    // Fallback FormData implementation
    (global as any).FormData = class FormData {
      private _data: Array<[string, any]> = [];
      
      append(key: string, value: any) {
        this._data.push([key, value]);
      }
      
      get(key: string) {
        const entry = this._data.find(([k]) => k === key);
        return entry ? entry[1] : null;
      }
      
      getAll(key: string) {
        return this._data.filter(([k]) => k === key).map(([, v]) => v);
      }
      
      has(key: string) {
        return this._data.some(([k]) => k === key);
      }
      
      delete(key: string) {
        this._data = this._data.filter(([k]) => k !== key);
      }
      
      entries() {
        return this._data[Symbol.iterator]();
      }
      
      keys() {
        return this._data.map(([k]) => k)[Symbol.iterator]();
      }
      
      values() {
        return this._data.map(([, v]) => v)[Symbol.iterator]();
      }
    };
  }
}

// Blob and File polyfills
if (typeof (global as any).Blob === 'undefined') {
  try {
    const BlobPolyfill = require('react-native/Libraries/Blob/Blob').Blob;
    (global as any).Blob = BlobPolyfill;
  } catch (error) {
    console.warn('Blob polyfill unavailable:', error);
  }
}

if (typeof (global as any).File === 'undefined') {
  try {
    const FilePolyfill = require('react-native/Libraries/Blob/File').File;
    (global as any).File = FilePolyfill;
  } catch (error) {
    console.warn('File polyfill unavailable:', error);
  }
}

// URL polyfill must come after core polyfills
import "react-native-url-polyfill/auto";

import React, { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Provider as ReduxProvider } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import * as Linking from 'expo-linking';
import { LogBox } from "react-native";
import "../global.css"
import { useAppSelector } from './store';
import { selectTheme } from './store/slices/appSlice';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Merriweather_400Regular } from "@expo-google-fonts/merriweather";


import { hydrateAuth } from "./store/slices/authSlice";
import unifiedSecurityService from "./services/unifiedSecurityService";
import store from "./store";
import AppNavigator from "./navigation/AppNavigator";
import { ThemeProvider } from "./wrappers/ThemeProvider";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  LogBox.ignoreAllLogs(true);

  // Global JS error handler (optional)
  // @ts-ignore
  global.ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
    console.log("Global JS error:", error);
  });

  const [appIsReady, setAppIsReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Merriweather_400Regular,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Unified security service initializes automatically
        console.log('🛡️ Top-notch security system initialized');
        store.dispatch(hydrateAuth());
      } catch (e) {
        console.warn("Initialization error:", e);
      } finally {
        if (fontsLoaded) {
          await SplashScreen.hideAsync();
          setAppIsReady(true);
        }
      }
    }
    prepare();
  }, [fontsLoaded]);

  if (!appIsReady) {
    return null;
  }

  return <AppNavigator />;
}

export default function App() {
  const linking = {
    prefixes: [Linking.createURL('/'), 'mooseticket://'],
    config: {
      screens: {
        Auth: {
          screens: {
            EmailVerified: 'email-verified',
          },
        },
      },
    },
  };

  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer linking={linking}>
            <AppContent />
          </NavigationContainer>
        </GestureHandlerRootView>
      </ThemeProvider>
    </ReduxProvider>
  );
}
