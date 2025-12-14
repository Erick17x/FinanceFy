import React, { createContext, useContext, ReactNode } from 'react';
import { MD3LightTheme, adaptNavigationTheme } from 'react-native-paper';
import { DefaultTheme } from '@react-navigation/native';

// Customize light theme
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ea',
    primaryContainer: '#bb86fc',
    secondary: '#03dac6',
    background: '#ffffff',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
  },
};

// Navigation theme
const { LightTheme: NavigationLightTheme } = 
  adaptNavigationTheme({
    reactNavigationLight: DefaultTheme,
  });

interface ThemeContextData {
  paperTheme: typeof lightTheme;
  navigationTheme: typeof NavigationLightTheme;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const paperTheme = lightTheme;
  const navigationTheme = NavigationLightTheme;

  return (
    <ThemeContext.Provider value={{
      paperTheme,
      navigationTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};






