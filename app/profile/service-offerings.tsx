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
import { useAuth, ServiceOffering } from '@/contexts/AuthContext';
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

export default function ServiceOfferingsScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState<'hour' | 'day' | 'month'>('month');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const profileData = user?.profileData as any;
  const serviceOfferings = profileData?.serviceOfferings || [];

  const toggleLocation = (location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  };

  const handleAddService = async () => {
    if (!serviceName.trim()) {
      Alert.alert('Required', 'Please enter service name');
      return;
    }
    if (!category) {
      Alert.alert('Required', 'Please select a category');
      return;
    }
    if (selectedLocations.length === 0) {
      Alert.alert('Required', 'Please select at least one location');
      return;
    }

    const newService: ServiceOffering = {
      id: Date.now().toString(),
      serviceName,
      description: description.trim() || undefined,
      price: price ? parseFloat(price) : undefined,
      priceUnit,
      locations: selectedLocations,
      category,
    };

    const updatedOfferings = [...serviceOfferings, newService];
    const updatedProfile = {
      ...profileData,
      serviceOfferings: updatedOfferings,
    };

    await updateUser({ profileData: updatedProfile });

    // Reset form
    setServiceName('');
    setDescription('');
    setCategory('');
    setPrice('');
    setSelectedLocations([]);

    Alert.alert('Success', 'Service offering added successfully');
  };

  const handleDeleteService = async (serviceId: string) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service offering?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedOfferings = serviceOfferings.filter(
              (s: ServiceOffering) => s.id !== serviceId
            );
            const updatedProfile = {
              ...profileData,
              serviceOfferings: updatedOfferings,
            };
            await updateUser({ profileData: updatedProfile });
          },
        },
      ]
    );
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
            Service Offerings
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Existing Services */}
        {serviceOfferings.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Your Services ({serviceOfferings.length})
            </ThemedText>
            {serviceOfferings.map((service: ServiceOffering) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceInfo}>
                    <ThemedText type="subtitle" style={styles.serviceName}>
                      {service.serviceName}
                    </ThemedText>
                    <ThemedText style={styles.serviceCategory}>{service.category}</ThemedText>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteService(service.id)}>
                    <IconSymbol name="trash.fill" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
                {service.description && (
                  <ThemedText style={styles.serviceDescription}>{service.description}</ThemedText>
                )}
                {service.price && (
                  <ThemedText style={styles.servicePrice}>
                    ₨{service.price}/{service.priceUnit}
                  </ThemedText>
                )}
                <View style={styles.serviceLocations}>
                  {service.locations.map((loc) => (
                    <View key={loc} style={styles.locationTag}>
                      <Text style={styles.locationTagText}>{loc}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add New Service Form */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Add New Service
          </ThemedText>

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
              <ThemedText style={styles.label}>Description (Optional)</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your service..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Price (Optional)</ThemedText>
              <View style={styles.priceContainer}>
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  placeholder="0"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
                <View style={styles.priceUnitContainer}>
                  {(['hour', 'day', 'month'] as const).map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.priceUnitButton,
                        priceUnit === unit && styles.priceUnitButtonActive,
                      ]}
                      onPress={() => setPriceUnit(unit)}
                    >
                      <Text
                        style={[
                          styles.priceUnitText,
                          priceUnit === unit && styles.priceUnitTextActive,
                        ]}
                      >
                        /{unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Locations *</ThemedText>
              <View style={styles.locationsContainer}>
                {LOCATIONS.map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[
                      styles.locationButton,
                      selectedLocations.includes(loc) && styles.locationButtonActive,
                    ]}
                    onPress={() => toggleLocation(loc)}
                  >
                    <Text
                      style={[
                        styles.locationText,
                        selectedLocations.includes(loc) && styles.locationTextActive,
                      ]}
                    >
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAddService}>
              <Text style={styles.addButtonText}>Add Service</Text>
            </TouchableOpacity>
          </View>
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 14,
    opacity: 0.6,
  },
  serviceDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  serviceLocations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  locationTagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  form: {
    marginTop: 8,
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
  priceContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priceInput: {
    flex: 1,
  },
  priceUnitContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  priceUnitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  priceUnitButtonActive: {
    backgroundColor: '#007AFF',
  },
  priceUnitText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  priceUnitTextActive: {
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
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

