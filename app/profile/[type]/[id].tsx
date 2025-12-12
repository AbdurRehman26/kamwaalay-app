import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

// Mock profile data as fallback
const MOCK_PROFILE = {
  id: '1',
  name: 'Fatima Ali',
  service: 'Cooking',
  rating: 4.8,
  reviews: 127,
  price: 15000,
  location: 'Karachi',
  distance: '2.3 km',
  experience: '5 years',
  bio: 'Expert in Pakistani cuisine and traditional dishes. I have been cooking for families for over 5 years and specialize in healthy, home-style meals.',
  services: ['Cooking', 'Meal Planning'],
  locations: ['Karachi', 'Lahore'],
};

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileViewScreen() {
  const router = useRouter();
  const { type, id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otherServices, setOtherServices] = useState<any[]>([]);
  const [isLoadingOtherServices, setIsLoadingOtherServices] = useState(false);
  const [canContact, setCanContact] = useState(false);
  const [isCheckingContact, setIsCheckingContact] = useState(false);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);

        // Determine which API to use based on type
        const isHelper = type === 'helper';
        const isBusiness = type === 'business';
        let endpoint: string;

        if (isHelper) {
          endpoint = API_ENDPOINTS.HELPERS.GET;
        } else if (isBusiness) {
          endpoint = API_ENDPOINTS.BUSINESSES.GET;
        } else {
          endpoint = API_ENDPOINTS.SERVICE_LISTINGS.GET;
        }

        const response = await apiService.get(
          endpoint,
          { id: id as string }
        );

        console.log(`📦 ${isHelper ? 'Helper' : isBusiness ? 'Business' : 'Service Listing'} API Response:`, JSON.stringify(response, null, 2));

        if (response.success && response.data) {
          // Handle business API response
          if (isBusiness) {
            let business = response.data;

            // Check if data is nested under 'business'
            if (response.data.business) {
              business = response.data.business;
            }

            console.log('🏢 Business Data:', JSON.stringify(business, null, 2));

            // Map business response to profile structure
            const mappedProfile = {
              id: business.id || business.user?.id || id,
              name: business.business_name || business.name || business.user?.name || 'Unknown',
              service: 'Business',
              rating: business.rating || 0,
              reviews: business.reviews_count || 0,
              price: business.service_listings?.[0]?.monthly_rate || 0,
              location: business.location_details?.[0]?.area || business.location_details?.[0]?.area_name || business.area || 'Location not specified',
              distance: 'N/A',
              experience: business.experience_years ? `${business.experience_years} years` : 'N/A',
              bio: business.bio || business.description || 'No description available',
              services: (() => {
                const servicesList: string[] = [];
                if (business.service_listings && Array.isArray(business.service_listings)) {
                  business.service_listings.forEach((s: any) => {
                    if (s.service_type) {
                      const serviceName = s.service_type.charAt(0).toUpperCase() + s.service_type.slice(1).replace('_', ' ');
                      if (!servicesList.includes(serviceName)) {
                        servicesList.push(serviceName);
                      }
                    }
                  });
                }
                return servicesList;
              })(),
              locations: (() => {
                const locationsList: string[] = [];
                if (business.location_details && Array.isArray(business.location_details)) {
                  business.location_details.forEach((loc: any) => {
                    const area = loc.area || loc.area_name || '';
                    if (area && !locationsList.includes(area)) {
                      locationsList.push(area);
                    }
                  });
                }
                return locationsList;
              })(),
              profileImage: business.profile_image || business.user?.profile_image,
              service_listings: business.service_listings || [],
              location_details: business.location_details || [],
              verified: business.verified || business.is_verified || false,
              phone_number: business.phone_number || business.user?.phone_number || business.user?.phoneNumber || null,
              gender: business.gender || business.user?.gender || null,
              religion: business.religion || business.user?.religion || null,
              languages: business.languages || business.user?.languages || [],
            };

            setProfile(mappedProfile);
            setIsLoading(false);
            return;
          }

          // Handle helper API response
          if (isHelper) {
            let helper = response.data;

            // Check if data is nested under 'helper'
            if (response.data.helper) {
              helper = response.data.helper;
            }

            console.log('👤 Helper Data:', JSON.stringify(helper, null, 2));

            // Map helper response to profile structure
            const mappedProfile = {
              id: helper.id || helper.user?.id || id,
              name: helper.name || helper.user?.name || 'Unknown',
              service: 'Helper',
              rating: helper.rating || 0,
              reviews: helper.reviews_count || 0,
              price: helper.service_listings?.[0]?.monthly_rate || 0,
              location: helper.location_details?.[0]?.area || helper.location_details?.[0]?.area_name || helper.area || 'Location not specified',
              distance: 'N/A',
              experience: helper.experience_years ? `${helper.experience_years} years` : 'N/A',
              bio: helper.bio || 'No description available',
              services: (() => {
                const servicesList: string[] = [];
                if (helper.service_listings && Array.isArray(helper.service_listings)) {
                  helper.service_listings.forEach((s: any) => {
                    if (s.service_type) {
                      const serviceName = s.service_type.charAt(0).toUpperCase() + s.service_type.slice(1).replace('_', ' ');
                      if (!servicesList.includes(serviceName)) {
                        servicesList.push(serviceName);
                      }
                    }
                  });
                }
                return servicesList;
              })(),
              locations: (() => {
                const locationsList: string[] = [];
                if (helper.location_details && Array.isArray(helper.location_details)) {
                  helper.location_details.forEach((loc: any) => {
                    const area = loc.area || loc.area_name || '';
                    if (area && !locationsList.includes(area)) {
                      locationsList.push(area);
                    }
                  });
                }
                return locationsList;
              })(),
              profileImage: helper.profile_image || helper.user?.profile_image,
              service_listings: helper.service_listings || [],
              location_details: helper.location_details || [],
              verified: helper.verified || helper.is_verified || false,
              phone_number: helper.phone_number || helper.user?.phone_number || helper.user?.phoneNumber || null,
              gender: helper.gender || helper.user?.gender || null,
              religion: helper.religion || helper.user?.religion || null,
              languages: helper.languages || helper.user?.languages || [],
            };

            setProfile(mappedProfile);
            setIsLoading(false);
            return;
          }

          // Handle service listing API response (existing code)
          // Handle different response structures
          let listing = response.data;

          // Check if data is nested under 'listing' or 'service_listing'
          if (response.data.listing) {
            listing = response.data.listing;
          } else if (response.data.service_listing) {
            listing = response.data.service_listing;
          }

          console.log('📋 Extracted Listing:', JSON.stringify(listing, null, 2));

          const user = listing.user || {};

          console.log('👤 User Data:', JSON.stringify(user, null, 2));

          // Map service listing response to profile structure
          const mappedProfile = {
            id: user.id || listing.user_id || listing.id,
            name: user.name || 'Unknown',
            service: listing.service_type
              ? listing.service_type.charAt(0).toUpperCase() + listing.service_type.slice(1).replace('_', ' ')
              : 'Service Provider',
            rating: user.rating || listing.rating || 0,
            reviews: user.reviews_count || listing.reviews_count || 0,
            price: listing.monthly_rate || listing.price || 0,
            location: listing.area || listing.location?.name || listing.location_name || 'Location not specified',
            distance: listing.distance || 'N/A',
            experience: user.experience_years
              ? `${user.experience_years} years`
              : (user.profileData?.experience || user.experience || 'N/A'),
            bio: listing.description || user.bio || user.profileData?.bio || 'No description available',
            // Handle multiple services - get from listing.service_types array
            services: (() => {
              const servicesList: string[] = [];

              // Primary source: listing.service_types array
              if (listing.service_types && Array.isArray(listing.service_types) && listing.service_types.length > 0) {
                listing.service_types.forEach((serviceType: string) => {
                  const formatted = serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('_', ' ');
                  if (!servicesList.includes(formatted)) {
                    servicesList.push(formatted);
                  }
                });
              }

              // Fallback: Check if services is an array
              if (servicesList.length === 0 && listing.services && Array.isArray(listing.services) && listing.services.length > 0) {
                listing.services.forEach((s: any) => {
                  const serviceName = s.service_type
                    ? s.service_type.charAt(0).toUpperCase() + s.service_type.slice(1).replace('_', ' ')
                    : s.name || 'Service';
                  if (!servicesList.includes(serviceName)) {
                    servicesList.push(serviceName);
                  }
                });
              }

              // Fallback: single service_type
              if (servicesList.length === 0 && listing.service_type) {
                servicesList.push(
                  listing.service_type.charAt(0).toUpperCase() + listing.service_type.slice(1).replace('_', ' ')
                );
              }

              // Final fallback
              if (servicesList.length === 0) {
                servicesList.push('Service');
              }

              console.log('📋 Services from listing.service_types:', servicesList);
              return servicesList;
            })(),
            // Handle multiple locations - get from listing.location_details array
            locations: (() => {
              const locs: string[] = [];

              // Primary source: listing.location_details array
              if (listing.location_details && Array.isArray(listing.location_details) && listing.location_details.length > 0) {
                listing.location_details.forEach((loc: any) => {
                  // Prefer display_text if available (e.g., "Karachi, DHA Phase 6")
                  if (loc.display_text) {
                    if (!locs.includes(loc.display_text)) {
                      locs.push(loc.display_text);
                    }
                  } else {
                    // Fallback to city_name + area or individual fields
                    const cityName = loc.city_name || loc.city || '';
                    const area = loc.area || loc.area_name || '';
                    const locationName = loc.name || loc.location_name || '';

                    if (cityName && area) {
                      const formatted = `${cityName}, ${area}`;
                      if (!locs.includes(formatted)) {
                        locs.push(formatted);
                      }
                    } else if (area) {
                      if (!locs.includes(area)) {
                        locs.push(area);
                      }
                    } else if (cityName) {
                      if (!locs.includes(cityName)) {
                        locs.push(cityName);
                      }
                    } else if (locationName) {
                      if (!locs.includes(locationName)) {
                        locs.push(locationName);
                      }
                    }
                  }
                });
              }

              // Fallback: Add from listing.locations array if it exists
              if (locs.length === 0 && listing.locations && Array.isArray(listing.locations)) {
                listing.locations.forEach((loc: any) => {
                  if (typeof loc === 'string') {
                    if (!locs.includes(loc)) {
                      locs.push(loc);
                    }
                  } else if (loc.name) {
                    if (!locs.includes(loc.name)) {
                      locs.push(loc.name);
                    }
                  } else if (loc.area) {
                    if (!locs.includes(loc.area)) {
                      locs.push(loc.area);
                    }
                  }
                });
              }

              // Fallback: Add individual location fields
              if (locs.length === 0) {
                if (listing.area && listing.city) {
                  locs.push(`${listing.city}, ${listing.area}`);
                } else if (listing.area) {
                  locs.push(listing.area);
                } else if (listing.city) {
                  locs.push(listing.city);
                } else if (listing.location?.name) {
                  locs.push(listing.location.name);
                } else if (listing.location_name) {
                  locs.push(listing.location_name);
                }
              }

              // Remove duplicates and filter out empty values
              const uniqueLocs = [...new Set(locs.filter(Boolean))];
              console.log('📍 Locations from listing.location_details:', uniqueLocs);
              return uniqueLocs;
            })(),
            profile_image: user.profile_image || user.avatar,
            // Store the full listing and user data for reference
            _listing: listing,
            _user: user,
            gender: listing.gender || user.gender || null,
            religion: listing.religion || user.religion || null,
            languages: listing.languages || user.languages || [],
          };

          console.log('✅ Mapped Profile:', JSON.stringify(mappedProfile, null, 2));

          setProfile(mappedProfile);

          // Fetch other services from the same provider
          if (user.id || listing.user_id) {
            fetchOtherServices(user.id || listing.user_id, listing.id);
          }
        } else {
          console.log('❌ Failed to fetch service listing - No data in response');
        }
      } catch (error) {
        console.error('❌ Error fetching service listing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchOtherServices = async (userId: string | number, currentListingId: string | number) => {
      try {
        setIsLoadingOtherServices(true);

        // Fetch all service listings
        const response = await apiService.get(
          API_ENDPOINTS.SERVICE_LISTINGS.LIST,
          undefined,
          undefined,
          false
        );

        if (response.success && response.data) {
          let listings = [];

          // Handle different response formats
          if (response.data.listings) {
            if (response.data.listings.data) {
              listings = Array.isArray(response.data.listings.data)
                ? response.data.listings.data
                : [];
            } else {
              listings = Array.isArray(response.data.listings)
                ? response.data.listings
                : [];
            }
          } else if (response.data.service_listings) {
            listings = Array.isArray(response.data.service_listings.data)
              ? response.data.service_listings.data
              : (Array.isArray(response.data.service_listings) ? response.data.service_listings : []);
          } else if (Array.isArray(response.data)) {
            listings = response.data;
          } else if (response.data.data) {
            listings = Array.isArray(response.data.data) ? response.data.data : [];
          }

          // Filter listings from the same user, excluding the current listing
          const userListings = listings.filter((listing: any) => {
            const listingUserId = listing.user?.id || listing.user_id;
            const listingId = listing.id;
            return listingUserId?.toString() === userId?.toString() && listingId?.toString() !== currentListingId?.toString();
          });

          console.log(`🔍 Found ${userListings.length} other services from this provider`);
          setOtherServices(userListings);
        }
      } catch (error) {
        console.error('❌ Error fetching other services:', error);
      } finally {
        setIsLoadingOtherServices(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id, type]);

  // Check if user can contact this helper/business
  useEffect(() => {
    const checkContactPermission = async () => {
      // Only check for helper or business profiles
      const isHelper = type === 'helper';
      const isBusiness = type === 'business';

      if (!isHelper && !isBusiness) {
        // For service listings, allow contact (no restriction)
        setCanContact(true);
        return;
      }

      // If user is not logged in, don't allow contact
      if (!user?.id || !id) {
        setCanContact(false);
        return;
      }

      setIsCheckingContact(true);
      try {
        // Get the user ID of the helper/business profile
        // Profile ID might be the profile ID, but we need the user ID for matching
        const profileUserId = profile?.id?.toString() || id?.toString();

        // Check 1: Check if there's an existing conversation
        let hasConversation = false;
        try {
          const conversationsResponse = await apiService.get(
            API_ENDPOINTS.MESSAGES.CONVERSATIONS,
            undefined,
            undefined,
            true
          );

          if (conversationsResponse.success && conversationsResponse.data?.conversations) {
            hasConversation = conversationsResponse.data.conversations.some(
              (conv: any) => {
                const otherUserId = conv.other_user?.id?.toString();
                return otherUserId === profileUserId;
              }
            );
          }
        } catch (error) {
          console.error('Error checking conversations:', error);
        }

        // Check 2: Check if user has accepted a job request from this helper/business
        let hasAcceptedApplication = false;
        try {
          const applicationsResponse = await apiService.get(
            API_ENDPOINTS.JOB_APPLICATIONS.MY_REQUEST_APPLICATIONS,
            undefined,
            undefined,
            true
          );

          if (applicationsResponse.success && applicationsResponse.data) {
            const applications = Array.isArray(applicationsResponse.data)
              ? applicationsResponse.data
              : (applicationsResponse.data.applications || applicationsResponse.data.data || []);

            // Check if there's an accepted application from this helper/business
            // The applicant should be the helper/business (profileUserId)
            hasAcceptedApplication = applications.some((app: any) => {
              const applicantId = app.applicant_id?.toString() ||
                app.user_id?.toString() ||
                app.helper_id?.toString() ||
                app.business_id?.toString() ||
                app.applicant?.id?.toString() ||
                app.user?.id?.toString();
              const isAccepted = app.status === 'accepted' ||
                app.status === 'approved' ||
                app.status === 'hired';
              return applicantId === profileUserId && isAccepted;
            });
          }
        } catch (error) {
          console.error('Error checking job applications:', error);
        }

        // Allow contact if either condition is met
        setCanContact(hasConversation || hasAcceptedApplication);
      } catch (error) {
        console.error('Error checking contact permission:', error);
        setCanContact(false);
      } finally {
        setIsCheckingContact(false);
      }
    };

    // Only check if profile is loaded and user is logged in
    if (profile && user?.id) {
      checkContactPermission();
    } else if (!user?.id) {
      // If user is not logged in, don't allow contact for helper/business
      const isHelper = type === 'helper';
      const isBusiness = type === 'business';
      setCanContact(!isHelper && !isBusiness);
    }
  }, [profile, user, id, type]);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </ThemedView>
    );
  }

  // Use fetched profile or fallback to MOCK_PROFILE if dev/test
  const displayProfile = profile || MOCK_PROFILE;

  // Helper function to format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone: string): string => {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('92')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.startsWith('0')) {
        cleaned = '+92' + cleaned.substring(1);
      } else {
        cleaned = '+92' + cleaned;
      }
    }
    return cleaned;
  };

  // Handle phone call
  const handleCall = (phoneNumber: string | null) => {
    if (!phoneNumber) {
      Alert.alert('Phone Number', 'Phone number not available');
      return;
    }
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Phone dialer is not available');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open phone dialer');
      });
  };

  // Handle WhatsApp
  const handleWhatsApp = (phoneNumber: string | null) => {
    if (!phoneNumber) {
      Alert.alert('Phone Number', 'Phone number not available');
      return;
    }
    const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
    const url = `https://wa.me/${formattedPhone.replace(/\+/g, '')}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'WhatsApp is not available');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp');
      });
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>

      <ScrollView
        style={[styles.scrollView]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Decorative Background Elements */}
        <View style={[styles.topCircle, { backgroundColor: primaryLight, opacity: 0.3 }]} />
        <View style={[styles.bottomCircle, { backgroundColor: primaryLight, opacity: 0.2 }]} />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: cardBg, shadowColor: borderColor }]}
          >
            <IconSymbol name="chevron.left" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Profile</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.contentContainer}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {displayProfile.profileImage ? (
                <Image source={{ uri: displayProfile.profileImage }} style={[styles.avatarImage, { borderColor: cardBg }]} />
              ) : (
                <View style={[styles.avatarImage, styles.avatarPlaceholder, { backgroundColor: primaryLight, borderColor: cardBg }]}>
                  <Text style={[styles.avatarText, { color: primaryColor }]}>{displayProfile.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              {displayProfile.verified && (
                <View style={[styles.verifiedBadge, { borderColor: cardBg }]}>
                  <IconSymbol name="checkmark.seal.fill" size={14} color="#FFFFFF" />
                </View>
              )}
            </View>

            <Text style={[styles.name, { color: textColor }]}>{displayProfile.name}</Text>
            <Text style={[styles.serviceType, { color: textSecondary }]}>{displayProfile.service}</Text>

            <View style={[styles.statsRow, { borderColor }]}>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FFF9C4' }]}>
                  <IconSymbol name="star.fill" size={14} color="#F59E0B" />
                </View>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {typeof displayProfile.rating === 'number' ? displayProfile.rating.toFixed(1) : displayProfile.rating}
                </Text>
                <Text style={[styles.statLabel, { color: textSecondary }]}>Rating</Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: borderColor }]} />

              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: primaryLight }]}>
                  <IconSymbol name="clock.fill" size={14} color={primaryColor} />
                </View>
                <Text style={[styles.statValue, { color: textColor }]}>{displayProfile.experience}</Text>
                <Text style={[styles.statLabel, { color: textSecondary }]}>Exp.</Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: borderColor }]} />

              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
                  <IconSymbol name="location.fill" size={14} color="#EF4444" />
                </View>
                <Text style={[styles.statValue, { color: textColor }]} numberOfLines={1}>
                  {displayProfile.location.split(',')[0]}
                </Text>
                <Text style={[styles.statLabel, { color: textSecondary }]}>Location</Text>
              </View>
            </View>
          </View>

          {/* About Section */}
          {displayProfile.bio && (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>About</Text>
              <Text style={[styles.bioText, { color: textSecondary }]}>{displayProfile.bio}</Text>
            </View>
          )}

          {/* Personal Details Section */}
          {(displayProfile.gender || displayProfile.religion || (displayProfile.languages && displayProfile.languages.length > 0)) && (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Personal Details</Text>
              <View style={styles.detailsList}>
                {displayProfile.gender && (
                  <View style={styles.detailItem}>
                    <View style={[styles.detailIcon, { backgroundColor: primaryLight }]}>
                      <FontAwesome name="user" size={16} color={primaryColor} />
                    </View>
                    <View>
                      <Text style={[styles.detailLabel, { color: textSecondary }]}>Gender</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>
                        {displayProfile.gender.charAt(0).toUpperCase() + displayProfile.gender.slice(1)}
                      </Text>
                    </View>
                  </View>
                )}

                {displayProfile.religion && (
                  <View style={styles.detailItem}>
                    <View style={[styles.detailIcon, { backgroundColor: primaryLight }]}>
                      <FontAwesome name="moon-o" size={16} color={primaryColor} />
                    </View>
                    <View>
                      <Text style={[styles.detailLabel, { color: textSecondary }]}>Religion</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>{displayProfile.religion}</Text>
                    </View>
                  </View>
                )}

                {displayProfile.languages && displayProfile.languages.length > 0 && (
                  <View style={styles.detailItem}>
                    <View style={[styles.detailIcon, { backgroundColor: primaryLight }]}>
                      <FontAwesome name="language" size={16} color={primaryColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.detailLabel, { color: textSecondary }]}>Languages</Text>
                      <View style={styles.languageTags}>
                        {displayProfile.languages.map((lang: string | any, index: number) => {
                          const langName = typeof lang === 'object' && lang.name ? lang.name : lang;
                          return (
                            <View key={index} style={[styles.langTag, { backgroundColor: '#F3F4F6' }]}>
                              <Text style={[styles.langTagText, { color: '#4B5563' }]}>{langName}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Services Offered Section */}
          {displayProfile.services && displayProfile.services.length > 0 && (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Services Offered</Text>
              <View style={styles.tagsContainer}>
                {displayProfile.services.map((service: string, index: number) => (
                  <View key={index} style={[styles.tag, { backgroundColor: primaryLight }]}>
                    <Text style={[styles.tagText, { color: primaryColor }]}>{service}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Service Areas Section */}
          {displayProfile.locations && displayProfile.locations.length > 0 && (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Service Areas</Text>
              <View style={styles.tagsContainer}>
                {displayProfile.locations.map((loc: string, index: number) => (
                  <View key={index} style={[styles.locationTag, { borderColor }]}>
                    <IconSymbol name="mappin.circle.fill" size={14} color={textSecondary} />
                    <Text style={[styles.locationTagText, { color: textSecondary }]}>{loc}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Service Listings Section */}
          {displayProfile.service_listings && displayProfile.service_listings.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor, paddingLeft: 4 }]}>Service Packages</Text>
              {displayProfile.service_listings.map((service: any, index: number) => {
                const serviceTypes = service.service_types && Array.isArray(service.service_types) && service.service_types.length > 0
                  ? service.service_types
                  : service.service_type
                    ? [service.service_type]
                    : ['Service'];

                const formatServiceType = (type: string) => {
                  return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
                };

                const monthlyRate = parseFloat(service.monthly_rate || '0');

                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.9}
                    onPress={() => router.push(`/service/${service.id}`)}
                    style={[styles.listingCard, { backgroundColor: cardBg, borderColor }]}
                  >
                    <View style={styles.listingHeader}>
                      <View style={styles.listingTitleContent}>
                        <Text style={[styles.listingTitle, { color: textColor }]}>
                          {serviceTypes.map(formatServiceType).join(', ')}
                        </Text>
                        <Text style={[styles.listingPrice, { color: primaryColor }]}>
                          {monthlyRate > 0 ? `₨${Math.floor(monthlyRate).toLocaleString()}/mo` : 'Contact for Price'}
                        </Text>
                      </View>
                      <View style={[styles.iconBox, { backgroundColor: primaryLight }]}>
                        <IconSymbol name="chevron.right" size={16} color={primaryColor} />
                      </View>
                    </View>

                    {service.description && (
                      <Text style={[styles.listingDesc, { color: textSecondary }]} numberOfLines={2}>
                        {service.description}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Other Services Section */}
          {otherServices.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor, paddingLeft: 4 }]}>More from {displayProfile.name}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 20 }}
              >
                {otherServices.map((service: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.miniCard, { backgroundColor: cardBg, borderColor }]}
                    onPress={() => router.push(`/profile/helper/${service.id}` as any)}
                  >
                    <View style={[styles.miniCardIcon, { backgroundColor: primaryLight }]}>
                      <IconSymbol name="briefcase.fill" size={20} color={primaryColor} />
                    </View>
                    <Text style={[styles.miniCardTitle, { color: textColor }]} numberOfLines={1}>
                      {service.service_type
                        ? service.service_type.charAt(0).toUpperCase() + service.service_type.slice(1).replace('_', ' ')
                        : 'Service'}
                    </Text>
                    <Text style={[styles.miniCardPrice, { color: textSecondary }]}>
                      ₨{service.monthly_rate?.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {(() => {
        const isHelper = type === 'helper';
        const isBusiness = type === 'business';
        // Always show contact options
        const shouldShowContact = true;

        if (!displayProfile) {
          return null;
        }

        return (
          <View style={[styles.bottomBar, { backgroundColor: cardBg, borderColor, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', borderWidth: 1 }]}
                onPress={() => handleCall(displayProfile.phone_number)}
              >
                <IconSymbol name="phone.fill" size={24} color="#374151" />
                <Text style={[styles.actionBtnText, { color: '#374151' }]}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                onPress={() => handleWhatsApp(displayProfile.phone_number)}
              >
                <FontAwesome name="whatsapp" size={24} color="#FFFFFF" />
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: primaryColor }]}
                onPress={() => router.push(`/chat/${displayProfile.id}`)}
              >
                <IconSymbol name="message.fill" size={24} color="#FFFFFF" />
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  serviceType: {
    fontSize: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  locationTagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listingCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listingTitleContent: {
    flex: 1,
    marginRight: 12,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  listingPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  miniCard: {
    width: 150,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
  },
  miniCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  miniCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  miniCardPrice: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 72,
    borderRadius: 16,
    gap: 4,
    paddingVertical: 12,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsList: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  languageTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  langTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
