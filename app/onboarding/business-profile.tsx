import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BusinessProfile, useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function BusinessProfileScreen() {
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');

  const handleContinue = async () => {
    if (!businessName.trim()) {
      Alert.alert('Required', 'Please enter your business name');
      return;
    }

    if (!user?.name) {
      Alert.alert('Error', 'Owner name is required');
      return;
    }

    const profileData: BusinessProfile = {
      businessName,
      ownerName: user.name,
      bio: businessDescription,
      businessAddress,
      serviceOfferings: [],
      locations: [],
    };

    await completeOnboarding(profileData);
    // Navigate to add workers step
    router.push('/onboarding/add-workers');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Business Information
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Tell us about your business
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Business Name *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter your business name"
              placeholderTextColor="#999"
              value={businessName}
              onChangeText={setBusinessName}
              autoComplete="organization"
              textContentType="organizationName"
              autoCorrect={false}
              spellCheck={false}
              importantForAutofill="yes"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Business Address (Optional)</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter your business address"
              placeholderTextColor="#999"
              value={businessAddress}
              onChangeText={setBusinessAddress}
              autoComplete="street-address"
              textContentType="fullStreetAddress"
              autoCorrect={false}
              spellCheck={false}
              importantForAutofill="yes"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Business Description (Optional)</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your business and services"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={businessDescription}
              onChangeText={setBusinessDescription}
              autoComplete="off"
              textContentType="none"
              autoCorrect={false}
              spellCheck={false}
              importantForAutofill="no"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, !businessName.trim() && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!businessName.trim()}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={async () => {
            // Allow skipping without business name
            const profileData: BusinessProfile = {
              businessName: businessName.trim() || 'My Business',
              ownerName: user?.name || '',
              businessAddress,
              bio: businessDescription,
              serviceOfferings: [],
              locations: [],
            };
            await completeOnboarding(profileData);
            router.replace('/(tabs)');
          }}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6366F1',
    fontSize: 16,
  },
});

