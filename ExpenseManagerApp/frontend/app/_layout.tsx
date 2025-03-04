import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NetworkProvider } from '../contexts/NetworkContext';
import { SyncProvider } from '../contexts/SyncContext';
import { SyncStatus } from '../components/SyncStatus';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <SyncProvider>
          <Stack>
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)"
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </SyncProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}

// Prevent the root layout from being unmounted
export const unstable_settings = {
  initialRouteName: '(tabs)',
};
