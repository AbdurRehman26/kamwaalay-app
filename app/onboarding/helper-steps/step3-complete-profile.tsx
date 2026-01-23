import MapView, { Marker, PROVIDER_GOOGLE, Region } from '@/components/MapLib';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import * as Location from 'expo-location'; // Added import
import React from 'react';
import {
  ActivityIndicator,
  Modal, // Added import
  SafeAreaView, // Added import
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface CompleteProfileData {
  experience: string;
  bio: string;
  age: string;
  gender: string;
  religion: string;
  languages: number[];
  address?: string; // New
  latitude?: number; // New
  longitude?: number; // New
}

interface Step3CompleteProfileProps {
  data: CompleteProfileData;
  onChange: (data: CompleteProfileData) => void;
  onBack: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

const RELIGION_OPTIONS = [
  { id: 'sunni_nazar_niyaz', label: 'Sunni (Nazar/Niyaz)' },
  { id: 'sunni_no_nazar_niyaz', label: 'Sunni (No Nazar/Niyaz)' },
  { id: 'shia', label: 'Shia' },
  { id: 'christian', label: 'Christian' },
];

interface Language {
  id: string | number;
  name: string;
}

export default function Step3CompleteProfile({
  data,
  onChange,
  onBack,
  onSubmit,
  isLoading = false,
}: Step3CompleteProfileProps) {
  // Theme colors
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  const [availableLanguages, setAvailableLanguages] = React.useState<Language[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = React.useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = React.useState(false);

  React.useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      setIsLoadingLanguages(true);
      const response = await apiService.get(API_ENDPOINTS.LANGUAGES.LIST, undefined, undefined, false);

      if (response.success && response.data) {
        let langs: Language[] = [];
        if (Array.isArray(response.data)) {
          langs = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          langs = response.data.data;
        } else if (response.data.languages) {
          langs = Array.isArray(response.data.languages) ? response.data.languages : (response.data.languages.data || []);
        }

        // Ensure standard format
        const formattedLangs = langs.map((l: any) => ({
          id: l.id || l.name,
          name: l.name || l
        }));

        setAvailableLanguages(formattedLangs);
      }
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    } finally {
      setIsLoadingLanguages(false);
    }
  };

  const toggleLanguage = (languageId: number) => {
    const currentLanguages = data.languages || [];

    let updatedLanguages: number[];
    if (currentLanguages.includes(languageId)) {
      updatedLanguages = currentLanguages.filter(id => id !== languageId);
    } else {
      updatedLanguages = [...currentLanguages, languageId];
    }

    onChange({ ...data, languages: updatedLanguages });
  };

  // Map State
  const [address, setAddress] = React.useState(data.address || '');
  const [pinLocation, setPinLocation] = React.useState<{ latitude: number; longitude: number } | null>(
    data.latitude && data.longitude ? { latitude: data.latitude, longitude: data.longitude } : null
  );
  const [isMapVisible, setIsMapVisible] = React.useState(false);
  const [mapRegion, setMapRegion] = React.useState<Region>({
    latitude: 24.8607,
    longitude: 67.0011,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isGeocoding, setIsGeocoding] = React.useState(false);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // PERMISSION DENIED
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      setPinLocation({ latitude, longitude });
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  const openMap = () => {
    setIsMapVisible(true);
    if (!pinLocation) {
      getCurrentLocation();
    } else {
      setMapRegion({
        latitude: pinLocation.latitude,
        longitude: pinLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

  const handleMapConfirm = async () => {
    if (!pinLocation) return;

    setIsMapVisible(false);
    setIsGeocoding(true);

    try {
      // Update parent data with coordinates immediately
      onChange({
        ...data,
        latitude: pinLocation.latitude,
        longitude: pinLocation.longitude,
      });

      const result = await Location.reverseGeocodeAsync({
        latitude: pinLocation.latitude,
        longitude: pinLocation.longitude
      });

      if (result.length > 0) {
        const addr = result[0];
        const formattedAddress = [
          addr.street,
          addr.district,
          addr.city,
          addr.region
        ].filter(Boolean).join(', ');

        setAddress(formattedAddress);
        // Update parent data with address
        onChange({
          ...data,
          latitude: pinLocation.latitude,
          longitude: pinLocation.longitude,
          address: formattedAddress,
        });
      }
    } catch (error) {
      console.log('Error reverse geocoding:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const renderMapModal = () => {
    return (
      <Modal
        visible={isMapVisible}
        animationType="slide"
        onRequestClose={() => setIsMapVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={mapRegion}
              onRegionChangeComplete={(region) => {
                setMapRegion(region);
                setPinLocation({
                  latitude: region.latitude,
                  longitude: region.longitude,
                });
              }}
            >
              <Marker
                coordinate={{
                  latitude: mapRegion.latitude,
                  longitude: mapRegion.longitude,
                }}
              />
            </MapView>

            <View style={styles.mapOverlay}>
              <Text style={styles.mapInstruction}>
                Drag map to pin exact location
              </Text>
            </View>

            <View style={styles.mapButtons}>
              <TouchableOpacity
                style={[styles.mapButton, styles.cancelButton]}
                onPress={() => setIsMapVisible(false)}
              >
                <Text style={[styles.mapButtonText, { color: '#FF3B30' }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mapButton, styles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={handleMapConfirm}
              >
                <Text style={[styles.mapButtonText, { color: '#fff' }]}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Your Profile
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
            Optional: Add more details about yourself
          </ThemedText>
        </View>

        <View style={styles.form}>
          {/* Address with Map Pin */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>Address / Location</ThemedText>
            <View style={{ gap: 10 }}>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor, color: textMuted, opacity: 0.8 }]}
                placeholder="Select location on map"
                placeholderTextColor={textMuted}
                value={address}
                editable={false}
              />
              <TouchableOpacity
                style={[styles.pinButton, { backgroundColor: cardBg, borderColor: primaryColor }]}
                onPress={openMap}
              >
                <IconSymbol name="location.fill" size={20} color={primaryColor} />
                <Text style={[styles.pinButtonText, { color: primaryColor }]}>
                  {address ? 'Change Location' : 'Pin Location on Map'}
                </Text>
              </TouchableOpacity>
            </View>
            {isGeocoding && (
              <View style={styles.helperTextContainer}>
                <ActivityIndicator size="small" color={primaryColor} />
                <Text style={[styles.helperText, { color: textMuted }]}>Getting address...</Text>
              </View>
            )}
          </View>

          {/* Years of Experience */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>Years of Experience</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
              placeholder="e.g., 5"
              placeholderTextColor={textMuted}
              value={data.experience}
              onChangeText={(value) => onChange({ ...data, experience: value })}
              keyboardType="numeric"
            />
          </View>

          {/* Age and Gender Row */}
          <View style={styles.row}>
            {/* Age */}
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <ThemedText style={[styles.label, { color: textColor }]}>Age</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
                placeholder="e.g., 25"
                placeholderTextColor={textMuted}
                value={data.age}
                onChangeText={(value) => onChange({ ...data, age: value })}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            {/* Gender */}
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <ThemedText style={[styles.label, { color: textColor }]}>Gender</ThemedText>
              <View style={styles.genderContainer}>
                {['Male', 'Female'].map((genderOption) => (
                  <TouchableOpacity
                    key={genderOption}
                    style={[
                      styles.genderButton,
                      { backgroundColor: cardBg, borderColor },
                      data.gender === genderOption && { backgroundColor: primaryColor, borderColor: primaryColor }
                    ]}
                    onPress={() => onChange({ ...data, gender: genderOption })}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        { color: textSecondary },
                        data.gender === genderOption && { color: '#FFFFFF' }
                      ]}
                    >
                      {genderOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>


          {/* Religion */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>Religion</ThemedText>
            <View style={styles.religionContainer}>
              {RELIGION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.religionButton,
                    { backgroundColor: cardBg, borderColor },
                    data.religion === option.id && { backgroundColor: primaryColor, borderColor: primaryColor }
                  ]}
                  onPress={() => onChange({ ...data, religion: option.id })}
                >
                  <Text
                    style={[
                      styles.religionText,
                      { color: textSecondary },
                      data.religion === option.id && { color: '#FFFFFF' }
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Languages */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>Languages</ThemedText>
            <ThemedText style={[styles.helperText, { color: textSecondary }]}>Select languages you can speak</ThemedText>

            {/* Selected Languages Chips */}
            {data.languages && data.languages.length > 0 ? (
              <View style={styles.selectedLanguagesContainer}>
                {data.languages.map((langId) => {
                  const langName = availableLanguages.find(l => l.id === langId)?.name || langId.toString();
                  return (
                    <TouchableOpacity
                      key={langId}
                      style={[styles.languageChip, { backgroundColor: primaryColor }]}
                      onPress={() => toggleLanguage(langId)}
                    >
                      <Text style={styles.languageChipText}>{langName} ✕</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            {/* Language Dropdown Selector */}
            <TouchableOpacity
              style={[
                styles.dropdownSelector,
                { backgroundColor: cardBg, borderColor },
              ]}
              onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
            >
              <Text style={[styles.dropdownSelectorText, { color: textColor }]}>
                Select Languages
              </Text>
              <IconSymbol name="chevron.down" size={20} color={textSecondary} />
            </TouchableOpacity>

            {/* Dropdown Content */}
            {showLanguageDropdown && (
              <View style={[styles.languagesList, { borderColor, backgroundColor: cardBg }]}>
                {isLoadingLanguages ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={primaryColor} />
                  </View>
                ) : (
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                    {availableLanguages.map((lang) => {
                      const langId = typeof lang.id === 'string' ? parseInt(lang.id) : lang.id;
                      const isSelected = data.languages?.includes(langId);
                      return (
                        <TouchableOpacity
                          key={lang.id}
                          style={[
                            styles.languageItem,
                            isSelected && { backgroundColor: primaryColor + '20' }
                          ]}
                          onPress={() => toggleLanguage(langId)}
                        >
                          <Text style={[styles.languageItemText, { color: textColor }]}>{lang.name}</Text>
                          {isSelected && <Text style={{ color: primaryColor }}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* Bio */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>Bio</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: cardBg, borderColor, color: textColor }]}
              placeholder="Tell us about yourself..."
              placeholderTextColor={textMuted}
              multiline
              numberOfLines={6}
              value={data.bio}
              onChangeText={(value) => onChange({ ...data, bio: value })}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: cardBg }]} onPress={onBack}>
            <Text style={[styles.backButtonText, { color: textSecondary }]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: primaryColor, opacity: isLoading ? 0.7 : 1 }]}
            onPress={onSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Complete Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderMapModal()}
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    marginBottom: 8,
    marginTop: -4,
  },
  helperTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  religionContainer: {
    gap: 8,
  },
  religionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  religionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedLanguagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  languageChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  languageChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  dropdownSelectorText: {
    fontSize: 16,
  },
  languagesList: {
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 200,
    overflow: 'hidden', // Ensure scrolling works if content overflows
  },
  languageItem: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  languageItemText: {
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 8,
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  pinButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapInstruction: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mapButtons: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  mapButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#fff',
  },
  confirmButton: {

  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
