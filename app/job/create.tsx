import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
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
  'Cleaning',
  'Cooking',
  'Babysitting',
  'Elderly Care',
  'All-Rounder',
  '24/7 Live-in',
  'Other',
];

const WORK_TYPES = [
  'Full Time',
  'Part Time',
  'Contract',
  'Temporary',
];

interface Location {
  id: number | string;
  name: string;
  area?: string;
}

export default function CreateRequestScreen() {
  const router = useRouter();
  const { addJob } = useApp();
  const { user } = useAuth();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const errorColor = '#FF3B30';

  // Form State
  const [serviceType, setServiceType] = useState('');
  const [workType, setWorkType] = useState('');
  const [estimatedSalary, setEstimatedSalary] = useState('');
  const [userName, setUserName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');

  // Location State
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // UI State
  const [showServiceTypeDropdown, setShowServiceTypeDropdown] = useState(false);
  const [showWorkTypeDropdown, setShowWorkTypeDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    // Only allow single location selection as per design implication ("Area *")
    // But keeping array structure for compatibility if needed, or simply replacing
    setSelectedLocations([location]);
    setLocationSearch(location.area || location.name);
    setShowLocationDropdown(false);
  };

  const handleCreate = async () => {
    if (!serviceType) { Alert.alert('Required', 'Please select a service type'); return; }
    if (!workType) { Alert.alert('Required', 'Please select a work type'); return; }
    if (selectedLocations.length === 0) { Alert.alert('Required', 'Please select an area'); return; }
    if (!userName.trim()) { Alert.alert('Required', 'Please enter your name'); return; }
    if (!phone.trim()) { Alert.alert('Required', 'Please enter your phone number'); return; }

    setIsSubmitting(true);
    try {
      const locationName = selectedLocations.map((loc) => loc.area || loc.name).join(', ');

      await addJob({
        userId: user?.id || 'guest',
        userName: userName,
        serviceName: serviceType,
        description: specialRequirements,
        location: locationName,
        budget: estimatedSalary ? parseFloat(estimatedSalary) : undefined,
        workType,
        phone,
        address
      });

      Alert.alert('Success', 'Job created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={primaryColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Post a Job</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#F59E0B" />
          <Text style={styles.warningText}>
            Note: We are currently serving <Text style={{ fontWeight: 'bold' }}>Karachi</Text> only. We will be going live in different cities soon!
          </Text>
        </View>

        <View style={styles.form}>

          {/* Row 1: Service Type & Work Type */}
          <View style={styles.row}>
            <View style={[styles.col, { zIndex: 2000 }]}>
              <ThemedText style={styles.label}>SERVICE TYPE *</ThemedText>
              <TouchableOpacity
                style={[styles.dropdownButton, { backgroundColor: cardBg, borderColor: borderColor }]}
                onPress={() => {
                  setShowServiceTypeDropdown(!showServiceTypeDropdown);
                  setShowWorkTypeDropdown(false);
                }}
              >
                <Text style={[styles.dropdownButtonText, { color: serviceType ? textColor : textMuted }]}>
                  {serviceType || 'Select Service'}
                </Text>
                <IconSymbol name="chevron.down" size={16} color={textMuted} />
              </TouchableOpacity>
              {showServiceTypeDropdown && (
                <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor: borderColor }]}>
                  {SERVICE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.dropdownItem, { borderBottomColor: borderColor }]}
                      onPress={() => {
                        setServiceType(type);
                        setShowServiceTypeDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, { color: textColor }]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.col, { zIndex: 1000 }]}>
              <ThemedText style={styles.label}>WORK TYPE *</ThemedText>
              <TouchableOpacity
                style={[styles.dropdownButton, { backgroundColor: cardBg, borderColor: borderColor }]}
                onPress={() => {
                  setShowWorkTypeDropdown(!showWorkTypeDropdown);
                  setShowServiceTypeDropdown(false);
                }}
              >
                <Text style={[styles.dropdownButtonText, { color: workType ? textColor : textMuted }]}>
                  {workType || 'Select Type'}
                </Text>
                <IconSymbol name="chevron.down" size={16} color={textMuted} />
              </TouchableOpacity>
              {showWorkTypeDropdown && (
                <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor: borderColor }]}>
                  {WORK_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.dropdownItem, { borderBottomColor: borderColor }]}
                      onPress={() => {
                        setWorkType(type);
                        setShowWorkTypeDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, { color: textColor }]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Row 2: Salary & Area */}
          <View style={[styles.row, { zIndex: 1 }]}>
            <View style={styles.col}>
              <ThemedText style={styles.label}>ESTIMATED SALARY</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor: borderColor, color: textColor }]}
                placeholder="25000 (PKR/MONTH)"
                placeholderTextColor={textMuted}
                keyboardType="numeric"
                value={estimatedSalary}
                onChangeText={setEstimatedSalary}
              />
            </View>

            <View style={[styles.col, { zIndex: 500 }]}>
              <ThemedText style={styles.label}>AREA *</ThemedText>
              <View>
                <TextInput
                  style={[styles.input, { backgroundColor: cardBg, borderColor: borderColor, color: textColor }]}
                  placeholder="Type to search area..."
                  placeholderTextColor={textMuted}
                  value={locationSearch}
                  onChangeText={setLocationSearch}
                  onFocus={() => {
                    if (locationSearch.trim()) setShowLocationDropdown(true);
                  }}
                />
                {isLoadingLocations && (
                  <ActivityIndicator style={styles.loader} size="small" color={primaryColor} />
                )}
                {showLocationDropdown && filteredLocations.length > 0 && (
                  <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor: borderColor, width: '100%', top: '100%' }]}>
                    {filteredLocations.map((loc, index) => (
                      <TouchableOpacity
                        key={loc.id || index}
                        style={[styles.dropdownItem, { borderBottomColor: borderColor }]}
                        onPress={() => handleLocationSelect(loc)}
                      >
                        <Text style={[styles.dropdownItemText, { color: textColor }]}>
                          {loc.area ? `${loc.area}` : loc.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Row 3: Name & Phone */}
          <View style={styles.row}>
            <View style={styles.col}>
              <ThemedText style={styles.label}>YOUR NAME *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor: borderColor, color: textColor }]}
                placeholder="Full Name"
                placeholderTextColor={textMuted}
                value={userName}
                onChangeText={setUserName}
              />
            </View>

            <View style={styles.col}>
              <ThemedText style={styles.label}>PHONE *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor: borderColor, color: textColor }]}
                placeholder="03001234567"
                placeholderTextColor={textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <View style={styles.helperTextContainer}>
                <IconSymbol name="info.circle" size={12} color={textMuted} />
                <Text style={[styles.helperText, { color: textMuted }]}>
                  Not visible until accepted.
                </Text>
              </View>
            </View>
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>ADDRESS</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: cardBg, borderColor: borderColor, color: textColor }]}
              placeholder="House 123, Street 4, Karachi"
              placeholderTextColor={textMuted}
              multiline
              numberOfLines={3}
              value={address}
              onChangeText={setAddress}
            />
            <View style={styles.helperTextContainer}>
              <IconSymbol name="info.circle" size={12} color={textMuted} />
              <Text style={[styles.helperText, { color: textMuted }]}>
                Your address will not be visible to helpers unless you accept their application.
              </Text>
            </View>
          </View>

          {/* Special Requirements */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>SPECIAL REQUIREMENTS</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: cardBg, borderColor: borderColor, color: textColor }]}
              placeholder="Any special requirements or preferences..."
              placeholderTextColor={textMuted}
              multiline
              numberOfLines={4}
              value={specialRequirements}
              onChangeText={setSpecialRequirements}
            />
          </View>

          {/* Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: primaryColor }, isSubmitting && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Job Post</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: cardBg, borderColor: borderColor }]}
              onPress={() => router.push('/(tabs)/helpers')}
            >
              <Text style={[styles.secondaryButtonText, { color: textColor }]}>Browse Helpers First</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  warningBanner: {
    backgroundColor: '#3B3012', // Dark yellow/orange bg
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    color: '#FCD34D', // Light yellow text
    fontSize: 12,
    flex: 1,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  col: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 48,
  },
  textArea: {
    height: 'auto',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 14,
  },
  dropdownList: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 9999,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 14,
  },
  loader: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  helperTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  helperText: {
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  submitButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
});

