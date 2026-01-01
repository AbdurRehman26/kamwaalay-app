import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getJobs } = useApp();
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'cancelled' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const jobs = getJobs();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const iconMuted = useThemeColor({}, 'iconMuted');

  // For users: show their own bookings (in_progress, completed, cancelled)
  // For helpers/businesses: show bookings they've applied to
  const getBookings = () => {
    if (user?.userType === 'user') {
      return jobs.filter((r) => r.userId === user.id);
    } else {
      // For helpers/businesses: show jobs they've applied to
      return jobs.filter(
        (r) => r.applicants?.includes(user?.id || '') && r.status !== 'open'
      );
    }
  };

  const allBookings = getBookings();
  const activeBookings = allBookings.filter((b) => b.status === 'in_progress');
  const completedBookings = allBookings.filter((b) => b.status === 'completed');
  const cancelledBookings = allBookings.filter((b) => b.status === 'cancelled');

  const getFilteredBookings = () => {
    let bookings = [];
    switch (selectedTab) {
      case 'active':
        bookings = activeBookings;
        break;
      case 'completed':
        bookings = completedBookings;
        break;
      case 'cancelled':
        bookings = cancelledBookings;
        break;
      case 'all':
      default:
        bookings = allBookings;
        break;
    }

    if (searchQuery.trim()) {
      bookings = bookings.filter(
        (b) =>
          b.serviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return bookings;
  };

  const getFilterLabel = () => {
    switch (selectedTab) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'all':
      default:
        return 'All Applications';
    }
  };

  const filteredBookings = getFilteredBookings();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return primaryLight;
      case 'completed':
        return '#E8F5E9';
      case 'cancelled':
        return '#FFEBEE';
      default:
        return borderColor;
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return primaryColor;
      case 'completed':
        return '#2E7D32';
      case 'cancelled':
        return '#C62828';
      default:
        return textSecondary;
    }
  };

  const renderBookingCard = (booking: any) => {
    const isUser = user?.userType === 'user';
    const statusColor = getStatusColor(booking.status);
    const statusTextColor = getStatusTextColor(booking.status);

    return (
      <View key={booking.id} style={[styles.card, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <ThemedText type="subtitle" style={[styles.cardTitle, { color: textColor }]}>
              {booking.serviceName}
            </ThemedText>
            {!isUser && (
              <View style={styles.userInfoRow}>
                <View style={[styles.avatar, { backgroundColor: primaryLight }]}>
                  <Text style={[styles.avatarText, { color: primaryColor }]}>
                    {(booking.userName || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <ThemedText style={[styles.cardUser, { color: textSecondary }]}>{booking.userName || 'Unknown'}</ThemedText>
              </View>
            )}
            {isUser && booking.applicants && booking.applicants.length > 0 && (
              <ThemedText style={[styles.applicantsInfo, { color: textSecondary }]}>
                {booking.applicants.length} applicant{booking.applicants.length > 1 ? 's' : ''}
              </ThemedText>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusTextColor }]}>
              {booking.status === 'in_progress'
                ? 'Active'
                : booking.status === 'completed'
                  ? 'Completed'
                  : 'Cancelled'}
            </Text>
          </View>
        </View>

        <ThemedText style={[styles.cardDescription, { color: textSecondary }]} numberOfLines={2}>
          {booking.description}
        </ThemedText>

        <View style={[styles.cardDetails, { borderTopColor: borderColor }]}>
          <View style={styles.detailRow}>
            <IconSymbol name="location.fill" size={16} color={primaryColor} />
            <ThemedText style={[styles.detailText, { color: textSecondary }]}>{booking.location}</ThemedText>
          </View>
          {booking.budget && (
            <View style={styles.detailRow}>
              <IconSymbol name="dollarsign.circle.fill" size={16} color={primaryColor} />
              <ThemedText style={[styles.detailText, { color: textSecondary }]}>₨{booking.budget}</ThemedText>
            </View>
          )}
          <View style={styles.detailRow}>
            <IconSymbol name="clock.fill" size={16} color={primaryColor} />
            <ThemedText style={[styles.detailText, { color: textSecondary }]}>
              {new Date(booking.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: primaryLight, borderColor: primaryColor }]}
            onPress={() => router.push(`/chat/${isUser ? booking.applicants?.[0] : booking.userId}`)}
          >
            <IconSymbol name="message.fill" size={18} color={primaryColor} />
            <Text style={[styles.contactButtonText, { color: primaryColor }]}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: primaryColor, shadowColor: primaryColor }]}
            onPress={() => router.push(`/job-view/${booking.id}`)}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Decorative Background Elements */}
      <ScrollView
        style={[styles.scrollView, { backgroundColor }]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        horizontal={false}
        bounces={false}
        alwaysBounceHorizontal={false}
        alwaysBounceVertical={false}
      >
        <View style={[styles.topCircle, { backgroundColor: primaryLight, opacity: 0.3 }]} />
        <View style={[styles.bottomCircle, { backgroundColor: primaryLight, opacity: 0.2 }]} />

        {/* Header Background */}
        <View style={styles.headerBackground}>
          <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>My Job Applications</ThemedText>
            <View style={{ width: 40 }} />
          </View>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Search and Filter Bar */}
          <View style={styles.searchFilterContainer}>
            <View style={[styles.searchContainer, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}>
              <IconSymbol name="magnifyingglass" size={20} color={iconMuted} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Search applications..."
                placeholderTextColor={textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <IconSymbol name="xmark.circle.fill" size={20} color={iconMuted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}
              onPress={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <IconSymbol name="slider.horizontal.3" size={18} color={selectedTab !== 'all' ? primaryColor : iconMuted} />
              <Text style={[styles.filterButtonText, { color: selectedTab !== 'all' ? primaryColor : textSecondary }]}>
                {getFilterLabel()}
              </Text>
              <IconSymbol name="chevron.down" size={14} color={iconMuted} />
            </TouchableOpacity>
          </View>

          {/* Filter Dropdown */}
          {showFilterDropdown && (
            <View style={[styles.filterDropdown, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}>
              <TouchableOpacity
                style={[styles.filterOption, selectedTab === 'all' && { backgroundColor: primaryLight }]}
                onPress={() => {
                  setSelectedTab('all');
                  setShowFilterDropdown(false);
                }}
              >
                <Text style={[styles.filterOptionText, { color: selectedTab === 'all' ? primaryColor : textColor }]}>
                  All Applications ({allBookings.length})
                </Text>
                {selectedTab === 'all' && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, selectedTab === 'active' && { backgroundColor: primaryLight }]}
                onPress={() => {
                  setSelectedTab('active');
                  setShowFilterDropdown(false);
                }}
              >
                <Text style={[styles.filterOptionText, { color: selectedTab === 'active' ? primaryColor : textColor }]}>
                  Active ({activeBookings.length})
                </Text>
                {selectedTab === 'active' && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, selectedTab === 'completed' && { backgroundColor: primaryLight }]}
                onPress={() => {
                  setSelectedTab('completed');
                  setShowFilterDropdown(false);
                }}
              >
                <Text style={[styles.filterOptionText, { color: selectedTab === 'completed' ? primaryColor : textColor }]}>
                  Completed ({completedBookings.length})
                </Text>
                {selectedTab === 'completed' && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, selectedTab === 'cancelled' && { backgroundColor: primaryLight }]}
                onPress={() => {
                  setSelectedTab('cancelled');
                  setShowFilterDropdown(false);
                }}
              >
                <Text style={[styles.filterOptionText, { color: selectedTab === 'cancelled' ? primaryColor : textColor }]}>
                  Cancelled ({cancelledBookings.length})
                </Text>
                {selectedTab === 'cancelled' && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
              </TouchableOpacity>
            </View>
          )}

          {/* Content */}
          {filteredBookings.length > 0 ? (
            <View style={styles.content}>
              {filteredBookings.map((booking) => renderBookingCard(booking))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol name="calendar" size={64} color={iconMuted} />
              <ThemedText type="subtitle" style={[styles.emptyTitle, { color: textColor }]}>
                No Applications Found
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                {searchQuery.trim()
                  ? 'Try adjusting your search'
                  : selectedTab === 'active'
                    ? 'You have no active applications'
                    : selectedTab === 'completed'
                      ? 'You have no completed applications'
                      : selectedTab === 'cancelled'
                        ? 'You have no cancelled applications'
                        : 'You have no applications'}
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
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
    alignSelf: 'stretch',
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
    fontSize: 24,
    fontWeight: '700',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  searchFilterContainer: {
    marginTop: 16,
    marginBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 0,
    padding: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    gap: 8,
  },
  filterButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  filterDropdown: {
    marginTop: -8,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterOptionText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
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
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardUser: {
    fontSize: 13,
    opacity: 0.7,
    fontWeight: '500',
  },
  applicantsInfo: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 4,
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
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 14,
    lineHeight: 20,
  },
  cardDetails: {
    gap: 10,
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  viewButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 22,
  },
});

