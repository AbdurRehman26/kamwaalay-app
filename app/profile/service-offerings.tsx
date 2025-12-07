import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

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
    <View style={styles.container}>
      {/* Decorative Background Elements */}
      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Offerings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Existing Services */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>Loading service listings...</Text>
            </View>
          ) : serviceListings.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Your Service Listings ({serviceListings.length})
              </Text>
              {serviceListings.map((listing: ServiceListing) => {
                const serviceType = listing.service_type || 'Service';
                const displayName = serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('_', ' ');
                const location = listing.location?.name || listing.area || 'Location not specified';

                return (
                  <View key={listing.id} style={styles.serviceCard}>
                    <View style={styles.serviceHeader}>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>
                          {displayName}
                        </Text>
                        {listing.work_type && (
                          <Text style={styles.serviceCategory}>
                            {listing.work_type.replace('_', ' ')}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteService(listing.id.toString())}
                      >
                        <IconSymbol name="trash.fill" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    {listing.description && (
                      <Text style={styles.serviceDescription}>{listing.description}</Text>
                    )}
                    {listing.monthly_rate && (
                      <View style={styles.priceContainer}>
                        <IconSymbol name="dollarsign.circle.fill" size={16} color="#6366F1" />
                        <Text style={styles.servicePrice}>
                          ₨{listing.monthly_rate.toLocaleString()}/month
                        </Text>
                      </View>
                    )}
                    <View style={styles.serviceLocations}>
                      <View style={styles.locationTag}>
                        <IconSymbol name="location.fill" size={12} color="#6366F1" />
                        <Text style={styles.locationTagText}>{location}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <IconSymbol name="list.bullet" size={48} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyText}>No service listings yet</Text>
              <Text style={styles.emptySubtext}>Add your first service below</Text>
            </View>
          )}

          {/* Add New Service Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Add New Service
            </Text>

            <View style={styles.form}>
              {/* Service Types */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Select Service Types <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.instruction}>
                  Choose the services for this offer. You can select multiple.
                </Text>
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
              <View style={[styles.inputGroup, { zIndex: 10 }]}>
                <Text style={styles.label}>
                  Select Locations <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.instruction}>
                  Add locations for this offer. You can add multiple locations.
                </Text>

                {/* Selected Locations */}
                {selectedLocations.length > 0 && (
                  <View style={styles.selectedLocationsContainer}>
                    {selectedLocations.map((loc, index) => (
                      <View key={loc.id || `location-${index}`} style={styles.selectedLocationTag}>
                        <Text style={styles.selectedLocationTagText}>
                          {loc.area || loc.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleLocationRemove(loc.id)}
                          style={styles.removeTagButton}
                        >
                          <IconSymbol name="xmark.circle.fill" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Location Search */}
                <View style={styles.locationSearchContainer}>
                  <IconSymbol name="magnifyingglass" size={20} color="#9CA3AF" style={styles.searchIcon} />
                  <TextInput
                    style={styles.locationInput}
                    placeholder="Search location..."
                    placeholderTextColor="#9CA3AF"
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
                          <IconSymbol name="mappin.circle.fill" size={20} color="#6366F1" />
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
                <Text style={styles.label}>
                  Work Type <Text style={styles.required}>*</Text>
                </Text>
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
                      {workType === type.id && (
                        <IconSymbol name="checkmark.circle.fill" size={20} color="#6366F1" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Monthly Rate */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Monthly Rate (PKR)</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencyPrefix}>₨</Text>
                  <TextInput
                    style={styles.inputWithPrefix}
                    placeholder="e.g., 15000"
                    placeholderTextColor="#9CA3AF"
                    value={monthlyRate}
                    onChangeText={setMonthlyRate}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe this service offer..."
                  placeholderTextColor="#9CA3AF"
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
                <IconSymbol name="plus" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topCircle: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#EEF2FF',
    opacity: 0.6,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#F5F3FF',
    opacity: 0.6,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
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
    borderRadius: 12,
    gap: 6,
  },
  locationTagText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
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
    color: '#EF4444',
  },
  instruction: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
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
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
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
    color: '#6B7280',
    textAlign: 'center',
  },
  serviceTypeNameSelected: {
    color: '#6366F1',
  },
  selectedLocationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectedLocationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  selectedLocationTagText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  removeTagButton: {
    padding: 2,
  },
  locationSearchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  loader: {
    marginLeft: 12,
  },
  locationDropdown: {
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  locationDropdownScroll: {
    maxHeight: 200,
  },
  locationDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  locationDropdownText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  workTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  workTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  workTypeButtonActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  workTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  workTypeTextActive: {
    color: '#6366F1',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  inputWithPrefix: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
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
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});
