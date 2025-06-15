// app.config.js
// import "dotenv/config";w
import Constants from "expo-constants";

export default {
  expo: {
    // Basic project info (from your old app.json)
    name: "MooseTicketApp",
    slug: "MooseTicketApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: true,

    // Splash screen config (copied from app.json)
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#004F4F",
      hideAsync: true,
    },

    // iOS-specific settings
    ios: {
      supportsTablet: true,
       "bundleIdentifier": "com.thurnye.MooseTicketApp"
    },

    // Android-specific settings
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
       "package": "com.thurnye.MooseTicketApp"
    },

    // Web-specific settings
    web: {
      favicon: "./assets/logo.png",
      bundler: "metro"
    },

    // Your dynamic “extra” values (from environment variables)
    extra: {
      API_URL: process.env.API_URL,
      EXPO_OS: process.env.EXPO_OS || "android",
      NODE_ENV: process.env.NODE_ENV || "development",
      __DEV__: process.env.NODE_ENV !== "production",
      GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID,
      GOOGLE_IOS_CLIENT_ID: process.env.GOOGLE_IOS_CLIENT_ID,
      FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
      FACEBOOK_DISPLAY_NAME: process.env.FACEBOOK_DISPLAY_NAME || "MooseTicket"
    },

    // Any Expo plugins you need
    plugins: [
      "expo-font",
      "expo-secure-store",
      "@react-native-google-signin/google-signin",
      "expo-apple-authentication"
      // (if you add other plugins later, list them here)
    ],
    doctor: {
      reactNativeDirectoryCheck: {
        listUnknownPackages: false
      }
    }
  },
};
