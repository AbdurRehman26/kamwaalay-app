import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import { toast } from '@/utils/toast';
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

import { useApp } from '@/contexts/AppContext';

const WORK_TYPES = [
  { id: 'full_time', name: 'Full Time' },
  { id: 'part_time', name: 'Part Time' },
];



interface ServiceType {
  id: string | number;
  slug: string;
  name: string;
  icon?: string;
}

export default function AddServiceOfferingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { serviceTypes } = useApp();
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
  const [workType, setWorkType] = useState('full_time');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load service listing data when editing
  useEffect(() => {
    if (isEditMode && id) {
      loadServiceListing();
    }
  }, [id, isEditMode]);


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

        // Set service types - API returns array of objects with {id, name, slug, icon}
        if (listing.service_types && Array.isArray(listing.service_types) && listing.service_types.length > 0) {
          // Extract IDs from service type objects (API expects IDs, not slugs)
          const ids = listing.service_types.map((st: any) => {
            // Handle both object format and string/number format
            if (typeof st === 'object' && st.id) {
              return st.id.toString();
            }
            // If it's already a number or numeric string, use it directly
            if (typeof st === 'number' || !isNaN(Number(st))) {
              return st.toString();
            }
            // Fallback: if it's a slug, try to find matching ID
            if (typeof st === 'string') {
              const found = serviceTypes.find(t => t.slug === st || t.name === st);
              return found ? found.id.toString() : st;
            }
            return st;
          });
          setSelectedServiceTypes(ids);
        } else if (listing.service_type) {
          // Fallback to single service_type string/slug
          const type = listing.service_type;
          const found = serviceTypes.find(t => t.name === type || t.slug === type);
          const id = found ? found.id.toString() : type;
          setSelectedServiceTypes([id]);
        }



        if (listing.work_type) setWorkType(listing.work_type);
        if (listing.monthly_rate) setMonthlyRate(listing.monthly_rate.toString());
        if (listing.description) setDescription(listing.description);
      }
    } catch (error) {
      console.error('Error loading service listing:', error);
      Alert.alert('Error', 'Failed to load service listing');
    } finally {
      setIsLoading(false);
    }
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


    try {
      setIsSubmitting(true);



      let response;
      if (isEditMode && id) {
        // Update existing service listing
        response = await apiService.put(
          API_ENDPOINTS.SERVICE_LISTINGS.UPDATE,
          {
            service_types: selectedServiceTypes,
            work_type: workType,
            monthly_rate: monthlyRate ? parseFloat(monthlyRate) : null,
            description: description || null,
            status: "active",
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
            work_type: workType,
            monthly_rate: monthlyRate ? parseFloat(monthlyRate) : null,
            description: description || null,
          },
          undefined,
          true
        );
      }

      if (response.success) {
        toast.success(isEditMode ? 'Service offering updated successfully' : 'Service offering added successfully');
        // Redirect to service offerings listing page
        router.replace('/profile/service-offerings');
      } else {
        toast.error(response.message || response.error || (isEditMode ? 'Failed to update service offering' : 'Failed to add service offering'));
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
                  {serviceTypes.map((service: ServiceType) => {
                    // Use ID for selection (API expects IDs)
                    const serviceId = service.id.toString();
                    const isSelected = selectedServiceTypes.includes(serviceId);
                    return (
                      <TouchableOpacity
                        key={serviceId}
                        style={[
                          styles.serviceTypeCard,
                          { backgroundColor: cardBg, borderColor },
                          isSelected && { borderColor: primaryColor, backgroundColor: primaryLight },
                        ]}
                        onPress={() => toggleServiceType(serviceId)}
                      >
                        <Text style={styles.serviceEmoji}>{service.icon || '🔧'}</Text>
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
                  (selectedServiceTypes.length === 0)
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
                disabled={selectedServiceTypes.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={[
                      styles.addButtonText,
                      (selectedServiceTypes.length === 0) && { opacity: 0.7 }
                    ]}>{isEditMode ? 'Update Service' : 'Add Service'}</Text>
                    <IconSymbol
                      name="plus"
                      size={20}
                      color={(selectedServiceTypes.length === 0) ? textMuted : "#FFFFFF"}
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

