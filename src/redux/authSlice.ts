// src/redux/authSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as SecureStore from "expo-secure-store";
import apiClient from "../services/apiClients"; // no store import here

export interface AuthState {
  token: string | null;
  roles: string[];
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  roles: [],
  loading: false,
  error: null,
};

// Thunk to sign in
export const signIn = createAsyncThunk<
  { token: string; roles: string[] },
  { email: string; password: string },
  { rejectValue: string }
>(
  "auth/signIn",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/auth/signin", credentials);
      const { token, roles } = response.data as { token: string; roles: string[] };

      // Persist token
      await SecureStore.setItemAsync("userToken", token);
      return { token, roles };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Sign-in failed";
      return rejectWithValue(msg);
    }
  }
);

// Thunk to hydrate token on app start
export const hydrateAuth = createAsyncThunk<
  { token: string } | null,
  void,
  { rejectValue: string }
>(
  "auth/hydrateAuth",
  async (_, { rejectWithValue }) => {
    try {
      const savedToken = await SecureStore.getItemAsync("userToken");
      if (savedToken) return { token: savedToken };
      return null;
    } catch (err: any) {
      return rejectWithValue("Failed to load token");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.roles = [];
      state.error = null;
      // Remove token from SecureStore, but don’t import store here
      SecureStore.deleteItemAsync("userToken").catch(() => {});
    },
  },
  extraReducers: (builder) => {
    builder
      // signIn
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.roles = action.payload.roles;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Sign-in failed";
      })

      // hydrateAuth
      .addCase(hydrateAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.token) {
          state.token = action.payload.token;
          // roles will come from signIn or a separate API call
        }
      })
      .addCase(hydrateAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Hydration failed";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
