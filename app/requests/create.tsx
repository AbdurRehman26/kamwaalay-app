import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

const SERVICE_CATEGORIES = [
  'Cleaning',
  'Cooking',
  'Babysitting',
  'Elderly Care',
  'All-Rounder',
  '24/7 Live-in',
  'Other',
];

const LOCATIONS = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad'];

export default function CreateRequestScreen() {
  const router = useRouter();
  const { user, addServiceRequest } = useApp();
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');

  const handleCreate = async () => {
    if (!serviceName.trim()) {
      Alert.alert('Required', 'Please enter service name');
      return;
    }
    if (!category) {
      Alert.alert('Required', 'Please select a category');
      return;
    }
    if (!location) {
      Alert.alert('Required', 'Please select a location');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter description');
      return;
    }

    if (!user?.id || !user?.name) {
      Alert.alert('Error', 'User information not found');
      return;
    }

    await addServiceRequest({
      userId: user.id,
      userName: user.name,
      serviceName,
      description,
      location,
      budget: budget ? parseFloat(budget) : undefined,
    });

    Alert.alert('Success', 'Service request created successfully', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#007AFF" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Create Request
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Service Name *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g., House Cleaning"
              placeholderTextColor="#999"
              value={serviceName}
              onChangeText={setServiceName}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Category *</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
              {SERVICE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Description *</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what you need..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Location *</ThemedText>
            <View style={styles.locationsContainer}>
              {LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[
                    styles.locationButton,
                    location === loc && styles.locationButtonActive,
                  ]}
                  onPress={() => setLocation(loc)}
                >
                  <Text
                    style={[
                      styles.locationText,
                      location === loc && styles.locationTextActive,
                    ]}
                  >
                    {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Budget (Optional)</ThemedText>
            <View style={styles.budgetContainer}>
              <Text style={styles.currency}>₨</Text>
              <TextInput
                style={styles.budgetInput}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={budget}
                onChangeText={setBudget}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.createButton,
              (!serviceName.trim() || !category || !location || !description.trim()) &&
                styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!serviceName.trim() || !category || !location || !description.trim()}
          >
            <Text style={styles.createButtonText}>Create Request</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
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
    height: 120,
    textAlignVertical: 'top',
  },
  categories: {
    marginTop: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  locationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  locationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  locationButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  locationTextActive: {
    color: '#FFFFFF',
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

