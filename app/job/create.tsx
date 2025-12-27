import MapView, { Marker, PROVIDER_GOOGLE, Region } from '@/components/MapLib';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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

  // New Location State
  // New Location State
  const [city, setCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [pinLocation, setPinLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setIsLoadingCities(true);
      const response = await apiService.get(API_ENDPOINTS.CITIES.LIST);
      if (response.success && response.data) {
        // Assume API returns array of strings or objects with name
        const cityList = Array.isArray(response.data)
          ? response.data.map((c: any) => typeof c === 'string' ? c : c.name)
          : [];
        setCities(cityList);
      }
    } catch (error) {
      console.log('Error fetching cities:', error);
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Map State
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 24.8607,
    longitude: 67.0011, // Karachi default
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedCoordinate, setSelectedCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Modal State
  const [activeSelection, setActiveSelection] = useState<'service' | 'work' | 'city' | null>(null);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to pin your address on map');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(region);
      setSelectedCoordinate({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    } catch (error) {
      console.log('Error getting location', error);
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
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setSelectedCoordinate({
        latitude: pinLocation.latitude,
        longitude: pinLocation.longitude
      });
    }
  };

  const handleMapConfirm = async () => {
    if (!selectedCoordinate) return;

    setIsGeocoding(true);
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: selectedCoordinate.latitude,
        longitude: selectedCoordinate.longitude
      });

      let addressString = '';
      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        addressString = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}, ${addr.region || ''}, ${addr.postalCode || ''}`.replace(/\s+/g, ' ').trim();
      } else {
        addressString = `${selectedCoordinate.latitude.toFixed(6)}, ${selectedCoordinate.longitude.toFixed(6)}`;
      }

      setPinLocation({
        latitude: selectedCoordinate.latitude,
        longitude: selectedCoordinate.longitude,
        address: addressString
      });

      // Update form address field
      setAddress(addressString);

      // Auto-select city if possible
      if (reverseGeocode[0]?.city && cities.includes(reverseGeocode[0].city)) {
        setCity(reverseGeocode[0].city);
      }

      setIsMapVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to get address details');
    } finally {
      setIsGeocoding(false);
    }
  };



  const handleCreate = async () => {
    if (!serviceType) { Alert.alert('Required', 'Please select a service type'); return; }
    if (!workType) { Alert.alert('Required', 'Please select a work type'); return; }
    if (!city) { Alert.alert('Required', 'Please select a city'); return; }
    if (!userName.trim()) { Alert.alert('Required', 'Please enter your name'); return; }
    if (!phone.trim()) { Alert.alert('Required', 'Please enter your phone number'); return; }

    setIsSubmitting(true);
    try {
      await addJob({
        userId: user?.id || 'guest',
        userName: userName,
        serviceName: serviceType,
        description: specialRequirements,
        location: city, // Use city as location/area
        budget: estimatedSalary ? parseFloat(estimatedSalary) : undefined,
        workType,
        phone,
        address,
        pin_address: pinLocation?.address || address,
        latitude: pinLocation?.latitude,
        longitude: pinLocation?.longitude,
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

  const renderSelectionModal = () => {
    if (!activeSelection) return null;

    let title = '';
    let options: string[] = [];
    let onSelect: (item: any) => void = () => { };

    if (activeSelection === 'service') {
      title = 'Select Service Type';
      options = SERVICE_TYPES;
      onSelect = (item) => {
        setServiceType(item);
        setActiveSelection(null);
      };
    } else if (activeSelection === 'work') {
      title = 'Select Work Type';
      options = WORK_TYPES;
      onSelect = (item) => {
        setWorkType(item);
        setActiveSelection(null);
      };
    } else if (activeSelection === 'city') {
      title = 'Select City';
      options = cities;
      onSelect = (item) => {
        setCity(item);
        setActiveSelection(null);
      };
    }

    return (
      <Modal
        visible={!!activeSelection}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveSelection(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: backgroundColor }}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={() => setActiveSelection(null)} style={styles.closeButton}>
              <IconSymbol name="xmark" size={24} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>{title}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {options.map((item: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={[styles.modalItem, { borderBottomColor: borderColor }]}
                onPress={() => onSelect(item)}
              >
                <Text style={[styles.modalItemText, { color: textColor }]}>
                  {item}
                </Text>
                {((activeSelection === 'service' && serviceType === item) ||
                  (activeSelection === 'work' && workType === item) ||
                  (activeSelection === 'city' && city === item)) && (
                    <IconSymbol name="checkmark" size={20} color={primaryColor} />
                  )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
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
            <View style={styles.col}>
              <ThemedText style={styles.label}>SERVICE TYPE *</ThemedText>
              <TouchableOpacity
                style={[styles.dropdownButton, { backgroundColor: cardBg, borderColor: borderColor }]}
                onPress={() => setActiveSelection('service')}
              >
                <Text style={[styles.dropdownButtonText, { color: serviceType ? textColor : textMuted }]}>
                  {serviceType || 'Select Service'}
                </Text>
                <IconSymbol name="chevron.down" size={16} color={textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.col}>
              <ThemedText style={styles.label}>WORK TYPE *</ThemedText>
              <TouchableOpacity
                style={[styles.dropdownButton, { backgroundColor: cardBg, borderColor: borderColor }]}
                onPress={() => setActiveSelection('work')}
              >
                <Text style={[styles.dropdownButtonText, { color: workType ? textColor : textMuted }]}>
                  {workType || 'Select Type'}
                </Text>
                <IconSymbol name="chevron.down" size={16} color={textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2: Salary & Area */}
          <View style={styles.row}>
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

            <View style={styles.col}>
              <ThemedText style={styles.label}>CITY *</ThemedText>
              <TouchableOpacity
                style={[styles.dropdownButton, { backgroundColor: cardBg, borderColor: borderColor }]}
                onPress={() => setActiveSelection('city')}
              >
                <Text style={[styles.dropdownButtonText, { color: city ? textColor : textMuted }]} numberOfLines={1}>
                  {city || 'Select City'}
                </Text>
                <IconSymbol name="chevron.down" size={16} color={textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 3: Name & Phone */}
          <View style={styles.row}>
            <View style={styles.col}>
              <ThemedText style={styles.label}>YOUR NAME *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor: borderColor, color: textMuted, opacity: 0.8 }]}
                placeholder="Full Name"
                placeholderTextColor={textMuted}
                value={userName}
                editable={false}
              />
            </View>

            <View style={styles.col}>
              <ThemedText style={styles.label}>PHONE *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor: borderColor, color: textMuted, opacity: 0.8 }]}
                placeholder="03001234567"
                placeholderTextColor={textMuted}
                keyboardType="phone-pad"
                value={phone}
                editable={false}
              />
              <View style={styles.helperTextContainer}>
                <IconSymbol name="info.circle" size={12} color={textMuted} />
                <Text style={[styles.helperText, { color: textMuted }]}>
                  Not visible until you accept an application.
                </Text>
              </View>
            </View>
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>ADDRESS</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: cardBg, borderColor: borderColor, color: textColor, opacity: 0.7 }]}
              placeholder="Pin location on map to set address"
              placeholderTextColor={textMuted}
              multiline
              numberOfLines={3}
              value={address}
              editable={false}
            />
            <TouchableOpacity
              style={[styles.pinButton, { borderColor: primaryColor }]}
              onPress={openMap}
            >
              <IconSymbol name="location.fill" size={16} color={primaryColor} />
              <Text style={[styles.pinButtonText, { color: primaryColor }]}>
                {address ? 'Change Location' : 'Pin Location on Map'}
              </Text>
            </TouchableOpacity>
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

      {renderSelectionModal()}

      <Modal
        visible={isMapVisible}
        animationType="slide"
        onRequestClose={() => setIsMapVisible(false)}
      >
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={(region) => {
              setMapRegion(region);
              // Update selected coordinate to center of map when region changes (simulating crosshair selection)
              setSelectedCoordinate({
                latitude: region.latitude,
                longitude: region.longitude
              });
            }}
            showsUserLocation
            showsMyLocationButton
          >
            {selectedCoordinate && (
              <Marker
                coordinate={selectedCoordinate}
                title="Job Location"
                draggable
                onDragEnd={(e) => setSelectedCoordinate(e.nativeEvent.coordinate)}
              />
            )}
          </MapView>

          <View style={[styles.mapOverlay, { bottom: Platform.OS === 'ios' ? 40 : 20 }]}>
            <Text style={styles.mapInstruction}>Drag marker or move map to position</Text>
            <View style={styles.mapButtons}>
              <TouchableOpacity
                style={[styles.mapButton, styles.cancelButton]}
                onPress={() => setIsMapVisible(false)}
              >
                <Text style={styles.mapButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mapButton, styles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={handleMapConfirm}
                disabled={isGeocoding}
              >
                {isGeocoding ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={[styles.mapButtonText, { color: '#FFF' }]}>Confirm Location</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Centered Crosshair for precise selection */}
          <View style={styles.crosshair} pointerEvents="none">
            <IconSymbol name="plus" size={24} color={primaryColor} />
          </View>
        </View>
      </Modal>

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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  pinButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapInstruction: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
    fontWeight: '600',
  },
  mapButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mapButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  confirmButton: {
    // Background color set inline
  },
  mapButtonText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#374151',
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
});
