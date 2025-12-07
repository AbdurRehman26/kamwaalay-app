import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useApp } from '@/contexts/AppContext';
import { Job, useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { notificationService } from '@/services/notification.service';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SERVICES = [
  { id: '1', name: 'Cleaning', icon: '✨', color: '#EEF2FF', border: '#C7D2FE' },
  { id: '2', name: 'Cooking', icon: '👨‍🍳', color: '#F0FDF4', border: '#BBF7D0' },
  { id: '3', name: 'Babysitting', icon: '👶', color: '#FFF7ED', border: '#FFEDD5' },
  { id: '4', name: 'Elderly Care', icon: '👵', color: '#FAF5FF', border: '#E9D5FF' },
  { id: '5', name: 'All-Rounder', icon: '🛠️', color: '#F8FAFC', border: '#E2E8F0' },
  { id: '6', name: '24/7 Live-in', icon: '🏠', color: '#FFF1F2', border: '#FECDD3' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { getJobs, applyToJob } = useApp();
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const jobs = getJobs();

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
      console.error('Error fetching unread count:', error);
    }
  };

  const loadMyJobs = useCallback(async () => {
    try {
      setIsLoadingRequests(true);
      const response = await apiService.get(
        API_ENDPOINTS.BOOKINGS.LIST,
        undefined,
        undefined,
        true
      );

      if (response.success && response.data) {
        let rawBookings = [];
        if (response.data.bookings) {
          rawBookings = Array.isArray(response.data.bookings.data)
            ? response.data.bookings.data
            : (Array.isArray(response.data.bookings) ? response.data.bookings : []);
        } else if (Array.isArray(response.data)) {
          rawBookings = response.data;
        } else if (response.data.data) {
          rawBookings = Array.isArray(response.data.data) ? response.data.data : [];
        }

        const requests: Job[] = rawBookings.map((booking: any) => ({
          id: booking.id?.toString() || Date.now().toString(),
          userId: booking.user_id?.toString() || booking.user?.id?.toString() || user?.id || '',
          userName: booking.user?.name || booking.name || user?.name || 'Unknown',
          serviceName: booking.service_type
            ? booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1).replace('_', ' ')
            : booking.service_name || 'Service',
          description: booking.special_requirements || booking.description || '',
          location: booking.area || booking.location || '',
          budget: booking.monthly_rate || booking.budget || booking.price,
          status: (booking.status === 'pending' ? 'open' : booking.status) || 'open',
          createdAt: booking.created_at || booking.createdAt || new Date().toISOString(),
          applicants: booking.job_applications?.map((app: any) => app.user_id?.toString() || app.applicant_id?.toString()) ||
            booking.applicants ||
            [],
        }));

        setMyJobs(requests);
      } else {
        const contextRequests = jobs.filter((r) => r.userId === user?.id);
        setMyJobs(contextRequests);
      }
    } catch (error) {
      const contextRequests = jobs.filter((r) => r.userId === user?.id);
      setMyJobs(contextRequests);
    } finally {
      setIsLoadingRequests(false);
    }
  }, [user?.id, jobs]);

  useEffect(() => {
    if (user?.userType === 'user' && user?.id) {
      loadMyJobs();
    }
  }, [user?.id, user?.userType, loadMyJobs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUnreadCount(), loadMyJobs()]);
    setRefreshing(false);
  }, [fetchUnreadCount, loadMyJobs]);

  if (isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderServiceCard = ({ item }: { item: typeof SERVICES[0] }) => (
    <TouchableOpacity
      style={[styles.serviceCard, { backgroundColor: item.color, borderColor: item.border }]}
      onPress={() => {
        router.push({
          pathname: '/(tabs)/explore',
          params: { service: item.name }
        });
      }}
    >
      <View style={styles.serviceIconContainer}>
        <Text style={styles.serviceIcon}>{item.icon}</Text>
      </View>
      <Text style={styles.serviceName}>{item.name}</Text>
    </TouchableOpacity>
  );

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
    router.push(`/chat/${request.userId}`);
  };

  const renderRequestCard = (request: any) => {
    const isHelperOrBusiness = user?.userType === 'helper' || user?.userType === 'business';
    const hasApplied = request.applicants?.includes(user?.id || '');
    const isOpen = request.status === 'open';

    if (isHelperOrBusiness) {
      return (
        <View key={request.id} style={styles.requestCard}>
          <View style={styles.requestHeader}>
            <View style={styles.requestHeaderInfo}>
              <Text style={styles.requestTitle} numberOfLines={1}>
                {request.serviceName}
              </Text>
              <View style={styles.userInfoRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(request.userName || 'U').charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.requestUser}>{request.userName || 'Unknown'}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
              <Text style={styles.statusText}>{request.status}</Text>
            </View>
          </View>

          <Text style={styles.requestDescription} numberOfLines={2}>
            {request.description}
          </Text>

          <View style={styles.requestDetails}>
            <View style={styles.detailRow}>
              <IconSymbol name="location.fill" size={14} color="#6366F1" />
              <Text style={styles.detailText}>{request.location}</Text>
            </View>
            {request.budget && (
              <View style={styles.detailRow}>
                <IconSymbol name="dollarsign.circle.fill" size={14} color="#6366F1" />
                <Text style={styles.detailText}>₨{request.budget}</Text>
              </View>
            )}
          </View>

          {isOpen && !hasApplied && (
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleContact(request)}
              >
                <IconSymbol name="message.fill" size={16} color="#6366F1" />
                <Text style={styles.contactButtonText}>Contact</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => handleApply(request.id)}
              >
                <Text style={styles.applyButtonText}>Apply Now</Text>
              </TouchableOpacity>
            </View>
          )}
          {hasApplied && (
            <View style={styles.appliedBadge}>
              <IconSymbol name="checkmark.circle.fill" size={16} color="#34C759" />
              <Text style={styles.appliedText}>Applied</Text>
            </View>
          )}
        </View>
      );
    }

    // For users - original card
    return (
      <TouchableOpacity
        key={request.id}
        style={styles.requestCard}
        onPress={() => router.push(`/requests/${request.id}`)}
      >
        <View style={styles.requestHeader}>
          <Text style={styles.requestTitle} numberOfLines={1}>
            {request.serviceName}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
            <Text style={styles.statusText}>{request.status}</Text>
          </View>
        </View>
        <Text style={styles.requestDescription} numberOfLines={2}>
          {request.description}
        </Text>
        <View style={styles.requestFooter}>
          <View style={styles.detailRow}>
            <IconSymbol name="mappin.and.ellipse" size={14} color="#6B7280" />
            <Text style={styles.requestLocation}>{request.location}</Text>
          </View>
          {request.budget && (
            <Text style={styles.requestBudget}>₨{request.budget}</Text>
          )}
        </View>
      </TouchableOpacity>
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>
              {user?.name?.split(' ')[0] || 'User'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={styles.notificationButton}
          >
            <View style={styles.notificationIconContainer}>
              <IconSymbol name="bell.fill" size={24} color="#1A1A1A" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* View Helpers Button - Only for users/customers */}
        {(!user || user?.userType === 'user' || user?.userType === undefined) && (
          <TouchableOpacity
            style={styles.viewHelpersButton}
            onPress={() => router.push('/(tabs)/helpers')}
          >
            <View style={styles.viewHelpersContent}>
              <View style={styles.viewHelpersIcon}>
                <IconSymbol name="magnifyingglass" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.viewHelpersTitle}>Find Helpers</Text>
                <Text style={styles.viewHelpersSubtitle}>Browse profiles & reviews</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* For Users/Customers */}
        {(!user || user?.userType === 'user' || user?.userType === undefined) && (
          <>
            {/* Quick Actions */}
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/requests/create')}
            >
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionIcon}>
                  <IconSymbol name="plus" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.quickActionText}>Post a Job</Text>
              </View>
            </TouchableOpacity>

            {/* Services */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/helpers')}>
                  <Text style={styles.seeAll}>View All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={SERVICES}
                renderItem={renderServiceCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.servicesContainer}
              />
            </View>

            {/* My Postings */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Jobs</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/requests')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              {isLoadingRequests ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator size="small" color="#6366F1" />
                </View>
              ) : myJobs.length > 0 ? (
                myJobs.slice(0, 3).map((request) => (
                  <View key={request.id}>{renderRequestCard(request)}</View>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconContainer}>
                    <IconSymbol name="doc.text.fill" size={32} color="#9CA3AF" />
                  </View>
                  <Text style={styles.emptyCardText}>
                    No active jobs found
                  </Text>
                  <TouchableOpacity
                    style={styles.createRequestButton}
                    onPress={() => router.push('/requests/create')}
                  >
                    <Text style={styles.createRequestButtonText}>Create Job</Text>
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
                style={styles.dashboardCard}
                onPress={() => router.push('/business/dashboard')}
              >
                <View style={styles.dashboardCardContent}>
                  <View style={styles.dashboardIconContainer}>
                    <IconSymbol name="chart.bar.fill" size={24} color="#6366F1" />
                  </View>
                  <View style={styles.dashboardCardText}>
                    <Text style={styles.dashboardCardTitle}>Business Dashboard</Text>
                    <Text style={styles.dashboardCardSubtitle}>Manage workers & bookings</Text>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={20} color="#6366F1" />
              </TouchableOpacity>
            )}

            {/* Find Jobs Button */}
            <TouchableOpacity
              style={styles.viewHelpersButton}
              onPress={() => router.push('/(tabs)/requests')}
            >
              <View style={styles.viewHelpersContent}>
                <View style={styles.viewHelpersIcon}>
                  <IconSymbol name="briefcase.fill" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.viewHelpersTitle}>Find Jobs</Text>
                  <Text style={styles.viewHelpersSubtitle}>Browse available opportunities</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>New Opportunities</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/requests')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              {jobs.filter((r) => r.status === 'open').length > 0 ? (
                jobs
                  .filter((r) => r.status === 'open')
                  .slice(0, 3)
                  .map((request) => (
                    <View key={request.id}>{renderRequestCard(request)}</View>
                  ))
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>No new jobs available</Text>
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
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
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  notificationButton: {
    padding: 8,
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
    backgroundColor: '#1A1A1A',
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewHelpersTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  viewHelpersSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  quickActionButton: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
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
    color: '#1A1A1A',
  },
  seeAll: {
    fontSize: 14,
    color: '#6366F1',
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
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
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
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestHeaderInfo: {
    flex: 1,
    marginRight: 12,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  requestUser: {
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
  requestDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  requestDetails: {
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
  requestLocation: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  requestBudget: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
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
  applyButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 12,
    borderRadius: 12,
  },
  applyButtonText: {
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
    marginTop: 12,
  },
  appliedText: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  createRequestButtonText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
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
    padding: 24,
    alignItems: 'center',
  },
});
