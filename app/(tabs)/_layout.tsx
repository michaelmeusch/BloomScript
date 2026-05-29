import { useAuth } from '@clerk/expo';
import { Redirect, Stack, router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function TabLayout() {
  const colors = useColors();
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { hasSeenOnboarding } = useOnboarding(isSignedIn ? userId : null);

  useEffect(() => {
    if (isLoaded && isSignedIn && hasSeenOnboarding === false) {
      router.replace('/(tabs)/onboarding' as never);
    }
  }, [isLoaded, isSignedIn, hasSeenOnboarding]);

  if (!isLoaded) return (
    <View style={{ flex: 1, backgroundColor: '#F8F4EE', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#2D4A3E" />
    </View>
  );

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitle: ({ children }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={{ width: 26, height: 26, borderRadius: 6 }}
              resizeMode="cover"
            />
            <Text style={{ fontSize: 17, fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>
              {children}
            </Text>
          </View>
        ),
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-book"
        options={{
          presentation: 'modal',
          title: 'New Book',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
        }}
      />
      <Stack.Screen
        name="book/[bookId]"
        options={{ headerBackTitle: 'Library' }}
      />
      <Stack.Screen
        name="chapter/[chapterId]"
        options={{ headerBackTitle: 'Book' }}
      />
      <Stack.Screen
        name="preview/[bookId]"
        options={{ title: 'Preview', headerBackTitle: 'Book' }}
      />
      <Stack.Screen
        name="chapter-ai/[chapterId]"
        options={{ title: 'Write with AI', headerBackTitle: 'Chapter' }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'modal',
          title: 'BloomScript Pro',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="export-book"
        options={{
          presentation: 'modal',
          title: 'Export Book',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="illustrate-book"
        options={{
          presentation: 'modal',
          title: 'AI Illustrations',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="folder/[folderId]"
        options={{ headerBackTitle: 'Library' }}
      />
      <Stack.Screen
        name="artist-space"
        options={{
          headerBackTitle: 'Library',
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={{ width: 26, height: 26, borderRadius: 6 }}
                resizeMode="cover"
              />
              <Text style={{ fontSize: 17, fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>
                Artist Space
              </Text>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="artist/[artistId]"
        options={{ headerBackTitle: 'Artist Space' }}
      />
      <Stack.Screen
        name="my-profile"
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="bloom-manuscript"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="bloom-wizard"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="screenplay-wizard"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="settings"
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="ai-studio"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="comic-panel"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="character-genesis"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="character-genesis-paywall"
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="comic-studio-paywall"
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="comic-art-studio"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="character-consistency"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="story-pages"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="comic-projects"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="panel-director"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="consistency-checker"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="pose-browser"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="action-archetype-director"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="panel-page"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="style-interpreter"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="visual-memory-bank"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ai-director"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="comic-showcase"
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
    </Stack>
  );
}
