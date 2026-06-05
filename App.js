import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { PendingItemsProvider } from './src/contexts/PendingItemsContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PendingItemsProvider>
          <RootNavigator />
          <StatusBar style="light" />
        </PendingItemsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
