import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const SERVICE_TYPES = [
  { id: 'maid', name: 'Maid', emoji: '🧹' },
  { id: 'cook', name: 'Cook', emoji: '👨‍🍳' },
  { id: 'babysitter', name: 'Babysitter', emoji: '👶' },
  { id: 'caregiver', name: 'Caregiver', emoji: '👩' },
  { id: 'cleaner', name: 'Cleaner', emoji: '✨' },
  { id: 'all_rounder', name: 'All Rounder', emoji: '⭐' },
];

const WORK_TYPES = [
  { id: 'full_time', name: 'Full Time' },
  { id: 'part_time', name: 'Part Time' },
];

interface Location {
  id: number | string;
  name: string;
  area?: string;
}

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

  // Form state
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
  const [workType, setWorkType] = useState('full_time');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [description, setDescription] = useState('');

  // Location search state
  const [locationSearch, setLocationSearch] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Service listings state
  const [serviceListings, setServiceListings] = useState<ServiceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch service listings from API
  useEffect(() => {
    loadServiceListings();
  }, []);

  // Location search effect
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (locationSearch.trim().length >= 2) {
        searchLocations(locationSearch.trim());
      } else if (locationSearch.trim().length === 0) {
        setFilteredLocations([]);
        setShowLocationDropdown(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [locationSearch]);

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
      setServiceListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchLocations = async (query: string) => {
    try {
      setIsLoadingLocations(true);
      setShowLocationDropdown(true);

      const response = await apiService.get(
        API_ENDPOINTS.LOCATIONS.SEARCH,
        undefined,
        { q: query },
        false
      );

      if (response.success && response.data) {
        let locationsData: Location[] = [];

        if (response.data.locations) {
          locationsData = Array.isArray(response.data.locations.data)
            ? response.data.locations.data
            : Array.isArray(response.data.locations)
              ? response.data.locations
              : [];
        } else if (Array.isArray(response.data)) {
          locationsData = response.data;
        } else if (response.data.data) {
          locationsData = Array.isArray(response.data.data) ? response.data.data : [];
        }

        const mappedLocations: Location[] = locationsData.map((loc: any) => ({
          id: loc.id || loc.location_id || loc.name,
          name: loc.name || loc.location_name || '',
          area: loc.area || loc.area_name,
        }));

        setFilteredLocations(mappedLocations);
        setShowLocationDropdown(mappedLocations.length > 0);
      } else {
        setFilteredLocations([]);
        setShowLocationDropdown(false);
      }
    } catch (error) {
      setFilteredLocations([]);
      setShowLocationDropdown(false);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleLocationSelect = (location: Location) => {
    if (!selectedLocations.find((loc) => loc.id === location.id)) {
      setSelectedLocations([...selectedLocations, location]);
    }
    setLocationSearch('');
    setShowLocationDropdown(false);
  };

  const handleLocationRemove = (locationId: number | string) => {
    setSelectedLocations(selectedLocations.filter((loc) => loc.id !== locationId));
  };

  const toggleServiceType = (serviceId: string) => {
    const isSelected = selectedServiceTypes.includes(serviceId);
    setSelectedServiceTypes(
      isSelected
        ? selectedServiceTypes.filter((id) => id !== serviceId)
        : [...selectedServiceTypes, serviceId]
    );
  };

  const handleAddService = async () => {
    if (selectedServiceTypes.length === 0) {
      Alert.alert('Required', 'Please select at least one service type');
      return;
    }
    if (selectedLocations.length === 0) {
      Alert.alert('Required', 'Please select at least one location');
      return;
    }

    // Reset form
    setSelectedServiceTypes([]);
    setSelectedLocations([]);
    setWorkType('full_time');
    setMonthlyRate('');
    setDescription('');

    Alert.alert('Success', 'Service offering added successfully');

    // Reload listings
    loadServiceListings();
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
            // TODO: Call API to delete service
            loadServiceListings();
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
        ) : serviceListings.length > 0 ? (
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
            {/* Service Types */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>
                Select Service Types <Text style={styles.required}>*</Text>
              </ThemedText>
              <ThemedText style={styles.instruction}>
                Choose the services for this offer. You can select multiple.
              </ThemedText>
              <View style={styles.serviceTypesContainer}>
                {SERVICE_TYPES.map((service) => {
                  const isSelected = selectedServiceTypes.includes(service.id);
                  return (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.serviceTypeCard,
                        isSelected && styles.serviceTypeCardSelected,
                      ]}
                      onPress={() => toggleServiceType(service.id)}
                    >
                      <Text style={styles.serviceEmoji}>{service.emoji}</Text>
                      <Text
                        style={[
                          styles.serviceTypeName,
                          isSelected && styles.serviceTypeNameSelected,
                        ]}
                      >
                        {service.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Locations */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>
                Select Locations <Text style={styles.required}>*</Text>
              </ThemedText>
              <ThemedText style={styles.instruction}>
                Add locations for this offer. You can add multiple locations.
              </ThemedText>

              {/* Selected Locations */}
              {selectedLocations.length > 0 && (
                <View style={styles.selectedLocationsContainer}>
                  {selectedLocations.map((loc, index) => (
                    <View key={loc.id || `location-${index}`} style={styles.locationTag}>
                      <Text style={styles.locationTagText}>
                        {loc.area || loc.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleLocationRemove(loc.id)}
                        style={styles.removeTagButton}
                      >
                        <IconSymbol name="xmark.circle.fill" size={16} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Location Search */}
              <View style={styles.locationSearchContainer}>
                <TextInput
                  style={styles.locationInput}
                  placeholder="Search location (e.g., Karachi, Clifton or type area name)..."
                  placeholderTextColor="#999"
                  value={locationSearch}
                  onChangeText={setLocationSearch}
                />
                {isLoadingLocations && (
                  <ActivityIndicator size="small" color="#6366F1" style={styles.loader} />
                )}
              </View>

              {/* Location Dropdown */}
              {showLocationDropdown && filteredLocations.length > 0 && (
                <View style={styles.locationDropdown}>
                  <ScrollView style={styles.locationDropdownScroll} nestedScrollEnabled>
                    {filteredLocations.map((loc, index) => (
                      <TouchableOpacity
                        key={loc.id || `filtered-location-${index}`}
                        style={styles.locationDropdownItem}
                        onPress={() => handleLocationSelect(loc)}
                      >
                        <Text style={styles.locationDropdownText}>
                          {loc.area || loc.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Work Type */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>
                Work Type <Text style={styles.required}>*</Text>
              </ThemedText>
              <View style={styles.workTypeContainer}>
                {WORK_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.workTypeButton,
                      workType === type.id && styles.workTypeButtonActive,
                    ]}
                    onPress={() => setWorkType(type.id)}
                  >
                    <Text
                      style={[
                        styles.workTypeText,
                        workType === type.id && styles.workTypeTextActive,
                      ]}
                    >
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Monthly Rate */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Monthly Rate (PKR)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g., 15000"
                placeholderTextColor="#999"
                value={monthlyRate}
                onChangeText={setMonthlyRate}
                keyboardType="numeric"
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Description</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe this service offer..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.addButton,
                (selectedServiceTypes.length === 0 || selectedLocations.length === 0) &&
                styles.addButtonDisabled,
              ]}
              onPress={handleAddService}
              disabled={selectedServiceTypes.length === 0 || selectedLocations.length === 0}
            >
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  locationTagText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  removeTagButton: {
    padding: 2,
  },
  form: {
    marginTop: 8,
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
  required: {
    color: '#FF3B30',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  serviceTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceTypeCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  serviceTypeCardSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  serviceEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  serviceTypeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  serviceTypeNameSelected: {
    color: '#6366F1',
  },
  selectedLocationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  locationSearchContainer: {
    position: 'relative',
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  loader: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  locationDropdown: {
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationDropdownScroll: {
    maxHeight: 200,
  },
  locationDropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationDropdownText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  workTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  workTypeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  workTypeButtonActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  workTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  workTypeTextActive: {
    color: '#6366F1',
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
    height: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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

