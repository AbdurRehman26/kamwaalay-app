import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ServiceRequestViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { getServiceRequests, applyToServiceRequest } = useApp();
  const serviceRequests = getServiceRequests();
  
  const request = serviceRequests.find((r) => r.id === id);

  if (!request) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="#007AFF" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Service Request
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#CCCCCC" />
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            Request Not Found
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            The service request you're looking for doesn't exist or has been removed.
          </ThemedText>
          <TouchableOpacity
            style={styles.backToRequestsButton}
            onPress={() => router.push('/(tabs)/requests')}
          >
            <Text style={styles.backToRequestsButtonText}>Back to Requests</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const hasApplied = request.applicants?.includes(user?.id || '');
  const isOpen = request.status === 'open';
  const isHelperOrBusiness = user?.userType === 'helper' || user?.userType === 'business';
  const isOwner = request.userId === user?.id;

  const handleApply = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please login to apply');
      return;
    }

    if (hasApplied) {
      Alert.alert('Already Applied', 'You have already applied to this service request');
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Confirm Application',
      `Are you sure you want to apply for "${request.serviceName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Apply',
          style: 'default',
          onPress: async () => {
            try {
              await applyToServiceRequest(request.id, user.id);
              Alert.alert('Success', 'You have successfully applied to this service request!');
            } catch (error) {
              Alert.alert('Error', 'Failed to apply. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleContact = () => {
    router.push(`/chat/${request.userId}`);
  };

  const handleContactApplicants = () => {
    if (request.applicants && request.applicants.length > 0) {
      // For now, navigate to chat with the first applicant
      // In the future, this could show a list of applicants to choose from
      router.push(`/chat/${request.applicants[0]}`);
    } else {
      Alert.alert('No Applicants', 'There are no applicants to contact yet.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#E8F5E9';
      case 'in_progress': return '#E3F2FD';
      case 'completed': return '#F5F5F5';
      case 'cancelled': return '#FFEBEE';
      default: return '#F5F5F5';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'open': return '#2E7D32';
      case 'in_progress': return '#1976D2';
      case 'completed': return '#666';
      case 'cancelled': return '#C62828';
      default: return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Service Request
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
            <Text style={[styles.statusText, { color: getStatusTextColor(request.status) }]}>
              {request.status.toUpperCase()}
            </Text>
          </View>

          {/* Service Name */}
          <ThemedText type="title" style={styles.serviceName}>
            {request.serviceName}
          </ThemedText>

          {/* User Info (for helpers/businesses) */}
          {isHelperOrBusiness && (
            <View style={styles.userInfoSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(request.userName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfoText}>
                <ThemedText style={styles.userLabel}>Requested by</ThemedText>
                <ThemedText style={styles.userName}>{request.userName || 'Unknown'}</ThemedText>
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Description</ThemedText>
            <ThemedText style={styles.description}>
              {request.description}
            </ThemedText>
          </View>

          {/* Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <IconSymbol name="location.fill" size={20} color="#007AFF" />
              </View>
              <View style={styles.detailContent}>
                <ThemedText style={styles.detailLabel}>Location</ThemedText>
                <ThemedText style={styles.detailValue}>{request.location}</ThemedText>
              </View>
            </View>

            {request.budget && (
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <IconSymbol name="dollarsign.circle.fill" size={20} color="#007AFF" />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Budget</ThemedText>
                  <ThemedText style={styles.detailValue}>₨{request.budget.toLocaleString()}</ThemedText>
                </View>
              </View>
            )}

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <IconSymbol name="calendar" size={20} color="#007AFF" />
              </View>
              <View style={styles.detailContent}>
                <ThemedText style={styles.detailLabel}>Created</ThemedText>
                <ThemedText style={styles.detailValue}>{formatDate(request.createdAt)}</ThemedText>
              </View>
            </View>

            {request.applicants && request.applicants.length > 0 && (
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <IconSymbol name="person.2.fill" size={20} color="#007AFF" />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Applicants</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {request.applicants.length} applicant{request.applicants.length > 1 ? 's' : ''}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>

          {/* Actions for users (who own the request) */}
          {isOwner && user?.userType === 'user' && (
            <View style={styles.actionsSection}>
              {request.applicants && request.applicants.length > 0 ? (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={handleContactApplicants}
                >
                  <IconSymbol name="message.fill" size={20} color="#007AFF" />
                  <Text style={styles.contactButtonText}>
                    Contact Applicant{request.applicants.length > 1 ? 's' : ''} ({request.applicants.length})
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.noApplicantsBadge}>
                  <IconSymbol name="person.fill" size={20} color="#999" />
                  <Text style={styles.noApplicantsText}>No applicants yet</Text>
                </View>
              )}
            </View>
          )}

          {/* Actions for helpers/businesses */}
          {isHelperOrBusiness && !isOwner && (
            <View style={styles.actionsSection}>
              {isOpen && !hasApplied && (
                <>
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={handleContact}
                  >
                    <IconSymbol name="message.fill" size={20} color="#007AFF" />
                    <Text style={styles.contactButtonText}>Contact</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApply}
                  >
                    <Text style={styles.applyButtonText}>Apply Now</Text>
                  </TouchableOpacity>
                </>
              )}
              {hasApplied && (
                <>
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={handleContact}
                  >
                    <IconSymbol name="message.fill" size={20} color="#007AFF" />
                    <Text style={styles.contactButtonText}>Contact</Text>
                  </TouchableOpacity>
                  <View style={styles.appliedBadge}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#34C759" />
                    <Text style={styles.appliedText}>Applied</Text>
                  </View>
                </>
              )}
              {!isOpen && !hasApplied && (
                <View style={styles.closedBadge}>
                  <Text style={styles.closedText}>This request is closed</Text>
                </View>
              )}
            </View>
          )}
        </View>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  userInfoText: {
    flex: 1,
  },
  userLabel: {
    fontSize: 12,
    opacity: 0.6,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  detailsSection: {
    marginBottom: 24,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.6,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  actionsSection: {
    marginTop: 8,
    marginBottom: 24,
    gap: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  contactButtonText: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: '700',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    padding: 16,
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
    fontSize: 16,
    fontWeight: '700',
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  appliedText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '700',
  },
  closedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
  },
  closedText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '700',
  },
  noApplicantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  noApplicantsText: {
    color: '#999',
    fontSize: 16,
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
    marginBottom: 24,
  },
  backToRequestsButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backToRequestsButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

