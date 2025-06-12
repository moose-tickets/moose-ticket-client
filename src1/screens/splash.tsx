// src/screens/Splash.tsx
import React, { useEffect } from "react";
import { View, Text, Image, ActivityIndicator, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { useAppSelector } from "../redux/store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView, ThemedText } from "../components/ThemedComponents";
import { useTheme } from "../wrappers/ThemeProvider";


const { width } = Dimensions.get("window");
const LOGO_WIDTH = width * 0.5;

const GRADIENT_START = "#004F4F";
const GRADIENT_END   = "#007272";
const LOGO_SRC       = require("../../assets/brandLogo.png");

export default function Splash() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const token = useAppSelector((state) => state.auth?.token);

useEffect(() => {
  const checkAndNavigate = async () => {
    // const onboardingSeen = await AsyncStorage.getItem("onboarding_shown");
    const onboardingSeen =false;
    const route = token ? "Main" : onboardingSeen ? "Auth" : "Auth";
    const screen = onboardingSeen ? "SignIn" : "Onboarding";

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Auth", params: { screen } }],
      })
    );
  };

  const timeout = setTimeout(checkAndNavigate, 3000);
  return () => clearTimeout(timeout);
}, [navigation, token]);
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
