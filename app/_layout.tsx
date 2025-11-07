import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'onboarding';

    if (!user && !inAuthGroup) {
      router.replace('/auth/phone-login');
    } else if (user && inAuthGroup) {
      if (user.onboardingStatus === 'completed') {
        router.replace('/(tabs)');
      } else if (user.onboardingStatus === 'in_progress') {
        router.replace('/onboarding/start');
      } else if (user.userType) {
        router.replace('/onboarding/start');
      } else {
        router.replace('/auth/user-type');
      }
    }
  }, [user, isLoading, segments]);

  return (
    <Stack>
      <Stack.Screen name="auth/phone-login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/otp-verify" options={{ headerShown: false }} />
      <Stack.Screen name="auth/user-type" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/start" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/helper-profile" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/business-profile" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
            <Stack.Screen name="profile/bookings" options={{ headerShown: false }} />
            <Stack.Screen name="profile/service-offerings" options={{ headerShown: false }} />
            <Stack.Screen name="settings/change-password" options={{ headerShown: false }} />
            <Stack.Screen name="help" options={{ headerShown: false }} />
            <Stack.Screen name="terms" options={{ headerShown: false }} />
            <Stack.Screen name="privacy" options={{ headerShown: false }} />
            <Stack.Screen name="about" options={{ headerShown: false }} />
            <Stack.Screen name="requests/create" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  // Force light mode - always use DefaultTheme
  return (
    <ThemeProvider value={DefaultTheme}>
      <AuthProvider>
        <AppProvider>
          <RootLayoutNav />
          <StatusBar style="dark" />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
