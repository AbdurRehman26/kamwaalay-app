import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function JobViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { getJobs, applyToJob } = useApp();
  const jobs = getJobs();

  const request = jobs.find((r) => r.id === id);

  if (!request) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>

          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>Request Not Found</Text>
            <Text style={styles.emptyText}>
              The job you're looking for doesn't exist or has been removed.
            </Text>
            <TouchableOpacity
              style={styles.backToRequestsButton}
              onPress={() => router.push('/(tabs)/requests')}
            >
              <Text style={styles.backToRequestsButtonText}>Back to Requests</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
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
      Alert.alert('Already Applied', 'You have already applied to this job');
      return;
    }

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
              await applyToJob(request.id, user.id);
              Alert.alert('Success', 'You have successfully applied to this job!');
            } catch (error) {
              Alert.alert('Error', 'Failed to apply. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleContact = () => {
    const userName = request.userName || 'User';
    router.push(`/chat/${request.userId}?name=${encodeURIComponent(userName)}`);
  };

  const handleEdit = () => {
    router.push(`/requests/edit/${request.id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this request? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Call API to delete the request
              Alert.alert('Success', 'Request deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => router.push('/(tabs)/requests'),
                },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleContactApplicants = () => {
    if (request.applicants && request.applicants.length > 0) {
      router.push(`/chat/${request.applicants[0]}`);
    } else {
      Alert.alert('No Applicants', 'There are no applicants to contact yet.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#E0F2F1';
      case 'in_progress': return '#EEF2FF';
      case 'completed': return '#F5F5F5';
      case 'cancelled': return '#FFEBEE';
      default: return '#F5F5F5';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'open': return '#00695C';
      case 'in_progress': return '#4338CA';
      case 'completed': return '#616161';
      case 'cancelled': return '#C62828';
      default: return '#616161';
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
    <View style={styles.container}>
      {/* Decorative Background Elements */}
      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />

      <SafeAreaView style={styles.safeArea}>


        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
              <Text style={[styles.statusText, { color: getStatusTextColor(request.status) }]}>
                {request.status.toUpperCase()}
              </Text>
            </View>

            {/* Service Name */}
            <Text style={styles.serviceName}>
              {request.serviceName}
            </Text>

            {/* User Info (for helpers/businesses) */}
            {isHelperOrBusiness && (
              <View style={styles.userInfoSection}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(request.userName || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfoText}>
                  <Text style={styles.userLabel}>Requested by</Text>
                  <Text style={styles.userName}>{request.userName || 'Unknown'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.messageButton}
                  onPress={handleContact}
                >
                  <IconSymbol name="bubble.left.fill" size={20} color="#6366F1" />
                </TouchableOpacity>
              </View>
            )}

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>
                {request.description}
              </Text>
            </View>

            {/* Details */}
            <View style={styles.detailsSection}>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <IconSymbol name="location.fill" size={20} color="#6366F1" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{request.location}</Text>
                </View>
              </View>

              {request.budget && (
                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <IconSymbol name="dollarsign.circle.fill" size={20} color="#6366F1" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Budget</Text>
                    <Text style={styles.detailValue}>₨{request.budget.toLocaleString()}</Text>
                  </View>
                </View>
              )}

              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <IconSymbol name="calendar" size={20} color="#6366F1" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>{formatDate(request.createdAt)}</Text>
                </View>
              </View>

              {request.applicants && request.applicants.length > 0 && (
                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <IconSymbol name="person.2.fill" size={20} color="#6366F1" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Applicants</Text>
                    <Text style={styles.detailValue}>
                      {request.applicants.length} applicant{request.applicants.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Actions for users (who own the request) */}
            {isOwner && user?.userType === 'user' && (
              <View style={styles.actionsSection}>
                {/* Edit and Delete buttons */}
                <View style={styles.ownerActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEdit}
                  >
                    <IconSymbol name="pencil" size={20} color="#6366F1" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                  >
                    <IconSymbol name="trash" size={20} color="#EF4444" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>

                {/* Contact applicants */}
                {request.applicants && request.applicants.length > 0 ? (
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={handleContactApplicants}
                  >
                    <IconSymbol name="message.fill" size={20} color="#FFFFFF" />
                    <Text style={styles.contactButtonText}>
                      Contact Applicant{request.applicants.length > 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.noApplicantsBadge}>
                    <IconSymbol name="person.fill" size={20} color="#9CA3AF" />
                    <Text style={styles.noApplicantsText}>No applicants yet</Text>
                  </View>
                )}
              </View>
            )}

            {/* Actions for helpers/businesses */}
            {isHelperOrBusiness && !isOwner && (
              <View style={styles.actionsSection}>
                {isOpen && !hasApplied && (
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApply}
                  >
                    <Text style={styles.applyButtonText}>Apply Now</Text>
                    <IconSymbol name="arrow.right" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                {hasApplied && (
                  <View style={styles.appliedBadge}>
                    <IconSymbol name="checkmark.circle.fill" size={24} color="#16A34A" />
                    <Text style={styles.appliedText}>Application Sent</Text>
                  </View>
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  safeArea: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 24,
    lineHeight: 40,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366F1',
  },
  userInfoText: {
    flex: 1,
  },
  userLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: '#4B5563',
  },
  detailsSection: {
    marginBottom: 32,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  actionsSection: {
    marginTop: 8,
    marginBottom: 40,
    gap: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#6366F1',
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
    backgroundColor: '#F0FDF4',
    padding: 20,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  appliedText: {
    color: '#16A34A',
    fontSize: 16,
    fontWeight: '700',
  },
  closedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 16,
  },
  closedText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  noApplicantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
  },
  noApplicantsText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1A1A1A',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backToRequestsButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backToRequestsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  editButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
