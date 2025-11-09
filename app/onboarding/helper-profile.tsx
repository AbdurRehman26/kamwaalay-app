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
import { useAuth, HelperProfile } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function HelperProfileScreen() {
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');

  const handleContinue = async () => {
    if (!user?.name) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    const profileData: HelperProfile = {
      name: user.name,
      email: user.email,
      bio,
      experience,
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
            Complete Your Profile
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Help people know more about you
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Bio (Optional)</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about yourself and your skills"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={bio}
              onChangeText={setBio}
              autoComplete="off"
              textContentType="none"
              autoCorrect={false}
              spellCheck={false}
              importantForAutofill="no"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Experience (Optional)</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g., 5 years of experience"
              placeholderTextColor="#999"
              value={experience}
              onChangeText={setExperience}
              autoComplete="off"
              textContentType="none"
              autoCorrect={false}
              spellCheck={false}
              importantForAutofill="no"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Complete Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            const profileData: HelperProfile = {
              name: user?.name || '',
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

