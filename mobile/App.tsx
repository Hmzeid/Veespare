import React, { useCallback, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

// Initialise i18n (side-effect: sets RTL)
import '@/i18n';

import AppNavigator from '@/navigation/AppNavigator';
import { useAuthStore } from '@/store/authStore';

// Keep the splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const restoreToken = useAuthStore((s) => s.restoreToken);
  const [appReady, setAppReady] = useState(false);

  const [fontsLoaded] = useFonts({
    'Cairo-Light': require('./assets/fonts/Cairo-Light.ttf'),
    'Cairo-Regular': require('./assets/fonts/Cairo-Regular.ttf'),
    'Cairo-Medium': require('./assets/fonts/Cairo-Medium.ttf'),
    'Cairo-SemiBold': require('./assets/fonts/Cairo-SemiBold.ttf'),
    'Cairo-Bold': require('./assets/fonts/Cairo-Bold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      await restoreToken();
      setAppReady(true);
    }
    prepare();
  }, [restoreToken]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && appReady) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appReady]);

  if (!fontsLoaded || !appReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer onReady={onLayoutRootView}>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
