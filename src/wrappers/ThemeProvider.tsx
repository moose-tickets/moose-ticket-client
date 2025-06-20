import React, { createContext, useContext, useState, useEffect } from "react";
import { View, Platform, AppState } from "react-native";
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { useColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { themes, ThemeMode, themePresets } from "../utils/color-theme";
import * as NavigationBar from 'expo-navigation-bar';

interface ThemeContextType {
  theme: "light" | "dark";
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  forceStatusBarUpdate: () => void;
  presets: typeof themePresets.light | typeof themePresets.dark;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  themeMode: "auto",
  setThemeMode: () => {},
  toggleTheme: () => {},
  forceStatusBarUpdate: () => {},
  presets: themePresets.light,
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

const THEME_STORAGE_KEY = "mooseticket_theme_mode";

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { colorScheme } = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("auto");
  
  // Determine the actual theme based on mode
  const getActualTheme = (mode: ThemeMode): "light" | "dark" => {
    if (mode === "auto") {
      return colorScheme === "dark" ? "dark" : "light";
    }
    return mode;
  };
  
  const currentTheme = getActualTheme(themeMode);
  const currentPresets = themePresets[currentTheme];

  // Update navigation bar and status bar when theme changes
  useEffect(() => {
    const updateStatusBar = async () => {
      // Force update status bar immediately
      const statusBarStyle = currentTheme === 'dark' ? 'light' : 'dark';
      setStatusBarStyle(statusBarStyle, true); // true for animated
      
      // Small delay to ensure theme change is applied, then force another update
      setTimeout(() => {
        setStatusBarStyle(statusBarStyle, false); // Force update without animation
      }, 100);
    };

    updateStatusBar();
    
    if (Platform.OS === 'android') {
      // Set Android navigation bar
      NavigationBar.setBackgroundColorAsync(
        currentTheme === 'dark' ? '#151820' : '#FFFFFF'
      );
      NavigationBar.setButtonStyleAsync(
        currentTheme === 'dark' ? 'light' : 'dark'
      );
    }
  }, [currentTheme]);

  // Load saved theme mode on mount
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ["light", "dark", "auto"].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.log("Error loading theme mode:", error);
      }
    };
    loadThemeMode();
  }, []);

  // Listen to app state changes and force status bar update when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Force status bar update when app becomes active
        setTimeout(() => {
          const statusBarStyle = currentTheme === 'dark' ? 'light' : 'dark';
          setStatusBarStyle(statusBarStyle, false);
        }, 100);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [currentTheme]);

  // Save theme mode when it changes
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.log("Error saving theme mode:", error);
    }
  };

  // Toggle between light and dark (skipping auto)
  const toggleTheme = () => {
    const newMode = currentTheme === "light" ? "dark" : "light";
    setThemeMode(newMode);
  };

  // Force status bar update function
  const forceStatusBarUpdate = () => {
    const statusBarStyle = currentTheme === 'dark' ? 'light' : 'dark';
    setStatusBarStyle(statusBarStyle, false); // Force immediate update
  };

  const contextValue: ThemeContextType = {
    theme: currentTheme,
    themeMode,
    setThemeMode,
    toggleTheme,
    forceStatusBarUpdate,
    presets: currentPresets,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <StatusBar 
        style={currentTheme === "dark" ? "light" : "dark"}
        backgroundColor={currentTheme === "dark" ? "#0B0D10" : "#FFFFFF"}
        translucent={false}
        animated={true}
        hideTransitionAnimation="fade"
      />
      <View style={themes[currentTheme]} className="flex-1 bg-background">
        {children}
      </View>
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Export context for advanced usage
export { ThemeContext };