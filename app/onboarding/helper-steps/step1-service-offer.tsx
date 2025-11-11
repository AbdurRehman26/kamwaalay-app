import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

interface Location {
  id: number | string;
  name: string;
  area?: string;
}

interface ServiceOfferData {
  serviceTypes: string[];
  locations: Location[];
  workType: string;
  monthlyRate: string;
  description: string;
}

interface Step1ServiceOfferProps {
  data: ServiceOfferData;
  onChange: (data: ServiceOfferData) => void;
  onNext: () => void;
}

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

export default function Step1ServiceOffer({
  data,
  onChange,
  onNext,
}: Step1ServiceOfferProps) {
  const [locationSearch, setLocationSearch] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

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
    if (!data.locations.find((loc) => loc.id === location.id)) {
      onChange({
        ...data,
        locations: [...data.locations, location],
      });
    }
    setLocationSearch('');
    setShowLocationDropdown(false);
  };

  const handleLocationRemove = (locationId: number | string) => {
    onChange({
      ...data,
      locations: data.locations.filter((loc) => loc.id !== locationId),
    });
  };

  const toggleServiceType = (serviceId: string) => {
    const isSelected = data.serviceTypes.includes(serviceId);
    onChange({
      ...data,
      serviceTypes: isSelected
        ? data.serviceTypes.filter((id) => id !== serviceId)
        : [...data.serviceTypes, serviceId],
    });
  };

  const handleNext = () => {
    if (data.serviceTypes.length === 0) {
      return;
    }
    if (data.locations.length === 0) {
      return;
    }
    if (!data.workType) {
      return;
    }
    onNext();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Service Offer 1
          </ThemedText>
        </View>

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
                const isSelected = data.serviceTypes.includes(service.id);
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceCard,
                      isSelected && styles.serviceCardSelected,
                    ]}
                    onPress={() => toggleServiceType(service.id)}
                  >
                    <Text style={styles.serviceEmoji}>{service.emoji}</Text>
                    <Text
                      style={[
                        styles.serviceName,
                        isSelected && styles.serviceNameSelected,
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
            {data.locations.length > 0 && (
              <View style={styles.selectedLocationsContainer}>
                {data.locations.map((loc, index) => (
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
                <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
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
                    data.workType === type.id && styles.workTypeButtonActive,
                  ]}
                  onPress={() => onChange({ ...data, workType: type.id })}
                >
                  <Text
                    style={[
                      styles.workTypeText,
                      data.workType === type.id && styles.workTypeTextActive,
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
              value={data.monthlyRate}
              onChangeText={(value) => onChange({ ...data, monthlyRate: value })}
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
              value={data.description}
              onChangeText={(value) => onChange({ ...data, description: value })}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.nextButton,
            (data.serviceTypes.length === 0 ||
              data.locations.length === 0 ||
              !data.workType) &&
              styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={
            data.serviceTypes.length === 0 ||
            data.locations.length === 0 ||
            !data.workType
          }
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
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
  serviceCard: {
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
  serviceCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  serviceEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  serviceNameSelected: {
    color: '#007AFF',
  },
  selectedLocationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  locationTagText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  removeTagButton: {
    padding: 2,
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
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  workTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  workTypeTextActive: {
    color: '#007AFF',
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
  nextButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
    marginTop: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

