import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function AddServiceOfferingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const isEditMode = !!id;

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  // Form state
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
  const [workType, setWorkType] = useState('full_time');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [description, setDescription] = useState('');

  // Location search state
  const [locationSearch, setLocationSearch] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load service listing data when editing
  useEffect(() => {
    if (isEditMode && id) {
      loadServiceListing();
    }
  }, [id, isEditMode]);

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

  const loadServiceListing = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get(
        API_ENDPOINTS.SERVICE_LISTINGS.GET,
        { id: id as string },
        undefined,
        true
      );

      if (response.success && response.data) {
        const listing = response.data.listing || response.data.service_listing || response.data;
        
        // Set service types
        if (listing.service_types && Array.isArray(listing.service_types)) {
          setSelectedServiceTypes(listing.service_types);
        } else if (listing.service_type) {
          setSelectedServiceTypes([listing.service_type]);
        }

        // Set work type
        if (listing.work_type) {
          setWorkType(listing.work_type);
        }

        // Set monthly rate
        if (listing.monthly_rate) {
          setMonthlyRate(listing.monthly_rate.toString());
        }

        // Set description
        if (listing.description) {
          setDescription(listing.description);
        }

        // Set locations
        if (listing.location_details && Array.isArray(listing.location_details)) {
          const locations: Location[] = listing.location_details.map((loc: any) => ({
            id: loc.id || loc.location_id || loc.name,
            name: loc.display_text || loc.area || loc.area_name || loc.name || '',
            area: loc.area || loc.area_name || loc.name || '',
          }));
          setSelectedLocations(locations);
        } else if (listing.location) {
          setSelectedLocations([{
            id: listing.location.id || listing.location.name,
            name: listing.location.name || listing.location.area || '',
            area: listing.location.area || listing.location.name || '',
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading service listing:', error);
      Alert.alert('Error', 'Failed to load service listing');
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
            : (Array.isArray(response.data.locations) ? response.data.locations : []);
        } else if (Array.isArray(response.data)) {
          locationsData = response.data;
        } else if (response.data.data) {
          locationsData = Array.isArray(response.data.data) ? response.data.data : [];
        }

        const mappedLocations: Location[] = locationsData.map((loc: any) => ({
          id: loc.id || loc.location_id || loc.name,
          name: loc.name || loc.location_name || '',
          area: loc.area || loc.area_name || loc.name || '',
        }));

        setFilteredLocations(mappedLocations);
      } else {
        setFilteredLocations([]);
      }
    } catch (error) {
      setFilteredLocations([]);
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

    try {
      setIsSubmitting(true);

      // Prepare location IDs
      const locationIds = selectedLocations.map((loc) => loc.id);

      let response;
      if (isEditMode && id) {
        // Update existing service listing
        response = await apiService.put(
          API_ENDPOINTS.SERVICE_LISTINGS.UPDATE,
          {
            service_types: selectedServiceTypes,
            locations: locationIds,
            work_type: workType,
            monthly_rate: monthlyRate ? parseFloat(monthlyRate) : null,
            description: description || null,
          },
          { id: id },
          true
        );
      } else {
        // Create new service listing
        response = await apiService.post(
          API_ENDPOINTS.SERVICE_LISTINGS.CREATE,
          {
            service_types: selectedServiceTypes,
            locations: locationIds,
            work_type: workType,
            monthly_rate: monthlyRate ? parseFloat(monthlyRate) : null,
            description: description || null,
          },
          undefined,
          true
        );
      }

      if (response.success) {
        Alert.alert('Success', isEditMode ? 'Service offering updated successfully' : 'Service offering added successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', response.message || (isEditMode ? 'Failed to update service offering' : 'Failed to add service offering'));
      }
    } catch (error: any) {
      console.error('Error saving service offering:', error);
      Alert.alert('Error', error.message || (isEditMode ? 'Failed to update service offering' : 'Failed to add service offering'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: cardBg, borderColor }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {isEditMode ? 'Edit Service' : 'Add New Service'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={[styles.scrollView, { backgroundColor }]} 
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          bounces={false}
          alwaysBounceHorizontal={false}
          alwaysBounceVertical={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24, width: width, maxWidth: width }}
        >
          {/* Decorative Background Elements */}
          <View style={[styles.topCircle, { backgroundColor: primaryLight, opacity: 0.3 }]} />
          <View style={[styles.bottomCircle, { backgroundColor: primaryLight, opacity: 0.2 }]} />

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={primaryColor} />
              <Text style={[styles.loadingText, { color: textSecondary }]}>Loading service details...</Text>
            </View>
          ) : (
            <View style={styles.form}>
            {/* Service Types */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>
                Select Service Types <Text style={styles.required}>*</Text>
              </Text>
              <Text style={[styles.instruction, { color: textSecondary }]}>
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
                        { backgroundColor: cardBg, borderColor },
                        isSelected && { borderColor: primaryColor, backgroundColor: primaryLight },
                      ]}
                      onPress={() => toggleServiceType(service.id)}
                    >
                      <Text style={styles.serviceEmoji}>{service.emoji}</Text>
                      <Text
                        style={[
                          styles.serviceTypeName,
                          { color: textSecondary },
                          isSelected && { color: primaryColor },
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
              <Text style={[styles.label, { color: textColor }]}>
                Select Locations <Text style={styles.required}>*</Text>
              </Text>
              <Text style={[styles.instruction, { color: textSecondary }]}>
                Add locations for this offer. You can add multiple locations.
              </Text>

              {/* Selected Locations */}
              {selectedLocations.length > 0 && (
                <View style={styles.selectedLocationsContainer}>
                  {selectedLocations.map((loc, index) => (
                    <View key={loc.id || `location-${index}`} style={[styles.selectedLocationTag, { backgroundColor: primaryLight, borderColor: primaryColor }]}>
                      <Text style={[styles.selectedLocationTagText, { color: primaryColor }]}>
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
              <View style={[styles.locationSearchContainer, { backgroundColor: cardBg, borderColor }]}>
                <IconSymbol name="magnifyingglass" size={20} color={textMuted} style={styles.searchIcon} />
                <TextInput
                  style={[styles.locationInput, { color: textColor }]}
                  placeholder="Search location..."
                  placeholderTextColor={textMuted}
                  value={locationSearch}
                  onChangeText={setLocationSearch}
                />
                {isLoadingLocations && (
                  <ActivityIndicator size="small" color={primaryColor} style={styles.loader} />
                )}
              </View>

              {/* Location Dropdown */}
              {showLocationDropdown && filteredLocations.length > 0 && (
                <View style={[styles.locationDropdown, { backgroundColor: cardBg, borderColor }]}>
                  <ScrollView style={styles.locationDropdownScroll} nestedScrollEnabled>
                    {filteredLocations.map((loc, index) => (
                      <TouchableOpacity
                        key={loc.id || `filtered-location-${index}`}
                        style={[styles.locationDropdownItem, { borderBottomColor: borderColor }]}
                        onPress={() => handleLocationSelect(loc)}
                      >
                        <IconSymbol name="mappin.circle.fill" size={20} color={primaryColor} />
                        <Text style={[styles.locationDropdownText, { color: textColor }]}>
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
              <Text style={[styles.label, { color: textColor }]}>
                Work Type <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.workTypeContainer}>
                {WORK_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.workTypeButton,
                      { backgroundColor: cardBg, borderColor },
                      workType === type.id && { borderColor: primaryColor, backgroundColor: primaryLight },
                    ]}
                    onPress={() => setWorkType(type.id)}
                  >
                    <Text
                      style={[
                        styles.workTypeText,
                        { color: textSecondary },
                        workType === type.id && { color: primaryColor },
                      ]}
                    >
                      {type.name}
                    </Text>
                    {workType === type.id && (
                      <IconSymbol name="checkmark.circle.fill" size={20} color={primaryColor} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Monthly Rate */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Monthly Rate (PKR)</Text>
              <View style={[styles.inputContainer, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.currencyPrefix, { color: textSecondary }]}>₨</Text>
                <TextInput
                  style={[styles.inputWithPrefix, { color: textColor }]}
                  placeholder="e.g., 15000"
                  placeholderTextColor={textMuted}
                  value={monthlyRate}
                  onChangeText={setMonthlyRate}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: cardBg, borderColor, color: textColor }]}
                placeholder="Describe this service offer..."
                placeholderTextColor={textMuted}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.addButton,
                (selectedServiceTypes.length === 0 || selectedLocations.length === 0) 
                  ? { 
                      backgroundColor: borderColor, 
                      opacity: 0.5,
                      shadowOpacity: 0,
                    }
                  : { 
                      backgroundColor: primaryColor,
                      shadowColor: primaryColor,
                      shadowOpacity: 0.3,
                    },
              ]}
              onPress={handleAddService}
              disabled={selectedServiceTypes.length === 0 || selectedLocations.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={[
                    styles.addButtonText,
                    (selectedServiceTypes.length === 0 || selectedLocations.length === 0) && { opacity: 0.7 }
                  ]}>{isEditMode ? 'Update Service' : 'Add Service'}</Text>
                  <IconSymbol 
                    name="plus" 
                    size={20} 
                    color={(selectedServiceTypes.length === 0 || selectedLocations.length === 0) ? textMuted : "#FFFFFF"} 
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    maxWidth: width,
  },
  topCircle: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
  },
  safeArea: {
    flex: 1,
    width: width,
    maxWidth: width,
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    width: width,
    maxWidth: width,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  instruction: {
    fontSize: 14,
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
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  serviceEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  serviceTypeName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  selectedLocationTagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeTagButton: {
    padding: 2,
  },
  locationSearchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  searchIcon: {
    marginRight: 12,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    minHeight: 50,
  },
  loader: {
    marginLeft: 12,
  },
  locationDropdown: {
    maxHeight: 200,
    borderRadius: 16,
    borderWidth: 1,
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
    gap: 12,
  },
  locationDropdownText: {
    fontSize: 16,
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
    gap: 8,
  },
  workTypeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  inputWithPrefix: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 0,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});

