import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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

import { useApp } from '@/contexts/AppContext';

interface ServiceType {
  id: string | number;
  name: string;
  emoji?: string;
  image?: string;
  icon?: string;
  icon_url?: string;
  image_url?: string;
}

const WORK_TYPES = [
  { id: 'full_time', name: 'Full Time' },
  { id: 'part_time', name: 'Part Time' },
];

export default function Step1ServiceOffer({
  data,
  onChange,
  onNext,
}: Step1ServiceOfferProps) {
  const { serviceTypes } = useApp();
  const [locationSearch, setLocationSearch] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');

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
            <ThemedText style={[styles.label, { color: textColor }]}>
              Select Service Types <Text style={[styles.required, { color: errorColor }]}>*</Text>
            </ThemedText>
            <ThemedText style={[styles.instruction, { color: textSecondary }]}>
              Choose the services for this offer. You can select multiple.
            </ThemedText>
            <View style={styles.serviceTypesContainer}>
              {serviceTypes.map((service: ServiceType) => {
                const serviceId = service.id.toString();
                const isSelected = data.serviceTypes.includes(serviceId);
                return (
                  <TouchableOpacity
                    key={serviceId}
                    style={[
                      styles.serviceCard,
                      { backgroundColor: cardBg, borderColor },
                      isSelected && { borderColor: primaryColor, backgroundColor: primaryLight },
                    ]}
                    onPress={() => toggleServiceType(serviceId)}
                  >
                    {/* Use API icon/image if available, otherwise fallback to emoji */}
                      <Text style={styles.serviceEmoji}>{service.icon || '🔧'}</Text>
                    <Text
                      style={[
                        styles.serviceName,
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
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>
              Select Locations <Text style={[styles.required, { color: errorColor }]}>*</Text>
            </ThemedText>
            <ThemedText style={[styles.instruction, { color: textSecondary }]}>
              Add locations for this offer. You can add multiple locations.
            </ThemedText>

            {/* Selected Locations */}
            {data.locations.length > 0 && (
              <View style={styles.selectedLocationsContainer}>
                {data.locations.map((loc, index) => (
                  <View key={loc.id || `location-${index}`} style={[styles.locationTag, { backgroundColor: primaryLight }]}>
                    <Text style={[styles.locationTagText, { color: primaryColor }]}>
                      {loc.area || loc.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleLocationRemove(loc.id)}
                      style={styles.removeTagButton}
                    >
                      <IconSymbol name="xmark.circle.fill" size={16} color={errorColor} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Location Search */}
            <View style={styles.locationSearchContainer}>
              <TextInput
                style={[styles.locationInput, { backgroundColor: cardBg, borderColor, color: textColor }]}
                placeholder="Search location (e.g., Karachi, Clifton or type area name)..."
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
            <ThemedText style={[styles.label, { color: textColor }]}>
              Work Type <Text style={[styles.required, { color: errorColor }]}>*</Text>
            </ThemedText>
            <View style={styles.workTypeContainer}>
              {WORK_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.workTypeButton,
                    { backgroundColor: cardBg, borderColor },
                    data.workType === type.id && { borderColor: primaryColor, backgroundColor: primaryLight },
                  ]}
                  onPress={() => onChange({ ...data, workType: type.id })}
                >
                  <Text
                    style={[
                      styles.workTypeText,
                      { color: textSecondary },
                      data.workType === type.id && { color: primaryColor },
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
            <ThemedText style={[styles.label, { color: textColor }]}>Monthly Rate (PKR)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
              placeholder="e.g., 15000"
              placeholderTextColor={textMuted}
              value={data.monthlyRate}
              onChangeText={(value) => onChange({ ...data, monthlyRate: value })}
              keyboardType="numeric"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>Description</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: cardBg, borderColor, color: textColor }]}
              placeholder="Describe this service offer..."
              placeholderTextColor={textMuted}
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
            { backgroundColor: primaryColor },
            (data.serviceTypes.length === 0 ||
              data.locations.length === 0 ||
              !data.workType) &&
            { backgroundColor: textMuted, opacity: 0.5 },
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
  },
  required: {
  },
  instruction: {
    fontSize: 14,
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
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  serviceCardSelected: {
  },
  serviceImage: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  serviceEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  serviceNameSelected: {
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  locationTagText: {
    fontSize: 14,
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
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  loader: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  locationDropdown: {
    maxHeight: 200,
    borderRadius: 12,
    borderWidth: 1,
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
  },
  locationDropdownText: {
    fontSize: 16,
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
    alignItems: 'center',
  },
  workTypeButtonActive: {
  },
  workTypeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  workTypeTextActive: {
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  nextButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
    marginTop: 8,
  },
  nextButtonDisabled: {
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

