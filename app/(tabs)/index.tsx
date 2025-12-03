import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useApp } from '@/contexts/AppContext';
import { ServiceRequest, useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { notificationService } from '@/services/notification.service';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SERVICES = [
  { id: '1', name: 'Cleaning', icon: '🧹', color: '#EEF2FF' },
  { id: '2', name: 'Cooking', icon: '👨‍🍳', color: '#E8F5E9' },
  { id: '3', name: 'Babysitting', icon: '👶', color: '#FFF3E0' },
  { id: '4', name: 'Elderly Care', icon: '👴', color: '#F3E5F5' },
  { id: '5', name: 'All-Rounder', icon: '🛠️', color: '#E0F2F1' },
  { id: '6', name: '24/7 Live-in', icon: '🏠', color: '#FCE4EC' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { getServiceRequests, applyToServiceRequest } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [myServiceRequests, setMyServiceRequests] = useState<ServiceRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const serviceRequests = getServiceRequests();

  useFocusEffect(
    useCallback(() => {
      const fetchUnreadCount = async () => {
        try {
          const response = await notificationService.getUnreadCount();
          if (response.success && response.data) {
            setUnreadCount(response.data.count || 0);
          }
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      };

      if (user) {
        fetchUnreadCount();
      }
    }, [user])
  );

  // Define loadMyServiceRequests using useCallback to avoid recreating it on every render
  const loadMyServiceRequests = useCallback(async () => {
    try {
      setIsLoadingRequests(true);
      const response = await apiService.get(
        API_ENDPOINTS.BOOKINGS.LIST,
        undefined,
        undefined,
        true // Requires authentication
      );

      if (response.success && response.data) {
        let rawBookings = [];

        // Handle different response formats
        if (response.data.bookings) {
          rawBookings = Array.isArray(response.data.bookings.data)
            ? response.data.bookings.data
            : (Array.isArray(response.data.bookings) ? response.data.bookings : []);
        } else if (Array.isArray(response.data)) {
          rawBookings = response.data;
        } else if (response.data.data) {
          rawBookings = Array.isArray(response.data.data) ? response.data.data : [];
        }

        // Map API booking format to app ServiceRequest format
        const requests: ServiceRequest[] = rawBookings.map((booking: any) => ({
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

        setMyServiceRequests(requests);
      } else {
        // Fallback to context data
        const contextRequests = serviceRequests.filter((r) => r.userId === user?.id);
        setMyServiceRequests(contextRequests);
      }
    } catch (error) {
      // Error loading my service requests
      // Fallback to context data
      const contextRequests = serviceRequests.filter((r) => r.userId === user?.id);
      setMyServiceRequests(contextRequests);
    } finally {
      setIsLoadingRequests(false);
    }
  }, [user?.id, serviceRequests]);

  // Fetch user's own service requests (bookings) from API
  useEffect(() => {
    if (user?.userType === 'user' && user?.id) {
      loadMyServiceRequests();
    }
  }, [user?.id, user?.userType, loadMyServiceRequests]);

  // Show loading while auth is loading
  if (isAuthLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <ThemedText style={styles.loadingText}>Loading...</ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
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
      style={[styles.serviceCard, { backgroundColor: item.color }]}
      onPress={() => {
        // Navigate to explore screen with service filter, or create request
        router.push({
          pathname: '/(tabs)/explore',
          params: { service: item.name }
        });
      }}
    >
      <Text style={styles.serviceIcon}>{item.icon}</Text>
      <ThemedText style={styles.serviceName}>{item.name}</ThemedText>
    </TouchableOpacity>
  );

  const handleApply = async (requestId: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please login to apply');
      return;
    }

    const request = serviceRequests.find((r) => r.id === requestId);
    if (request?.applicants?.includes(user.id)) {
      Alert.alert('Already Applied', 'You have already applied to this service request');
      return;
    }

    try {
      await applyToServiceRequest(requestId, user.id);
      Alert.alert('Success', 'You have successfully applied to this service request!');
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
              <ThemedText type="subtitle" style={styles.requestTitle}>
                {request.serviceName}
              </ThemedText>
              <View style={styles.userInfoRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(request.userName || 'U').charAt(0).toUpperCase()}</Text>
                </View>
                <ThemedText style={styles.requestUser}>{request.userName || 'Unknown'}</ThemedText>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
              <Text style={styles.statusText}>{request.status}</Text>
            </View>
          </View>
          <ThemedText style={styles.requestDescription} numberOfLines={2}>
            {request.description}
          </ThemedText>
          <View style={styles.requestDetails}>
            <View style={styles.detailRow}>
              <IconSymbol name="location.fill" size={14} color="#6366F1" />
              <ThemedText style={styles.detailText}>{request.location}</ThemedText>
            </View>
            {request.budget && (
              <View style={styles.detailRow}>
                <IconSymbol name="dollarsign.circle.fill" size={14} color="#6366F1" />
                <ThemedText style={styles.detailText}>₨{request.budget}</ThemedText>
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
          <ThemedText type="subtitle" style={styles.requestTitle}>
            {request.serviceName}
          </ThemedText>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
            <Text style={styles.statusText}>{request.status}</Text>
          </View>
        </View>
        <ThemedText style={styles.requestDescription} numberOfLines={2}>
          {request.description}
        </ThemedText>
        <View style={styles.requestFooter}>
          <ThemedText style={styles.requestLocation}>📍 {request.location}</ThemedText>
          {request.budget && (
            <ThemedText style={styles.requestBudget}>₨{request.budget}</ThemedText>
          )}
        </View>
      </TouchableOpacity>
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.greeting}>{getGreeting()},</ThemedText>
              <ThemedText type="title" style={styles.userName}>
                {user?.name || 'User'}
              </ThemedText>
            </View>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.notificationButton}>
              <IconSymbol name="bell.fill" size={24} color="#6366F1" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* View Helpers Button */}
          <TouchableOpacity
            style={styles.viewHelpersButton}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <IconSymbol name="magnifyingglass" size={20} color="#FFFFFF" />
            <Text style={styles.viewHelpersButtonText}>View Helpers</Text>
          </TouchableOpacity>

          {/* For Users/Customers - Show content if user is null or user type is 'user' */}
          {(!user || user?.userType === 'user' || user?.userType === undefined) && (
            <>
              {/* Quick Actions */}
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push('/requests/create')}
              >
                <IconSymbol name="plus.circle.fill" size={24} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Post a Service Request</Text>
              </TouchableOpacity>

              {/* Services - Prominent Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Browse Services
                  </ThemedText>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                    <ThemedText style={styles.seeAll}>View All</ThemedText>
                  </TouchableOpacity>
                </View>
                <ThemedText style={styles.sectionDescription}>
                  Find trusted helpers and businesses for your household needs
                </ThemedText>
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
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    My Postings
                  </ThemedText>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/requests')}>
                    <ThemedText style={styles.seeAll}>See All</ThemedText>
                  </TouchableOpacity>
                </View>
                {isLoadingRequests ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#6366F1" />
                    <ThemedText style={styles.loadingText}>Loading requests...</ThemedText>
                  </View>
                ) : myServiceRequests.length > 0 ? (
                  myServiceRequests.slice(0, 3).map((request) => (
                    <View key={request.id}>{renderRequestCard(request)}</View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <IconSymbol name="list.bullet" size={32} color="#CCCCCC" />
                    <ThemedText style={styles.emptyCardText}>
                      You haven't created any service requests yet
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.createRequestButton}
                      onPress={() => router.push('/requests/create')}
                    >
                      <Text style={styles.createRequestButtonText}>Create Your First Request</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}

          {/* For Helpers/Businesses - Show available service requests */}
          {(user?.userType === 'helper' || user?.userType === 'business') && (
            <>
              {/* Business Dashboard Link - Only for businesses */}
              {user?.userType === 'business' && (
                <TouchableOpacity
                  style={styles.dashboardCard}
                  onPress={() => router.push('/business/dashboard')}
                >
                  <View style={styles.dashboardCardContent}>
                    <IconSymbol name="chart.bar.fill" size={32} color="#6366F1" />
                    <View style={styles.dashboardCardText}>
                      <ThemedText type="subtitle" style={styles.dashboardCardTitle}>
                        Business Dashboard
                      </ThemedText>
                      <ThemedText style={styles.dashboardCardSubtitle}>
                        Manage your agency workers and bookings
                      </ThemedText>
                    </View>
                  </View>
                  <IconSymbol name="chevron.right" size={24} color="#6366F1" />
                </TouchableOpacity>
              )}

              {/* Quick Actions */}
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push('/(tabs)/requests')}
              >
                <IconSymbol name="list.bullet" size={24} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Browse All Requests</Text>
              </TouchableOpacity>

              {/* Available Service Requests */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Available Requests
                  </ThemedText>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/requests')}>
                    <ThemedText style={styles.seeAll}>See All</ThemedText>
                  </TouchableOpacity>
                </View>
                <ThemedText style={styles.sectionDescription}>
                  Find new opportunities to apply for
                </ThemedText>
                {serviceRequests.filter((r) => r.status === 'open').length > 0 ? (
                  serviceRequests
                    .filter((r) => r.status === 'open')
                    .slice(0, 3)
                    .map((request) => (
                      <View key={request.id}>{renderRequestCard(request)}</View>
                    ))
                ) : (
                  <View style={styles.emptyCard}>
                    <IconSymbol name="list.bullet" size={32} color="#CCCCCC" />
                    <ThemedText style={styles.emptyCardText}>
                      No available service requests at the moment
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* My Applications */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    My Applications
                  </ThemedText>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/requests')}>
                    <ThemedText style={styles.seeAll}>See All</ThemedText>
                  </TouchableOpacity>
                </View>
                <ThemedText style={styles.sectionDescription}>
                  Requests you've applied to
                </ThemedText>
                {serviceRequests.filter((r) =>
                  r.applicants && r.applicants.includes(user?.id || '')
                ).length > 0 ? (
                  serviceRequests
                    .filter((r) => r.applicants && r.applicants.includes(user?.id || ''))
                    .slice(0, 3)
                    .map((request) => (
                      <View key={request.id}>{renderRequestCard(request)}</View>
                    ))
                ) : (
                  <View style={styles.emptyCard}>
                    <IconSymbol name="checkmark.circle.fill" size={32} color="#CCCCCC" />
                    <ThemedText style={styles.emptyCardText}>
                      You haven't applied to any requests yet
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.createRequestButton}
                      onPress={() => router.push('/(tabs)/requests')}
                    >
                      <Text style={styles.createRequestButtonText}>Browse Requests</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}

        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  greeting: {
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 4,
    color: '#666',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
    gap: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  seeAll: {
    fontSize: 15,
    color: '#6366F1',
    fontWeight: '700',
  },
  servicesContainer: {
    gap: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  serviceCard: {
    width: 110,
    height: 110,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1A1A1A',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    color: '#1A1A1A',
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
  },
  requestDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 14,
    lineHeight: 20,
    color: '#666',
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestLocation: {
    fontSize: 13,
    opacity: 0.6,
    color: '#666',
    fontWeight: '500',
  },
  requestBudget: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyCardText: {
    fontSize: 14,
    opacity: 0.6,
    color: '#666',
    textAlign: 'center',
  },
  requestHeaderInfo: {
    flex: 1,
    marginRight: 10,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  requestUser: {
    fontSize: 13,
    opacity: 0.7,
    color: '#666',
    fontWeight: '500',
  },
  requestDetails: {
    gap: 8,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  contactButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '700',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 12,
    gap: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  appliedText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.6,
    color: '#666',
  },
  createRequestButton: {
    backgroundColor: '#6366F1',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  createRequestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dashboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dashboardCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  dashboardCardText: {
    flex: 1,
  },
  dashboardCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  dashboardCardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  viewHelpersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    gap: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewHelpersButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
