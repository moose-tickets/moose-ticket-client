// src/services/ArchetClient.ts
import Constants from "expo-constants";

// Safe Arcjet import with better error handling
let Arcjet: any = null;

const loadArcjet = () => {
  if (Arcjet !== null) return Arcjet;
  
  try {
    // Try React Native compatible import first
    Arcjet = require("@arcjet/react-native");
    console.log("✅ Arcjet React Native SDK loaded");
    return Arcjet;
  } catch (e1) {
    try {
      // Fallback to Node.js SDK  
      Arcjet = require("@arcjet/node");
      console.log("✅ Arcjet Node SDK loaded");
      return Arcjet;
    } catch (e2) {
      try {
        // Fallback to main package
        Arcjet = require("arcjet");
        console.log("✅ Arcjet main package loaded");
        return Arcjet;
      } catch (e3) {
        console.warn("⚠️ Arcjet package not found. Security features will be disabled.");
        if (__DEV__) {
          console.warn("To enable security features, install: npm install @arcjet/react-native");
        }
        Arcjet = false; // Mark as unavailable
        return null;
      }
    }
  }
};

// Initialize Arcjet
loadArcjet();

type BotContext = { score: number; isHuman: boolean };

class ArchetClient {
  private static instance: any = null;

  static initialize() {
    if (!Arcjet || Arcjet === false) {
      // If Arcjet didn't load, do nothing
      if (__DEV__) {
        console.log("🔒 Arcjet security features are disabled in development");
      }
      return;
    }
    if (!ArchetClient.instance) {
      const apiKey = Constants.expoConfig?.extra?.ARCHET_API_KEY ?? "";
      if (!apiKey) {
        console.warn(
          "⚠️ ARCHET_API_KEY is missing in Constants.expoConfig.extra – Arcjet not initialized."
        );
        return;
      }
      
      try {
        ArchetClient.instance = new Arcjet({
          apiKey,
          environment: __DEV__ ? "development" : "production",
        });
        console.log("✅ Arcjet client initialized successfully");
      } catch (error) {
        console.error("❌ Failed to initialize Arcjet client:", error);
      }
    }
  }

  static getInstance(): any {
    if (!Arcjet || Arcjet === false) {
      throw new Error("Arcjet SDK not loaded. Cannot call getInstance().");
    }
    if (!ArchetClient.instance) {
      throw new Error("ArchetClient not initialized; call initialize() first.");
    }
    return ArchetClient.instance;
  }

  static async getBotContext(): Promise<BotContext> {
    if (!Arcjet || Arcjet === false) {
      return { score: 1, isHuman: true };
    }
    
    try {
      const archet = ArchetClient.getInstance();
      const ctx = await archet.getBotContext({
        device: {
          platform: Constants.platform?.os ?? "unknown",
          sdkVersion: Constants.expoConfig?.sdkVersion ?? "unknown",
          appVersion: Constants.expoConfig?.version ?? "unknown",
        },
      });
      return {
        score: ctx.score,
        isHuman: ctx.score < 0.8,
      };
    } catch (error) {
      console.warn("Bot context error:", error);
      return { score: 1, isHuman: true };
    }
  }

  static isAvailable(): boolean {
    return !!(Arcjet && Arcjet !== false && ArchetClient.instance);
  }
}

export default ArchetClient;