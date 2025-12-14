import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'react-native';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Context
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useAppTheme } from './src/contexts/ThemeContext';

const AppContent = () => {
  const { paperTheme, navigationTheme } = useAppTheme();
  
  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={navigationTheme as any}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#f5f5f5" 
        />
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;