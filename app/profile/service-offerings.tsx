import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, ServiceOffering } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

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

interface ServiceListing {
  id: string | number;
  service_type?: string;
  monthly_rate?: number;
  description?: string;
  location?: {
    id?: number;
    name?: string;
  };
  location_id?: number;
  area?: string;
  work_type?: string;
}

export default function ServiceOfferingsScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState<'hour' | 'day' | 'month'>('month');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [serviceListings, setServiceListings] = useState<ServiceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch service listings from API
  useEffect(() => {
    loadServiceListings();
  }, []);

  const loadServiceListings = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get(
        API_ENDPOINTS.SERVICE_LISTINGS.MY_LISTINGS,
        undefined,
        undefined,
        true // Requires authentication
      );

      if (response.success && response.data) {
        let listings: ServiceListing[] = [];
        
        // Handle different response formats
        if (response.data.service_listings) {
          listings = Array.isArray(response.data.service_listings.data)
            ? response.data.service_listings.data
            : (Array.isArray(response.data.service_listings) ? response.data.service_listings : []);
        } else if (Array.isArray(response.data)) {
          listings = response.data;
        } else if (response.data.data) {
          listings = Array.isArray(response.data.data) ? response.data.data : [];
        }
        
        setServiceListings(listings);
      } else {
        setServiceListings([]);
      }
    } catch (error) {
      // Error loading service listings
      setServiceListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback to local profile data if API fails
  const profileData = user?.profileData as any;
  const localServiceOfferings = profileData?.serviceOfferings || [];
  
  // Use API listings if available, otherwise fall back to local
  const hasApiListings = serviceListings.length > 0;
  const serviceOfferings = hasApiListings ? [] : localServiceOfferings;

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
            <IconSymbol name="chevron.left" size={24} color="#6366F1" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Service Offerings
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Existing Services */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <ThemedText style={styles.loadingText}>Loading service listings...</ThemedText>
          </View>
        ) : hasApiListings ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Your Service Listings ({serviceListings.length})
            </ThemedText>
            {serviceListings.map((listing: ServiceListing) => {
              const serviceType = listing.service_type || 'Service';
              const displayName = serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('_', ' ');
              const location = listing.location?.name || listing.area || 'Location not specified';
              
              return (
                <View key={listing.id} style={styles.serviceCard}>
                  <View style={styles.serviceHeader}>
                    <View style={styles.serviceInfo}>
                      <ThemedText type="subtitle" style={styles.serviceName}>
                        {displayName}
                      </ThemedText>
                      {listing.work_type && (
                        <ThemedText style={styles.serviceCategory}>
                          {listing.work_type.replace('_', ' ')}
                        </ThemedText>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteService(listing.id.toString())}>
                      <IconSymbol name="trash.fill" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                  {listing.description && (
                    <ThemedText style={styles.serviceDescription}>{listing.description}</ThemedText>
                  )}
                  {listing.monthly_rate && (
                    <ThemedText style={styles.servicePrice}>
                      ₨{listing.monthly_rate.toLocaleString()}/month
                    </ThemedText>
                  )}
                  <View style={styles.serviceLocations}>
                    <View style={styles.locationTag}>
                      <Text style={styles.locationTagText}>{location}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : serviceOfferings.length > 0 ? (
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
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="list.bullet" size={48} color="#CCCCCC" />
            <ThemedText style={styles.emptyText}>No service listings yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>Add your first service below</ThemedText>
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
    color: '#6366F1',
    marginBottom: 8,
  },
  serviceLocations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  locationTagText: {
    fontSize: 12,
    color: '#6366F1',
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
    backgroundColor: '#6366F1',
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
    backgroundColor: '#6366F1',
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
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
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
    backgroundColor: '#6366F1',
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    opacity: 0.7,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.5,
  },
});

