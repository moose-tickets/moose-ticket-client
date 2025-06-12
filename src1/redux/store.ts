// src/redux/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

import authReducer from "./authSlice";
import appReducer from "./appSlice";
// If you have other slices, import them here. e.g.:
// import ticketsReducer from "./ticketsSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
     app: appReducer,
    // tickets: ticketsReducer,
    // …other reducers…
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: __DEV__,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for dispatch and selector
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
