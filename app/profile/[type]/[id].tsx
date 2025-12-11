import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
            _user: user
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
        style={[styles.scrollView, { backgroundColor }]} 
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        horizontal={false}
        bounces={false}
        alwaysBounceHorizontal={false}
        alwaysBounceVertical={false}
      >
        {/* Header Background */}
        <View style={styles.headerBackground}>
          <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>Profile</ThemedText>
            <View style={{ width: 40 }} />
          </View>
        </View>

        {/* Profile Content */}
        <View style={styles.profileContentContainer}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {displayProfile.profileImage ? (
                <Image source={{ uri: displayProfile.profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>{displayProfile.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              {displayProfile.verified && (
                <View style={styles.verifiedBadge}>
                  <IconSymbol name="checkmark.seal.fill" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>

            <ThemedText type="title" style={styles.name}>{displayProfile.name}</ThemedText>
            <Text style={styles.serviceType}>{displayProfile.service}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <IconSymbol name="star.fill" size={16} color="#FFC107" />
                <Text style={styles.statValue}>
                  {typeof displayProfile.rating === 'number' ? displayProfile.rating.toFixed(1) : displayProfile.rating}
                </Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <IconSymbol name="clock.fill" size={16} color={Colors.light.primary} />
                <Text style={styles.statValue}>{displayProfile.experience}</Text>
                <Text style={styles.statLabel}>Experience</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <IconSymbol name="location.fill" size={16} color="#EF4444" />
                <Text style={styles.statValue} numberOfLines={1}>
                  {displayProfile.location.split(',')[0]}
                </Text>
                <Text style={styles.statLabel}>Location</Text>
              </View>
            </View>

            {/* Contact Actions */}

          </View>

          {/* About Section */}
          {displayProfile.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{displayProfile.bio}</Text>
            </View>
          )}

          {/* Services Offered Section - from listing.service_types */}
          {displayProfile.services && displayProfile.services.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Services Offered</Text>
              <View style={styles.tagsContainer}>
                {displayProfile.services.map((service: string, index: number) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{service}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Service Areas Section - from listing.location_details */}
          {displayProfile.locations && displayProfile.locations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Areas</Text>
              <View style={styles.tagsContainer}>
                <IconSymbol name="mappin.circle.fill" size={16} color="#8B5CF6" />
                {displayProfile.locations.map((loc: string, index: number) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{loc}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Service Listings Section */}
          {displayProfile.service_listings && displayProfile.service_listings.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Services</Text>
              {displayProfile.service_listings.map((service: any, index: number) => {
                // Get service types from service.service_types array
                const serviceTypes = service.service_types && Array.isArray(service.service_types) && service.service_types.length > 0
                  ? service.service_types
                  : service.service_type
                  ? [service.service_type]
                  : ['Service'];

                const formatServiceType = (type: string) => {
                  return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
                };

                // Extract locations from service.location_details array
                const serviceLocations: string[] = [];
                if (service.location_details && Array.isArray(service.location_details)) {
                  service.location_details.forEach((loc: any) => {
                    // Prefer display_text if available
                    if (loc.display_text) {
                      if (!serviceLocations.includes(loc.display_text)) {
                        serviceLocations.push(loc.display_text);
                      }
                    } else {
                      const cityName = loc.city_name || loc.city || '';
                      const area = loc.area || loc.area_name || '';
                      if (cityName && area) {
                        const formatted = `${cityName}, ${area}`;
                        if (!serviceLocations.includes(formatted)) {
                          serviceLocations.push(formatted);
                        }
                      } else if (area) {
                        if (!serviceLocations.includes(area)) {
                          serviceLocations.push(area);
                        }
                      } else if (cityName) {
                        if (!serviceLocations.includes(cityName)) {
                          serviceLocations.push(cityName);
                        }
                      }
                    }
                  });
                } else if (service.area && service.city) {
                  serviceLocations.push(`${service.city}, ${service.area}`);
                } else if (service.area) {
                  serviceLocations.push(service.area);
                } else if (service.city) {
                  serviceLocations.push(service.city);
                }

                const monthlyRate = parseFloat(service.monthly_rate || '0');

                return (
                  <View key={index} style={styles.serviceCard}>
                    <View style={styles.serviceCardHeader}>
                      <View style={styles.serviceTitleRow}>
                        <View style={styles.serviceIconSmall}>
                          <IconSymbol name="wrench.fill" size={14} color={Colors.light.primary} />
                        </View>
                        <Text style={styles.serviceCardTitle}>
                          {serviceTypes.length === 1
                            ? formatServiceType(serviceTypes[0])
                            : `${formatServiceType(serviceTypes[0])} +${serviceTypes.length - 1} more`}
                        </Text>
                      </View>
                      {monthlyRate > 0 && (
                        <Text style={styles.serviceCardPrice}>
                          ₨{Math.floor(monthlyRate).toLocaleString()}/mo
                        </Text>
                      )}
                    </View>

                    {/* Service Types Tags */}
                    {serviceTypes.length > 1 && (
                      <View style={styles.serviceTypesContainer}>
                        {serviceTypes.slice(0, 3).map((serviceType: string, idx: number) => (
                          <View key={idx} style={styles.serviceTypeTag}>
                            <Text style={styles.serviceTypeTagText}>{formatServiceType(serviceType)}</Text>
                          </View>
                        ))}
                        {serviceTypes.length > 3 && (
                          <View style={styles.serviceTypeTag}>
                            <Text style={styles.serviceTypeTagText}>+{serviceTypes.length - 3} more</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {service.description && (
                      <Text style={styles.serviceCardDescription} numberOfLines={3}>
                        {service.description}
                      </Text>
                    )}

                    <View style={styles.serviceCardMeta}>
                      {service.work_type && (
                        <View style={styles.metaItem}>
                          <IconSymbol name="clock.fill" size={12} color="#6B7280" />
                          <Text style={styles.metaText}>
                            {service.work_type.charAt(0).toUpperCase() + service.work_type.slice(1).replace('_', ' ')}
                          </Text>
                        </View>
                      )}

                      {serviceLocations.length > 0 && (
                        <View style={styles.metaItem}>
                          <IconSymbol name="location.fill" size={12} color="#6B7280" />
                          <Text style={styles.metaText}>
                            {serviceLocations.slice(0, 2).join(', ')}
                            {serviceLocations.length > 2 && ` +${serviceLocations.length - 2} more`}
                          </Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.viewDetailBtn}
                      onPress={() => {
                        router.push(`/service/${service.id}`);
                      }}
                    >
                      <Text style={styles.viewDetailBtnText}>View Details</Text>
                      <IconSymbol name="chevron.right" size={16} color={Colors.light.primary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}


          {/* Other Services Section */}
          {otherServices.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>More from {displayProfile.name}</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingRight: 20 }}
                style={{ width: '100%' }}
              >
                {otherServices.map((service: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.otherServiceCard}
                    onPress={() => router.push(`/profile/helper/${service.id}` as any)}
                  >
                    <View style={styles.otherServiceIcon}>
                      <IconSymbol name="briefcase.fill" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.otherServiceName} numberOfLines={1}>
                      {service.service_type
                        ? service.service_type.charAt(0).toUpperCase() + service.service_type.slice(1).replace('_', ' ')
                        : 'Service'}
                    </Text>
                    <Text style={styles.otherServicePrice}>₨{service.monthly_rate?.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar - Only show contact buttons if allowed */}
      {(() => {
        const isHelper = type === 'helper';
        const isBusiness = type === 'business';
        // Show contact buttons if: not helper/business OR (helper/business AND canContact)
        const shouldShowContact = !isHelper && !isBusiness ? true : canContact;
        
        if (!shouldShowContact) {
          return null;
        }

        return (
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.callBtn]}
                onPress={() => handleCall(displayProfile.phone_number)}
              >
                <IconSymbol name="phone.fill" size={24} color="#1F2937" />
                <Text style={[styles.actionBtnText, { color: '#1F2937' }]}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.whatsappBtn]}
                onPress={() => handleWhatsApp(displayProfile.phone_number)}
              >
                <FontAwesome name="whatsapp" size={24} color="#FFFFFF" />
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.messageBtn]}
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
    width: '100%',
    alignSelf: 'stretch',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  headerBackground: {
    backgroundColor: Colors.light.primary,
    height: 220,
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
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  profileContentContainer: {
    paddingHorizontal: 20,
    marginTop: -100,
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    backgroundColor: Colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  contactActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 24,
    width: '100%',
    maxWidth: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  serviceIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  serviceCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  serviceCardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  serviceCardDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
    marginBottom: 16,
  },
  serviceCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  serviceTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  serviceTypeTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  serviceTypeTagText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  otherServiceCard: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 20,
    width: 160,
    marginRight: 12,
  },
  otherServiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  otherServiceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  otherServicePrice: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
    paddingVertical: 12,
    borderRadius: 16,
    gap: 4,
    height: 72,
  },
  callBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
  },
  messageBtn: {
    backgroundColor: Colors.light.primary,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    gap: 6,
  },
  viewDetailBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
});
