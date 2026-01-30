import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Toast } from '@/components/Toast';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/contexts/ThemeContext';

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
        return originalUnhandledRejection.call(this as any, event);
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
    const isAtRoot = (segments as any).length === 0 || (segments.length === 1 && (segments as any)[0] === 'index');

    // Define public routes that don't require authentication
    const PUBLIC_ROUTES = ['about', 'help', 'privacy', 'terms'];
    const isPublicRoute = PUBLIC_ROUTES.includes(currentPath);
    const isOnAuthScreen = currentPath === 'auth/phone-login' || currentPath === 'auth/signup' || currentPath === 'auth/user-type';

    // If no user, redirect to login from protected routes
    if (!user) {
      // Allow access to public routes, auth screens, and the root (which will redirect to login)
      if (!isPublicRoute && !isOnAuthScreen && !isAtRoot) {
        try {
          router.replace('/auth/phone-login');
        } catch (error) { }
      }
    }
    // If user exists but is not verified, redirect to OTP verify screen
    else if (user && user.isVerified === false) {
      if (currentPath !== 'auth/otp-verify') {
        try {
          router.replace('/auth/otp-verify');
        } catch (error) { }
      }
    }
    // If user exists and is verified
    else if (user) {
      // Verified users on auth screens or root should be redirected to their proper place
      if (isOnAuthScreen || isAtRoot) {
        try {
          if (!user.userType) {
            router.replace('/auth/user-type');
          } else if (user.onboardingStatus !== 'completed') {
            router.replace('/onboarding/start');
          } else {
            router.replace('/(tabs)');
          }
        } catch (error) { }
        return;
      }

      // 1. Check if user type is selected
      if (!user.userType) {
        if (currentPath !== 'auth/user-type') {
          try {
            router.replace('/auth/user-type');
          } catch (error) { }
        }
        return;
      }

      // 2. Check onboarding status
      if (user.onboardingStatus !== 'completed') {
        const isAllowedPath = segments[0] === 'onboarding' || currentPath === 'auth/user-type' || isPublicRoute;

        if (!isAllowedPath) {
          // Intelligent redirection based on missing basic data (consolidated into start step)
          if (!user.name || !user.city_id || !user.pin_address) {
            router.replace('/onboarding/start');
          } else if (user.userType === 'helper') {
            router.replace('/onboarding/helper-profile');
          } else if (user.userType === 'business') {
            router.replace('/onboarding/business-profile');
          } else {
            router.replace('/onboarding/location');
          }
          return;
        }
        return;
      }

      // 3. Onboarding is completed - redirect away from auth/onboarding pages (except public ones)
      if (inAuthGroup && !isPublicRoute) {
        try {
          router.replace('/(tabs)');
        } catch (error) { }
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
      <Stack.Screen name="onboarding/business" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
      <Stack.Screen name="profile/bookings" options={{ headerShown: false }} />
      <Stack.Screen name="profile/service-offerings" options={{ headerShown: false }} />
      <Stack.Screen name="profile/add-service-offering" options={{ headerShown: false }} />
      <Stack.Screen name="profile/[type]/[id]" options={{ headerShown: false, title: 'View Profile' }} />
      <Stack.Screen name="service/[id]" options={{ headerShown: false, title: 'Service Details' }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="settings/change-password" options={{ headerShown: false }} />
      <Stack.Screen name="help" options={{ headerShown: false }} />
      <Stack.Screen name="terms" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
      <Stack.Screen name="about" options={{ headerShown: false }} />
      <Stack.Screen name="job/create" options={{ headerShown: false }} />
      <Stack.Screen name="job/edit/[id]" options={{ headerShown: false, title: 'Edit Job' }} />
      <Stack.Screen name="job-view/[id]/index" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen
        name="business/dashboard"
        options={{
          headerShown: false,
          title: 'Business Dashboard',
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="workers/index"
        options={{
          headerShown: false,
          title: 'All Workers',
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="workers/add"
        options={{
          headerShown: false,
          title: 'Add New Worker',
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{
          headerShown: true,
          title: 'Chat',
          headerBackTitle: "",
        }}
      />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

function ThemedApp({ children }: { children: React.ReactNode }) {
  const { colorScheme } = useTheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {children}
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CustomThemeProvider>
        <AuthProvider>
          <AppProvider>
            <SplashHider />
            <ThemedApp>
              <RootLayoutNav />
            </ThemedApp>
            <Toast />
          </AppProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </SafeAreaProvider>
  );
}

// Component to hide splash screen when auth is ready
function SplashHider() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Hide splash screen once auth loading is complete
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors if splash screen is already hidden
      });
    }
  }, [isLoading]);

  return null;
}

