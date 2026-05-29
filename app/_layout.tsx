import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Merriweather_400Regular, Merriweather_700Bold } from '@expo-google-fonts/merriweather';
import { Lora_400Regular, Lora_700Bold } from '@expo-google-fonts/lora';
import { PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { EBGaramond_400Regular, EBGaramond_700Bold } from '@expo-google-fonts/eb-garamond';
import { CrimsonPro_400Regular, CrimsonPro_700Bold } from '@expo-google-fonts/crimson-pro';
import { LibreBaskerville_400Regular, LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import { SourceSerifPro_400Regular, SourceSerifPro_700Bold } from '@expo-google-fonts/source-serif-pro';
import { PTSerif_400Regular, PTSerif_700Bold } from '@expo-google-fonts/pt-serif';
import { CormorantGaramond_400Regular, CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond';
import { RobotoSlab_400Regular, RobotoSlab_700Bold } from '@expo-google-fonts/roboto-slab';
import { OpenSans_400Regular, OpenSans_700Bold } from '@expo-google-fonts/open-sans';
import { ClerkProvider, ClerkLoaded } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { LogBox, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProviderCompat } from '@/components/KeyboardProviderCompat';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ArtistProvider } from '@/context/ArtistContext';
import { AuthorProfileProvider } from '@/context/AuthorProfileContext';
import { BookProvider } from '@/context/BookContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { initializeRevenueCat, SubscriptionProvider } from '@/lib/revenuecat';

LogBox.ignoreLogs([
  "Calling the 'loadAsync' function has failed",
  'fontFamily "',
]);

SplashScreen.preventAutoHideAsync();

initializeRevenueCat();

const queryClient = new QueryClient();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="terms" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Merriweather_400Regular,
    Merriweather_700Bold,
    Lora_400Regular,
    Lora_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    EBGaramond_400Regular,
    EBGaramond_700Bold,
    CrimsonPro_400Regular,
    CrimsonPro_700Bold,
    LibreBaskerville_400Regular,
    LibreBaskerville_700Bold,
    SourceSerifPro_400Regular,
    SourceSerifPro_700Bold,
    PTSerif_400Regular,
    PTSerif_700Bold,
    CormorantGaramond_400Regular,
    CormorantGaramond_700Bold,
    RobotoSlab_400Regular,
    RobotoSlab_700Bold,
    OpenSans_400Regular,
    OpenSans_700Bold,
  });

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setTimedOut(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (Platform.OS !== 'web' && !fontsLoaded && !fontError && !timedOut) return null;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={Platform.OS === 'web' ? undefined : tokenCache}
      proxyUrl={proxyUrl}
    >
      <ClerkLoaded>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProviderCompat>
                <LanguageProvider>
                <ThemeProvider>
                <BookProvider>
                  <ArtistProvider>
                    <AuthorProfileProvider>
                      <SubscriptionProvider>
                        <ErrorBoundary>
                          <RootLayoutNav />
                        </ErrorBoundary>
                      </SubscriptionProvider>
                    </AuthorProfileProvider>
                  </ArtistProvider>
                </BookProvider>
                </ThemeProvider>
                </LanguageProvider>
              </KeyboardProviderCompat>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
