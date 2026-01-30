import MapView, { Marker, PROVIDER_GOOGLE, Region } from '@/components/MapLib';
import { ScreenHeader } from '@/components/ScreenHeader';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { mapDarkStyle } from '@/constants/MapStyle';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/useTranslation';
import { apiService } from '@/services/api';
import { notificationService } from '@/services/notification.service';
import { toast } from '@/utils/toast';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Location {
  id: number | string;
  name: string;
  area?: string;
}

interface FilterState {
  services: string[];
  pinLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;

}

interface JobPost {
  id: string | number;
  userId?: string | number;
  userName?: string;
  serviceName?: string;
  serviceIcon?: string;
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
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { applyToJob, deleteJob, serviceTypes } = useApp();
  const { colorScheme } = useTheme();
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadCount();
      fetchJobPosts();
    }, [user])
  );

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
    }
  };

  // Pin location map state
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 24.8607,
    longitude: 67.0011, // Karachi default
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedCoordinate, setSelectedCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

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
    pinLocation: null,

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

      // Use specific endpoint for users to see their own posts
      const endpoint = user?.userType === 'user'
        ? API_ENDPOINTS.JOB_POSTS.MY_POSTS
        : API_ENDPOINTS.JOB_POSTS.LIST;

      const response = await apiService.get(
        endpoint,
        undefined,
        undefined,
        true // Requires authentication
      );

      if (response.success && response.data) {
        let jobPostsData: any[] = [];

        // Handle different response formats
        if (response.data.job_posts) {
          jobPostsData = Array.isArray(response.data.job_posts.data)
            ? response.data.job_posts.data
            : (Array.isArray(response.data.job_posts) ? response.data.job_posts : []);
        } else if (response.data.bookings) {
          // Some endpoints return 'bookings'
          jobPostsData = Array.isArray(response.data.bookings.data)
            ? response.data.bookings.data
            : (Array.isArray(response.data.bookings) ? response.data.bookings : []);
        } else if (response.data.data) {
          jobPostsData = Array.isArray(response.data.data) ? response.data.data : [];
        } else if (Array.isArray(response.data)) {
          jobPostsData = response.data;
        }

        // Map API response to JobPost format
        const mappedJobs: JobPost[] = jobPostsData.map((post: any) => ({
          id: post.id?.toString() || Date.now().toString(),
          userId: post.user_id?.toString() || post.user?.id?.toString() || post.customer_id?.toString() || '',
          userName: post.user?.name || post.name || 'User',
          serviceName: post.service_type
            ? post.service_type.charAt(0).toUpperCase() + post.service_type.slice(1).replace('_', ' ')
            : post.service_name || 'Service',
          serviceIcon: post.service_type_obj?.icon || post.service?.icon || post.icon,
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
    if (filters.pinLocation) count += 1;

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

    // Apply location filters - if pin location set, this would filter by proximity
    // For now, we just check if pinLocation is set (real implementation would use geo-distance)
    // Note: This is a placeholder - actual implementation would require lat/lng on job posts
    // and a geo-distance calculation



    return requests;
  };

  const clearFilters = () => {
    setFilters({
      services: [],
      pinLocation: null,

    });
  };

  // Map Functions
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), 'Allow location access to pin your location on map');
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
      // Error getting location - use default
    }
  };

  const openMap = () => {
    setIsMapVisible(true);
    if (!filters.pinLocation) {
      getCurrentLocation();
    } else {
      setMapRegion({
        latitude: filters.pinLocation.latitude,
        longitude: filters.pinLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setSelectedCoordinate({
        latitude: filters.pinLocation.latitude,
        longitude: filters.pinLocation.longitude
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
        addressString = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}, ${addr.region || ''}`.replace(/\\s+/g, ' ').trim();
      } else {
        addressString = `${selectedCoordinate.latitude.toFixed(6)}, ${selectedCoordinate.longitude.toFixed(6)}`;
      }

      setFilters({
        ...filters,
        pinLocation: {
          latitude: selectedCoordinate.latitude,
          longitude: selectedCoordinate.longitude,
          address: addressString
        }
      });

      setIsMapVisible(false);
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to get address details');
    } finally {
      setIsGeocoding(false);
    }
  };

  const filteredRequests = getFilteredRequests();

  const handleApply = async (requestId: string) => {
    if (!user?.id) {
      Alert.alert(t('common.error'), t('jobPosts.card.loginToApply'));
      return;
    }

    const request = allRequests.find((r) => r.id === requestId);
    if (request?.applicants?.includes(user.id)) {
      Alert.alert(t('jobPosts.card.applied'), 'You have already applied to this job');
      return;
    }

    try {
      await applyToJob(requestId, user.id);
      Alert.alert(t('common.success'), 'You have successfully applied to this job!');
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to apply. Please try again.');
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

  const handleDelete = (requestId: string) => {
    setJobToDelete(requestId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;

    setIsDeleting(true);
    try {
      await deleteJob(jobToDelete);
      await fetchJobPosts(); // Pull the updated job list
      toast.success('Job deleted successfully');
      setShowDeleteModal(false);
      setJobToDelete(null);
    } catch (error) {
      toast.error('Failed to delete job');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderDeleteConfirmationModal = () => {
    return (
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalContent, { backgroundColor: cardBg }]}>
            <View style={styles.deleteIconContainer}>
              <IconSymbol name="trash.fill" size={32} color="#EF4444" />
            </View>
            <Text style={[styles.deleteModalTitle, { color: textColor }]}>
              {t('common.confirm')}
            </Text>
            <Text style={[styles.deleteModalMessage, { color: textSecondary }]}>
              Are you sure you want to delete this job post? This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelBtn, { borderColor }]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={[styles.deleteModalButtonText, { color: textSecondary }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmBtn, { backgroundColor: '#EF4444' }]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={[styles.deleteModalButtonText, { color: '#FFF' }]}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
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
      if (!dateString) return t('jobPosts.card.dateNotSpecified');
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
      return `${t('jobPosts.card.posted')} ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };

    const formatWorkType = (type?: string) => {
      if (!type) return t('home.jobCard.partTime');
      return type
        .split(/[_\s]/)
        .map(word => {
          const mapped = t(`home.jobCard.${word.toLowerCase()}`);
          return mapped !== `home.jobCard.${word.toLowerCase()}` ? mapped : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
    };





    // ... (intermediate code preserved implicitly, but I need to be careful with range. 
    // Actually, I can do this in two edits for safety or one big one if I capture the context. I'll split it.)

    // ...

    const getServiceIcon = (serviceName: string) => {
      const name = serviceName?.toLowerCase() || '';
      if (name.includes('electr')) return 'bolt.fill';
      if (name.includes('plumb')) return 'drop.fill';
      if (name.includes('mechanic') || name.includes('repair') || name.includes('fix')) return 'gearshape.fill';
      if (name.includes('clean') || name.includes('maid')) return 'sparkles';
      if (name.includes('paint')) return 'paintpalette.fill';
      if (name.includes('move') || name.includes('driver')) return 'car.fill';
      if (name.includes('ac') || name.includes('cool')) return 'snowflake';
      if (name.includes('carpenter') || name.includes('wood')) return 'hammer.fill';
      if (name.includes('chef') || name.includes('cook') || name.includes('kitchen') || name.includes('food')) return 'fork.knife';
      if (name.includes('garden') || name.includes('lawn')) return 'leaf.fill';
      if (name.includes('guard') || name.includes('secur')) return 'shield.fill';
      if (name.includes('salon') || name.includes('beauty') || name.includes('hair') || name.includes('tailor') || name.includes('stitch')) return 'scissors';
      if (name.includes('tutor') || name.includes('teach') || name.includes('educat') || name.includes('school')) return 'book.fill';
      if (name.includes('computer') || name.includes('develop') || name.includes('tech') || name.includes('web')) return 'desktopcomputer';
      return 'briefcase.fill';
    };

    const renderServiceIcon = () => {
      // 1. Check if we have a direct icon from the job post (could be URL or Emoji)
      let icon = request.serviceIcon;

      // 2. If not, try to find it in the global service types cache
      if (!icon && serviceTypes.length > 0) {
        const found = serviceTypes.find((s: any) =>
          s.name?.toLowerCase() === request.serviceName?.toLowerCase() ||
          s.slug === request.serviceName?.toLowerCase()
        );
        if (found?.icon) icon = found.icon;
      }

      // 3. Render
      if (icon) {
        // Check if URL
        if (icon.startsWith('http')) {
          return <Image source={{ uri: icon }} style={{ width: 16, height: 16 }} resizeMode="contain" />;
        }
        // Assume Emoji/Text
        return <Text style={{ fontSize: 14, lineHeight: 18 }}>{icon}</Text>;
      }

      // 4. Fallback to local mapping
      return <IconSymbol name={getServiceIcon(request.serviceName)} size={14} color="#FFFFFF" />;
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
              <View style={[styles.serviceTag, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                {renderServiceIcon()}
                <Text style={styles.serviceTagText}>{request.serviceName?.toUpperCase()}</Text>
              </View>
              <View style={[styles.statusTag, { backgroundColor: 'rgba(0,0,0,0.2)', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <IconSymbol name="mappin.and.ellipse" size={12} color="#FCD34D" />
                <Text style={[styles.statusTagText, { color: '#FCD34D' }]}>
                  {request.city?.toUpperCase() || 'KARACHI'}
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
                <Text style={[styles.userNameText, { color: textColor }]}>{request.userName || 'Unknown User'}</Text>
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




            </View>

            {/* Special Requirements Box */}
            <View style={[styles.requirementsBox, { backgroundColor: cardBg, borderColor: borderColor }]}>
              <Text style={[styles.requirementsTitle, { color: textSecondary }]}>{t('jobPosts.card.specialRequirements')}</Text>
              <Text style={[styles.requirementsText, { color: textMuted }]} numberOfLines={2}>
                "{request.description || t('jobPosts.card.noRequirements')}"
              </Text>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            {/* Footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.applicantsText}>
                {request.applicants?.length || 0} {t('jobPosts.card.applicants')}
              </Text>

              {user?.userType === 'user' && request.userId === user?.id ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleContactApplicants(request)}
                >
                  <Text style={styles.actionButtonText}>{t('jobPosts.card.viewApplicants')}</Text>
                  <IconSymbol name="arrow.right" size={16} color="#818CF8" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => isHelperOrBusiness ? handleCardPress(request.id) : null}
                  disabled={!isHelperOrBusiness && !!user}
                >
                  <Text style={styles.actionButtonText}>
                    {!user ? t('jobPosts.card.loginToApply') : (isHelperOrBusiness ? (hasApplied ? t('jobPosts.card.applied') : t('jobPosts.card.applyNow')) : t('jobPosts.card.helpersOnly'))}
                  </Text>
                  {(!user || isHelperOrBusiness) && <IconSymbol name="arrow.right" size={16} color="#818CF8" />}
                </TouchableOpacity>
              )}
            </View>

            {/* Edit & Delete Button Row (Owner Only) */}
            {user?.userType === 'user' && request.userId === user?.id && (
              <View style={styles.ownerActionRow}>
                <TouchableOpacity
                  style={[styles.ownerActionButton, styles.editButton, { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: '#0EA5E9' }]}
                  onPress={() => router.push(`/job/edit/${request.id}`)}
                >
                  <IconSymbol name="pencil" size={14} color="#38BDF8" />
                  <Text style={[styles.ownerActionButtonText, { color: '#38BDF8' }]}>{t('jobPosts.card.edit')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.ownerActionButton, styles.deleteButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#EF4444' }]}
                  onPress={() => handleDelete(request.id.toString())}
                >
                  <IconSymbol name="trash.fill" size={14} color="#EF4444" />
                  <Text style={[styles.ownerActionButtonText, { color: '#EF4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
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

      {/* Header */}
      <ScreenHeader
        title={user?.userType === 'user' ? t('jobPosts.myJobs') : t('jobPosts.findJobs')}
        showBackButton={false}
        rightElement={
          user?.userType === 'user' ? (
            <TouchableOpacity
              onPress={() => router.push('/job/create')}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            >
              <IconSymbol name="plus.circle.fill" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={{ flex: 1 }}>

        {/* Search Bar - Only for helpers/businesses */}
        {(user?.userType === 'helper' || user?.userType === 'business') && (
          <View style={[styles.searchContainer, { backgroundColor: cardBg, borderColor }]}>
            <IconSymbol name="magnifyingglass" size={20} color={textMuted} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder={t('jobPosts.searchPlaceholder')}
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
        {user?.userType === 'user' && (
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                { backgroundColor: cardBg, borderColor, marginTop: 10 },
                selectedTab === 'my' && { backgroundColor: primaryColor, borderColor: primaryColor }
              ]}
              onPress={() => setSelectedTab('my')}
            >
              <Text style={[
                styles.tabText,
                { color: textSecondary },
                selectedTab === 'my' && { color: '#FFFFFF' }
              ]}>
                {t('jobPosts.tabs.my')} ({myRequests.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
              <Text style={[styles.loadingText, { color: textSecondary }]}>{t('jobPosts.empty.loading')}</Text>
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
                {user?.userType === 'user' ? t('jobPosts.empty.noJobsYet') : t('jobPosts.empty.noJobsFound')}
              </Text>
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                {user?.userType === 'user' ? (
                  t('jobPosts.empty.createStart')
                ) : activeFiltersCount > 0 ? (
                  t('jobPosts.empty.noMatch')
                ) : searchQuery.trim() ? (
                  t('jobPosts.empty.adjustSearch')
                ) : selectedTab === 'applied' ? (
                  t('jobPosts.empty.notApplied')
                ) : (
                  t('jobPosts.empty.noJobsAvailable')
                )}
              </Text>
              {user?.userType === 'user' && (
                <TouchableOpacity
                  style={[styles.createButton, { backgroundColor: primaryColor }]}
                  onPress={() => router.push('/job/create')}
                >
                  <Text style={styles.createButtonText}>{t('jobPosts.createFirstJob')}</Text>
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
                <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>{t('jobPosts.filterModal.title')}</Text>
                  <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                    <IconSymbol name="xmark" size={24} color={textColor} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScrollView}>
                  {/* Services Filter */}
                  <View style={[styles.filterSection, { borderBottomColor: borderColor }]}>
                    <Text style={[styles.filterSectionTitle, { color: textColor }]}>
                      {t('jobPosts.filterModal.serviceTypes')}
                    </Text>
                    <View style={styles.chipContainer}>
                      {availableServices.map((service) => {
                        const isSelected = filters.services.includes(service);
                        return (
                          <TouchableOpacity
                            key={service}
                            style={[
                              styles.chip,
                              { backgroundColor: cardBg, borderColor: borderColor },
                              isSelected && { backgroundColor: primaryLight, borderColor: primaryColor }
                            ]}
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
                            <Text style={[
                              styles.chipText,
                              { color: textSecondary },
                              isSelected && { color: primaryColor, fontWeight: '600' }
                            ]}>
                              {service}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Pin Location Filter */}
                  <View style={[styles.filterSection, { borderBottomColor: borderColor }]}>
                    <Text style={[styles.filterSectionTitle, { color: textColor }]}>
                      {t('jobPosts.filterModal.location')}
                    </Text>
                    <Text style={[styles.filterHelpText, { color: textMuted }]}>
                      {t('jobPosts.filterModal.pinHelp')}
                    </Text>
                    {filters.pinLocation?.address && (
                      <View style={[styles.pinLocationDisplay, { backgroundColor: cardBg, borderColor }]}>
                        <IconSymbol name="location.fill" size={18} color={primaryColor} />
                        <Text style={[styles.pinLocationText, { color: textColor }]} numberOfLines={2}>
                          {filters.pinLocation.address}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setFilters({ ...filters, pinLocation: null })}
                          style={styles.clearPinButton}
                        >
                          <IconSymbol name="xmark.circle.fill" size={20} color={textMuted} />
                        </TouchableOpacity>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[styles.pinButton, { borderColor: primaryColor, backgroundColor: primaryLight }]}
                      onPress={() => {
                        setShowFilterModal(false);
                        requestAnimationFrame(() => {
                          openMap();
                        });
                      }}
                    >
                      <IconSymbol name="location.fill" size={18} color={primaryColor} />
                      <Text style={[styles.pinButtonText, { color: primaryColor }]}>
                        {filters.pinLocation ? t('jobPosts.filterModal.changeLocation') : t('jobPosts.filterModal.pinLocation')}
                      </Text>
                    </TouchableOpacity>
                  </View>


                </ScrollView>

                <View style={[styles.modalFooter, { borderTopColor: borderColor }]}>
                  <TouchableOpacity
                    style={[styles.clearFiltersButton, { backgroundColor: cardBg }]}
                    onPress={clearFilters}
                  >
                    <Text style={[styles.clearFiltersText, { color: textSecondary }]}>{t('jobPosts.filterModal.clearAll')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.applyFiltersButton, { backgroundColor: primaryColor }]}
                    onPress={() => setShowFilterModal(false)}
                  >
                    <Text style={styles.applyFiltersText}>{t('jobPosts.filterModal.apply')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Map Modal */}
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
              customMapStyle={colorScheme === 'dark' ? mapDarkStyle : []}
              onRegionChangeComplete={(region: Region) => {
                setMapRegion(region);
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
                  title="Filter Location"
                  draggable
                  onDragEnd={(e: any) => setSelectedCoordinate(e.nativeEvent.coordinate)}
                />
              )}
            </MapView>

            <View style={[styles.mapOverlay, {
              bottom: Platform.OS === 'ios' ? 40 : 20,
              backgroundColor: cardBg + 'F2', // Semi-opaque card background
            }]}>
              <Text style={[styles.mapInstruction, { color: textColor }]}>{t('jobPosts.map.dragMarker')}</Text>
              <View style={styles.mapButtons}>
                <TouchableOpacity
                  style={[styles.mapButton, styles.cancelButton]}
                  onPress={() => setIsMapVisible(false)}
                >
                  <Text style={styles.mapButtonText}>{t('jobPosts.map.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.mapButton, styles.confirmButton, { backgroundColor: primaryColor }]}
                  onPress={handleMapConfirm}
                  disabled={isGeocoding}
                >
                  {isGeocoding ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={[styles.mapButtonText, { color: '#FFF' }]}>{t('jobPosts.map.confirm')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Centered Crosshair */}
            <View style={styles.crosshair} pointerEvents="none">
              <IconSymbol name="plus" size={24} color={primaryColor} />
            </View>
          </View>
        </Modal>
        {renderDeleteConfirmationModal()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    maxWidth: width,
  },
  // Pin location styles
  filterHelpText: {
    fontSize: 13,
    marginBottom: 12,
  },
  pinLocationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  pinLocationText: {
    flex: 1,
    fontSize: 14,
  },
  clearPinButton: {
    padding: 4,
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  pinButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  // Map modal styles
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
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
  headerBackground: {
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 10,
  },
  screenHeaderContent: {
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

  addButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 5,
    marginHorizontal: 24,
    marginBottom: 10,
    marginTop: 8,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '700',
  },
  postedDateText: {
    color: '#4B5563',
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
    marginBottom: 10,
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
  ownerActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  ownerActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  ownerActionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  editButton: {
    // Styles handled in JSX color props
  },
  deleteButton: {
    // Styles handled in JSX color props
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  notificationButton: {
    padding: 0,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    minWidth: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
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
  // Delete modal styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  deleteIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {
    // Background color handled in props
  },
  deleteModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

