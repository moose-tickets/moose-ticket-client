// src/redux/appSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Appearance } from "react-native";

export type ThemeMode = "light" | "dark";

export interface AppState {
  theme: ThemeMode;
}

const systemScheme = Appearance.getColorScheme();
const initialState: AppState = {
  theme: systemScheme === "dark" ? "dark" : "light",
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
  },
});

export const { setTheme, toggleTheme } = appSlice.actions;
export default appSlice.reducer;

// Selector
export const selectTheme = (state: { app: AppState }) => state.app.theme;
