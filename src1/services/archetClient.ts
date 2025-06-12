// src/services/ArchetClient.ts
import Constants from "expo-constants";

let Arcjet: any;
try {
  // Attempt to require the Arcjet SDK; if it isn’t installed, catch the error
  Arcjet = require("arcjet");
} catch (e) {
  console.warn(
    "⚠️ arcjet package not found. Bot‐detection will be disabled.",
    e
  );
}

type BotContext = { score: number; isHuman: boolean };

class ArchetClient {
  private static instance: any = null;

  static initialize() {
    if (!Arcjet) {
      // If Arcjet didn’t load, do nothing
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
      ArchetClient.instance = new Arcjet({
        apiKey,
        environment: __DEV__ ? "development" : "production",
      });
    }
  }

  static getInstance(): any {
    if (!Arcjet) {
      throw new Error("Arcjet SDK not loaded. Cannot call getInstance().");
    }
    if (!ArchetClient.instance) {
      throw new Error("ArchetClient not initialized; call initialize() first.");
    }
    return ArchetClient.instance;
  }

  static async getBotContext(): Promise<BotContext> {
    if (!Arcjet) {
      return { score: 1, isHuman: true };
    }
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
  }
}

export default ArchetClient;
