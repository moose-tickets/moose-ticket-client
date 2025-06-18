// src/screens/Splash.tsx
import React, { useEffect } from "react";
import { View, Text, Image, ActivityIndicator, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { useAppSelector, useAppDispatch } from "../store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView, ThemedText } from "../components/ThemedComponents";
import { useTheme } from "../wrappers/ThemeProvider";
import { selectIsAuthenticated, selectUser, initializeAuth } from "../store/slices/authSlice";
import { initializeApp } from "../store/slices/appSlice";
import { fetchProfile } from "../store/slices/userSlice";


const { width } = Dimensions.get("window");
const LOGO_WIDTH = width * 0.5;

const GRADIENT_START = "#004F4F";
const GRADIENT_END   = "#007272";
const LOGO_SRC       = require("../../assets/brandLogo.png");

export default function Splash() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  useEffect(() => {
    const initializeAndNavigate = async () => {
      try {
        // Initialize the app and authentication
        await dispatch(initializeApp());
        const authResult = await dispatch(initializeAuth());
        
        // If authentication is valid, fetch profile
        if (authResult.payload && authResult.payload.isAuthenticated) {
          try {
            await dispatch(fetchProfile());
          } catch (error) {
            console.log('Profile fetch failed:', error);
          }
        }
        
        // Check onboarding status
        const onboardingSeen = await AsyncStorage.getItem("onboarding_shown");
        
        // Get the updated authentication state after initialization
        const authState = (authResult.payload as any);
        const finalIsAuthenticated = authState?.isAuthenticated || false;
        const finalUser = authState?.user || null;
        
        // Determine navigation route
        let route: string;
        let screen: string;
        
        if (finalIsAuthenticated && finalUser) {
          route = "Main";
          screen = "Dashboard";
        } else if (onboardingSeen) {
          route = "Auth";
          screen = "SignIn";
        } else {
          route = "Auth";
          screen = "Onboarding";
        }

        // Navigate after minimum splash time
        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: route, params: route === "Auth" ? { screen } : undefined }],
            })
          );
        }, 2000); // Reduced from 3000 to 2000ms
        
      } catch (error) {
        console.error('Splash initialization error:', error);
        // Fallback to auth screen on error
        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Auth", params: { screen: "SignIn" } }],
            })
          );
        }, 2000);
      }
    };

    initializeAndNavigate();
  }, [navigation, dispatch, isAuthenticated, user]);
  return (
    <LinearGradient
      colors={theme === 'dark' ? ['#0B0D10', '#1F2329'] : [GRADIENT_START, GRADIENT_END]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1 justify-center items-center">
      <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center" }} className="bg-transparent">
        {/* <Image
          source={LOGO_SRC}
          style={{ width: LOGO_WIDTH, height: LOGO_WIDTH, marginBottom: 16, borderRadius: 10}}
          resizeMode="contain"
          className="rounded-lg"
        /> */}
        <ThemedText 
          size="3xl" 
          weight="bold"
          style={{ color: "#FFFFFF"}}
          className="text-center"
        >
          MooseTicket
        </ThemedText>
        <ThemedText
          size="base"
          style={{
            color: "rgba(255,255,255,0.85)",
            marginTop: 4,
            textAlign: "center",
          }}
          className="text-center"
        >
          Your City Ticket Tracker
        </ThemedText>
        <View style={{ height: 32 }} />
        <ActivityIndicator size="large" color="#FFFFFF" />
      </ThemedView>

      </View>
    </LinearGradient>
  );
}
