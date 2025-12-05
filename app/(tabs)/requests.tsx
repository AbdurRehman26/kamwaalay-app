import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const { getJobs, applyToJob } = useApp();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'my' | 'all' | 'open' | 'applied'>(
    user?.userType === 'user' ? 'my' : 'all'
  );
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
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
              <ThemedText type="subtitle" style={styles.cardTitle}>
                {request.serviceName}
              </ThemedText>
              {isHelperOrBusiness && (
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(request.userName || 'U').charAt(0).toUpperCase()}</Text>
                  </View>
                  <ThemedText style={styles.cardUser}>{request.userName || 'Unknown'}</ThemedText>
                </View>
              )}
              {user?.userType === 'user' && (
                <ThemedText style={styles.cardUser}>by {request.userName || 'Unknown'}</ThemedText>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
              <Text style={styles.statusText}>{request.status}</Text>
            </View>
          </View>

          <ThemedText style={styles.cardDescription} numberOfLines={3}>
            {request.description}
          </ThemedText>

          {isHelperOrBusiness && (
            <View style={styles.cardDetails}>
              <View style={styles.detailRow}>
                <IconSymbol name="location.fill" size={16} color="#6366F1" />
                <ThemedText style={styles.detailText}>{request.location}</ThemedText>
              </View>
              {request.budget && (
                <View style={styles.detailRow}>
                  <IconSymbol name="dollarsign.circle.fill" size={16} color="#6366F1" />
                  <ThemedText style={styles.detailText}>₨{request.budget}</ThemedText>
                </View>
              )}
            </View>
          )}

          {!isHelperOrBusiness && (
            <View style={styles.cardFooter}>
              <View style={styles.locationContainer}>
                <IconSymbol name="location.fill" size={14} color="#999" />
                <ThemedText style={styles.location}>{request.location}</ThemedText>
              </View>
              {request.budget && (
                <ThemedText style={styles.budget}>₨{request.budget}</ThemedText>
              )}
            </View>
          )}

          {request.applicants && request.applicants.length > 0 && (
            <ThemedText style={styles.applicants}>
              {request.applicants.length} applicant{request.applicants.length > 1 ? 's' : ''}
            </ThemedText>
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
      case 'open': return '#E8F5E9';
      case 'in_progress': return '#EEF2FF';
      case 'completed': return '#F5F5F5';
      default: return '#FFEBEE';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          {user?.userType === 'user' ? 'My Jobs' : 'Jobs'}
        </ThemedText>
        {user?.userType === 'user' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/requests/create')}
          >
            <IconSymbol name="plus.circle.fill" size={28} color="#6366F1" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar - Only for helpers/businesses */}
      {(user?.userType === 'helper' || user?.userType === 'business') && (
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setShowFilterModal(true)}
          >
            <IconSymbol name="slider.horizontal.3" size={20} color={activeFiltersCount > 0 ? "#6366F1" : "#999"} />
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
      >
        {filteredRequests.length > 0 ? (
          <View style={styles.content}>
            {filteredRequests.map((request) => renderRequestCard(request))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="list.bullet" size={48} color="#CCCCCC" />
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              {user?.userType === 'user' ? 'No Jobs Yet' : 'No Jobs Found'}
            </ThemedText>
            <ThemedText style={styles.emptyText}>
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
            </ThemedText>
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
                <ThemedText type="title" style={styles.modalTitle}>Filters</ThemedText>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <IconSymbol name="xmark" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                {/* Services Filter */}
                <View style={styles.filterSection}>
                  <ThemedText type="subtitle" style={styles.filterSectionTitle}>
                    Service Types
                  </ThemedText>
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
                  <ThemedText type="subtitle" style={styles.filterSectionTitle}>
                    Locations
                  </ThemedText>
                  <TextInput
                    style={styles.locationSearchInput}
                    placeholder="Search locations..."
                    placeholderTextColor="#999"
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
                  <ThemedText type="subtitle" style={styles.filterSectionTitle}>
                    Budget Range
                  </ThemedText>
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
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
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
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
  },
  tabActive: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
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
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    color: '#1A1A1A',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  cardUser: {
    fontSize: 14,
    opacity: 0.7,
    color: '#666',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#1A1A1A',
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 14,
    lineHeight: 20,
    color: '#666',
  },
  cardDetails: {
    gap: 10,
    marginBottom: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  location: {
    fontSize: 13,
    opacity: 0.6,
    color: '#666',
    fontWeight: '500',
  },
  budget: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  applicants: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
    color: '#666',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 0,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  contactButtonText: {
    color: '#1976D2',
    fontSize: 15,
    fontWeight: '700',
  },
  viewDetailsButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  appliedBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  appliedText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '700',
  },
  closedBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 12,
  },
  closedText: {
    color: '#999',
    fontSize: 15,
    fontWeight: '700',
  },
  noApplicantsBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  noApplicantsText: {
    color: '#999',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    color: '#1A1A1A',
  },
  emptyText: {
    fontSize: 15,
    opacity: 0.6,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  filterIconButton: {
    padding: 4,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalScrollView: {
    maxHeight: '70%',
  },
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
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
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  locationSearchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  loadingIndicator: {
    marginVertical: 8,
  },
  budgetContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  budgetInputContainer: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  budgetInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
