// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import all slice reducers
import authReducer from './slices/authSlice';
import appReducer from './slices/appSlice';
import userReducer from './slices/userSlice';
import ticketReducer from './slices/ticketSlice';
import vehicleReducer from './slices/vehicleSlice';
import paymentReducer from './slices/paymentSlice';
import notificationReducer from './slices/notificationSlice';
import disputeReducer from './slices/disputeSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import dashboardReducer from './slices/dashboardSlice';
import consentReducer from './slices/consentSlice';
import infractionTypeReducer from './slices/infractionTypeSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'app', 'user'], // Only persist these slices
  blacklist: ['tickets', 'notifications'], // Don't persist these (they should refresh)
};

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['token', 'refreshToken', 'user', 'isAuthenticated'],
};

const userPersistConfig = {
  key: 'user',
  storage: AsyncStorage,
  whitelist: ['profile', 'preferences', 'addresses'],
};

// Combine all reducers
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  app: appReducer,
  user: persistReducer(userPersistConfig, userReducer),
  tickets: ticketReducer,
  vehicles: vehicleReducer,
  payments: paymentReducer,
  notifications: notificationReducer,
  disputes: disputeReducer,
  subscriptions: subscriptionReducer,
  dashboard: dashboardReducer,
  consent: consentReducer,
  infractionTypes: infractionTypeReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['auth.user.createdAt', 'auth.user.updatedAt'],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;