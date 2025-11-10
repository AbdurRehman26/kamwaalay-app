import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getServiceRequests, applyToServiceRequest } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'my' | 'all' | 'open' | 'applied'>(
    user?.userType === 'user' ? 'my' : 'all'
  );
  const serviceRequests = getServiceRequests();

  // For users: show their own requests
  const myRequests = serviceRequests.filter((r) => r.userId === user?.id);
  
  // For helpers/businesses: filter requests
  const allRequests = serviceRequests;
  const openRequests = allRequests.filter((r) => r.status === 'open' || r.status === 'pending');
  const appliedRequests = allRequests.filter((r) => 
    r.applicants && r.applicants.includes(user?.id || '')
  );

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

    if (searchQuery.trim()) {
      requests = requests.filter((r) =>
        r.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return requests;
  };

  const filteredRequests = getFilteredRequests();

  const handleApply = async (requestId: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please login to apply');
      return;
    }

    const request = allRequests.find((r) => r.id === requestId);
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
    const hasApplied = request.applicants?.includes(user?.id || '');
    const isOpen = request.status === 'open';
    const isHelperOrBusiness = user?.userType === 'helper' || user?.userType === 'business';

    return (
      <View key={request.id} style={styles.card}>
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
              <IconSymbol name="location.fill" size={16} color="#007AFF" />
              <ThemedText style={styles.detailText}>{request.location}</ThemedText>
            </View>
            {request.budget && (
              <View style={styles.detailRow}>
                <IconSymbol name="dollarsign.circle.fill" size={16} color="#007AFF" />
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

        {/* Actions for helpers/businesses */}
        {isHelperOrBusiness && (
          <View style={styles.cardActions}>
            {isOpen && !hasApplied && (
              <>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleContact(request)}
                >
                  <IconSymbol name="message.fill" size={18} color="#007AFF" />
                  <Text style={styles.contactButtonText}>Contact</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => handleApply(request.id)}
                >
                  <Text style={styles.applyButtonText}>Apply Now</Text>
                </TouchableOpacity>
              </>
            )}
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
      case 'in_progress': return '#E3F2FD';
      case 'completed': return '#F5F5F5';
      default: return '#FFEBEE';
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          {user?.userType === 'user' ? 'My Service Requests' : 'Service Requests'}
        </ThemedText>
        {user?.userType === 'user' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/requests/create')}
          >
            <IconSymbol name="plus.circle.fill" size={28} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar - Only for helpers/businesses */}
      {(user?.userType === 'helper' || user?.userType === 'business') && (
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search service requests..."
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredRequests.length > 0 ? (
          <View style={styles.content}>
            {filteredRequests.map((request) => renderRequestCard(request))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="list.bullet" size={48} color="#CCCCCC" />
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              {user?.userType === 'user' ? 'No Service Requests Yet' : 'No Service Requests Found'}
            </ThemedText>
            <ThemedText style={styles.emptyText}>
              {user?.userType === 'user' ? (
                'Create your first service request to get started'
              ) : searchQuery.trim() ? (
                'Try adjusting your search'
              ) : selectedTab === 'applied' ? (
                "You haven't applied to any requests yet"
              ) : (
                'No service requests available at the moment'
              )}
            </ThemedText>
            {user?.userType === 'user' && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/requests/create')}
              >
                <Text style={styles.createButtonText}>Create Your First Request</Text>
              </TouchableOpacity>
            )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
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
    marginRight: 8,
    marginTop: 16,
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
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
  },
  tabActive: {
    backgroundColor: '#007AFF',
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
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
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
    color: '#007AFF',
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
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
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
  applyButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
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
    backgroundColor: '#007AFF',
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
});
