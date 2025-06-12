// src/App.tsx

import "react-native-url-polyfill/auto";
import { Buffer } from "buffer";
import process from "process";
(global as any).Buffer = Buffer;
(global as any).process = process;

import React, { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Provider as ReduxProvider } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { LogBox } from "react-native";
import "../global.css"
import { useAppSelector } from './redux/store';
import { selectTheme } from './redux/appSlice';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Merriweather_400Regular } from "@expo-google-fonts/merriweather";


import { hydrateAuth } from "./redux/authSlice";
import ArchetClient from "./services/archetClient";
import ArcjetSecurity from "./services/arcjetSecurity";
import store from "./redux/store";
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
        ArchetClient.initialize();
        ArcjetSecurity.initialize();
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
  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </GestureHandlerRootView>
      </ThemeProvider>
    </ReduxProvider>
  );
}
