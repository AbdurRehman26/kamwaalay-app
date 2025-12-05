import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SplashScreen as CustomSplashScreen } from '@/components/splash-screen';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Suppress browser extension errors (web only)
if (typeof window !== 'undefined' && typeof window.onerror !== 'undefined') {
  const originalError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
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
    window.onunhandledrejection = function (event) {
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
    window.addEventListener('error', function (event: ErrorEvent) {
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
        // Allow navigation to specific onboarding screens (helper-profile, business-profile)
        // Don't redirect if user is already on these screens
        if (currentPath === 'onboarding/helper-profile' || currentPath === 'onboarding/business-profile') {
          // User is on the stepper onboarding screen - allow them to stay
          return;
        }

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
      <Stack.Screen name="profile/[type]/[id]" options={{ headerShown: false, title: 'View Profile' }} />
      <Stack.Screen name="service/[id]" options={{ headerShown: false, title: 'Service Details' }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="settings/change-password" options={{ headerShown: false }} />
      <Stack.Screen name="help" options={{ headerShown: false }} />
      <Stack.Screen name="terms" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
      <Stack.Screen name="about" options={{ headerShown: false }} />
      <Stack.Screen name="requests/create" options={{ headerShown: false }} />
      <Stack.Screen name="requests/[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="business/dashboard"
        options={{
          headerShown: true,
          title: 'Business Dashboard',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="workers/index"
        options={{
          headerShown: true,
          title: 'All Workers',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="workers/add"
        options={{
          headerShown: true,
          title: 'Add New Worker',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{
          headerShown: true,
          title: 'Chat',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    // Hide native splash screen as soon as custom splash is mounted
    // This ensures smooth transition from native to custom splash
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors if splash screen is already hidden
      });
    }, 100); // Small delay to ensure custom splash is rendered

    return () => clearTimeout(timer);
  }, []);

  // Force light mode - always use DefaultTheme
  return (
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <AuthProvider>
          <AppProvider>
            {showCustomSplash && (
              <CustomSplashScreen
                onFinish={() => {
                  setShowCustomSplash(false);
                }}
              />
            )}
            {!showCustomSplash && (
              <>
                <RootLayoutNav />
                <StatusBar style="dark" />
              </>
            )}
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
