import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
    city?: string;
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
    gender?: string;
    religion?: string;
    services?: string[];
    locations?: string[];
    age?: number;
    experience?: number;
    languages?: string[];
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

  // Handle phone call
  const handleCall = async (phoneNumber: string | null) => {
    if (!phoneNumber) {
      Alert.alert('Phone Number', 'Phone number not available');
      return;
    }
    const url = `tel:${phoneNumber}`;
    try {
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Error', 'Unable to open phone dialer');
    }
  };

  // Handle WhatsApp
  const handleWhatsApp = async (phoneNumber: string | null) => {
    if (!phoneNumber) {
      Alert.alert('Phone Number', 'Phone number not available');
      return;
    }
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    const appUrl = `whatsapp://send?phone=${cleaned}`;
    const webUrl = `https://wa.me/${cleaned.replace(/\+/g, '')}`;

    try {
      await Linking.openURL(appUrl);
    } catch (err) {
      try {
        await Linking.openURL(webUrl);
      } catch (webErr) {
        Alert.alert('Error', 'Unable to open WhatsApp');
      }
    }
  };
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
              city: (typeof jobData.city === 'string' ? jobData.city : jobData.city?.name) || 
                    (typeof jobData.location_city === 'string' ? jobData.location_city : jobData.location_city?.name) || 
                    'Karachi',
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
              gender: app.user?.gender,
              religion: app.user?.religion,
              age: app.user?.age,
              experience: app.user?.experience_years,
              languages: app.user?.languages || [],
              services: app.user?.service_listings?.map((s: any) => s.service_type || s.name) || [],
              locations: app.user?.service_listings?.flatMap((s: any) => s.service_locations?.map((l: any) => l.name || l.city) || [])
                .filter((value: any, index: any, self: any) => self.indexOf(value) === index) // Unique locations
                .slice(0, 3) || (app.user?.city ? [app.user.city] : []),
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

    router.push(`/job-view/${id}/apply`);
  };

  const handleContact = () => {
    const userName = request.userName || 'User';
    router.push(`/chat/${request.userId}?name=${encodeURIComponent(userName)}`);
  };

  const handleEdit = () => {
    router.push(`/job/edit/${id}`);
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
              setIsLoading(true);
              // Try deleting via bookings endpoint which is the primary one for jobs now
              const response = await apiService.delete(API_ENDPOINTS.BOOKINGS.DELETE, { id: id as string });

              if (response.success) {
                Alert.alert('Success', 'Job post deleted successfully', [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/(tabs)/job-posts'),
                  },
                ]);
              } else {
                throw new Error(response.message || 'Failed to delete job post');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete job post. Please try again.');
            } finally {
              setIsLoading(false);
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
    <>
      <Stack.Screen options={{ title: 'Job Details', headerBackTitle: 'Back' }} />
      <View style={[styles.container, { backgroundColor }]}>
        {/* Decorative Background Elements */}

        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => router.back()}
            >
              <IconSymbol name="chevron.left" size={28} color={textColor} />
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
                        <Text style={[styles.detailValue, { color: textColor }]}>
                          {request.location ? (
                            `${request.location}${request.city ? `, ${request.city}` : ''}`
                          ) : (
                            request.city || 'Karachi'
                          )}
                        </Text>
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
                        {request.applicantsDetails.map((applicant: any, index) => (
                          <View key={applicant.id || index} style={[
                            styles.applicantCard,
                            {
                              backgroundColor: cardBg,
                              borderColor: borderColor,
                            }
                          ]}>
                            {/* 1. Header Section */}
                            <View style={styles.cardHeader}>
                              <View style={styles.avatarSection}>
                                {applicant.profileImage ? (
                                  <Image source={{ uri: applicant.profileImage }} style={styles.avatarImage} />
                                ) : (
                                  <View style={[styles.avatarPlaceholder, { backgroundColor: primaryLight }]}>
                                    <Text style={[styles.avatarText, { color: primaryColor }]}>
                                      {(applicant.name || 'H').charAt(0).toUpperCase()}
                                    </Text>
                                  </View>
                                )}
                                <View style={styles.verifiedBadge}>
                                  <IconSymbol name="checkmark.seal.fill" size={14} color="#FFFFFF" />
                                </View>
                              </View>

                              <View style={styles.headerInfo}>
                                <View style={styles.nameRow}>
                                  <Text style={[styles.cardName, { color: textColor }]}>
                                    {applicant.name || 'Helper'}
                                  </Text>
                                  {applicant.rating !== undefined && (
                                    <View style={[styles.ratingPill, { backgroundColor: '#FFFBEB' }]}>
                                      <IconSymbol name="star.fill" size={12} color="#F59E0B" />
                                      <Text style={styles.ratingText}>{applicant.rating.toFixed(1)}</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={[styles.cardRole, { color: textSecondary }]}>
                                  {applicant.role ? applicant.role.charAt(0).toUpperCase() + applicant.role.slice(1) : 'Professional Helper'}
                                </Text>
                              </View>
                            </View>

                            {/* 2. Key Details Grid */}
                            <View style={[styles.statsGrid, { backgroundColor: backgroundColor, borderColor: borderColor }]}>
                              {/* Row 1: Experience & Age */}
                              <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                  <Text style={[styles.statLabel, { color: textMuted }]}>Experience</Text>
                                  <Text style={[styles.statValue, { color: textColor }]}>
                                    {applicant.experience ? `${applicant.experience} Yrs` : 'N/A'}
                                  </Text>
                                </View>
                                <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
                                <View style={styles.statItem}>
                                  <Text style={[styles.statLabel, { color: textMuted }]}>Age</Text>
                                  <Text style={[styles.statValue, { color: textColor }]}>
                                    {applicant.age ? `${applicant.age} Yrs` : '-'}
                                  </Text>
                                </View>
                              </View>

                              {/* Row 2: Gender & Religion */}
                              <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                  <Text style={[styles.statLabel, { color: textMuted }]}>Gender</Text>
                                  <Text style={[styles.statValue, { color: textColor }]}>
                                    {applicant.gender ? applicant.gender.charAt(0).toUpperCase() + applicant.gender.slice(1) : '-'}
                                  </Text>
                                </View>
                                <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
                                <View style={styles.statItem}>
                                  <Text style={[styles.statLabel, { color: textMuted }]}>Religion</Text>
                                  <Text style={[styles.statValue, { color: textColor }]}>
                                    {applicant.religion ? (typeof applicant.religion === 'object' ? (applicant.religion as any).label : applicant.religion) : '-'}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            {/* 3. Location, Languages & Skills */}
                            <View style={{ marginBottom: 16 }}>


                              {(applicant.languages && applicant.languages.length > 0) && (
                                <View style={styles.skillsSection}>
                                  {applicant.languages.slice(0, 3).map((lang: any, idx: number) => {
                                    const langLabel = typeof lang === 'object' && lang?.name ? lang.name : lang;
                                    return (
                                      <View key={`lang-${idx}`} style={[styles.skillChip, { backgroundColor: '#F1F5F9' }]}>
                                        <Text style={[styles.skillText, { color: '#64748B' }]}>{langLabel}</Text>
                                      </View>
                                    );
                                  })}
                                </View>
                              )}

                              {(applicant.services && applicant.services.length > 0) && (
                                <View style={styles.skillsSection}>
                                  {applicant.services.slice(0, 3).map((service: string, idx: number) => (
                                    <View key={`svc-${idx}`} style={[styles.skillChip, { backgroundColor: primaryLight }]}>
                                      <Text style={[styles.skillText, { color: primaryColor }]}>{service}</Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>

                            {/* 4. Action Buttons */}
                            <View style={styles.actionButtonsContainer}>
                              <TouchableOpacity
                                style={[styles.viewProfileBtn, { borderColor: primaryColor }]}
                                onPress={() => router.push(`/profile/helper/${applicant.id}`)}
                              >
                                <Text style={[styles.viewProfileText, { color: primaryColor }]}>View Profile</Text>
                              </TouchableOpacity>

                              <View style={styles.contactActions}>
                                <TouchableOpacity
                                  style={[styles.contactBtn, { backgroundColor: primaryLight }]}
                                  onPress={() => router.push(`/chat/${applicant.id}?name=${encodeURIComponent(applicant.name || 'Helper')}`)}
                                >
                                  <IconSymbol name="bubble.left.fill" size={20} color={primaryColor} />
                                </TouchableOpacity>

                                {applicant.phoneNumber && (
                                  <>
                                    <TouchableOpacity
                                      style={[styles.contactBtn, { backgroundColor: '#DCFCE7' }]}
                                      onPress={() => handleWhatsApp(applicant.phoneNumber || '')}
                                    >
                                      <FontAwesome name="whatsapp" size={22} color="#16A34A" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[styles.contactBtn, { backgroundColor: '#E0E7FF' }]}
                                      onPress={() => handleCall(applicant.phoneNumber || '')}
                                    >
                                      <IconSymbol name="phone.fill" size={20} color="#4F46E5" />
                                    </TouchableOpacity>
                                  </>
                                )}
                              </View>
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
    </>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
    zIndex: 50,
    width: '100%',
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
  applicantCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  avatarSection: {
    position: 'relative',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  cardRole: {
    fontSize: 14,
  },
  statsGrid: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  skillsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  skillChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewProfileBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contactBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
