import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

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

interface Location {
  id: number | string;
  name: string;
  area?: string;
}

interface ServiceListing {
  id: string | number;
  service_type?: string;
  service_types?: string[];
  monthly_rate?: number | string;
  description?: string;
  location?: {
    id?: number;
    name?: string;
    area?: string;
  };
  location_id?: number;
  location_details?: Array<{
    id?: number;
    name?: string;
    area?: string;
    city_name?: string;
    display_text?: string;
  }>;
  area?: string;
  work_type?: string;
  [key: string]: any; // Allow additional properties from API
}

export default function ServiceOfferingsScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  // Service listings state
  const [serviceListings, setServiceListings] = useState<ServiceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch service listings from API
  useEffect(() => {
    loadServiceListings();
  }, []);

  // Reload when screen comes into focus (e.g., returning from add screen)
  useFocusEffect(
    useCallback(() => {
      loadServiceListings();
    }, [])
  );

  const loadServiceListings = async () => {
    try {
      setIsLoading(true);
      console.log('📋 Fetching service listings from:', API_ENDPOINTS.SERVICE_LISTINGS.MY_LISTINGS);
      const response = await apiService.get(
        API_ENDPOINTS.SERVICE_LISTINGS.MY_LISTINGS,
        undefined,
        undefined,
        true // Requires authentication
      );

      console.log('📋 Service listings API response:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        let listings: ServiceListing[] = [];

        // Handle different response formats
        if (response.data.service_listings) {
          listings = Array.isArray(response.data.service_listings.data)
            ? response.data.service_listings.data
            : (Array.isArray(response.data.service_listings) ? response.data.service_listings : []);
        } else if (response.data.data) {
          listings = Array.isArray(response.data.data) ? response.data.data : [];
        } else if (Array.isArray(response.data)) {
          listings = response.data;
        } else if (response.data.listings) {
          // Check for listings key
          listings = Array.isArray(response.data.listings.data)
            ? response.data.listings.data
            : (Array.isArray(response.data.listings) ? response.data.listings : []);
        }

        console.log('📋 Parsed service listings:', listings.length, listings);
        setServiceListings(listings);
      } else {
        console.log('❌ No service listings found in response:', response);
        setServiceListings([]);
      }
    } catch (error) {
      console.error('❌ Error loading service listings:', error);
      setServiceListings([]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteService = async (serviceId: string) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service offering?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: Call API to delete service
            loadServiceListings();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Decorative Background Elements */}
      <View style={[styles.topCircle, { backgroundColor: primaryLight, opacity: 0.3 }]} />
      <View style={[styles.bottomCircle, { backgroundColor: primaryLight, opacity: 0.2 }]} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: cardBg, borderColor }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Service Offerings</Text>
          <TouchableOpacity
            style={[styles.addHeaderButton, { backgroundColor: primaryColor }]}
            onPress={() => router.push('/profile/add-service-offering')}
          >
            <IconSymbol name="plus" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          contentContainerStyle={{ paddingBottom: 0, flexGrow: 1, width: '100%' }}
        >
          {/* Existing Services */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={primaryColor} />
              <Text style={[styles.loadingText, { color: textSecondary }]}>Loading service listings...</Text>
            </View>
          ) : serviceListings.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Your Service Listings ({serviceListings.length})
              </Text>
              {serviceListings.map((listing: ServiceListing) => {
                // Handle service type - could be in service_type or service_types array
                let serviceType = listing.service_type || 'Service';
                if (!serviceType && listing.service_types && Array.isArray(listing.service_types) && listing.service_types.length > 0) {
                  serviceType = listing.service_types[0];
                }
                const displayName = serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('_', ' ');
                
                // Handle location - could be in location object, location_details array, or area
                let location = 'Location not specified';
                if (listing.location?.name) {
                  location = listing.location.name;
                } else if (listing.location?.area) {
                  location = listing.location.area;
                } else if (listing.area) {
                  location = listing.area;
                } else if (listing.location_details && Array.isArray(listing.location_details) && listing.location_details.length > 0) {
                  const firstLocation = listing.location_details[0];
                  location = firstLocation.display_text || firstLocation.area || firstLocation.city_name || firstLocation.name || 'Location not specified';
                }

                return (
                  <View key={listing.id} style={[styles.serviceCard, { backgroundColor: cardBg, borderColor }]}>
                    <View style={styles.serviceHeader}>
                      <View style={styles.serviceInfo}>
                        <Text style={[styles.serviceName, { color: textColor }]}>
                          {displayName}
                        </Text>
                        {listing.work_type && (
                          <Text style={[styles.serviceCategory, { color: textSecondary }]}>
                            {listing.work_type.replace('_', ' ')}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[styles.deleteButton, { backgroundColor: cardBg, borderColor: '#EF4444', borderWidth: 1 }]}
                        onPress={() => handleDeleteService(listing.id.toString())}
                      >
                        <IconSymbol name="trash.fill" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    {listing.description && (
                      <Text style={[styles.serviceDescription, { color: textSecondary }]}>{listing.description}</Text>
                    )}
                    {listing.monthly_rate && (
                      <View style={styles.priceContainer}>
                        <IconSymbol name="dollarsign.circle.fill" size={16} color={primaryColor} />
                        <Text style={[styles.servicePrice, { color: primaryColor }]}>
                          ₨{typeof listing.monthly_rate === 'string' 
                            ? parseFloat(listing.monthly_rate).toLocaleString() 
                            : listing.monthly_rate.toLocaleString()}/month
                        </Text>
                      </View>
                    )}
                    <View style={styles.serviceLocations}>
                      <View style={[styles.locationTag, { backgroundColor: primaryLight, borderColor: primaryColor }]}>
                        <IconSymbol name="location.fill" size={12} color={primaryColor} />
                        <Text style={[styles.locationTagText, { color: primaryColor }]}>{location}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: cardBg }]}>
                <IconSymbol name="list.bullet" size={48} color={textMuted} />
              </View>
              <Text style={[styles.emptyText, { color: textColor }]}>No service listings yet</Text>
              <Text style={[styles.emptySubtext, { color: textSecondary }]}>Tap the + button to add your first service</Text>
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
    width: '100%',
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
  addHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  serviceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    width: '100%',
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 12,
  },
  serviceDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  serviceLocations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
  },
  locationTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  form: {
    marginTop: 8,
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
  selectedLocationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectedLocationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  selectedLocationTagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeTagButton: {
    padding: 2,
  },
  locationSearchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  searchIcon: {
    marginRight: 12,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    minHeight: 50,
  },
  loader: {
    marginLeft: 12,
  },
  locationDropdown: {
    maxHeight: 200,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  locationDropdownScroll: {
    maxHeight: 200,
  },
  locationDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  locationDropdownText: {
    fontSize: 16,
    fontWeight: '500',
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
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
});
