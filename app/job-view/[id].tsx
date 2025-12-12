import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Job {
  id: string;
  userId: string;
  userName: string;
  serviceName: string;
  description: string;
  location: string;
  budget?: number;
  status: string;
  createdAt: string;
  applicants?: string[];
  applicantsDetails?: {
    id: string;
    name: string;
    role: string;
    profileImage?: string;
    phoneNumber?: string;
    rating?: number;
    jobsCount?: number;
  }[];
}

export default function JobViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { getJobs, applyToJob } = useApp();
  const insets = useSafeAreaInsets();
  const jobs = getJobs();

  const [request, setRequest] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');

  useEffect(() => {
    const loadJob = async () => {
      // First, check local jobs
      const localJob = jobs.find((r) => r.id === id);
      if (localJob) {
        setRequest(localJob);
        setIsLoading(false);
        return;
      }

      // If not found locally, fetch from API
      try {
        setIsLoading(true);

        // Try job-posts endpoint first
        let response = await apiService.get(
          API_ENDPOINTS.JOB_POSTS.GET,
          { id: id as string },
          undefined,
          true
        );

        // If job-posts fails, try bookings endpoint
        if (!response.success || !response.data) {
          response = await apiService.get(
            API_ENDPOINTS.BOOKINGS.GET,
            { id: id as string },
            undefined,
            true
          );
        }

        if (response.success && response.data) {
          const jobData = response.data.job_post || response.data.booking || response.data;

          const mappedJob: Job = {
            id: jobData.id?.toString() || id,
            userId: jobData.user_id?.toString() || jobData.user?.id?.toString() || '',
            userName: jobData.user?.name || jobData.name || 'Unknown',
            serviceName: jobData.service_type
              ? jobData.service_type.charAt(0).toUpperCase() + jobData.service_type.slice(1).replace('_', ' ')
              : jobData.service_name || 'Service',
            description: jobData.description || jobData.special_requirements || '',
            location: jobData.area || jobData.location || jobData.location_name || '',
            budget: jobData.monthly_rate || jobData.budget || jobData.price,
            status: jobData.status === 'pending' ? 'open' : (jobData.status || 'open'),
            createdAt: jobData.created_at || jobData.createdAt || new Date().toISOString(),
            applicants: jobData.job_applications?.map((app: any) => app.user_id?.toString() || app.applicant_id?.toString()) ||
              jobData.applicants ||
              [],
            applicantsDetails: jobData.job_applications?.map((app: any) => ({
              id: app.user?.id?.toString() || app.user_id?.toString() || app.applicant_id?.toString(),
              name: app.user?.name || app.applicant_name || 'Helper',
              role: app.user?.role || 'Helper',
              profileImage: app.user?.profile_image,
              phoneNumber: app.user?.phone_number || app.user?.phone,
              rating: app.user?.average_rating,
              jobsCount: app.user?.completed_jobs_count,
            })) || [],
          };

          setRequest(mappedJob);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching job:', error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadJob();
    }
  }, [id, jobs]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={[styles.emptyText, { color: textSecondary, marginTop: 16 }]}>
              Loading job details...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (notFound || !request) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: cardBg }]}>
              <IconSymbol name="exclamationmark.triangle.fill" size={48} color={textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>Job Not Found</Text>
            <Text style={[styles.emptyText, { color: textSecondary }]}>
              The job you're looking for doesn't exist or has been removed.
            </Text>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: primaryColor }]}
              onPress={() => router.push('/(tabs)/job-posts')}
            >
              <Text style={styles.backButtonText}>Back to Job Posts</Text>
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
    // TODO: Navigate to edit job post screen when route is available
    Alert.alert('Edit', 'Edit functionality coming soon');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Job Post',
      'Are you sure you want to delete this job post? This action cannot be undone.',
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
              Alert.alert('Success', 'Job post deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => router.push('/(tabs)/job-posts'),
                },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete job post. Please try again.');
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
    <View style={[styles.container, { backgroundColor }]}>
      {/* Decorative Background Elements */}

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButtonHeader, { backgroundColor: cardBg, borderColor }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={20} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          <View style={[styles.topCircle, { backgroundColor: primaryLight, opacity: 0.3 }]} />
          <View style={[styles.bottomCircle, { backgroundColor: primaryLight, opacity: 0.2 }]} />

          <View style={styles.content}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
              <Text style={[styles.statusText, { color: getStatusTextColor(request.status) }]}>
                {request.status.toUpperCase()}
              </Text>
            </View>

            {/* Service Name */}
            <Text style={[styles.serviceName, { color: textColor }]}>
              {request.serviceName}
            </Text>

            {/* User Info (for helpers/businesses) */}
            {isHelperOrBusiness && (
              <View style={[styles.userInfoSection, { backgroundColor: cardBg, borderColor }]}>
                <View style={[styles.avatar, { backgroundColor: primaryLight }]}>
                  <Text style={[styles.avatarText, { color: primaryColor }]}>
                    {(request.userName || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfoText}>
                  <Text style={[styles.userLabel, { color: textMuted }]}>Requested by</Text>
                  <Text style={[styles.userName, { color: textColor }]}>{request.userName || 'Unknown'}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.messageButton, { backgroundColor: primaryLight }]}
                  onPress={handleContact}
                >
                  <IconSymbol name="bubble.left.fill" size={20} color={primaryColor} />
                </TouchableOpacity>
              </View>
            )}

            {/* Description */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Description</Text>
              <Text style={[styles.description, { color: textSecondary }]}>
                {request.description || 'No description provided.'}
              </Text>
            </View>

            {/* Details */}
            <View style={styles.detailsSection}>
              <View style={[styles.detailItem, { backgroundColor: cardBg, borderColor }]}>
                <View style={[styles.detailIcon, { backgroundColor: primaryLight }]}>
                  <IconSymbol name="location.fill" size={20} color={primaryColor} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: textMuted }]}>Location</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>{request.location}</Text>
                </View>
              </View>

              {request.budget && (
                <View style={[styles.detailItem, { backgroundColor: cardBg, borderColor }]}>
                  <View style={[styles.detailIcon, { backgroundColor: primaryLight }]}>
                    <IconSymbol name="dollarsign.circle.fill" size={20} color={primaryColor} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: textMuted }]}>Budget</Text>
                    <Text style={[styles.detailValue, { color: textColor }]}>₨{request.budget.toLocaleString()}</Text>
                  </View>
                </View>
              )}

              <View style={[styles.detailItem, { backgroundColor: cardBg, borderColor }]}>
                <View style={[styles.detailIcon, { backgroundColor: primaryLight }]}>
                  <IconSymbol name="calendar" size={20} color={primaryColor} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: textMuted }]}>Created</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>{formatDate(request.createdAt)}</Text>
                </View>
              </View>

              {request.applicants && request.applicants.length > 0 && (
                <View style={[styles.detailItem, { backgroundColor: cardBg, borderColor }]}>
                  <View style={[styles.detailIcon, { backgroundColor: primaryLight }]}>
                    <IconSymbol name="person.2.fill" size={20} color={primaryColor} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: textMuted }]}>Applicants</Text>
                    <View style={styles.applicantsTagContainer}>
                      <View style={[styles.applicantsTag, { backgroundColor: primaryLight, borderColor: primaryColor }]}>
                        <IconSymbol name="person.2.fill" size={12} color={primaryColor} />
                        <Text style={[styles.applicantsTagText, { color: primaryColor }]}>
                          {request.applicants.length} applicant{request.applicants.length > 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
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
                    style={[styles.editButton, { backgroundColor: primaryLight, borderColor: primaryColor }]}
                    onPress={handleEdit}
                  >
                    <IconSymbol name="pencil" size={18} color={primaryColor} />
                    <Text style={[styles.editButtonText, { color: primaryColor }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: '#FEF2F2', borderColor: errorColor }]}
                    onPress={handleDelete}
                  >
                    <IconSymbol name="trash" size={18} color={errorColor} />
                    <Text style={[styles.deleteButtonText, { color: errorColor }]}>Delete</Text>
                  </TouchableOpacity>
                </View>

                {/* Applicants List */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: textColor, fontSize: 16, marginTop: 16 }]}>
                    Applicants ({request.applicantsDetails?.length || request.applicants?.length || 0})
                  </Text>

                  {request.applicantsDetails && request.applicantsDetails.length > 0 ? (
                    <View style={styles.applicantsList}>
                      {request.applicantsDetails.map((applicant, index) => (
                        <View key={applicant.id || index} style={[styles.applicantCard, { backgroundColor: cardBg, borderColor }]}>
                          <View style={styles.applicantInfo}>
                            <View style={[styles.applicantAvatar, { backgroundColor: primaryLight }]}>
                              <Text style={[styles.applicantAvatarText, { color: primaryColor }]}>
                                {(applicant.name || 'H').charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View>
                              <Text style={[styles.applicantName, { color: textColor }]}>
                                {applicant.name || 'Helper'}
                              </Text>
                              <View style={styles.applicantMeta}>
                                <Text style={[styles.applicantRole, { color: textMuted }]}>
                                  {applicant.role || 'Helper'}
                                </Text>
                                {applicant.rating && (
                                  <>
                                    <Text style={[styles.metaDot, { color: textMuted }]}>•</Text>
                                    <IconSymbol name="star.fill" size={12} color="#F59E0B" />
                                    <Text style={[styles.metaText, { color: textColor }]}>{applicant.rating}</Text>
                                  </>
                                )}
                              </View>
                            </View>
                          </View>

                          <View style={styles.applicantActions}>
                            {applicant.phoneNumber && (
                              <>
                                <TouchableOpacity
                                  style={[styles.actionIconButton, { backgroundColor: '#DCFCE7' }]}
                                  onPress={() => Linking.openURL(`whatsapp://send?phone=${applicant.phoneNumber}`)}
                                >
                                  <IconSymbol name="phone.bubble.fill" size={18} color="#16A34A" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={[styles.actionIconButton, { backgroundColor: '#DBEAFE' }]}
                                  onPress={() => Linking.openURL(`tel:${applicant.phoneNumber}`)}
                                >
                                  <IconSymbol name="phone.fill" size={18} color="#2563EB" />
                                </TouchableOpacity>
                              </>
                            )}

                            <TouchableOpacity
                              style={[styles.actionIconButton, { backgroundColor: primaryLight }]}
                              onPress={() => router.push(`/chat/${applicant.id}?name=${encodeURIComponent(applicant.name || 'Helper')}`)}
                            >
                              <IconSymbol name="bubble.left.fill" size={18} color={primaryColor} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : request.applicants && request.applicants.length > 0 ? (
                    // Fallback if we only have IDs but no details (shouldn't happen with updated logic, but safe fallback)
                    <TouchableOpacity
                      style={[styles.contactButton, { backgroundColor: primaryColor }]}
                      onPress={handleContactApplicants}
                    >
                      <IconSymbol name="message.fill" size={20} color="#FFFFFF" />
                      <Text style={styles.contactButtonText}>
                        Contact Applicant{request.applicants.length > 1 ? 's' : ''}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.noApplicantsBadge, { backgroundColor: cardBg, borderColor }]}>
                      <IconSymbol name="person.fill" size={20} color={textMuted} />
                      <Text style={[styles.noApplicantsText, { color: textMuted }]}>No applicants yet</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Actions for helpers/businesses */}
            {isHelperOrBusiness && !isOwner && (
              <View style={styles.actionsSection}>
                {isOpen && !hasApplied && (
                  <TouchableOpacity
                    style={[styles.applyButton, { backgroundColor: primaryColor }]}
                    onPress={handleApply}
                  >
                    <Text style={styles.applyButtonText}>Apply Now</Text>
                    <IconSymbol name="arrow.right" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                {hasApplied && (
                  <View style={[styles.appliedBadge, { backgroundColor: '#F0FDF4', borderColor: successColor }]}>
                    <IconSymbol name="checkmark.circle.fill" size={24} color={successColor} />
                    <Text style={[styles.appliedText, { color: successColor }]}>Application Sent</Text>
                  </View>
                )}
                {!isOpen && !hasApplied && (
                  <View style={[styles.closedBadge, { backgroundColor: cardBg, borderColor }]}>
                    <Text style={[styles.closedText, { color: textMuted }]}>This job post is closed</Text>
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
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
    marginBottom: 24,
    lineHeight: 40,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  userInfoText: {
    flex: 1,
  },
  userLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
  },
  detailsSection: {
    marginBottom: 32,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  applicantsTagContainer: {
    marginTop: 4,
  },
  applicantsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  applicantsTagText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    padding: 20,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
  },
  appliedText: {
    fontSize: 16,
    fontWeight: '700',
  },
  closedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  closedText: {
    fontSize: 16,
    fontWeight: '600',
  },
  noApplicantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  noApplicantsText: {
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
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
  backButtonText: {
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
    padding: 16,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  applicantsList: {
    gap: 12,
    marginTop: 8,
  },
  applicantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  applicantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  applicantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  applicantAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  applicantName: {
    fontSize: 14,
    fontWeight: '700',
  },
  applicantRole: {
    fontSize: 12,
  },
  applicantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaDot: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  applicantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
