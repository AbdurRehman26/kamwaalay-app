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
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
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

interface Location {
  id: number | string;
  name: string;
  area?: string;
}

export default function CreateRequestScreen() {
  const router = useRouter();
  const { user, addServiceRequest } = useApp();
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [budget, setBudget] = useState('');

  // Search locations from API when user types
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (locationSearch.trim().length >= 2) {
        searchLocations(locationSearch.trim());
      } else if (locationSearch.trim().length === 0) {
        setFilteredLocations([]);
        setShowLocationDropdown(false);
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(searchTimeout);
  }, [locationSearch]);

  const searchLocations = async (query: string) => {
    try {
      setIsLoadingLocations(true);
      setShowLocationDropdown(true);
      
      const response = await apiService.get(
        API_ENDPOINTS.LOCATIONS.SEARCH,
        undefined,
        { q: query }, // Search query parameter
        false // Public endpoint
      );

      if (response.success && response.data) {
        let locationsData: Location[] = [];
        
        // Handle different response formats
        if (response.data.locations) {
          locationsData = Array.isArray(response.data.locations.data)
            ? response.data.locations.data
            : (Array.isArray(response.data.locations) ? response.data.locations : []);
        } else if (Array.isArray(response.data)) {
          locationsData = response.data;
        } else if (response.data.data) {
          locationsData = Array.isArray(response.data.data) ? response.data.data : [];
        }

        // Map to Location interface
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
      // Error searching locations
      setFilteredLocations([]);
      setShowLocationDropdown(false);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleLocationSelect = (location: Location) => {
    // Check if location is already selected
    if (!selectedLocations.find((loc) => loc.id === location.id)) {
      setSelectedLocations([...selectedLocations, location]);
    }
    setLocationSearch('');
    setShowLocationDropdown(false);
  };

  const handleLocationRemove = (locationId: number | string) => {
    setSelectedLocations(selectedLocations.filter((loc) => loc.id !== locationId));
  };

  const handleCreate = async () => {
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
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter description');
      return;
    }

    if (!user?.id || !user?.name) {
      Alert.alert('Error', 'User information not found');
      return;
    }

    // Use the first selected location's name for the location field
    const locationName = selectedLocations.map((loc) => loc.name).join(', ');

    await addServiceRequest({
      userId: user.id,
      userName: user.name,
      serviceName,
      description,
      location: locationName,
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
            
            {/* Selected Locations as Tags */}
            {selectedLocations.length > 0 && (
              <View style={styles.selectedLocationsContainer}>
                {selectedLocations.map((loc, index) => (
                  <View key={loc.id || `selected-location-${index}`} style={styles.locationTag}>
                    <Text style={styles.locationTagText}>
                      {loc.area ? `${loc.area}` : ''}
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

            {/* Location Search Input */}
            <View style={styles.locationSearchContainer}>
              <IconSymbol name="magnifyingglass" size={20} color="#999" />
              <TextInput
                style={styles.locationSearchInput}
                placeholder="Search and select locations..."
                placeholderTextColor="#999"
                value={locationSearch}
                onChangeText={setLocationSearch}
                onFocus={() => {
                  if (locationSearch.trim()) {
                    setShowLocationDropdown(true);
                  }
                }}
              />
              {isLoadingLocations && (
                <ActivityIndicator size="small" color="#007AFF" />
              )}
            </View>

            {/* Location Dropdown */}
            {showLocationDropdown && filteredLocations.length > 0 && (
              <View style={styles.locationDropdown}>
                <ScrollView
                  style={styles.locationDropdownScroll}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredLocations.map((loc, index) => {
                    const isSelected = selectedLocations.some((selected) => selected.id === loc.id);
                    return (
                      <TouchableOpacity
                        key={loc.id || `location-${index}`}
                        style={[
                          styles.locationDropdownItem,
                          isSelected && styles.locationDropdownItemSelected,
                        ]}
                        onPress={() => handleLocationSelect(loc)}
                        disabled={isSelected}
                      >
                        <Text
                          style={[
                            styles.locationDropdownText,
                            isSelected && styles.locationDropdownTextSelected,
                          ]}
                        >
                          {loc.area && `${loc.area}`}
                        </Text>
                        {isSelected && (
                          <IconSymbol name="checkmark.circle.fill" size={20} color="#34C759" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {!isLoadingLocations && locationSearch.trim().length >= 2 && filteredLocations.length === 0 && (
              <ThemedText style={styles.noLocationsText}>
                No locations found. Try a different search term.
              </ThemedText>
            )}
            
            {locationSearch.trim().length > 0 && locationSearch.trim().length < 2 && (
              <ThemedText style={styles.noLocationsText}>
                Type at least 2 characters to search
              </ThemedText>
            )}
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
              (!serviceName.trim() || !category || selectedLocations.length === 0 || !description.trim()) &&
                styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!serviceName.trim() || !category || selectedLocations.length === 0 || !description.trim()}
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
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  locationTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976D2',
  },
  removeTagButton: {
    padding: 2,
  },
  locationSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingLeft: 20,
    paddingRight: 16,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  locationSearchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1A1A1A',
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
    elevation: 3,
  },
  locationDropdownScroll: {
    maxHeight: 200,
  },
  locationDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationDropdownItemSelected: {
    backgroundColor: '#F5F5F5',
  },
  locationDropdownText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  locationDropdownTextSelected: {
    color: '#666',
  },
  noLocationsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
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
    marginBottom: 24,
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

