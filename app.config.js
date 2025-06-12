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
      ARCHET_API_KEY: process.env.ARCHET_API_KEY,
      API_URL: process.env.API_URL,
      
    },

    // Any Expo plugins you need
    plugins: [
      "expo-font",
      "expo-secure-store"
      // (if you add other plugins later, list them here)
    ],
    doctor: {
      reactNativeDirectoryCheck: {
        listUnknownPackages: false
      }
    }
  },
};
