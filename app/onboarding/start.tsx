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
import { useAuth } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function OnboardingStartScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    if (user?.userType === 'helper') {
      await updateUser({ name });
      router.push('/onboarding/helper-profile');
    } else if (user?.userType === 'business') {
      await updateUser({ name });
      router.push('/onboarding/business-profile');
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
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
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

        <TouchableOpacity
          style={[styles.button, !name.trim() && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!name.trim()}
        >
          <Text style={styles.buttonText}>Continue</Text>
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
});

