import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
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

interface JobPost {
  id: string | number;
  userId?: string | number;
  userName?: string;
  serviceName?: string;
    description?: string;
    location?: string;
    city?: string;
    budget?: number;
  status?: string;
  createdAt?: string;
  applicants?: string[];
  [key: string]: any;
}

export default function JobPostsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { applyToJob } = useApp();
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
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<JobPost[]>([]);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const secondaryLight = useThemeColor({}, 'secondaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');

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

  // Fetch job posts from API
  const fetchJobPosts = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get(
        API_ENDPOINTS.JOB_POSTS.LIST,
        undefined,
        undefined,
        true // Requires authentication
      );

      if (response.success && response.data) {
        let jobPostsData: JobPost[] = [];

        // Handle different response formats
        if (response.data.job_posts) {
          jobPostsData = Array.isArray(response.data.job_posts.data)
            ? response.data.job_posts.data
            : (Array.isArray(response.data.job_posts) ? response.data.job_posts : []);
        } else if (response.data.data) {
          jobPostsData = Array.isArray(response.data.data) ? response.data.data : [];
        } else if (Array.isArray(response.data)) {
          jobPostsData = response.data;
        }

        // Map API response to JobPost format
        const mappedJobs: JobPost[] = jobPostsData.map((post: any) => ({
          id: post.id?.toString() || Date.now().toString(),
          userId: post.user_id?.toString() || post.user?.id?.toString() || '',
          userName: post.user?.name || post.name || 'Unknown',
          serviceName: post.service_type
            ? post.service_type.charAt(0).toUpperCase() + post.service_type.slice(1).replace('_', ' ')
            : post.service_name || 'Service',
            description: post.description || post.special_requirements || '',
            location: post.area || post.location || post.location_name || '',
            city: (typeof post.city === 'string' ? post.city : post.city?.name) || 
                  (typeof post.location_city === 'string' ? post.location_city : post.location_city?.name) || 
                  'Karachi',
            workType: post.work_type,
            budget: post.monthly_rate || post.budget || post.price || 0,
          status: post.status === 'pending' ? 'open' : (post.status || 'open'),
          createdAt: post.created_at || post.createdAt || new Date().toISOString(),
          applicants: post.job_applications?.map((app: any) => app.user_id?.toString() || app.applicant_id?.toString()) ||
            post.applicants ||
            [],
        }));

        setJobs(mappedJobs);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Error fetching job posts:', error);
      setJobs([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load job posts on mount and when user changes
  useEffect(() => {
    fetchJobPosts();
  }, [user]);

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
    router.push(`/job-view/${requestId}`);
  };

  const renderRequestCard = (request: any) => {
    const hasApplied = request.applicants?.includes(user?.id || '');
    const isOpen = request.status === 'open';
    const isHelperOrBusiness = user?.userType === 'helper' || user?.userType === 'business';

    // Format date
    const formatDate = (dateString: string) => {
      if (!dateString) return 'Date not specified';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    // Format posted date
    const formatPostedDate = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `Posted ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };

    const formatWorkType = (type?: string) => {
      if (!type) return 'Part Time';
      return type
        .split(/[_\s]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    return (
      <View key={request.id} style={styles.cardWrapper}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: cardBg, borderColor: borderColor, borderWidth: 1 }]}
          onPress={() => handleCardPress(request.id)}
          activeOpacity={0.9}
        >
          {/* Gradient Header */}
          <LinearGradient
            colors={['#4f46e5', '#9333ea']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardHeaderGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.serviceTag}>
                <Text style={styles.serviceTagText}>{request.serviceName?.toUpperCase()}</Text>
              </View>
              <View style={[styles.statusTag, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                <Text style={[styles.statusTagText, { color: '#FCD34D' }]}>
                  {request.status?.toUpperCase() || 'PENDING'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Card Body */}
          <View style={styles.cardBody}>
            {/* User Info */}
            <View style={styles.userInfoRow}>
              <View style={[styles.avatar, { backgroundColor: primaryLight }]}>
                <Text style={[styles.avatarText, { color: primaryColor }]}>
                  {(request.userName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userMeta}>
                <Text style={styles.userNameText}>{request.userName || 'Unknown User'}</Text>
                <Text style={styles.postedDateText}>{formatPostedDate(request.createdAt)}</Text>
              </View>
            </View>

            {/* Job Details */}
            <View style={styles.detailsContainer}>
              {/* Job Type (Placeholder if not available) */}
              <View style={styles.detailRow}>
                <IconSymbol name="briefcase.fill" size={18} color="#94A3B8" />
                <View style={styles.jobTypeTag}>
                  <Text style={styles.jobTypeText}>{formatWorkType(request.workType)}</Text>
                </View>
              </View>

              {/* Location */}
              <View style={styles.detailRow}>
                  <IconSymbol name="mappin.and.ellipse" size={18} color="#EF4444" />
                    <View>
                      <Text style={[styles.detailMainText, { color: textColor }]}>{request.city || 'Karachi'}</Text>
                      {request.location ? (
                        <Text style={[styles.detailSubText, { color: textMuted }]}>{request.location}</Text>
                      ) : null}
                    </View>
              </View>

              {/* Date */}
              <View style={styles.detailRow}>
                <IconSymbol name="calendar" size={18} color="#F87171" />
                <Text style={[styles.detailMainText, { color: textColor }]}>{formatDate(request.createdAt)}</Text>
              </View>
            </View>

            {/* Special Requirements Box */}
            <View style={[styles.requirementsBox, { backgroundColor: cardBg, borderColor: borderColor }]}>
              <Text style={[styles.requirementsTitle, { color: textSecondary }]}>SPECIAL REQUIREMENTS</Text>
              <Text style={[styles.requirementsText, { color: textMuted }]} numberOfLines={2}>
                "{request.description || 'No special requirements specified'}"
              </Text>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            {/* Footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.applicantsText}>
                {request.applicants?.length || 0} Applicants
              </Text>

              {user?.userType === 'user' && request.userId === user?.id ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: '#0EA5E9' }]}
                    onPress={() => router.push(`/job/edit/${request.id}`)}
                  >
                    <IconSymbol name="pencil" size={14} color="#38BDF8" />
                    <Text style={[styles.actionButtonText, { color: '#38BDF8' }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleContactApplicants(request)}
                  >
                    <Text style={styles.actionButtonText}>Applicants</Text>
                    <IconSymbol name="arrow.right" size={16} color="#818CF8" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => isHelperOrBusiness ? handleCardPress(request.id) : null}
                  disabled={!isHelperOrBusiness && !!user}
                >
                  <Text style={styles.actionButtonText}>
                    {!user ? 'Login to Apply' : (isHelperOrBusiness ? (hasApplied ? 'Applied' : 'Apply Now') : 'Helpers Only')}
                  </Text>
                  {(!user || isHelperOrBusiness) && <IconSymbol name="arrow.right" size={16} color="#818CF8" />}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
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
    <View style={[styles.container, { backgroundColor }]}>
      {/* Decorative Background Elements */}
      <View style={[styles.topCircle, { backgroundColor: primaryLight, opacity: 0.3 }]} />
      <View style={[styles.bottomCircle, { backgroundColor: secondaryLight, opacity: 0.3 }]} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            {user?.userType === 'user' ? 'My Jobs' : 'Find Jobs'}
          </Text>
          {user?.userType === 'user' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/job/create')}
            >
              <IconSymbol name="plus.circle.fill" size={32} color={primaryColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar - Only for helpers/businesses */}
        {(user?.userType === 'helper' || user?.userType === 'business') && (
          <View style={[styles.searchContainer, { backgroundColor: cardBg, borderColor }]}>
            <IconSymbol name="magnifyingglass" size={20} color={textMuted} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search jobs..."
              placeholderTextColor={textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              style={styles.filterIconButton}
              onPress={() => setShowFilterModal(true)}
            >
              <IconSymbol name="slider.horizontal.3" size={20} color={activeFiltersCount > 0 ? primaryColor : textMuted} />
              {activeFiltersCount > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: primaryColor }]}>
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
              style={[
                styles.tab,
                { backgroundColor: cardBg, borderColor },
                selectedTab === 'my' && { backgroundColor: primaryColor, borderColor: primaryColor }
              ]}
              onPress={() => setSelectedTab('my')}
            >
              <Text style={[
                styles.tabText,
                { color: textSecondary },
                selectedTab === 'my' && { color: '#FFFFFF' }
              ]}>
                My Requests ({myRequests.length})
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.tab,
                  { backgroundColor: cardBg, borderColor },
                  selectedTab === 'all' && { backgroundColor: primaryColor, borderColor: primaryColor }
                ]}
                onPress={() => setSelectedTab('all')}
              >
                <Text style={[
                  styles.tabText,
                  { color: textSecondary },
                  selectedTab === 'all' && { color: '#FFFFFF' }
                ]}>
                  All ({allRequests.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  { backgroundColor: cardBg, borderColor },
                  selectedTab === 'open' && { backgroundColor: primaryColor, borderColor: primaryColor }
                ]}
                onPress={() => setSelectedTab('open')}
              >
                <Text style={[
                  styles.tabText,
                  { color: textSecondary },
                  selectedTab === 'open' && { color: '#FFFFFF' }
                ]}>
                  Open ({openRequests.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  { backgroundColor: cardBg, borderColor },
                  selectedTab === 'applied' && { backgroundColor: primaryColor, borderColor: primaryColor }
                ]}
                onPress={() => setSelectedTab('applied')}
              >
                <Text style={[
                  styles.tabText,
                  { color: textSecondary },
                  selectedTab === 'applied' && { color: '#FFFFFF' }
                ]}>
                  Applied ({appliedRequests.length})
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Content */}
        <ScrollView
          style={[styles.scrollView, { backgroundColor }]}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          bounces={false}
          alwaysBounceHorizontal={false}
          alwaysBounceVertical={false}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom, width: width, maxWidth: width }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={async () => {
                setIsRefreshing(true);
                await fetchJobPosts();
              }}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
        >
          {isLoading && jobs.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={primaryColor} />
              <Text style={[styles.loadingText, { color: textSecondary }]}>Loading jobs...</Text>
            </View>
          ) : filteredRequests.length > 0 ? (
            <View style={styles.content}>
              {filteredRequests.map((request) => renderRequestCard(request))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <IconSymbol name="doc.text.fill" size={48} color={textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: textColor }]}>
                {user?.userType === 'user' ? 'No Jobs Yet' : 'No Jobs Found'}
              </Text>
              <Text style={[styles.emptyText, { color: textSecondary }]}>
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
                  style={[styles.createButton, { backgroundColor: primaryColor }]}
                  onPress={() => router.push('/job/create')}
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
              <View style={[styles.modalContent, { backgroundColor }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>Filters</Text>
                  <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                    <IconSymbol name="xmark" size={24} color={textColor} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScrollView}>
                  {/* Services Filter */}
                  <View style={styles.filterSection}>
                    <Text style={[styles.filterSectionTitle, { color: textColor }]}>
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
                    <Text style={[styles.filterSectionTitle, { color: textColor }]}>
                      Locations
                    </Text>
                    <TextInput
                      style={[styles.locationSearchInput, { backgroundColor: cardBg, borderColor, color: textColor }]}
                      placeholder="Search locations..."
                      placeholderTextColor={textMuted}
                      value={locationSearch}
                      onChangeText={setLocationSearch}
                    />
                    {isLoadingLocations && (
                      <ActivityIndicator size="small" color={primaryColor} style={styles.loadingIndicator} />
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
    width: width,
    maxWidth: width,
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
    width: width,
    maxWidth: width,
  },
  content: {
    paddingHorizontal: 24,
  },
  cardWrapper: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 24,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardHeaderGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
  },
  serviceTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 20,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  userMeta: {
    justifyContent: 'center',
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  postedDateText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  detailsContainer: {
    marginBottom: 20,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  jobTypeTag: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  jobTypeText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
  detailMainText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
    flex: 1,
  },
  detailSubText: {
    fontSize: 13,
  },
  requirementsBox: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  requirementsText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  applicantsText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#312E81', // Dark Indigo background for button
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100, // Pill shape
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  actionButtonText: {
    color: '#C7D2FE', // Lighter Indigo text
    fontSize: 13,
    fontWeight: '600',
  },
  viewDetailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  viewDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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

