import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Location {
  id: number | string;
  name: string;
  area?: string;
}

interface FilterState {
  services: string[];
  locations: string[];
  minBudget: number | null;
  maxBudget: number | null;
}

export default function RequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getJobs, applyToJob, refreshJobs } = useApp();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'my' | 'all' | 'open' | 'applied'>(
    user?.userType === 'user' ? 'my' : 'all'
  );
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const jobs = getJobs();

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    services: [],
    locations: [],
    minBudget: null,
    maxBudget: null,
  });

  // For users: show their own requests
  const myRequests = jobs.filter((r) => r.userId === user?.id);

  // For helpers/businesses: filter requests
  const allRequests = jobs;
  const openRequests = allRequests.filter((r) => r.status === 'open');
  const appliedRequests = allRequests.filter((r) =>
    r.applicants && r.applicants.includes(user?.id || '')
  );

  // Extract unique services from jobs
  const availableServices = useMemo(() => {
    const serviceSet = new Set<string>();
    jobs.forEach((request) => {
      if (request.serviceName) {
        serviceSet.add(request.serviceName);
      }
    });
    return Array.from(serviceSet).sort();
  }, [jobs]);

  // Extract unique locations from jobs
  const availableLocationsFromRequests = useMemo(() => {
    const locationSet = new Set<string>();
    jobs.forEach((request) => {
      if (request.location) {
        locationSet.add(request.location);
      }
    });
    return Array.from(locationSet).sort();
  }, [jobs]);

  // Search locations from API
  const searchLocations = async (query: string) => {
    if (query.trim().length < 2) {
      setLocations([]);
      return;
    }

    try {
      setIsLoadingLocations(true);
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
          id: loc.id || loc.location_id || loc.area || loc.name,
          name: loc.name || loc.location_name || '',
          area: loc.area || loc.area_name || loc.name || '',
        }));

        setLocations(mappedLocations);
      } else {
        setLocations([]);
      }
    } catch (error) {
      setLocations([]);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Debounce location search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationSearch.trim()) {
        searchLocations(locationSearch);
      } else {
        setLocations([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationSearch]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.services.length > 0) count += filters.services.length;
    if (filters.locations.length > 0) count += filters.locations.length;
    if (filters.minBudget !== null) count += 1;
    if (filters.maxBudget !== null) count += 1;
    return count;
  }, [filters]);

  const getFilteredRequests = () => {
    if (user?.userType === 'user') {
      return myRequests;
    }

    let requests = [];
    switch (selectedTab) {
      case 'open':
        requests = openRequests;
        break;
      case 'applied':
        requests = appliedRequests;
        break;
      case 'all':
      default:
        requests = allRequests;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      requests = requests.filter((r) =>
        (r.serviceName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.location || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply service filters
    if (filters.services.length > 0) {
      requests = requests.filter((r) =>
        filters.services.some((service) =>
          (r.serviceName || '').toLowerCase().includes((service || '').toLowerCase())
        )
      );
    }

    // Apply location filters
    if (filters.locations.length > 0) {
      requests = requests.filter((r) => {
        if (!r.location) return false;
        const requestLocation = (r.location || '').toLowerCase().trim();
        return filters.locations.some((location) => {
          const filterLocation = (location || '').toLowerCase().trim();
          // Match if request location contains filter location or vice versa
          return requestLocation.includes(filterLocation) ||
            filterLocation.includes(requestLocation) ||
            requestLocation === filterLocation;
        });
      });
    }

    // Apply budget filters
    if (filters.minBudget !== null) {
      requests = requests.filter((r) => r.budget && r.budget >= filters.minBudget!);
    }
    if (filters.maxBudget !== null) {
      requests = requests.filter((r) => r.budget && r.budget <= filters.maxBudget!);
    }

    return requests;
  };

  const clearFilters = () => {
    setFilters({
      services: [],
      locations: [],
      minBudget: null,
      maxBudget: null,
    });
  };

  const filteredRequests = getFilteredRequests();

  const handleApply = async (requestId: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please login to apply');
      return;
    }

    const request = allRequests.find((r) => r.id === requestId);
    if (request?.applicants?.includes(user.id)) {
      Alert.alert('Already Applied', 'You have already applied to this job');
      return;
    }

    try {
      await applyToJob(requestId, user.id);
      Alert.alert('Success', 'You have successfully applied to this job!');
    } catch (error) {
      Alert.alert('Error', 'Failed to apply. Please try again.');
    }
  };

  const handleContact = (request: any) => {
    const userName = request.userName || 'User';
    router.push(`/chat/${request.userId}?name=${encodeURIComponent(userName)}`);
  };

  const handleContactApplicants = (request: any, event?: any) => {
    if (event) {
      event.stopPropagation?.();
    }
    if (request.applicants && request.applicants.length > 0) {
      // Navigate to chat with the first applicant
      // Name will be looked up in the chat detail screen
      router.push(`/chat/${request.applicants[0]}`);
    } else {
      Alert.alert('No Applicants', 'There are no applicants to contact yet.');
    }
  };

  const handleCardPress = (requestId: string) => {
    router.push(`/requests/${requestId}`);
  };

  const renderRequestCard = (request: any) => {
    const hasApplied = request.applicants?.includes(user?.id || '');
    const isOpen = request.status === 'open';
    const isHelperOrBusiness = user?.userType === 'helper' || user?.userType === 'business';

    return (
      <View key={request.id} style={styles.cardWrapper}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleCardPress(request.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {request.serviceName}
              </Text>
              {isHelperOrBusiness && (
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(request.userName || 'U').charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.cardUser}>{request.userName || 'Unknown'}</Text>
                </View>
              )}
              {user?.userType === 'user' && (
                <Text style={styles.cardUser}>by {request.userName || 'Unknown'}</Text>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
              <Text style={styles.statusText}>{request.status}</Text>
            </View>
          </View>

          <Text style={styles.cardDescription} numberOfLines={3}>
            {request.description}
          </Text>

          {isHelperOrBusiness && (
            <View style={styles.cardDetails}>
              <View style={styles.detailRow}>
                <IconSymbol name="location.fill" size={16} color="#6366F1" />
                <Text style={styles.detailText}>{request.location}</Text>
              </View>
              {request.budget && (
                <View style={styles.detailRow}>
                  <IconSymbol name="dollarsign.circle.fill" size={16} color="#6366F1" />
                  <Text style={styles.detailText}>₨{request.budget}</Text>
                </View>
              )}
            </View>
          )}

          {!isHelperOrBusiness && (
            <View style={styles.cardFooter}>
              <View style={styles.locationContainer}>
                <IconSymbol name="location.fill" size={14} color="#9CA3AF" />
                <Text style={styles.location}>{request.location}</Text>
              </View>
              {request.budget && (
                <Text style={styles.budget}>₨{request.budget}</Text>
              )}
            </View>
          )}

          {request.applicants && request.applicants.length > 0 && (
            <View style={styles.applicantsContainer}>
              <IconSymbol name="person.2.fill" size={14} color="#6366F1" />
              <Text style={styles.applicants}>
                {request.applicants.length} applicant{request.applicants.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Actions for users (who own the request) */}
        {user?.userType === 'user' && request.userId === user?.id && (
          <View style={styles.cardActions}>
            {request.applicants && request.applicants.length > 0 ? (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleContactApplicants(request)}
              >
                <IconSymbol name="message.fill" size={18} color="#6366F1" />
                <Text style={styles.contactButtonText}>
                  Contact Applicant{request.applicants.length > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.noApplicantsBadge}>
                <Text style={styles.noApplicantsText}>No applicants yet</Text>
              </View>
            )}
          </View>
        )}

        {/* Actions for helpers/businesses */}
        {isHelperOrBusiness && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => handleCardPress(request.id)}
            >
              <Text style={styles.viewDetailsButtonText}>View Details</Text>
            </TouchableOpacity>
            {hasApplied && (
              <View style={styles.appliedBadge}>
                <IconSymbol name="checkmark.circle.fill" size={18} color="#34C759" />
                <Text style={styles.appliedText}>Applied</Text>
              </View>
            )}
            {!isOpen && !hasApplied && (
              <View style={styles.closedBadge}>
                <Text style={styles.closedText}>Closed</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#E0F2F1';
      case 'in_progress': return '#EEF2FF';
      case 'completed': return '#F5F5F5';
      default: return '#FFEBEE';
    }
  };

  return (
    <View style={styles.container}>
      {/* Decorative Background Elements */}
      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {user?.userType === 'user' ? 'My Jobs' : 'Find Jobs'}
          </Text>
          {user?.userType === 'user' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/requests/create')}
            >
              <IconSymbol name="plus.circle.fill" size={32} color="#6366F1" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar - Only for helpers/businesses */}
        {(user?.userType === 'helper' || user?.userType === 'business') && (
          <View style={styles.searchContainer}>
            <IconSymbol name="magnifyingglass" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search jobs..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              style={styles.filterIconButton}
              onPress={() => setShowFilterModal(true)}
            >
              <IconSymbol name="slider.horizontal.3" size={20} color={activeFiltersCount > 0 ? "#6366F1" : "#9CA3AF"} />
              {activeFiltersCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          {user?.userType === 'user' ? (
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'my' && styles.tabActive]}
              onPress={() => setSelectedTab('my')}
            >
              <Text style={[styles.tabText, selectedTab === 'my' && styles.tabTextActive]}>
                My Requests ({myRequests.length})
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
                onPress={() => setSelectedTab('all')}
              >
                <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
                  All ({allRequests.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'open' && styles.tabActive]}
                onPress={() => setSelectedTab('open')}
              >
                <Text style={[styles.tabText, selectedTab === 'open' && styles.tabTextActive]}>
                  Open ({openRequests.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'applied' && styles.tabActive]}
                onPress={() => setSelectedTab('applied')}
              >
                <Text style={[styles.tabText, selectedTab === 'applied' && styles.tabTextActive]}>
                  Applied ({appliedRequests.length})
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={async () => {
                setIsRefreshing(true);
                try {
                  await refreshJobs();
                } catch (error) {
                  console.error('Error refreshing jobs:', error);
                } finally {
                  setIsRefreshing(false);
                }
              }}
              tintColor="#6366F1"
              colors={['#6366F1']}
            />
          }
        >
          {isRefreshing && jobs.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>Loading jobs...</Text>
            </View>
          ) : filteredRequests.length > 0 ? (
            <View style={styles.content}>
              {filteredRequests.map((request) => renderRequestCard(request))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <IconSymbol name="doc.text.fill" size={48} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>
                {user?.userType === 'user' ? 'No Jobs Yet' : 'No Jobs Found'}
              </Text>
              <Text style={styles.emptyText}>
                {user?.userType === 'user' ? (
                  'Create your first job to get started'
                ) : activeFiltersCount > 0 ? (
                  'No requests match your filters. Try adjusting your filters.'
                ) : searchQuery.trim() ? (
                  'Try adjusting your search'
                ) : selectedTab === 'applied' ? (
                  "You haven't applied to any requests yet"
                ) : (
                  'No jobs available at the moment'
                )}
              </Text>
              {user?.userType === 'user' && (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => router.push('/requests/create')}
                >
                  <Text style={styles.createButtonText}>Create Your First Job</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        {/* Filter Modal - Only for helpers/businesses */}
        {(user?.userType === 'helper' || user?.userType === 'business') && (
          <Modal
            visible={showFilterModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowFilterModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filters</Text>
                  <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                    <IconSymbol name="xmark" size={24} color="#1A1A1A" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScrollView}>
                  {/* Services Filter */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>
                      Service Types
                    </Text>
                    <View style={styles.chipContainer}>
                      {availableServices.map((service) => {
                        const isSelected = filters.services.includes(service);
                        return (
                          <TouchableOpacity
                            key={service}
                            style={[styles.chip, isSelected && styles.chipActive]}
                            onPress={() => {
                              if (isSelected) {
                                setFilters({
                                  ...filters,
                                  services: filters.services.filter((s) => s !== service),
                                });
                              } else {
                                setFilters({
                                  ...filters,
                                  services: [...filters.services, service],
                                });
                              }
                            }}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                              {service}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Locations Filter */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>
                      Locations
                    </Text>
                    <TextInput
                      style={styles.locationSearchInput}
                      placeholder="Search locations..."
                      placeholderTextColor="#9CA3AF"
                      value={locationSearch}
                      onChangeText={setLocationSearch}
                    />
                    {isLoadingLocations && (
                      <ActivityIndicator size="small" color="#6366F1" style={styles.loadingIndicator} />
                    )}
                    <View style={styles.chipContainer}>
                      {/* Show locations from requests first */}
                      {availableLocationsFromRequests.map((location) => {
                        const isSelected = filters.locations.includes(location);
                        return (
                          <TouchableOpacity
                            key={location}
                            style={[styles.chip, isSelected && styles.chipActive]}
                            onPress={() => {
                              if (isSelected) {
                                setFilters({
                                  ...filters,
                                  locations: filters.locations.filter((l) => l !== location),
                                });
                              } else {
                                setFilters({
                                  ...filters,
                                  locations: [...filters.locations, location],
                                });
                              }
                            }}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                              {location}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      {/* Show API search results */}
                      {locations.map((location) => {
                        const locationName = location.area || location.name;
                        const isSelected = filters.locations.includes(locationName);
                        return (
                          <TouchableOpacity
                            key={location.id}
                            style={[styles.chip, isSelected && styles.chipActive]}
                            onPress={() => {
                              if (isSelected) {
                                setFilters({
                                  ...filters,
                                  locations: filters.locations.filter((l) => l !== locationName),
                                });
                              } else {
                                setFilters({
                                  ...filters,
                                  locations: [...filters.locations, locationName],
                                });
                              }
                            }}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                              {locationName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Budget Filter */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>
                      Budget Range
                    </Text>
                    <View style={styles.budgetContainer}>
                      <View style={styles.budgetInputContainer}>
                        <Text style={styles.budgetLabel}>Min (₨)</Text>
                        <TextInput
                          style={styles.budgetInput}
                          placeholder="0"
                          keyboardType="numeric"
                          value={filters.minBudget !== null ? filters.minBudget.toString() : ''}
                          onChangeText={(text) => {
                            const value = text.trim() === '' ? null : parseInt(text, 10);
                            setFilters({
                              ...filters,
                              minBudget: isNaN(value as number) ? null : value,
                            });
                          }}
                        />
                      </View>
                      <View style={styles.budgetInputContainer}>
                        <Text style={styles.budgetLabel}>Max (₨)</Text>
                        <TextInput
                          style={styles.budgetInput}
                          placeholder="No limit"
                          keyboardType="numeric"
                          value={filters.maxBudget !== null ? filters.maxBudget.toString() : ''}
                          onChangeText={(text) => {
                            const value = text.trim() === '' ? null : parseInt(text, 10);
                            setFilters({
                              ...filters,
                              maxBudget: isNaN(value as number) ? null : value,
                            });
                          }}
                        />
                      </View>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={clearFilters}
                  >
                    <Text style={styles.clearFiltersText}>Clear All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.applyFiltersButton}
                    onPress={() => setShowFilterModal(false)}
                  >
                    <Text style={styles.applyFiltersText}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topCircle: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#EEF2FF',
    opacity: 0.6,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#F5F3FF',
    opacity: 0.6,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  addButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  filterIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F1',
  },
  cardUser: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  location: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  budget: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  applicantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  applicants: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  viewDetailsButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 12,
    borderRadius: 12,
  },
  viewDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    flex: 1,
  },
  appliedText: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '600',
  },
  closedBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
  },
  closedText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  noApplicantsBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
  },
  noApplicantsText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalScrollView: {
    flex: 1,
  },
  filterSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  chipText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  locationSearchInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  loadingIndicator: {
    marginBottom: 12,
  },
  budgetContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  budgetInputContainer: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  budgetInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  clearFiltersText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
  applyFiltersButton: {
    flex: 2,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyFiltersText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
