import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../wrappers/ThemeProvider';

interface ThemedSafeAreaProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  className?: string;
}

export const ThemedSafeArea = ({ 
  children, 
  edges = ['top', 'bottom'], 
  className = '' 
}: ThemedSafeAreaProps) => {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={{
        flex: 1,
        backgroundColor: theme === 'dark' ? '#0B0D10' : '#FFFFFF',
        // set the font color
        
      }}
      className={className}
    >
      {children}
    </SafeAreaView>
  );
};

export default ThemedSafeArea;