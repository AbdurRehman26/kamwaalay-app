import MapView, { Marker, PROVIDER_GOOGLE, Region } from '@/components/MapLib';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import * as Location from 'expo-location';

import { API_ENDPOINTS } from '@/constants/api';
import { apiService } from '@/services/api';
import { toast } from '@/utils/toast'; // Added import
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';





const WORK_TYPES = [
  'Full Time',
  'Part Time',
];



export default function CreateRequestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [serviceType, setServiceType] = useState('');
  const [workType, setWorkType] = useState('');
  const [estimatedSalary, setEstimatedSalary] = useState('');
  const [userName, setUserName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');

  useEffect(() => {
    if (user) {
      setUserName(user.name || '');
      setPhone(user.phoneNumber || '');
    }
  }, [user]);

  const [specialRequirements, setSpecialRequirements] = useState('');
  // Map State
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

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const fetchServiceTypes = async () => {
    try {
      setIsLoadingServices(true);
      const response = await apiService.get(API_ENDPOINTS.SERVICE_TYPES.LIST);
      if (response.data) {
        // Handle various response structures
        const data = Array.isArray(response.data) ? response.data : response.data.data;
        if (Array.isArray(data)) {
          const types = data.map((item: any) => {
            if (typeof item === 'string') return item;
            return item.name || item.slug || item.label || '';
          }).filter((t) => t);
          setServiceTypes(types);
        }
      }
    } catch (error) {
      console.log('Error fetching service types:', error);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
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
      Alert.alert('Error', 'Could not get address from location');
    } finally {
      setIsGeocoding(false);
    }
  };



  // Map State


  // Modal State
  const [activeSelection, setActiveSelection] = useState<'service' | 'work' | null>(null);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);


  const handleCreate = async () => {
    setFormError(null);

    let errorMsg = '';
    if (!serviceType) errorMsg = 'Please select a service type';
    else if (!workType) errorMsg = 'Please select a work type';
    else if (!address) errorMsg = 'Please select a location on map';
    else if (!userName.trim()) errorMsg = 'Please enter your name';
    else if (!phone.trim()) errorMsg = 'Please enter your phone number';

    if (errorMsg) {
      setFormError(errorMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      await addJob({
        userId: user?.id || 'guest',
        userName: userName,
        serviceName: serviceType,
        description: specialRequirements,
        location: address,
        latitude: pinLocation?.latitude,
        longitude: pinLocation?.longitude,
        address,

        budget: estimatedSalary ? parseFloat(estimatedSalary) : undefined,
        workType,
        phone,

      });

      toast.success('Job created successfully');
      router.back();
    } catch (error) {
      toast.error('Failed to create job');
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
      options = serviceTypes;
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
                  (activeSelection === 'work' && workType === item)) && (
                    <IconSymbol name="checkmark" size={20} color={primaryColor} />
                  )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
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
        {/* Header */}
        <ScreenHeader title="Post a Job" />



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

          {/* Address with Map Pin */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>ADDRESS *</ThemedText>
            <View style={{ gap: 10 }}>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor: borderColor, color: textMuted, opacity: 0.8 }]}
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

          {formError ? (
            <Text style={{ color: '#FF3B30', marginTop: 10, textAlign: 'center', fontWeight: '500' }}>
              {formError}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {renderSelectionModal()}
      {renderMapModal()}

    </ThemedView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    marginTop: 20,
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
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    // Removed uppercase and letterspacing to match edit profile
  },
  input: {
    borderWidth: 1,
    borderRadius: 16, // Changed from 8 to 16
    padding: 16, // Changed from 12 to 16
    fontSize: 16, // Changed from 14 to 16
    height: 56, // Changed from 48 to 56
  },
  textArea: {
    height: 'auto',
    minHeight: 100, // Increased slightly
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  dropdownButton: {
    borderWidth: 1,
    borderRadius: 16, // Changed from 8 to 16
    padding: 16, // Changed from 12 to 16
    height: 56, // Changed from 48 to 56
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16, // Changed from 14 to 16
  },
  loader: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  helperTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  helperText: {
    fontSize: 12, // Increased from 11
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  submitButton: {
    flex: 1,
    height: 56, // Changed from 48 to 56
    borderRadius: 16, // Changed from 8 to 16
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16, // Changed from 14 to 16
  },
  secondaryButton: {
    flex: 1,
    height: 56, // Changed from 48 to 56
    borderRadius: 16, // Changed from 8 to 16
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 16, // Changed from 14 to 16
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
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
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
