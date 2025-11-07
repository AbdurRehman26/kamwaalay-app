import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, BusinessProfile } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function BusinessProfileScreen() {
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');

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
      email: user.email,
      bio,
      serviceOfferings: [],
      locations: [],
    };

    await completeOnboarding(profileData);
    router.replace('/(tabs)');
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
              value={bio}
              onChangeText={setBio}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, !businessName.trim() && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!businessName.trim()}
        >
          <Text style={styles.buttonText}>Complete Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            if (!businessName.trim()) {
              Alert.alert('Required', 'Business name is required');
              return;
            }
            const profileData: BusinessProfile = {
              businessName,
              ownerName: user?.name || '',
              email: user?.email,
              serviceOfferings: [],
              locations: [],
            };
            completeOnboarding(profileData);
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
    backgroundColor: '#007AFF',
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
    color: '#007AFF',
    fontSize: 16,
  },
});

