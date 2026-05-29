import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return (
    <View style={{ flex: 1, backgroundColor: '#0A0806', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#FFD600" />
    </View>
  );

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F8F4EE' },
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
