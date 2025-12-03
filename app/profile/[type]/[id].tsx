import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { apiService } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otherServices, setOtherServices] = useState<any[]>([]);
  const [isLoadingOtherServices, setIsLoadingOtherServices] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        // Fetch service listing detail using the listing ID
        const endpoint = API_ENDPOINTS.SERVICE_LISTINGS.GET;

        const response = await apiService.get(
          endpoint,
          { id: id as string }
        );

        console.log('📦 Service Listing API Response:', JSON.stringify(response, null, 2));

        if (response.success && response.data) {
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
            // Handle multiple services - check service_types array first
            services: (() => {
              const servicesList = [];
              
              // Check if service_types is an array (multiple services)
              if (listing.service_types && Array.isArray(listing.service_types) && listing.service_types.length > 0) {
                listing.service_types.forEach((serviceType: string) => {
                  const formatted = serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('_', ' ');
                  if (!servicesList.includes(formatted)) {
                    servicesList.push(formatted);
                  }
                });
              }
              
              // Check if services is an array
              if (listing.services && Array.isArray(listing.services) && listing.services.length > 0) {
                listing.services.forEach((s: any) => {
                  const serviceName = s.service_type
                    ? s.service_type.charAt(0).toUpperCase() + s.service_type.slice(1).replace('_', ' ')
                    : s.name || 'Service';
                  if (!servicesList.includes(serviceName)) {
                    servicesList.push(serviceName);
                  }
                });
              }
              
              // Fallback to single service_type
              if (servicesList.length === 0 && listing.service_type) {
                servicesList.push(
                  listing.service_type.charAt(0).toUpperCase() + listing.service_type.slice(1).replace('_', ' ')
                );
              }
              
              // Final fallback
              if (servicesList.length === 0) {
                servicesList.push('Service');
              }
              
              return servicesList;
            })(),
            // Handle multiple locations - prioritize location_details
            locations: (() => {
              const locs = [];

              // First, check location_details (primary source)
              if (listing.location_details && Array.isArray(listing.location_details) && listing.location_details.length > 0) {
                listing.location_details.forEach((loc: any) => {
                  const locationName = loc.name || loc.location_name || '';
                  const area = loc.area || loc.area_name || '';
                  
                  if (locationName && area) {
                    const formatted = `${locationName}, ${area}`;
                    if (!locs.includes(formatted)) {
                      locs.push(formatted);
                    }
                  } else if (locationName) {
                    if (!locs.includes(locationName)) {
                      locs.push(locationName);
                    }
                  } else if (area) {
                    if (!locs.includes(area)) {
                      locs.push(area);
                    }
                  }
                });
              }

              // Add from listing.locations array if it exists
              if (listing.locations && Array.isArray(listing.locations)) {
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

              // Add individual location fields as fallback
              if (locs.length === 0) {
                if (listing.area) locs.push(listing.area);
                if (listing.location?.name) locs.push(listing.location.name);
                if (listing.location_name) locs.push(listing.location_name);
              }

              // Remove duplicates and filter out empty values
              return [...new Set(locs.filter(Boolean))];
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#6366F1" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            {displayProfile.name}
          </ThemedText>
          <TouchableOpacity onPress={() => router.push(`/chat/${displayProfile.id}`)}>
            <IconSymbol name="message.fill" size={24} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {/* Service Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayProfile.name.charAt(0).toUpperCase()}</Text>
          </View>

          <ThemedText type="title" style={styles.providerName}>
            {displayProfile.name}
          </ThemedText>

          {/* Service Badge - Show first service or count if multiple */}
          <View style={styles.serviceBadge}>
            <Text style={styles.serviceBadgeText}>
              {displayProfile.services && displayProfile.services.length > 0
                ? displayProfile.services.length === 1
                  ? displayProfile.services[0]
                  : `${displayProfile.services.length} Services`
                : displayProfile.service}
            </Text>
          </View>

          {/* Rating */}
          {displayProfile.rating > 0 && (
            <View style={styles.ratingContainer}>
              <IconSymbol name="star.fill" size={18} color="#FFC107" />
              <ThemedText style={styles.rating}>
                {typeof displayProfile.rating === 'number' ? displayProfile.rating.toFixed(1) : displayProfile.rating}
              </ThemedText>
              {displayProfile.reviews > 0 && (
                <ThemedText style={styles.reviews}>({displayProfile.reviews} reviews)</ThemedText>
              )}
            </View>
          )}
        </View>

        {/* Price Card */}
        {displayProfile.price > 0 && (
          <View style={styles.priceCard}>
            <ThemedText style={styles.priceLabel}>Monthly Rate</ThemedText>
            <ThemedText style={styles.priceValue}>₨{displayProfile.price.toLocaleString()}</ThemedText>
            <ThemedText style={styles.priceSubtext}>per month</ThemedText>
          </View>
        )}

        {/* Key Details */}
        <View style={styles.detailsGrid}>
          {/* Location */}
          <View style={styles.detailCard}>
            <View style={styles.detailIconContainer}>
              <IconSymbol name="location.fill" size={20} color="#6366F1" />
            </View>
            <ThemedText style={styles.detailLabel}>
              {displayProfile.locations && displayProfile.locations.length > 1 ? 'Locations' : 'Location'}
            </ThemedText>
            <ThemedText style={styles.detailValue} numberOfLines={2}>
              {displayProfile.locations && displayProfile.locations.length > 0
                ? displayProfile.locations.length === 1
                  ? displayProfile.locations[0]
                  : `${displayProfile.locations.length} Areas`
                : displayProfile.location}
            </ThemedText>
          </View>

          {/* Experience */}
          {displayProfile.experience !== 'N/A' && (
            <View style={styles.detailCard}>
              <View style={styles.detailIconContainer}>
                <IconSymbol name="clock.fill" size={20} color="#6366F1" />
              </View>
              <ThemedText style={styles.detailLabel}>Experience</ThemedText>
              <ThemedText style={styles.detailValue}>{displayProfile.experience}</ThemedText>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            About This Service
          </ThemedText>
          <View style={styles.descriptionCard}>
            <ThemedText style={styles.bio}>{displayProfile.bio}</ThemedText>
          </View>
        </View>

        {/* Services Offered - Always show if services array exists */}
        {displayProfile.services && displayProfile.services.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {displayProfile.services.length === 1 ? 'Service Offered' : 'Services Offered'}
            </ThemedText>
            <View style={styles.servicesTagsContainer}>
              {displayProfile.services.map((service: string, index: number) => (
                <View key={index} style={styles.serviceTagChip}>
                  <Text style={styles.serviceTagChipText}>{service}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Service Locations */}
        {displayProfile.locations && displayProfile.locations.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Service Areas
            </ThemedText>
            <View style={styles.locationsContainer}>
              {displayProfile.locations.map((location: string, index: number) => (
                <View key={index} style={styles.locationChip}>
                  <IconSymbol name="location.fill" size={14} color="#6366F1" />
                  <Text style={styles.locationChipText}>{location}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Other Services from Same Provider */}
        {otherServices.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Other Services by {displayProfile.name}
            </ThemedText>
            {isLoadingOtherServices ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.otherServicesScroll}
              >
                {otherServices.map((service: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.otherServiceCard}
                    onPress={() => router.push(`/profile/helper/${service.id}` as any)}
                  >
                    <View style={styles.otherServiceHeader}>
                      <View style={styles.otherServiceBadge}>
                        <Text style={styles.otherServiceBadgeText}>
                          {service.service_type
                            ? service.service_type.charAt(0).toUpperCase() + service.service_type.slice(1).replace('_', ' ')
                            : 'Service'}
                        </Text>
                      </View>
                    </View>
                    <ThemedText style={styles.otherServiceDescription} numberOfLines={2}>
                      {service.description || 'No description'}
                    </ThemedText>
                    <View style={styles.otherServiceFooter}>
                      <View style={styles.otherServiceLocation}>
                        <IconSymbol name="location.fill" size={12} color="#999" />
                        <Text style={styles.otherServiceLocationText}>
                          {service.area || service.location?.name || 'N/A'}
                        </Text>
                      </View>
                      {service.monthly_rate > 0 && (
                        <Text style={styles.otherServicePrice}>
                          ₨{service.monthly_rate.toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push(`/chat/${displayProfile.id}`)}
          >
            <IconSymbol name="message.fill" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Contact Provider</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookButton}>
            <IconSymbol name="calendar" size={20} color="#FFFFFF" />
            <Text style={styles.bookButtonText}>Book Service</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  heroSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#6366F1',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  providerName: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  serviceBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  serviceBadgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366F1',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rating: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  reviews: {
    fontSize: 14,
    color: '#666',
  },
  priceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6366F1',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 4,
  },
  priceSubtext: {
    fontSize: 14,
    color: '#999',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  detailIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  bio: {
    fontSize: 15,
    lineHeight: 24,
    color: '#666',
  },
  servicesTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceTagChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  serviceTagChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  locationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  locationChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  otherServicesScroll: {
    paddingRight: 20,
    gap: 12,
  },
  otherServiceCard: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otherServiceHeader: {
    marginBottom: 12,
  },
  otherServiceBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  otherServiceBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  otherServiceDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 12,
    minHeight: 40,
  },
  otherServiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  otherServiceLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  otherServiceLocationText: {
    fontSize: 12,
    color: '#999',
  },
  otherServicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 32,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  bookButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
