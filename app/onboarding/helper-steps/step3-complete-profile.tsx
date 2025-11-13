import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

interface CompleteProfileData {
  experience: string;
  bio: string;
}

interface Step3CompleteProfileProps {
  data: CompleteProfileData;
  onChange: (data: CompleteProfileData) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function Step3CompleteProfile({
  data,
  onChange,
  onBack,
  onSubmit,
}: Step3CompleteProfileProps) {
  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Your Profile
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Optional: Add more details about yourself
          </ThemedText>
        </View>

        <View style={styles.form}>
          {/* Years of Experience */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Years of Experience</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g., 5"
              placeholderTextColor="#999"
              value={data.experience}
              onChangeText={(value) => onChange({ ...data, experience: value })}
              keyboardType="numeric"
            />
          </View>

          {/* Bio */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Bio</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              value={data.bio}
              onChangeText={(value) => onChange({ ...data, bio: value })}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 8,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});


