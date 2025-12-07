import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function OnboardingStartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Prefill email if it exists in user context
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  // Check token on mount and log out if not found
  useEffect(() => {
    const checkTokenAndLogout = async () => {
      try {
        // Check if token exists in AsyncStorage
        let token = await AsyncStorage.getItem('authToken');

        // If no token in separate key, check user object
        if (!token && user) {
          const userToken = (user as any).token;
          if (userToken) {
            // Save token to AsyncStorage for API service to use
            await AsyncStorage.setItem('authToken', userToken);
            token = userToken;
          }
        }

        // If no token found, log out and redirect to login
        if (!token) {
          await logout();
          router.replace('/auth/phone-login');
        }
      } catch (error) {
        // Error checking token - log out as a safety measure
        await logout();
        router.replace('/auth/phone-login');
      }
    };

    checkTokenAndLogout();
  }, [user, logout, router]);

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    // Clear any previous error
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Ensure token is available before making API call
      let token = await AsyncStorage.getItem('authToken');

      // If no token in AsyncStorage, check user object
      if (!token && user) {
        const userToken = (user as any).token;
        if (userToken) {
          // Save token to AsyncStorage for API service to use
          await AsyncStorage.setItem('authToken', userToken);
          token = userToken;
        }
      }

      // Check if token exists
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Prepare profile update data
      const profileUpdateData: { name: string; email?: string } = {
        name: name.trim(),
      };

      // Include email if provided
      if (email.trim()) {
        profileUpdateData.email = email.trim();
      }

      // Call profile update API (this will use the token from AsyncStorage)
      // Update name and email, but don't mark onboarding as completed yet
      await updateUser({
        ...profileUpdateData,
        // Don't set onboardingStatus to 'completed' here - let the stepper flow handle it
      });

      // Redirect based on user type
      // Helpers and businesses go to their specific onboarding screens
      // Regular users go directly to tabs
      // Get the updated user to ensure we have the latest userType
      const updatedUser = { ...user, ...profileUpdateData };

      setTimeout(() => {
        const userType = updatedUser?.userType || user?.userType;

        console.log('Onboarding navigation - User type:', userType);
        console.log('Onboarding navigation - User object:', updatedUser);

        if (userType === 'helper') {
          console.log('Navigating to helper-profile stepper');
          router.replace('/onboarding/helper-profile');
        } else if (userType === 'business') {
          console.log('Navigating to business-profile');
          router.replace('/onboarding/business-profile');
        } else {
          console.log('Navigating to tabs (regular user)');
          // For regular users, complete onboarding and go to tabs
          updateUser({
            ...profileUpdateData,
            onboardingStatus: 'completed',
          });
          router.replace('/(tabs)');
        }
      }, 100);
    } catch (error: any) {
      // Profile update error

      // Extract error message
      let extractedErrorMessage = 'Failed to update profile. Please try again.';

      if (error instanceof Error) {
        extractedErrorMessage = error.message;
      } else if (typeof error === 'string') {
        extractedErrorMessage = error;
      } else if (error && typeof error === 'object') {
        extractedErrorMessage = error.message || error.error || error.toString();
      }

      setErrorMessage(extractedErrorMessage);
      Alert.alert('Update Failed', extractedErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Decorative Background Elements */}
      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header Section */}
            <View style={[styles.headerSection, { marginTop: insets.top + 20 }]}>
              <Text style={styles.title}>Let's get started</Text>
              <Text style={styles.subtitle}>
                Tell us a bit about yourself to personalize your experience
              </Text>
            </View>

            <View style={styles.form} nativeID="onboarding-form" data-form="onboarding">
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {user?.userType === 'business' ? 'Business Owner Name' : 'Full Name'}
                </Text>
                <View style={styles.inputWrapper}>
                  <IconSymbol name="person.fill" size={20} color="#A0A0A0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={user?.userType === 'business' ? 'Enter owner name' : 'Enter your name'}
                    placeholderTextColor="#A0A0A0"
                    value={name}
                    onChangeText={setName}
                    autoComplete="name"
                    textContentType="name"
                    autoCorrect={false}
                    spellCheck={false}
                    importantForAutofill="yes"
                    nativeID="name-input"
                    accessibilityLabel={user?.userType === 'business' ? 'Business Owner Name' : 'Full Name'}
                    data-autocomplete="name"
                    data-content-type="name"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email (Optional)</Text>
                <View style={[styles.inputWrapper, email && styles.inputWrapperDisabled]}>
                  <IconSymbol name="envelope.fill" size={20} color={email ? "#6B7280" : "#A0A0A0"} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, email && styles.inputDisabled]}
                    placeholder="Enter your email"
                    placeholderTextColor="#A0A0A0"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={!email}
                    autoComplete="email"
                    textContentType="emailAddress"
                    autoCorrect={false}
                    spellCheck={false}
                    importantForAutofill="yes"
                    nativeID="email-input"
                    accessibilityLabel="Email Address"
                    data-autocomplete="email"
                    data-content-type="emailAddress"
                  />
                </View>
                {email ? (
                  <Text style={styles.helperText}>Email is pre-filled from your account</Text>
                ) : null}
              </View>
            </View>

            {/* Error Message Display */}
            {errorMessage && (
              <View style={styles.errorCard}>
                <IconSymbol name="exclamationmark.circle.fill" size={16} color="#D32F2F" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, (!name.trim() || isLoading) && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Continue</Text>
                  <IconSymbol name="arrow.right" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topCircle: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#EEF2FF',
    opacity: 0.7,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#F5F3FF',
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: 24,
  },
  headerSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 56,
    overflow: 'hidden',
  },
  inputWrapperDisabled: {
    backgroundColor: '#F3F4F6',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  inputDisabled: {
    color: '#6B7280',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
