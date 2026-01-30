import MapView, { Marker, PROVIDER_GOOGLE, Region } from '@/components/MapLib';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { mapDarkStyle } from '@/constants/MapStyle';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import { apiService } from '@/services/api';
import { toast } from '@/utils/toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColor } from '@/hooks/use-theme-color';

const { width } = Dimensions.get('window');

export default function OnboardingStartScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const { colorScheme } = useTheme();

  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Map & Location State
  const [address, setAddress] = useState('');
  const [pinLocation, setPinLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 24.8607,
    longitude: 67.0011,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  // City Selection State
  const [cityId, setCityId] = useState<number | null>(null);
  const [cities, setCities] = useState<any[]>([]);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');

  // Pre-populate data if it exists in user context
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    if (user?.city_id) {
      setCityId(user.city_id);
    }
    if (user?.pin_address) {
      setAddress(user.pin_address);
    }
    if (user?.pin_latitude && user?.pin_longitude) {
      setPinLocation({
        latitude: user.pin_latitude,
        longitude: user.pin_longitude
      });
    }
  }, [user]);

  // Fetch cities on mount
  useEffect(() => {
    fetchCities();
  }, []);

  // Check token on mount and log out if not found
  useEffect(() => {
    const checkTokenAndLogout = async () => {
      try {
        let token = await AsyncStorage.getItem('authToken');
        if (!token && user) {
          const userToken = (user as any).token;
          if (userToken) {
            await AsyncStorage.setItem('authToken', userToken);
            token = userToken;
          }
        }
        if (!token) {
          await logout();
          router.replace('/auth/phone-login');
        }
      } catch (error) {
        await logout();
        router.replace('/auth/phone-login');
      }
    };
    checkTokenAndLogout();
  }, [user, logout, router]);

  const fetchCities = async () => {
    try {
      setIsLoadingCities(true);
      const response = await apiService.get(API_ENDPOINTS.CITIES.LIST, undefined, undefined, false);
      if (response.success && response.data) {
        let citiesData: any[] = [];
        if (Array.isArray(response.data)) {
          citiesData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          citiesData = response.data.data;
        }
        const formattedCities = citiesData.map((c: any) => ({
          ...c,
          id: typeof c.id === 'string' ? parseInt(c.id, 10) : c.id,
        }));
        setCities(formattedCities);
      }
    } catch (error) {
    } finally {
      setIsLoadingCities(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.error('Permission to access location was denied');
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
      }
    } catch (error) {
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleContinue = async () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!cityId) {
      toast.error('Please select your city');
      return;
    }

    if (!address) {
      toast.error('Please pin your location');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const profileUpdateData: any = {
        name: name.trim(),
        city_id: cityId,
        pin_address: address,
        pin_latitude: pinLocation?.latitude,
        pin_longitude: pinLocation?.longitude,
      };

      await updateUser(profileUpdateData);

      // Redirect based on user type
      setTimeout(() => {
        if (user?.userType === 'helper') {
          router.replace('/onboarding/helper-profile');
        } else if (user?.userType === 'business') {
          router.replace('/onboarding/business-profile');
        } else {
          updateUser({ onboardingStatus: 'completed' });
          router.replace('/(tabs)');
        }
      }, 100);
    } catch (error: any) {
      let extractedErrorMessage = 'Failed to update profile. Please try again.';
      if (error instanceof Error) {
        extractedErrorMessage = error.message;
      } else if (typeof error === 'string') {
        extractedErrorMessage = error;
      } else if (error && typeof error === 'object') {
        extractedErrorMessage = error.message || error.error || error.toString();
      }
      setErrorMessage(extractedErrorMessage);
      toast.error(extractedErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCityModal = () => {
    return (
      <Modal
        visible={isCityModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsCityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>{t('auth.city')}</Text>
              <TouchableOpacity onPress={() => setIsCityModalVisible(false)}>
                <IconSymbol name="xmark" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor }]}>
              <IconSymbol name="magnifyingglass" size={20} color={textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Search city..."
                placeholderTextColor={textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <IconSymbol name="xmark.circle.fill" size={16} color={textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              style={styles.cityList}
              contentContainerStyle={styles.cityListContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {isLoadingCities ? (
                <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 20 }} />
              ) : filteredCities.length > 0 ? (
                filteredCities.map((city: any, index: number) => {
                  const isSelected = cityId === city.id;
                  return (
                    <TouchableOpacity
                      key={city.id}
                      style={[
                        styles.cityItem,
                        {
                          borderBottomColor: borderColor,
                          borderBottomWidth: index === filteredCities.length - 1 ? 0 : 1,
                          backgroundColor: isSelected ? (primaryLight + '30') : 'transparent'
                        }
                      ]}
                      onPress={() => {
                        setCityId(city.id);
                        setIsCityModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.cityItemText,
                          {
                            color: isSelected ? primaryColor : textColor,
                            fontWeight: isSelected ? '600' : '400'
                          }
                        ]}
                      >
                        {city.name}
                      </Text>
                      {isSelected && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: textSecondary }]}>No cities found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderMapModal = () => {
    return (
      <Modal
        visible={isMapVisible}
        animationType="slide"
        onRequestClose={() => setIsMapVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor }}>
          <View style={{ height: insets.top, backgroundColor: backgroundColor }} />
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={mapRegion}
              customMapStyle={colorScheme === 'dark' ? mapDarkStyle : []}
              onRegionChangeComplete={(region: Region) => {
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
                {t('jobPosts.map.dragMarker')}
              </Text>
            </View>

            <View style={styles.mapButtons}>
              <TouchableOpacity
                style={[styles.mapButton, styles.cancelButton]}
                onPress={() => setIsMapVisible(false)}
              >
                <Text style={[styles.mapButtonText, { color: '#FF3B30' }]}>{t('jobPosts.map.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mapButton, styles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={handleMapConfirm}
              >
                <Text style={[styles.mapButtonText, { color: '#fff' }]}>{t('jobPosts.map.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.topCircle, { backgroundColor: primaryLight, opacity: 0.3 }]} />
          <View style={[styles.bottomCircle, { backgroundColor: primaryLight, opacity: 0.2 }]} />

          <View style={styles.content}>
            <View style={[styles.headerSection, { marginTop: insets.top + 20 }]}>
              <Text style={[styles.title, { color: textColor }]}>{t('onboarding.start.title') || "Your Profile"}</Text>
              <Text style={[styles.subtitle, { color: textSecondary }]}>
                {t('onboarding.start.subtitle') || "Complete your profile to find relevant opportunities nearby"}
              </Text>
            </View>

            <View style={styles.form}>
              {/* Name Selection */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>
                  {user?.userType === 'business' ? 'Business Owner Name' : 'Full Name'}
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                  <IconSymbol name="person.fill" size={20} color={textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder={user?.userType === 'business' ? 'Enter owner name' : 'Enter your name'}
                    placeholderTextColor={textSecondary}
                    value={name}
                    onChangeText={setName}
                    autoComplete="name"
                    textContentType="name"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* City Selection */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>City</Text>
                <TouchableOpacity
                  style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}
                  onPress={() => setIsCityModalVisible(true)}
                >
                  <IconSymbol name="mappin.and.ellipse" size={20} color={textSecondary} style={styles.inputIcon} />
                  <Text style={[styles.input, { color: cityId ? textColor : textSecondary, paddingVertical: 16 }]}>
                    {cityId ? cities.find(c => c.id === cityId)?.name : 'Select City'}
                  </Text>
                  <IconSymbol name="chevron.down" size={20} color={textSecondary} style={{ marginRight: 16 }} />
                </TouchableOpacity>
              </View>

              {/* Pin Location UI */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>{t('profileEdit.labels.address')}</Text>
                <View style={{ gap: 10 }}>
                  <TextInput
                    style={[styles.input, styles.locationPlaceholder, { backgroundColor: cardBg, borderColor, color: textMuted }]}
                    placeholder={t('profileEdit.placeholders.pinLocation')}
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
                      {address ? t('profileEdit.actions.changeLocation') : t('profileEdit.actions.pinLocation')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {isGeocoding && (
                  <View style={styles.geocodingContainer}>
                    <ActivityIndicator size="small" color={primaryColor} />
                    <Text style={[styles.helperText, { color: textMuted }]}>{t('common.loading')}</Text>
                  </View>
                )}
              </View>
            </View>

            {errorMessage && (
              <View style={[styles.errorCard, { backgroundColor: '#FEF2F2' }]}>
                <IconSymbol name="exclamationmark.circle.fill" size={16} color={errorColor} />
                <Text style={[styles.errorText, { color: errorColor }]}>{errorMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: primaryColor, shadowColor: primaryColor },
                (!name.trim() || !cityId || !address || isLoading) && [styles.buttonDisabled, { backgroundColor: borderColor }]
              ]}
              onPress={handleContinue}
              disabled={!name.trim() || !cityId || !address || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>{t('auth.next')}</Text>
                  <IconSymbol name="arrow.right" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderCityModal()}
      {renderMapModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topCircle: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#EEF2FF',
    opacity: 0.7,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#F5F3FF',
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: 24,
  },
  headerSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 56,
    overflow: 'hidden',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  locationPlaceholder: {
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  pinButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  geocodingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
  },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  cityList: {
    maxHeight: 300,
  },
  cityListContent: {
    paddingBottom: 8,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  cityItemText: {
    fontSize: 14,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
  },
  mapInstruction: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  mapButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  mapButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: '#6366F1',
    borderWidth: 0,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
