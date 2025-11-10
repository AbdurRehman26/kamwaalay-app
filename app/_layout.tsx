import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';

// Suppress browser extension errors (web only)
if (typeof window !== 'undefined' && typeof window.onerror !== 'undefined') {
  const originalError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    // Suppress errors from browser extension content scripts
    if (
      typeof message === 'string' &&
      (message.includes('content_script.js') ||
       message.includes('Cannot read properties of undefined') ||
       message.includes("reading 'control'") ||
       message.includes('ControlLooksLikePasswordCredentialField') ||
       message.includes('ControlClaimsToBeUsernameViaAutocompleteAttribute') ||
       message.includes('ControlLooksLikeOneTimeCodeField') ||
       message.includes('ControlUniqueID') ||
       message.includes('ControlIsLabeledUsernameField') ||
       source?.includes('content_script.js'))
    ) {
      return true; // Suppress the error
    }
    // Call original error handler if it exists
    if (originalError) {
      return originalError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };

  // Also handle unhandled promise rejections (web only)
  if (typeof window.onunhandledrejection !== 'undefined') {
    const originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = function(event) {
      if (
        event.reason &&
        typeof event.reason === 'object' &&
        event.reason.message &&
        (event.reason.message.includes('content_script.js') ||
         event.reason.message.includes('Cannot read properties of undefined') ||
         event.reason.message.includes("reading 'control'") ||
         event.reason.message.includes('ControlLooksLikePasswordCredentialField') ||
         event.reason.message.includes('ControlClaimsToBeUsernameViaAutocompleteAttribute') ||
         event.reason.message.includes('ControlLooksLikeOneTimeCodeField') ||
         event.reason.message.includes('ControlUniqueID') ||
         event.reason.message.includes('ControlIsLabeledUsernameField'))
      ) {
        event.preventDefault(); // Suppress the error
        return;
      }
      // Call original handler if it exists
      if (originalUnhandledRejection) {
        return originalUnhandledRejection.call(this, event);
      }
    };
  }

  // Add global error event listener for more comprehensive error catching
  // Only add event listener if window.addEventListener exists (web only)
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('error', function(event: ErrorEvent) {
      if (
        event.message &&
        (event.message.includes('content_script.js') ||
         event.message.includes('Cannot read properties of undefined') ||
         event.message.includes("reading 'control'") ||
         event.message.includes('ControlLooksLikePasswordCredentialField') ||
         event.message.includes('ControlClaimsToBeUsernameViaAutocompleteAttribute') ||
         event.message.includes('ControlLooksLikeOneTimeCodeField') ||
         event.message.includes('ControlUniqueID') ||
         event.message.includes('ControlIsLabeledUsernameField') ||
         event.filename?.includes('content_script.js'))
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }, true); // Use capture phase to catch errors early
  }
}

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Ensure router is available
    if (!router) {
      return;
    }

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'onboarding';
    const currentPath = segments.join('/');

    // If no user, always redirect to login (never to onboarding)
    if (!user) {
      // Only navigate if we're not already on the login screen or signup screen
      if (currentPath !== 'auth/phone-login' && currentPath !== 'auth/signup') {
        try {
          router.replace('/auth/phone-login');
        } catch (error) {
          // Navigation error
        }
      }
    }
    // If user exists but is not verified, redirect to OTP verify screen
    // But ONLY if we're not on login/signup screens (allow users to login fresh)
    else if (user && user.isVerified === false) {
      // Don't redirect if user is on login or signup screens - let them login fresh
      if (currentPath === 'auth/phone-login' || currentPath === 'auth/signup') {
        // User is on login/signup screen - don't redirect, let them login
        return;
      }
      // Only navigate if we're not already on the OTP verify screen
      if (currentPath !== 'auth/otp-verify') {
        try {
          router.replace('/auth/otp-verify');
        } catch (error) {
          // Navigation error
        }
      }
    }
    // If user exists and is verified, and is in auth group, redirect to appropriate screen
    else if (user && user.isVerified !== false && inAuthGroup) {
      try {
        if (user.onboardingStatus === 'completed') {
          router.replace('/(tabs)');
        } else if (user.onboardingStatus === 'in_progress') {
          router.replace('/onboarding/start');
        } else if (user.userType) {
          router.replace('/onboarding/start');
        } else {
          router.replace('/auth/user-type');
        }
      } catch (error) {
        // Navigation error
      }
    }
    // If user exists and is verified but not in auth group, and is in tabs, that's fine
    // But if user is not verified and somehow got to tabs, redirect to OTP verify
    else if (user && user.isVerified === false && !inAuthGroup) {
      try {
        router.replace('/auth/otp-verify');
      } catch (error) {
        // Navigation error
      }
    }
  }, [user, isLoading, segments, router]);

  return (
    <Stack>
      <Stack.Screen name="auth/phone-login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
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
            <Stack.Screen name="requests/[id]" options={{ headerShown: false }} />
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
