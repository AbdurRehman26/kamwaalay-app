import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import { toast } from '@/utils/toast';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

interface ServiceTypeObject {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}

interface ServiceListing {
  id: string | number;
  service_type?: string;
  service_types?: ServiceTypeObject[];
  service_types_slugs?: string[];
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
  [key: string]: any;
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

  const insets = useSafeAreaInsets();

  // Service listings state
  const [serviceListings, setServiceListings] = useState<ServiceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

        setServiceListings(listings);
      } else {
        setServiceListings([]);
      }
    } catch (error) {
      console.error('❌ Error loading service listings:', error);
      setServiceListings([]);
    } finally {
      setIsLoading(false);
    }
  };


  const openDeleteModal = (serviceId: string) => {
    setDeleteServiceId(serviceId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteServiceId(null);
  };

  const confirmDelete = async () => {
    if (!deleteServiceId) return;

    setIsDeleting(true);
    try {
      const endpoint = API_ENDPOINTS.SERVICE_LISTINGS.DELETE.replace(':id', deleteServiceId);
      const response = await apiService.delete(endpoint, undefined, true);

      if (response.success) {
        toast.success('Service deleted successfully');
        loadServiceListings();
      } else {
        toast.error(response.message || 'Failed to delete service');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete service');
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor }]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        horizontal={false}
        bounces={false}
        alwaysBounceHorizontal={false}
        alwaysBounceVertical={false}
        contentContainerStyle={{ paddingBottom: 100, flexGrow: 1, width: width, maxWidth: width }}
      >
        {/* Decorative Background Elements */}
        <View style={[styles.topCircle, { backgroundColor: primaryLight, opacity: 0.3 }]} />
        <View style={[styles.bottomCircle, { backgroundColor: primaryLight, opacity: 0.2 }]} />

        {/* Header Background */}
        <View style={styles.headerBackground}>
          <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Service Offerings</Text>
            <TouchableOpacity
              style={styles.addHeaderButton}
              onPress={() => router.push('/profile/add-service-offering')}
            >
              <IconSymbol name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.addHeaderButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
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
                // Handle service types - extract name and icon from objects
                // Handle service types - extract name and icon from objects
                const serviceTypeDisplays: { name: string; icon?: string }[] = [];
                if (listing.service_types && Array.isArray(listing.service_types) && listing.service_types.length > 0) {
                  listing.service_types.forEach((st: any) => {
                    if (typeof st === 'object' && st) {
                      serviceTypeDisplays.push({ name: st.name || st.label || st.slug || 'Service', icon: st.icon });
                    } else if (typeof st === 'string') {
                      const formatted = st.charAt(0).toUpperCase() + st.slice(1).replace(/_/g, ' ');
                      serviceTypeDisplays.push({ name: formatted });
                    }
                  });
                } else if (listing.service_type) {
                  const st = listing.service_type;
                  if (typeof st === 'string') {
                    const formatted = st.charAt(0).toUpperCase() + st.slice(1).replace(/_/g, ' ');
                    serviceTypeDisplays.push({ name: formatted });
                  } else if (typeof st === 'object' && st) {
                    serviceTypeDisplays.push({ name: (st as any).name || (st as any).label || (st as any).slug || 'Service', icon: (st as any).icon });
                  }
                }

                // Handle locations - get all locations
                const locations: string[] = [];
                if (listing.location_details && Array.isArray(listing.location_details) && listing.location_details.length > 0) {
                  listing.location_details.forEach((loc: any) => {
                    const locationText = loc.display_text ||
                      (loc.city_name && loc.area ? `${loc.city_name}, ${loc.area}` : null) ||
                      loc.area ||
                      loc.area_name ||
                      loc.city_name ||
                      loc.name;
                    if (locationText && !locations.includes(locationText)) {
                      locations.push(locationText);
                    }
                  });
                } else if (listing.location?.name) {
                  locations.push(listing.location.name);
                } else if (listing.location?.area) {
                  locations.push(listing.location.area);
                } else if (listing.area) {
                  locations.push(listing.area);
                }

                return (
                  <View key={listing.id} style={[styles.serviceCard, { backgroundColor: cardBg, borderColor }]}>
                    <View style={styles.serviceHeader}>
                      <View style={styles.serviceInfo}>
                        <View style={styles.serviceTypesRow}>
                          {serviceTypeDisplays.length > 0 ? (
                            serviceTypeDisplays.map((st, idx) => (
                              <View key={idx} style={[styles.serviceTypeBadge, { backgroundColor: primaryLight }]}>
                                <Text style={[styles.serviceTypeBadgeText, { color: primaryColor }]}>
                                  {st.icon ? `${st.icon} ` : ''}{st.name}
                                </Text>
                              </View>
                            ))
                          ) : (
                            <Text style={[styles.serviceName, { color: textColor }]}>Service</Text>
                          )}
                        </View>
                        {listing.work_type && (
                          <Text style={[styles.serviceCategory, { color: textSecondary }]}>
                            {listing.work_type.replace('_', ' ').charAt(0).toUpperCase() + listing.work_type.replace('_', ' ').slice(1)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.editButton, { backgroundColor: primaryColor }]}
                          onPress={() => router.push(`/profile/add-service-offering?id=${listing.id}`)}
                        >
                          <IconSymbol name="pencil" size={16} color="#FFFFFF" />
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.deleteButton, { backgroundColor: '#EF4444' }]}
                          onPress={() => openDeleteModal(listing.id.toString())}
                        >
                          <IconSymbol name="trash.fill" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {listing.description && (
                      <Text style={[styles.serviceDescription, { color: textSecondary }]} numberOfLines={2}>{listing.description}</Text>
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
                    {locations.length > 0 && (
                      <View style={styles.serviceLocations}>
                        <IconSymbol name="location.fill" size={14} color={textSecondary} style={styles.locationIcon} />
                        <View style={styles.locationsList}>
                          {locations.map((loc, idx) => (
                            <View key={idx} style={[styles.locationTag, { backgroundColor: primaryLight, borderColor: primaryColor }]}>
                              <Text style={[styles.locationTagText, { color: primaryColor }]}>{loc}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
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
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent={true} animationType="fade" onRequestClose={closeDeleteModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModalContent, { backgroundColor: cardBg }]}>
            {/* Modal Header */}
            <View style={[styles.deleteModalIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <IconSymbol name="trash.fill" size={32} color="#EF4444" />
            </View>

            {/* Modal Title */}
            <Text style={[styles.deleteModalTitle, { color: textColor }]}>Delete Service?</Text>

            {/* Modal Description */}
            <Text style={[styles.deleteModalDescription, { color: textSecondary }]}>
              Are you sure you want to delete this service offering? This action cannot be undone.
            </Text>

            {/* Modal Buttons */}
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelModalButton, { backgroundColor: cardBg, borderColor }]}
                onPress={closeDeleteModal}
                disabled={isDeleting}
              >
                <Text style={[styles.cancelModalButtonText, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmDeleteButton]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerBackground: {
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  addHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addHeaderButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  scrollView: {
    flex: 1,
    width: width,
    maxWidth: width,
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
    marginTop: 8,
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
    marginRight: 12,
  },
  serviceTypesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  serviceTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  serviceTypeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
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
    alignItems: 'flex-start',
    marginTop: 8,
    gap: 8,
  },
  locationIcon: {
    marginTop: 2,
  },
  locationsList: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  locationTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  locationTagText: {
    fontSize: 12,
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
  // Delete Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  deleteModalIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalButton: {
    borderWidth: 1,
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    backgroundColor: '#EF4444',
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
