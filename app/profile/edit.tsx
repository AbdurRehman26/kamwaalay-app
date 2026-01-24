import MapView, { Marker, PROVIDER_GOOGLE, Region } from '@/components/MapLib';
import { ScreenHeader } from '@/components/ScreenHeader';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/useTranslation';
import { apiService } from '@/services/api';
import { toast } from '@/utils/toast';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

const RELIGION_OPTIONS = [
  { id: 'sunni_nazar_niyaz', label: 'sunni_nazar_niyaz' },
  { id: 'sunni_no_nazar_niyaz', label: 'sunni_no_nazar_niyaz' },
  { id: 'shia', label: 'shia' },
  { id: 'christian', label: 'christian' },
];

const GENDER_OPTIONS = ['male', 'female'];

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, updateUser, uploadProfilePhoto, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const insets = useSafeAreaInsets();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const iconMuted = useThemeColor({}, 'iconMuted');

  // Basic profile fields
  const [name, setName] = useState(
    user?.userType === 'helper'
      ? (user?.profileData as any)?.name || user?.name || ''
      : user?.name || ''
  );

  // Helper/Business profile fields
  // Bio (Helper only now)
  const [bio, setBio] = useState(
    user?.userType === 'helper' ? (user?.profileData as any)?.bio || '' : ''
  );

  const [businessName, setBusinessName] = useState(
    user?.userType === 'business' ? (user?.profileData as any)?.businessName || '' : ''
  );
  const [ownerName, setOwnerName] = useState(
    user?.userType === 'business' ? (user?.profileData as any)?.ownerName || '' : ''
  );

  // New Helper Fields
  const [age, setAge] = useState(
    user?.userType === 'helper' ? (user?.profileData as any)?.age || '' : ''
  );
  const [gender, setGender] = useState(
    user?.userType === 'helper' ? (user?.profileData as any)?.gender || '' : ''
  );
  const [religion, setReligion] = useState(
    user?.userType === 'helper' ? (user?.profileData as any)?.religion || '' : ''
  );
  const [languages, setLanguages] = useState<number[]>(
    user?.userType === 'helper'
      ? Array.isArray((user?.profileData as any)?.languages)
        ? (user?.profileData as any)?.languages.map((l: any) => {
          const id = typeof l === 'string' ? parseInt(l) : l;
          return typeof id === 'number' && !isNaN(id) ? id : null;
        }).filter((l: any) => l !== null)
        : []
      : []
  );

  // City Field (for Regular Users and Business)
  const [cityId, setCityId] = useState<number | null>(
    (user?.userType === 'user' || user?.userType === 'business') ? (user as any)?.city_id || null : null
  );
  const [cities, setCities] = useState<any[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Language fetching/handling
  const [availableLanguages, setAvailableLanguages] = useState<any[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showReligionDropdown, setShowReligionDropdown] = useState(false);

  // Map & Location State
  // Map & Location State
  const [address, setAddress] = useState(
    (user as any)?.profile?.pin_address ||
    (user?.userType === 'helper' ? (user?.profileData as any)?.pin_address : null) ||
    (user as any)?.address ||
    (user?.profileData as any)?.businessAddress ||
    ''
  );
  const [pinLocation, setPinLocation] = useState<{ latitude: number; longitude: number } | null>(
    (user as any)?.latitude && (user as any)?.longitude
      ? { latitude: parseFloat((user as any).latitude), longitude: parseFloat((user as any).longitude) }
      : null
  );
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 24.8607,
    longitude: 67.0011,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Initialize map region if location exists
  React.useEffect(() => {
    if ((user as any)?.latitude && (user as any)?.longitude) {
      setMapRegion({
        latitude: parseFloat((user as any).latitude),
        longitude: parseFloat((user as any).longitude),
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  }, [user]);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
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
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ height: insets.top, backgroundColor: backgroundColor }} />
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
        </View>
      </Modal>
    );
  };

  React.useEffect(() => {
    if (user?.userType === 'helper') {
      fetchLanguages();
    }

    // Fetch cities for regular users and business
    if (user?.userType === 'user' || user?.userType === 'business') {
      fetchCities().then(() => refreshProfile());
    } else {
      refreshProfile();
    }
  }, []);

  // Sync internal state when user object changes (e.g., after refreshProfile)
  React.useEffect(() => {
    if (user) {
      if (user.userType === 'helper') {
        const pd = user.profileData as any;
        setName(pd?.name || user.name || '');
        setBio(pd?.bio || (user as any).bio || '');

        setAge(pd?.age?.toString() || (user as any).age?.toString() || '');

        const rawGender = pd?.gender || (user as any).gender;
        if (rawGender && typeof rawGender === 'object') {
          setGender(rawGender.id || rawGender.value || rawGender.name || '');
        } else {
          setGender(rawGender || '');
        }

        const rawReligion = pd?.religion || (user as any).religion;
        if (rawReligion && typeof rawReligion === 'object') {
          setReligion(rawReligion.id || rawReligion.value || rawReligion.key || '');
        } else {
          setReligion(rawReligion || '');
        }

        const rawLangs = pd?.languages || (user as any).languages;
        if (Array.isArray(rawLangs)) {
          const parsedLangs = rawLangs.map((l: any) => {
            if (l && typeof l === 'object') {
              return l.id || l.value;
            }
            const id = typeof l === 'string' ? parseInt(l) : l;
            return typeof id === 'number' && !isNaN(id) ? id : null;
          }).filter((l: any) => l !== null);
          setLanguages(parsedLangs);
        }
      } else if (user.userType === 'business') {
        setName(user.name || '');
        const cId = (user as any)?.city_id;
        setCityId(cId ? (typeof cId === 'string' ? parseInt(cId, 10) : cId) : null);
        if (cities.length === 0) {
          fetchCities();
        }
      } else {
        setName(user.name || '');
        const cId = (user as any)?.city_id;
        setCityId(cId ? (typeof cId === 'string' ? parseInt(cId, 10) : cId) : null);
        if (cities.length === 0) {
          fetchCities();
        }
      }
    }
  }, [user]);

  const fetchLanguages = async () => {
    try {
      setIsLoadingLanguages(true);
      const response = await apiService.get(API_ENDPOINTS.LANGUAGES.LIST, undefined, undefined, false);

      if (response.success && response.data) {
        let langs: any[] = [];
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

        // Normalize IDs to numbers
        const formattedCities = citiesData.map((c: any) => ({
          ...c,
          id: typeof c.id === 'string' ? parseInt(c.id, 10) : c.id,
        }));

        setCities(formattedCities);
      }
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    } finally {
      setIsLoadingCities(false);
    }
  };

  const toggleLanguage = (languageId: number) => {
    const currentLanguages = languages || [];

    let updatedLanguages: number[];
    if (currentLanguages.includes(languageId)) {
      updatedLanguages = currentLanguages.filter((id) => id !== languageId);
    } else {
      updatedLanguages = [...currentLanguages, languageId];
    }

    setLanguages(updatedLanguages);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSelectedImageUri(uri);

        // Immediate upload
        setIsUploadingPhoto(true);
        try {
          await uploadProfilePhoto(uri);
          toast.success(t('profileEdit.toasts.photoUpdated'));
        } catch (error: any) {
          toast.error(error.message || t('profileEdit.toasts.photoFailed'));
          setSelectedImageUri(null); // Reset preview on failure
        } finally {
          setIsUploadingPhoto(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      toast.error(t('profileEdit.toasts.pickFailed'));
    }
  };

  const handleSave = async () => {
    if (user?.userType === 'helper' && !name.trim()) {
      toast.error(t('profileEdit.helpers.nameRequired'));
      return;
    }

    if ((user?.userType === 'user' || user?.userType === 'business') && !name.trim()) {
      toast.error(t('profileEdit.helpers.nameRequired'));
      return;
    }

    setIsLoading(true);
    try {
      // Sending flat payload as per requirement
      const profileUpdateData: any = {
        name: name.trim(),
      };

      if (user?.userType === 'user' || user?.userType === 'business') {
        profileUpdateData.city_id = cityId;
      }

      if (user?.userType === 'helper') {
        profileUpdateData.bio = bio.trim() || undefined;

        profileUpdateData.age = age.trim() ? parseInt(age) : undefined;
        profileUpdateData.gender = gender ? gender.toLowerCase() : undefined;
        profileUpdateData.religion = religion || undefined;
        profileUpdateData.languages = languages;
      }

      // Add location data for all users
      if (address) profileUpdateData.address = address;
      if (pinLocation) {
        profileUpdateData.latitude = pinLocation.latitude;
        profileUpdateData.longitude = pinLocation.longitude;
      }

      await updateUser(profileUpdateData);
      toast.success(t('profileEdit.toasts.updateSuccess'));
      // router.back(); // Keep user on the same screen as requested
    } catch (error: any) {
      toast.error(error.message || t('profileEdit.toasts.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Decorative Background Elements */}

      {/* Header */}
      <ScreenHeader
        title={t('profileEdit.title')}
        rightElement={
          <TouchableOpacity
            onPress={handleSave}
            style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{t('profileEdit.actions.save')}</Text>
            )}
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.keyboardView, { backgroundColor }]}
      >

        <ScrollView
          style={[styles.scrollView, { backgroundColor }]}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          bounces={false}
          alwaysBounceHorizontal={false}
          alwaysBounceVertical={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 40,
            width: width,
            maxWidth: width,
          }}
        >
          <View style={[styles.topCircle, { backgroundColor: primaryLight }]} />
          <View style={[styles.bottomCircle, { backgroundColor: primaryLight }]} />

          {/* Content Container */}
          <View style={styles.contentContainer}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: cardBg, borderColor: cardBg, shadowColor: primaryColor }]}>
                  {isUploadingPhoto ? (
                    <ActivityIndicator size="large" color={primaryColor} />
                  ) : selectedImageUri || user?.profileImage ? (
                    <ExpoImage
                      source={{ uri: selectedImageUri || user?.profileImage }}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={[styles.avatarText, { color: primaryColor }]}>
                      {(name || user?.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.cameraButton, { backgroundColor: primaryColor, borderColor: cardBg }]}
                  onPress={pickImage}
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <IconSymbol name="camera.fill" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={[styles.changePhotoText, { color: textSecondary }]}>{t('profileEdit.actions.changePhoto')}</Text>

              {/* Account Type Badge */}
              <View style={styles.badgeContainer}>
                <View style={[styles.badge, { backgroundColor: primaryLight }]}>
                  <IconSymbol
                    name={user?.userType === 'business' ? 'building.2.fill' : user?.userType === 'helper' ? 'person.fill' : 'person'}
                    size={14}
                    color={primaryColor}
                  />
                  <Text style={[styles.badgeText, { color: primaryColor }]}>
                    {user?.userType === 'user'
                      ? t('profileEdit.labels.customerProfile')
                      : user?.userType === 'helper'
                        ? t('profileEdit.labels.helperProfile')
                        : t('profileEdit.labels.businessProfile')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>{t('profileEdit.sections.basicInfo')}</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>
                  {user?.userType === 'business' ? t('profileEdit.labels.businessName') : t('profileEdit.labels.fullName')} <Text style={styles.required}>*</Text>
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}>
                  <IconSymbol name="person" size={20} color={iconMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    value={name}
                    onChangeText={setName}
                    placeholder={user?.userType === 'business' ? t('profileEdit.placeholders.enterBusinessName') : t('profileEdit.placeholders.enterName')}
                    placeholderTextColor={textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>{t('profileEdit.labels.phoneNumber')}</Text>
                <View style={[styles.inputWrapper, styles.disabledInputWrapper, { backgroundColor: borderColor, borderColor, shadowColor: textColor }]}>
                  <IconSymbol name="phone" size={20} color={iconMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.disabledInput, { color: textMuted }]}
                    value={user?.phoneNumber || ''}
                    editable={false}
                    placeholderTextColor={textMuted}
                  />
                  <IconSymbol name="lock.fill" size={16} color={iconMuted} style={styles.lockIcon} />
                </View>
                <Text style={[styles.helperText, { color: textMuted }]}>
                  {t('profileEdit.helpers.phoneCannotChange')}
                </Text>
              </View>

              {/* City Selection for Regular Users and Business */}
              {(user?.userType === 'user' || user?.userType === 'business') && (
                <View style={[styles.inputGroup, { zIndex: 100 }]}>
                  <Text style={[styles.label, { color: textColor }]}>{t('profileEdit.labels.city')}</Text>
                  <TouchableOpacity
                    style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}
                    onPress={() => setShowCityDropdown(!showCityDropdown)}
                  >
                    <IconSymbol name="mappin.and.ellipse" size={20} color={iconMuted} style={styles.inputIcon} />
                    <Text style={[styles.input, { color: cityId ? textColor : textMuted, paddingVertical: 16 }]}>
                      {cityId ? cities.find(c => c.id === cityId)?.name : t('profileEdit.actions.selectCity')}
                    </Text>
                    <IconSymbol name="chevron.down" size={20} color={iconMuted} />
                  </TouchableOpacity>

                  {showCityDropdown && (
                    <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor, maxHeight: 200 }]}>
                      <ScrollView nestedScrollEnabled>
                        {isLoadingCities ? (
                          <ActivityIndicator size="small" color={primaryColor} style={{ padding: 20 }} />
                        ) : (
                          cities.map((city: any) => (
                            <TouchableOpacity
                              key={city.id}
                              style={[styles.dropdownItem, { borderBottomColor: borderColor }]}
                              onPress={() => {
                                setCityId(city.id);
                                setShowCityDropdown(false);
                              }}
                            >
                              <Text style={[styles.dropdownText, { color: textColor }]}>{city.name}</Text>
                              {cityId === city.id && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
                            </TouchableOpacity>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* Address with Map Pin */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>{t('profileEdit.labels.address') || 'Address / Location'}</Text>
                <View style={{ gap: 10 }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: cardBg, borderColor, color: textMuted }]}
                    placeholder={t('profileEdit.placeholders.pinLocation') || "Select location on map"}
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
                      {address ? (t('profileEdit.actions.changeLocation') || 'Change Location') : (t('profileEdit.actions.pinLocation') || 'Pin Location on Map')}
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

              {/* Profile Details for Helpers ONLY */}
              {user?.userType === 'helper' && (
                <>
                  <View style={[styles.divider, { backgroundColor: borderColor }]} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t('profileEdit.sections.profileDetails')}</Text>

                  {user?.userType === 'helper' && (
                    <>
                      {/* Age */}
                      <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: textColor }]}>{t('profileEdit.labels.age')}</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}>
                          <IconSymbol name="calendar" size={20} color={iconMuted} style={styles.inputIcon} />
                          <TextInput
                            style={[styles.input, { color: textColor }]}
                            value={age}
                            onChangeText={setAge}
                            placeholder={t('profileEdit.placeholders.enterAge')}
                            placeholderTextColor={textMuted}
                            keyboardType="numeric"
                            maxLength={3}
                          />
                        </View>
                      </View>

                      {/* Gender */}
                      <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: textColor }]}>{t('profileEdit.labels.gender')}</Text>
                        <TouchableOpacity
                          style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}
                          onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                        >
                          <IconSymbol name="person" size={20} color={iconMuted} style={styles.inputIcon} />
                          <Text style={[styles.input, { color: gender ? textColor : textMuted, paddingVertical: 16 }]}>
                            {gender ? t(`profileEdit.options.${gender.toLowerCase()}`) : t('profileEdit.actions.selectGender')}
                          </Text>
                          <IconSymbol name="chevron.down" size={20} color={iconMuted} />
                        </TouchableOpacity>
                        {showGenderDropdown && (
                          <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor }]}>
                            {GENDER_OPTIONS.map((g) => (
                              <TouchableOpacity
                                key={g}
                                style={[styles.dropdownItem, { borderBottomColor: borderColor }]}
                                onPress={() => {
                                  setGender(g);
                                  setShowGenderDropdown(false);
                                }}
                              >
                                <Text style={[styles.dropdownText, { color: textColor }]}>{g}</Text>
                                {gender === g && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Religion */}
                      <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: textColor }]}>{t('profileEdit.labels.religion')}</Text>
                        <TouchableOpacity
                          style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}
                          onPress={() => setShowReligionDropdown(!showReligionDropdown)}
                        >
                          <IconSymbol name="star.fill" size={20} color={iconMuted} style={styles.inputIcon} />
                          <Text style={[styles.input, { color: religion ? textColor : textMuted, paddingVertical: 16 }]}>
                            {religion ? t(`profileEdit.options.${religion}`) : t('profileEdit.actions.selectReligion')}
                          </Text>
                          <IconSymbol name="chevron.down" size={20} color={iconMuted} />
                        </TouchableOpacity>
                        {showReligionDropdown && (
                          <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor }]}>
                            {RELIGION_OPTIONS.map((r) => (
                              <TouchableOpacity
                                key={r.id}
                                style={[styles.dropdownItem, { borderBottomColor: borderColor }]}
                                onPress={() => {
                                  setReligion(r.id);
                                  setShowReligionDropdown(false);
                                }}
                              >
                                <Text style={[styles.dropdownText, { color: textColor }]}>{t(`profileEdit.options.${r.label}`)}</Text>
                                {religion === r.id && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Languages */}
                      <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: textColor }]}>{t('profileEdit.labels.languages')}</Text>

                        {/* Selected Chips */}
                        <View style={styles.chipsContainer}>
                          {languages && languages.length > 0 ? languages.map((langId: number, index: number) => {
                            const langName = availableLanguages.find(l => l.id === langId)?.name || langId.toString();
                            return (
                              <TouchableOpacity
                                key={index}
                                style={[styles.chip, { backgroundColor: primaryColor }]}
                                onPress={() => toggleLanguage(langId)}
                              >
                                <Text style={styles.chipText}>{langName} ✕</Text>
                              </TouchableOpacity>
                            );
                          }) : null}
                        </View>

                        <TouchableOpacity
                          style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}
                          onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
                        >
                          <IconSymbol name="globe" size={20} color={iconMuted} style={styles.inputIcon} />
                          <Text style={[styles.input, { color: textMuted, paddingVertical: 16 }]}>
                            {t('profileEdit.actions.selectLanguages')}
                          </Text>
                          <IconSymbol name="chevron.down" size={20} color={iconMuted} />
                        </TouchableOpacity>

                        {showLanguageDropdown && (
                          <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor, maxHeight: 200 }]}>
                            <ScrollView nestedScrollEnabled>
                              {isLoadingLanguages ? (
                                <ActivityIndicator size="small" color={primaryColor} style={{ padding: 20 }} />
                              ) : (
                                availableLanguages.map((lang: any) => {
                                  const langId = typeof lang.id === 'string' ? parseInt(lang.id) : lang.id;
                                  const isSelected = languages?.includes(langId);
                                  return (
                                    <TouchableOpacity
                                      key={lang.id}
                                      style={[styles.dropdownItem, { borderBottomColor: borderColor }, isSelected && { backgroundColor: primaryLight + '40' }]}
                                      onPress={() => toggleLanguage(langId)}
                                    >
                                      <Text style={[styles.dropdownText, { color: textColor }]}>{lang.name}</Text>
                                      {isSelected && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
                                    </TouchableOpacity>
                                  );
                                })
                              )}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    </>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: textColor }]}>{t('profileEdit.labels.bio')}</Text>
                    <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}>
                      <TextInput
                        style={[styles.input, styles.textArea, { color: textColor }]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder={t('profileEdit.placeholders.bio')}
                        placeholderTextColor={textMuted}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {renderMapModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    maxWidth: width,
  },
  keyboardView: {
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
    opacity: 0.6,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    opacity: 0.6,
  },
  headerBackground: {
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  contentContainer: {
    marginTop: 16,
    width: '100%',
    alignSelf: 'stretch',
  },
  scrollView: {
    flex: 1,
    width: width,
    maxWidth: width,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  changePhotoText: {
    fontSize: 14,
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
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
  helperTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
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
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  formContainer: {
    paddingHorizontal: 24,
    width: width,
    maxWidth: width,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    width: width - 48,
    maxWidth: width - 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  textAreaWrapper: {
    height: 'auto',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  disabledInputWrapper: {
    shadowOpacity: 0,
  },
  disabledInput: {},
  lockIcon: {
    marginLeft: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownText: {
    fontSize: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
