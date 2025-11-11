import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function OnboardingStartScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
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

  // Ensure token is saved/available before making API calls
  useEffect(() => {
    const ensureToken = async () => {
      try {
        // Check if token exists in AsyncStorage
        let token = await AsyncStorage.getItem('authToken');
        
        // If no token in separate key, check user object
        if (!token && user) {
          const userToken = (user as any).token;
          if (userToken) {
            // Save token to AsyncStorage for API service to use
            await AsyncStorage.setItem('authToken', userToken);
          }
        }
      } catch (error) {
        // Error ensuring token availability
      }
    };

    if (user) {
      ensureToken();
    }
  }, [user]);

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
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Let's get started
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Tell us a bit about yourself
          </ThemedText>
        </View>

        <View style={styles.form} nativeID="onboarding-form" data-form="onboarding">
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              {user?.userType === 'business' ? 'Business Owner Name' : 'Full Name'} *
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder={user?.userType === 'business' ? 'Enter owner name' : 'Enter your name'}
              placeholderTextColor="#999"
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

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email (Optional)</ThemedText>
            <TextInput
              style={[styles.input, email && styles.inputDisabled]}
              placeholder="Enter your email"
              placeholderTextColor="#999"
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
        </View>

        {/* Error Message Display */}
        {errorMessage && (
          <View style={styles.errorContainer}>
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
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
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
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#D0D0D0',
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

