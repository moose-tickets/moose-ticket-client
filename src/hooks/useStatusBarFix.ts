// src/hooks/useStatusBarFix.ts
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { useTheme } from '../wrappers/ThemeProvider';

/**
 * Custom hook to fix status bar styling issues during navigation
 * This ensures the status bar content (time, wifi, battery) displays correctly
 * when navigating between screens, especially in dark mode.
 */
export const useStatusBarFix = (delay: number = 100) => {
  const { forceStatusBarUpdate } = useTheme();

  useFocusEffect(
    React.useCallback(() => {
      // Force status bar update when screen comes into focus
      const timeoutId = setTimeout(() => {
        forceStatusBarUpdate();
      }, delay);

      // Cleanup timeout on unfocus
      return () => {
        clearTimeout(timeoutId);
      };
    }, [forceStatusBarUpdate, delay])
  );
};

export default useStatusBarFix;