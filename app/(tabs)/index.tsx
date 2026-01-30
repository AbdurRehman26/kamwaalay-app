import { ScreenHeader } from '@/components/ScreenHeader';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useApp } from '@/contexts/AppContext';
import { Job, useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/useTranslation';
import { apiService } from '@/services/api';
import { notificationService } from '@/services/notification.service';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface ServiceType {
  id: number;
  slug: string;
  name: string;
  icon: string;
  sort_order: number;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { getJobs, applyToJob } = useApp();
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [opportunities, setOpportunities] = useState<Job[]>([]);
  const [featuredHelpers, setFeaturedHelpers] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [isLoadingFeaturedHelpers, setIsLoadingFeaturedHelpers] = useState(false);
  const [isLoadingServiceTypes, setIsLoadingServiceTypes] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const jobs = getJobs();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const secondaryLight = useThemeColor({}, 'secondaryLight');
  const successColor = useThemeColor({}, 'success');

  // Get color scheme for service cards
  const { colorScheme } = useTheme();
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
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

  // Fetch job opportunities for "New Opportunities" section
  const loadOpportunities = useCallback(async () => {
    try {
      setIsLoadingOpportunities(true);
      const response = await apiService.get(
        API_ENDPOINTS.JOB_POSTS.LIST,
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
        } else if (response.data.data) {
          jobPostsData = Array.isArray(response.data.data) ? response.data.data : [];
        } else if (Array.isArray(response.data)) {
          jobPostsData = response.data;
        }

        // Map API response to Job format
        const mappedJobs: Job[] = jobPostsData.map((post: any) => ({
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

        setOpportunities(mappedJobs);
      } else {
        // Fallback to jobs from context
        setOpportunities(jobs.filter((r) => r.status === 'open'));
      }
    } catch (error) {
      // Fallback to jobs from context
      setOpportunities(jobs.filter((r) => r.status === 'open'));
    } finally {
      setIsLoadingOpportunities(false);
    }
  }, [jobs]);

  // Fetch service types
  const loadServiceTypes = useCallback(async () => {
    try {
      setIsLoadingServiceTypes(true);
      const response = await apiService.get(
        API_ENDPOINTS.SERVICE_TYPES.LIST,
        undefined,
        undefined,
        false // Public endpoint
      );

      if (response.success && response.data) {
        const types = Array.isArray(response.data)
          ? response.data
          : (response.data.data || []);
        setServiceTypes(types);
      }
    } catch (error) {
    } finally {
      setIsLoadingServiceTypes(false);
    }
  }, []);

  // Fetch featured helpers for users
  const loadFeaturedHelpers = useCallback(async () => {
    try {
      setIsLoadingFeaturedHelpers(true);
      const response = await apiService.get(
        API_ENDPOINTS.HOME.GET,
        undefined,
        undefined,
        false // Public endpoint
      );

      if (response.success && response.data && response.data.featured_helpers) {
        setFeaturedHelpers(response.data.featured_helpers);
      }
    } catch (error) {
    } finally {
      setIsLoadingFeaturedHelpers(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadOpportunities();
    }
  }, [user?.id, loadOpportunities]);

  useEffect(() => {
    if (!user || user?.userType === 'user' || user?.userType === undefined) {
      loadFeaturedHelpers();
    }
  }, [user?.userType, loadFeaturedHelpers]);

  useEffect(() => {
    loadServiceTypes();
  }, [loadServiceTypes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const promises = [fetchUnreadCount(), loadServiceTypes()];
    if (user?.userType === 'user') {
      promises.push(loadFeaturedHelpers());
    } else if (user?.userType === 'helper' || user?.userType === 'business') {
      promises.push(loadOpportunities());
    }
    await Promise.all(promises);
    setRefreshing(false);
  }, [fetchUnreadCount, loadOpportunities, loadFeaturedHelpers, loadServiceTypes, user?.userType]);

  if (isAuthLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 18) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  const renderServiceCard = ({ item }: { item: ServiceType }) => {
    // Generate colors based on service type ID for consistency
    const colorPalettes = [
      { color: '#EEF2FF', darkColor: '#312E81', border: '#C7D2FE', darkBorder: '#4F46E5' },
      { color: '#F0FDF4', darkColor: '#064E3B', border: '#BBF7D0', darkBorder: '#10B981' },
      { color: '#FFF7ED', darkColor: '#78350F', border: '#FFEDD5', darkBorder: '#F59E0B' },
      { color: '#FAF5FF', darkColor: '#581C87', border: '#E9D5FF', darkBorder: '#A855F7' },
      { color: '#F8FAFC', darkColor: '#334155', border: '#E2E8F0', darkBorder: '#64748B' },
      { color: '#FFF1F2', darkColor: '#7F1D1D', border: '#FECDD3', darkBorder: '#EF4444' },
      { color: '#ECFEFF', darkColor: '#164E63', border: '#A5F3FC', darkBorder: '#06B6D4' },
      { color: '#FEF3C7', darkColor: '#78350F', border: '#FDE68A', darkBorder: '#F59E0B' },
    ];
    const palette = colorPalettes[(item.id - 1) % colorPalettes.length];
    const serviceColor = colorScheme === 'dark' ? palette.darkColor : palette.color;
    const serviceBorder = colorScheme === 'dark' ? palette.darkBorder : palette.border;

    return (
      <TouchableOpacity
        style={[styles.serviceCard, { backgroundColor: serviceColor, borderColor: serviceBorder }]}
        onPress={() => {
          router.push({
            pathname: '/(tabs)/explore',
            params: {
              service: item.slug,
              service_type_id: item.id
            }
          });
        }}
      >
        <View style={[styles.serviceIconContainer, { backgroundColor: cardBg }]}>
          <Text style={styles.serviceIcon}>{item.icon}</Text>
        </View>
        <Text style={[styles.serviceName, { color: textColor }]}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const handleApply = async (requestId: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please login to apply');
      return;
    }

    const request = jobs.find((r) => r.id === requestId);
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
      return `${t('home.posted')} ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };

    const formatWorkType = (type?: string) => {
      if (!type) return t('home.partTime');
      return type
        .split(/[_\s]/)
        .map(word => {
          if (word.toLowerCase() === 'part') return t('home.partTime');
          if (word.toLowerCase() === 'full') return t('home.fullTime');
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join(' ');
    };

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
                <Text style={[styles.postedDateText, { color: textSecondary }]}>{formatPostedDate(request.createdAt)}</Text>
              </View>
            </View>

            {/* Job Details */}
            <View style={styles.detailsContainer}>
              {/* Job Type (Placeholder if not available) */}
              <View style={styles.detailRow}>
                <IconSymbol name="briefcase.fill" size={18} color={textMuted} />
                <View style={[styles.jobTypeTag, { backgroundColor: primaryLight }]}>
                  <Text style={[styles.jobTypeText, { color: textSecondary }]}>{formatWorkType(request.workType)}</Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            {/* Footer */}
            <View style={styles.cardFooter}>
              <Text style={[styles.applicantsText, { color: textMuted }]}>
                {request.applicants?.length || 0} {t('home.applicants')}
              </Text>

              {user?.userType === 'user' && request.userId === user?.id ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: primaryLight, borderColor: primaryColor }]}
                    onPress={() => router.push(`/job/edit/${request.id}` as any)}
                  >
                    <IconSymbol name="pencil" size={14} color={primaryColor} />
                    <Text style={[styles.actionButtonText, { color: primaryColor }]}>{t('home.edit')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: primaryLight, borderColor: primaryColor }]}
                    onPress={() => handleContactApplicants(request)}
                  >
                    <Text style={[styles.actionButtonText, { color: primaryColor }]}>{t('home.applicants')}</Text>
                    <IconSymbol name="arrow.right" size={16} color={primaryColor} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: primaryLight, borderColor: primaryColor }]}
                  onPress={() => isHelperOrBusiness ? handleCardPress(request.id) : null}
                  disabled={!isHelperOrBusiness && !!user}
                >
                  <Text style={[styles.actionButtonText, { color: primaryColor }]}>
                    {!user ? t('home.loginToApply') : (isHelperOrBusiness ? (hasApplied ? t('home.applied') : t('home.applyNow')) : t('home.helpersOnly'))}
                  </Text>
                  {(!user || isHelperOrBusiness) && <IconSymbol name="arrow.right" size={16} color={primaryColor} />}
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

      {/* Header */}
      <ScreenHeader
        title=""
        leftElement={
          <View>
            <Text style={[styles.greeting, { color: '#E0E7FF' }]}>{getGreeting()},</Text>
            <Text style={[styles.userName, { color: '#FFFFFF' }]}>
              {user?.name?.split(' ')[0] || 'User'}
            </Text>
          </View>
        }
        rightElement={
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={styles.notificationButton}
          >
            <View style={[styles.notificationIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'transparent' }]}>
              <IconSymbol name="bell.fill" size={18} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={[styles.scrollView, { backgroundColor }]}
        showsHorizontalScrollIndicator={false}
        horizontal={false}
        bounces={false}
        alwaysBounceHorizontal={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
      >

        {/* View Helpers Button - Only for users/customers */}
        {(!user || user?.userType === 'user' || user?.userType === undefined) && (
          <TouchableOpacity
            style={[styles.viewHelpersButton, { backgroundColor: textColor }]}
            onPress={() => router.push('/(tabs)/helpers')}
          >
            <View style={styles.viewHelpersContent}>
              <View style={styles.viewHelpersIcon}>
                <IconSymbol name="magnifyingglass" size={20} color={backgroundColor} />
              </View>
              <View>
                <Text style={[styles.viewHelpersTitle, { color: backgroundColor }]}>{t('home.findHelpers')}</Text>
                <Text style={[styles.viewHelpersSubtitle, { color: backgroundColor, opacity: 0.7 }]}>{t('home.findHelpersSubtitle')}</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color={backgroundColor} />
          </TouchableOpacity>
        )}

        {/* For Users/Customers */}
        {(!user || user?.userType === 'user' || user?.userType === undefined) && (
          <>
            {/* Quick Actions */}
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/job/create')}
            >
              <LinearGradient
                colors={['#4f46e5', '#9333ea']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.quickActionContent}
              >
                <Text style={styles.quickActionText}>{t('home.postJob')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Services */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>{t('home.categories')}</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/helpers')}>
                  <Text style={[styles.seeAll, { color: primaryColor }]}>{t('home.viewAll')}</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={serviceTypes}
                renderItem={renderServiceCard}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.servicesContainer}
              />
            </View>

            {/* Featured Helpers */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>{t('home.featuredHelpers')}</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/helpers')}>
                  <Text style={[styles.seeAll, { color: primaryColor }]}>{t('home.seeAll')}</Text>
                </TouchableOpacity>
              </View>
              {isLoadingFeaturedHelpers ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator size="small" color={primaryColor} />
                </View>
              ) : featuredHelpers.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 24 }}
                >
                  {featuredHelpers.slice(0, 6).map((helper) => {
                    const primaryListing = helper.service_listings?.[0];
                    const serviceType = primaryListing?.service_type_label || primaryListing?.service_type || 'Helper';
                    const price = primaryListing?.monthly_rate || 0;
                    const location = helper.area || helper.city || 'Karachi';
                    const rating = parseFloat(helper.rating || '0');

                    return (
                      <TouchableOpacity
                        key={helper.id}
                        style={[styles.featuredHelperCard, { backgroundColor: cardBg, borderColor }]}
                        onPress={() => router.push(`/profile/helper/${helper.id}` as any)}
                      >
                        {/* Avatar */}
                        <View style={[styles.featuredHelperAvatar, { backgroundColor: primaryLight }]}>
                          <Text style={[styles.featuredHelperAvatarText, { color: primaryColor }]}>
                            {(helper.name || 'H').charAt(0).toUpperCase()}
                          </Text>
                          {helper.verification_status === 'verified' && (
                            <View style={styles.featuredVerifiedBadge}>
                              <IconSymbol name="checkmark.seal.fill" size={16} color="#10B981" />
                            </View>
                          )}
                        </View>

                        {/* Name */}
                        <Text style={[styles.featuredHelperName, { color: textColor }]} numberOfLines={1}>
                          {helper.name}
                        </Text>

                        {/* Service Type */}
                        <View style={[styles.featuredServiceBadge, { backgroundColor: primaryLight }]}>
                          <Text style={[styles.featuredServiceText, { color: primaryColor }]} numberOfLines={1}>
                            {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
                          </Text>
                        </View>

                        {/* Gender & Age */}
                        {(helper.gender || helper.age) && (
                          <View style={styles.featuredLocationRow}>
                            {helper.gender && (
                              <Text style={[styles.featuredLocationText, { color: textMuted }]}>
                                {helper.gender.charAt(0).toUpperCase() + helper.gender.slice(1)}
                              </Text>
                            )}
                            {helper.gender && helper.age && (
                              <Text style={[styles.featuredLocationText, { color: textMuted }]}> • </Text>
                            )}
                            {helper.age && (
                              <Text style={[styles.featuredLocationText, { color: textMuted }]}>
                                {helper.age} yrs
                              </Text>
                            )}
                          </View>
                        )}

                        {/* Location */}
                        <View style={styles.featuredLocationRow}>
                          <IconSymbol name="mappin.circle.fill" size={12} color={textMuted} />
                          <Text style={[styles.featuredLocationText, { color: textMuted }]} numberOfLines={1}>
                            {location}
                          </Text>
                        </View>

                        {/* Price */}
                        {price > 0 && (
                          <View style={[styles.featuredPriceContainer, { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }]}>
                            <Text style={styles.featuredPriceText}>₨{Math.floor(price).toLocaleString()}/mo</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
                  <Text style={[styles.emptyCardText, { color: textSecondary }]}>{t('home.noFeaturedHelpers')}</Text>
                </View>
              )}
            </View>

            {/* My Postings */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>{t('home.myJobs')}</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/job-posts')}>
                  <Text style={[styles.seeAll, { color: primaryColor }]}>{t('home.seeAll')}</Text>
                </TouchableOpacity>
              </View>
              {isLoadingRequests ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator size="small" color={primaryColor} />
                </View>
              ) : myJobs.length > 0 ? (
                myJobs.slice(0, 3).map((request) => (
                  <View key={request.id}>{renderRequestCard(request)}</View>
                ))
              ) : (
                <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
                  <View style={styles.emptyIconContainer}>
                    <IconSymbol name="doc.text.fill" size={32} color={textSecondary} />
                  </View>
                  <Text style={[styles.emptyCardText, { color: textSecondary }]}>
                    {t('home.noActiveJobs')}
                  </Text>
                  <TouchableOpacity
                    style={styles.createRequestButton}
                    onPress={() => router.push('/job/create')}
                  >
                    <LinearGradient
                      colors={['#4f46e5', '#9333ea']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.createRequestButtonGradient}
                    >
                      <Text style={styles.createRequestButtonText}>{t('home.createJob')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        {/* For Helpers/Businesses */}
        {(user?.userType === 'helper' || user?.userType === 'business') && (
          <>
            {user?.userType === 'business' && (
              <TouchableOpacity
                style={[styles.dashboardCard, { backgroundColor: cardBg, borderColor }]}
                onPress={() => router.push('/business/dashboard')}
              >
                <View style={styles.dashboardCardContent}>
                  <View style={[styles.dashboardIconContainer, { backgroundColor: primaryLight }]}>
                    <IconSymbol name="chart.bar.fill" size={24} color={primaryColor} />
                  </View>
                  <View style={styles.dashboardCardText}>
                    <Text style={[styles.dashboardCardTitle, { color: textColor }]}>{t('home.businessDashboard')}</Text>
                    <Text style={[styles.dashboardCardSubtitle, { color: textSecondary }]}>{t('home.manageWorkersBookings')}</Text>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={20} color={primaryColor} />
              </TouchableOpacity>
            )}

            {/* Find Jobs Button */}
            <TouchableOpacity
              style={[styles.viewHelpersButton, { backgroundColor: textColor }]}
              onPress={() => router.push('/(tabs)/job-posts')}
            >
              <View style={styles.viewHelpersContent}>
                <View style={styles.viewHelpersIcon}>
                  <IconSymbol name="briefcase.fill" size={20} color={backgroundColor} />
                </View>
                <View>
                  <Text style={[styles.viewHelpersTitle, { color: backgroundColor }]}>{t('home.findJobs')}</Text>
                  <Text style={[styles.viewHelpersSubtitle, { color: backgroundColor, opacity: 0.7 }]}>{t('home.findJobsSubtitle')}</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={20} color={backgroundColor} />
            </TouchableOpacity>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>{t('home.newOpportunities')}</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/job-posts')}>
                  <Text style={[styles.seeAll, { color: primaryColor }]}>{t('home.seeAll')}</Text>
                </TouchableOpacity>
              </View>
              {isLoadingOpportunities ? (
                <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
                  <ActivityIndicator size="small" color={primaryColor} />
                  <Text style={[styles.emptyCardText, { color: textSecondary, marginTop: 8 }]}>{t('home.loadingOpportunities')}</Text>
                </View>
              ) : opportunities.filter((r) => r.status === 'open').length > 0 ? (
                opportunities
                  .filter((r) => r.status === 'open')
                  .slice(0, 3)
                  .map((request) => (
                    <View key={request.id}>{renderRequestCard(request)}</View>
                  ))
              ) : (
                <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
                  <Text style={[styles.emptyCardText, { color: textSecondary }]}>No new jobs available</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  notificationButton: {
    padding: 8,
  },
  notificationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  viewHelpersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    padding: 14,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  viewHelpersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  viewHelpersIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewHelpersTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 1,
  },
  viewHelpersSubtitle: {
    fontSize: 12,
  },
  quickActionButton: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  servicesContainer: {
    gap: 12,
    paddingRight: 24,
  },
  serviceCard: {
    width: 100,
    height: 110,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 4,
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
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
    flex: 1,
  },
  detailSubText: {
    color: '#64748B',
    fontSize: 13,
  },
  requirementsBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
    marginTop: 16,
  },
  requirementsTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  requirementsText: {
    color: '#94A3B8',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
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
    backgroundColor: '#312E81',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  actionButtonText: {
    color: '#C7D2FE',
    fontSize: 13,
    fontWeight: '600',
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceIcon: {
    fontSize: 24,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },

  emptyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyCardText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  createRequestButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  createRequestButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createRequestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  dashboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  dashboardCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dashboardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardCardText: {
    gap: 4,
  },
  dashboardCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  dashboardCardSubtitle: {
    fontSize: 13,
    color: '#6366F1',
  },
  loadingState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  featuredHelperCard: {
    width: 160,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featuredHelperAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  featuredHelperAvatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  featuredVerifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
  },
  featuredHelperName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  featuredServiceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  featuredServiceText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuredRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 6,
  },
  featuredRatingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  featuredReviewsText: {
    fontSize: 11,
  },
  featuredLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 8,
  },
  featuredLocationText: {
    fontSize: 11,
  },
  featuredPriceContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  featuredPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
  },
  headerBackground: {
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  screenHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
});
