import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function UserTypeScreen() {
  const router = useRouter();
  const { selectUserType } = useAuth();

  const handleSelectType = async (type: 'user' | 'helper' | 'business') => {
    await selectUserType(type);
    
    if (type === 'user') {
      // Users go directly to the app
      router.replace('/(tabs)');
    } else {
      // Helpers and businesses need onboarding
      router.push('/onboarding/start');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Choose Your Role
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Select how you want to use Kamwaalay
          </ThemedText>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handleSelectType('user')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
              <Text style={styles.icon}>👤</Text>
            </View>
            <ThemedText type="subtitle" style={styles.optionTitle}>
              I need help
            </ThemedText>
            <ThemedText style={styles.optionDescription}>
              Hire helpers or businesses for household services
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handleSelectType('helper')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.icon}>🛠️</Text>
            </View>
            <ThemedText type="subtitle" style={styles.optionTitle}>
              I'm a Helper
            </ThemedText>
            <ThemedText style={styles.optionDescription}>
              Offer your services and find work opportunities
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handleSelectType('business')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.icon}>🏢</Text>
            </View>
            <ThemedText type="subtitle" style={styles.optionTitle}>
              I'm a Business
            </ThemedText>
            <ThemedText style={styles.optionDescription}>
              Register your business and offer services
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    color: '#666',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 20,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  icon: {
    fontSize: 44,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  optionDescription: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.7,
    color: '#666',
    lineHeight: 22,
  },
});

