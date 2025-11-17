import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getServiceRequests } = useApp();
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'cancelled'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const serviceRequests = getServiceRequests();

  // For users: show their own bookings (in_progress, completed, cancelled)
  // For helpers/businesses: show bookings they've applied to
  const getBookings = () => {
    if (user?.userType === 'user') {
      return serviceRequests.filter((r) => r.userId === user.id);
    } else {
      // For helpers/businesses: show requests they've applied to
      return serviceRequests.filter(
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
      default:
        bookings = allBookings;
    }

    if (searchQuery.trim()) {
      bookings = bookings.filter(
        (b) =>
          b.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return bookings;
  };

  const filteredBookings = getFilteredBookings();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return '#EEF2FF';
      case 'completed':
        return '#E8F5E9';
      case 'cancelled':
        return '#FFEBEE';
      default:
        return '#F5F5F5';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return '#1976D2';
      case 'completed':
        return '#2E7D32';
      case 'cancelled':
        return '#C62828';
      default:
        return '#666';
    }
  };

  const renderBookingCard = (booking: any) => {
    const isUser = user?.userType === 'user';
    const statusColor = getStatusColor(booking.status);
    const statusTextColor = getStatusTextColor(booking.status);

    return (
      <View key={booking.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              {booking.serviceName}
            </ThemedText>
            {!isUser && (
              <View style={styles.userInfoRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(booking.userName || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <ThemedText style={styles.cardUser}>{booking.userName || 'Unknown'}</ThemedText>
              </View>
            )}
            {isUser && booking.applicants && booking.applicants.length > 0 && (
              <ThemedText style={styles.applicantsInfo}>
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

        <ThemedText style={styles.cardDescription} numberOfLines={2}>
          {booking.description}
        </ThemedText>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <IconSymbol name="location.fill" size={16} color="#6366F1" />
            <ThemedText style={styles.detailText}>{booking.location}</ThemedText>
          </View>
          {booking.budget && (
            <View style={styles.detailRow}>
              <IconSymbol name="dollarsign.circle.fill" size={16} color="#6366F1" />
              <ThemedText style={styles.detailText}>₨{booking.budget}</ThemedText>
            </View>
          )}
          <View style={styles.detailRow}>
            <IconSymbol name="clock.fill" size={16} color="#6366F1" />
            <ThemedText style={styles.detailText}>
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
            style={styles.contactButton}
            onPress={() => router.push(`/chat/${isUser ? booking.applicants?.[0] : booking.userId}`)}
          >
            <IconSymbol name="message.fill" size={18} color="#6366F1" />
            <Text style={styles.contactButtonText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => router.push(`/requests/${booking.id}`)}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#6366F1" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          My Bookings
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search bookings..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconSymbol name="xmark.circle.fill" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
          onPress={() => setSelectedTab('active')}
        >
          <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
            Active ({activeBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'completed' && styles.tabActive]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[styles.tabText, selectedTab === 'completed' && styles.tabTextActive]}>
            Completed ({completedBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'cancelled' && styles.tabActive]}
          onPress={() => setSelectedTab('cancelled')}
        >
          <Text style={[styles.tabText, selectedTab === 'cancelled' && styles.tabTextActive]}>
            Cancelled ({cancelledBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredBookings.length > 0 ? (
          <View style={styles.content}>
            {filteredBookings.map((booking) => renderBookingCard(booking))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="calendar" size={64} color="#CCCCCC" />
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              No Bookings Found
            </ThemedText>
            <ThemedText style={styles.emptyText}>
              {searchQuery.trim()
                ? 'Try adjusting your search'
                : selectedTab === 'active'
                ? 'You have no active bookings'
                : selectedTab === 'completed'
                ? 'You have no completed bookings'
                : 'You have no cancelled bookings'}
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
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
    marginBottom: 20,
    gap: 12,
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
  card: {
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
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  cardUser: {
    fontSize: 13,
    opacity: 0.7,
    color: '#666',
    fontWeight: '500',
  },
  applicantsInfo: {
    fontSize: 13,
    opacity: 0.6,
    color: '#666',
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
    color: '#666',
  },
  cardDetails: {
    gap: 10,
    marginBottom: 16,
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
  viewButton: {
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
    color: '#1A1A1A',
  },
  emptyText: {
    fontSize: 15,
    opacity: 0.6,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
});

