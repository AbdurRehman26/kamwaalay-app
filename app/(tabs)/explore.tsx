import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { Colors } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Helper {
  id: string | number;
  name?: string;
  user?: {
    id: string | number;
    name?: string;
    email?: string;
    phone_number?: string;
    phoneNumber?: string;
  };
  phone_number?: string;
  phoneNumber?: string;
  bio?: string;
  experience_years?: number;
  services?: Array<{
    id?: string | number;
    service_type?: string;
    monthly_rate?: number;
    location_id?: number;
    location?: {
      id?: number;
      name?: string;
    };
    area?: string;
  }>;
  service_listings?: Array<{
    id?: string | number;
    service_type?: string;
    monthly_rate?: number;
    location_id?: number;
    location?: {
      id?: number;
      name?: string;
    };
    area?: string;
    location_details?: Array<{
      id?: number | string;
      name?: string;
      area?: string;
      location_name?: string;
      area_name?: string;
    }>;
  }>;
  area?: string;
  rating?: number;
  reviews_count?: number;
  profile_image?: string;
  location_details?: Array<{
    id?: number | string;
    name?: string;
    area?: string;
    location_name?: string;
    area_name?: string;
  }>;
  locations?: string[];
  role?: string;
  user_type?: string;
  verified?: boolean;
  is_verified?: boolean;
}

interface Location {
  id: number | string;
  name: string;
  area?: string;
}

interface FilterState {
  services: string[];
  locations: string[];
  minExperience: number | null;
  minRating: number | null;
}

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getHelpers } = useApp();
  const insets = useSafeAreaInsets();
  const [mainTab, setMainTab] = useState<'helpers' | 'service-providers'>('service-providers');

  // Tab-specific search queries
  const [searchQueryHelpers, setSearchQueryHelpers] = useState('');
  const [searchQueryServices, setSearchQueryServices] = useState('');

  // Tab-specific role filters
  const [selectedFilterHelpers, setSelectedFilterHelpers] = useState<'all' | 'helper' | 'business'>('all');
  const [selectedFilterServices, setSelectedFilterServices] = useState<'all' | 'helper' | 'business'>('all');

  // Tab-specific secondary filters
  const [selectedTabHelpers, setSelectedTabHelpers] = useState<'all' | 'top-rated' | 'experienced' | 'verified'>('all');
  const [selectedTabServices, setSelectedTabServices] = useState<'all' | 'top-rated' | 'experienced' | 'verified'>('all');

  // Tab-specific filter states
  const [filtersHelpers, setFiltersHelpers] = useState<FilterState>({
    services: [],
    locations: [],
    minExperience: null,
    minRating: null,
  });
  const [filtersServices, setFiltersServices] = useState<FilterState>({
    services: [],
    locations: [],
    minExperience: null,
    minRating: null,
  });

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [helpersFromAPI, setHelpersFromAPI] = useState<Helper[]>([]);
  const [isLoadingHelpers, setIsLoadingHelpers] = useState(false);
  const serviceProviders = getHelpers(); // Service listings from AppContext

  // Get current tab's state
  const searchQuery = mainTab === 'helpers' ? searchQueryHelpers : searchQueryServices;
  const setSearchQuery = mainTab === 'helpers' ? setSearchQueryHelpers : setSearchQueryServices;
  const selectedFilter = mainTab === 'helpers' ? selectedFilterHelpers : selectedFilterServices;
  const setSelectedFilter = mainTab === 'helpers' ? setSelectedFilterHelpers : setSelectedFilterServices;
  const selectedTab = mainTab === 'helpers' ? selectedTabHelpers : selectedTabServices;
  const setSelectedTab = mainTab === 'helpers' ? setSelectedTabHelpers : setSelectedTabServices;
  const filters = mainTab === 'helpers' ? filtersHelpers : filtersServices;
  const setFilters = mainTab === 'helpers' ? setFiltersHelpers : setFiltersServices;

  // Get service filter from route params
  const routeParams = useLocalSearchParams();
  const serviceFilter = routeParams?.service as string | undefined;

  // Fetch helpers from API when helpers tab is selected
  useEffect(() => {
    if (mainTab === 'helpers') {
      fetchHelpersFromAPI();
    }
  }, [mainTab]);

  const fetchHelpersFromAPI = async () => {
    try {
      setIsLoadingHelpers(true);
      const response = await apiService.get(
        API_ENDPOINTS.HELPERS.LIST,
        undefined,
        {
          sort_by: 'rating',
          user_type: 'all',
          page: '1',
        },
        false
      );

      if (response.success && response.data) {
        let helpersData: Helper[] = [];

        if (response.data.helpers) {
          if (response.data.helpers.data) {
            helpersData = Array.isArray(response.data.helpers.data)
              ? response.data.helpers.data
              : [];
          } else {
            helpersData = Array.isArray(response.data.helpers)
              ? response.data.helpers
              : [];
          }
        } else if (Array.isArray(response.data)) {
          helpersData = response.data;
        } else if (response.data.data) {
          helpersData = Array.isArray(response.data.data) ? response.data.data : [];
        }

        setHelpersFromAPI(helpersData);
      } else {
        setHelpersFromAPI([]);
      }
    } catch (error) {
      console.error('Error fetching helpers:', error);
      setHelpersFromAPI([]);
    } finally {
      setIsLoadingHelpers(false);
    }
  };

  // Get current data source based on main tab
  const currentData = mainTab === 'helpers' ? helpersFromAPI : serviceProviders;

  // Extract unique services from current data
  const availableServices = useMemo(() => {
    const serviceSet = new Set<string>();
    currentData.forEach((helper: Helper) => {
      if (helper.services && helper.services.length > 0) {
        helper.services.forEach((service) => {
          if (service.service_type) {
            const serviceType = service.service_type.charAt(0).toUpperCase() + service.service_type.slice(1).replace('_', ' ');
            serviceSet.add(serviceType);
          }
        });
      }
    });
    return Array.from(serviceSet).sort();
  }, [currentData]);

  // Extract unique locations from current data
  const availableLocationsFromHelpers = useMemo(() => {
    const locationSet = new Set<string>();
    currentData.forEach((helper: Helper) => {
      if (helper.location_details && Array.isArray(helper.location_details) && helper.location_details.length > 0) {
        helper.location_details.forEach((loc) => {
          const locationName = loc.name || loc.location_name || '';
          const area = loc.area || loc.area_name || '';
          if (locationName && area) {
            locationSet.add(`${locationName}, ${area}`);
          } else if (locationName) {
            locationSet.add(locationName);
          } else if (area) {
            locationSet.add(area);
          }
        });
      }
      if (helper.locations && Array.isArray(helper.locations)) {
        helper.locations.forEach((loc) => {
          if (loc) locationSet.add(loc);
        });
      }
      if (helper.services && helper.services.length > 0) {
        helper.services.forEach((service) => {
          if (service.location?.name) {
            locationSet.add(service.location.name);
          }
          if (service.area) {
            locationSet.add(service.area);
          }
        });
      }
      if (helper.area) {
        locationSet.add(helper.area);
      }
    });
    return Array.from(locationSet).sort();
  }, [currentData]);

  // Search locations from API
  const searchLocations = async (query: string) => {
    if (query.trim().length < 2) {
      setLocations([]);
      return;
    }

    try {
      setIsLoadingLocations(true);
      const response = await apiService.get(
        API_ENDPOINTS.LOCATIONS.SEARCH,
        undefined,
        { q: query },
        false
      );

      if (response.success && response.data) {
        let locationsData: Location[] = [];

        if (response.data.locations) {
          locationsData = Array.isArray(response.data.locations.data)
            ? response.data.locations.data
            : (Array.isArray(response.data.locations) ? response.data.locations : []);
        } else if (Array.isArray(response.data)) {
          locationsData = response.data;
        } else if (response.data.data) {
          locationsData = Array.isArray(response.data.data) ? response.data.data : [];
        }

        const mappedLocations: Location[] = locationsData.map((loc: any) => ({
          id: loc.id || loc.location_id || loc.name,
          name: loc.name || loc.location_name || '',
          area: loc.area || loc.area_name,
        }));

        setLocations(mappedLocations);
      } else {
        setLocations([]);
      }
    } catch (error) {
      setLocations([]);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Debounce location search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationSearch.trim()) {
        searchLocations(locationSearch);
      } else {
        setLocations([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationSearch]);

  // For helpers/businesses, redirect to requests tab (which shows jobs)
  useEffect(() => {
    if (user?.userType === 'helper' || user?.userType === 'business') {
      router.replace('/(tabs)/job-posts');
    }
  }, [user?.userType, router]);

  if (user?.userType === 'helper' || user?.userType === 'business') {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Redirecting...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Helper function to get helper name
  const getHelperName = (helper: Helper) => {
    return helper.name || helper.user?.name || 'Unknown';
  };

  // Helper function to get helper ID (listing ID for service listing detail)
  const getHelperId = (helper: Helper) => {
    // Use listing ID for service listing detail navigation
    return helper.id?.toString() || helper.user?.id?.toString() || '';
  };

  // Helper function to get role/type
  const getRole = (helper: Helper) => {
    // Check if helper has a role field (from API)
    const role = (helper as any).role || (helper as any).user_type || (helper as any).userType;
    if (role) {
      return role.charAt(0).toUpperCase() + role.slice(1);
    }
    // Fallback to service type or default
    if (helper.services && helper.services.length > 0) {
      const serviceType = helper.services[0].service_type || '';
      return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('_', ' ');
    }
    return 'Helper';
  };

  // Helper function to get primary service
  const getPrimaryService = (helper: Helper) => {
    // Check service_listings first (for helpers)
    if (helper.service_listings && helper.service_listings.length > 0) {
      const serviceType = helper.service_listings[0].service_type || '';
      return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('_', ' ');
    }
    // Fallback to services
    if (helper.services && helper.services.length > 0) {
      const serviceType = helper.services[0].service_type || '';
      return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('_', ' ');
    }
    return 'Service Provider';
  };

  // Helper function to get primary service ID
  const getPrimaryServiceId = (helper: Helper) => {
    // Check service_listings first (for helpers)
    if (helper.service_listings && helper.service_listings.length > 0) {
      return helper.service_listings[0].id;
    }
    // Fallback to services
    if (helper.services && helper.services.length > 0) {
      return helper.services[0].id;
    }
    return null;
  };

  // Helper function to get price
  const getPrice = (helper: Helper) => {
    // Check service_listings first (for helpers)
    if (helper.service_listings && helper.service_listings.length > 0) {
      return helper.service_listings[0].monthly_rate || 0;
    }
    // Fallback to services
    if (helper.services && helper.services.length > 0) {
      return helper.services[0].monthly_rate || 0;
    }
    return 0;
  };

  // Helper function to get all locations formatted
  const getAllLocationsFormatted = (helper: Helper): string[] => {
    const locationList: string[] = [];
    const seenLocations = new Set<string>();

    // Helper function to add unique location
    const addUniqueLocation = (location: string) => {
      if (location) {
        const locationLower = location.toLowerCase().trim();
        if (!seenLocations.has(locationLower)) {
          seenLocations.add(locationLower);
          locationList.push(location);
        }
      }
    };

    // First, check service_listings for helpers (primary source)
    if (helper.service_listings && Array.isArray(helper.service_listings) && helper.service_listings.length > 0) {
      for (let i = 0; i < helper.service_listings.length; i++) {
        const serviceListing = helper.service_listings[i];
        if (serviceListing.location_details && Array.isArray(serviceListing.location_details)) {
          for (let j = 0; j < serviceListing.location_details.length; j++) {
            const loc = serviceListing.location_details[j];
            const locationName = loc.name || loc.location_name || '';
            const area = loc.area || loc.area_name || '';

            if (locationName && area) {
              addUniqueLocation(`${locationName}, ${area}`);
            } else if (locationName) {
              addUniqueLocation(locationName);
            } else if (area) {
              addUniqueLocation(area);
            }
          }
        }
      }
    }

    // Check for location_details (primary source for non-helpers)
    if (locationList.length === 0 && helper.location_details && Array.isArray(helper.location_details) && helper.location_details.length > 0) {
      helper.location_details.forEach((loc) => {
        const locationName = loc.name || loc.location_name || '';
        const area = loc.area || loc.area_name || '';

        if (locationName && area) {
          addUniqueLocation(`${locationName}, ${area}`);
        } else if (locationName) {
          addUniqueLocation(locationName);
        } else if (area) {
          addUniqueLocation(area);
        }
      });
    }

    // Fallback to locations array if location_details is not available
    if (locationList.length === 0 && helper.locations && Array.isArray(helper.locations) && helper.locations.length > 0) {
      helper.locations.forEach((loc) => {
        if (loc) {
          addUniqueLocation(loc);
        }
      });
    }

    // Fallback to services locations
    if (locationList.length === 0 && helper.services && helper.services.length > 0) {
      helper.services.forEach((service) => {
        const locationName = service.location?.name || '';
        const area = service.area || '';

        if (locationName && area) {
          addUniqueLocation(`${locationName}, ${area}`);
        } else if (locationName) {
          addUniqueLocation(locationName);
        } else if (area) {
          addUniqueLocation(area);
        }
      });
    }

    // Check if area is at helper level
    if (locationList.length === 0 && helper.area) {
      addUniqueLocation(helper.area);
    }

    return locationList.length > 0 ? locationList : ['Location not specified'];
  };

  // Helper function to get phone number
  const getPhoneNumber = (helper: Helper): string | null => {
    return helper.phone_number || helper.phoneNumber || helper.user?.phone_number || helper.user?.phoneNumber || null;
  };

  // Helper function to format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    // Ensure it starts with country code
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
  const handleCall = (phoneNumber: string | null, e?: any) => {
    if (e) e.stopPropagation();
    if (!phoneNumber) {
      Alert.alert('Phone Number', 'Phone number not available for this provider');
      return;
    }
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Phone dialer is not available on this device');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open phone dialer');
      });
  };

  // Handle WhatsApp
  const handleWhatsApp = (phoneNumber: string | null, e?: any) => {
    if (e) e.stopPropagation();
    if (!phoneNumber) {
      Alert.alert('Phone Number', 'Phone number not available for this provider');
      return;
    }
    const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
    const url = `https://wa.me/${formattedPhone.replace(/\+/g, '')}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'WhatsApp is not available on this device');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp');
      });
  };

  // Handle in-app message
  const handleInAppMessage = (providerId: string, providerName: string, e?: any) => {
    if (e) e.stopPropagation();
    router.push(`/chat/${providerId}?name=${encodeURIComponent(providerName)}`);
  };

  // Helper function to format services as "x, x +2 more"
  const formatServicesText = (helper: Helper): string => {
    if (!helper.services || helper.services.length === 0) return '';
    const serviceNames = helper.services.map((s) => {
      const serviceType = s.service_type || '';
      return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('_', ' ');
    });

    if (serviceNames.length <= 2) {
      return serviceNames.join(', ');
    }
    return `${serviceNames.slice(0, 2).join(', ')} +${serviceNames.length - 2} more`;
  };

  // Helper function to format locations as "x, x +2 more"
  const formatLocationsText = (locations: string[]): string => {
    if (locations.length === 0) return '';
    if (locations.length <= 2) {
      return locations.join(', ');
    }
    return `${locations.slice(0, 2).join(', ')} +${locations.length - 2} more`;
  };

  // Render card for any provider (helper or business)
  const renderProviderCard = (item: Helper) => {
    const providerId = getHelperId(item);
    const providerName = getHelperName(item);
    const role = getRole(item);
    const service = getPrimaryService(item);
    const price = getPrice(item);
    const locations = getAllLocationsFormatted(item);
    const rating = typeof item.rating === 'number' ? item.rating : (typeof item.rating === 'string' ? parseFloat(item.rating) : 0);
    const reviewsCount = typeof item.reviews_count === 'number' ? item.reviews_count : (typeof item.reviews_count === 'string' ? parseInt(item.reviews_count, 10) : 0);
    const bio = item.bio || 'No bio available';
    const experience = item.experience_years ? `${item.experience_years} years` : '';
    const isVerified = (item as any).verified === true || (item as any).is_verified === true;
    const servicesCount = item.services ? item.services.length : 0;
    const locationsCount = locations.length;
    const apiRole = (item.role || item.user_type || (item as any).userType || '').toLowerCase();
    const phoneNumber = getPhoneNumber(item);
    const isHelper = apiRole === 'helper';

    // Distinct card design for Service Listings (Services Tab)
    if (mainTab === 'service-providers') {
      return (
        <TouchableOpacity
          key={providerId}
          style={styles.serviceListingCard}
          onPress={() => {
            const serviceId = getPrimaryServiceId(item);
            if (serviceId) {
              router.push(`/service/${serviceId}`);
            } else {
              const profileType = apiRole === 'business' ? 'business' : 'helper';
              router.push(`/profile/${profileType}/${providerId}` as any);
            }
          }}
          activeOpacity={0.9}
        >
          <View style={styles.serviceListingHeader}>
            <View style={styles.serviceIconContainer}>
              {item.profile_image ? (
                <Image source={{ uri: item.profile_image }} style={styles.serviceAvatarImage} />
              ) : (
                <Text style={styles.serviceAvatarText}>{providerName.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <View style={styles.serviceHeaderInfo}>
              <Text style={styles.serviceListingTitle}>{service}</Text>
              <Text style={styles.serviceListingProvider}>{providerName}</Text>
            </View>
            {price > 0 && (
              <View style={styles.serviceListingPrice}>
                <Text style={styles.servicePriceText}>₨{Math.floor(price).toLocaleString()}</Text>
                <Text style={styles.servicePricePeriod}>/mo</Text>
              </View>
            )}
          </View>

          <View style={styles.serviceListingBody}>
            <View style={styles.serviceMetaRow}>
              <View style={styles.serviceMetaItem}>
                <IconSymbol name="location.fill" size={14} color="#6B7280" />
                <Text style={styles.serviceMetaText} numberOfLines={1}>
                  {locations.length > 0 ? locations[0] : 'Location not specified'}
                  {locations.length > 1 && ` +${locations.length - 1}`}
                </Text>
              </View>
              {servicesCount > 1 && (
                <>
                  <View style={styles.serviceMetaDivider} />
                  <View style={styles.serviceMetaItem}>
                    <IconSymbol name="square.stack.3d.up.fill" size={14} color="#6B7280" />
                    <Text style={styles.serviceMetaText}>
                      {servicesCount} Services
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Service Tags */}
          {(item.service_listings || item.services) && (() => {
            // Get unique service types
            const uniqueServices: string[] = [];
            const seenServices = new Set<string>();

            // Check service_listings first
            if (item.service_listings && Array.isArray(item.service_listings) && item.service_listings.length > 0) {
              for (let i = 0; i < item.service_listings.length; i++) {
                const serviceListing = item.service_listings[i];
                if (serviceListing.service_type) {
                  const serviceType = serviceListing.service_type.toLowerCase();
                  if (!seenServices.has(serviceType)) {
                    seenServices.add(serviceType);
                    const serviceName = serviceListing.service_type.charAt(0).toUpperCase() + serviceListing.service_type.slice(1).replace('_', ' ');
                    uniqueServices.push(serviceName);
                  }
                }
              }
            }

            // Fallback to services array
            if (uniqueServices.length === 0 && item.services && Array.isArray(item.services) && item.services.length > 0) {
              for (let i = 0; i < item.services.length; i++) {
                const service = item.services[i];
                if (service.service_type) {
                  const serviceType = service.service_type.toLowerCase();
                  if (!seenServices.has(serviceType)) {
                    seenServices.add(serviceType);
                    const serviceName = service.service_type.charAt(0).toUpperCase() + service.service_type.slice(1).replace('_', ' ');
                    uniqueServices.push(serviceName);
                  }
                }
              }
            }

            return uniqueServices.length > 0 ? (
              <View style={styles.serviceListingTags}>
                {uniqueServices.slice(0, 3).map((serviceName, index) => (
                  <View key={index} style={styles.serviceListingTag}>
                    <Text style={styles.serviceListingTagText}>{serviceName}</Text>
                  </View>
                ))}
                {uniqueServices.length > 3 && (
                  <View style={styles.serviceListingTagMore}>
                    <Text style={styles.serviceListingTagMoreText}>+{uniqueServices.length - 3}</Text>
                  </View>
                )}
              </View>
            ) : null;
          })()}

          <View style={styles.serviceListingFooter}>
            <View style={styles.contactOptionsContainer}>
              <View style={styles.contactButtonsRow}>
                <TouchableOpacity
                  style={styles.contactOptionIconButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCall(phoneNumber, e);
                  }}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="phone.fill" size={16} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactOptionIconButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleWhatsApp(phoneNumber, e);
                  }}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="whatsapp" size={16} color="#25D366" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactOptionIconButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleInAppMessage(providerId, providerName, e);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="message" size={16} color="#6366F1" />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={(e) => {
                e.stopPropagation();
                const serviceId = getPrimaryServiceId(item);
                if (serviceId) {
                  router.push(`/service/${serviceId}`);
                } else {
                  const profileType = apiRole === 'business' ? 'business' : 'helper';
                  router.push(`/profile/${profileType}/${providerId}` as any);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
              <IconSymbol name="chevron.right" size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={providerId}
        style={styles.card}
        onPress={() => {
          const profileType = apiRole === 'business' ? 'business' : 'helper';
          router.push(`/profile/${profileType}/${providerId}` as any);
        }}
        activeOpacity={0.8}
      >
        {/* Card Header with Gradient Background */}
        <View style={styles.cardHeaderWrapper}>
          <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {item.profile_image ? (
                  <Image source={{ uri: item.profile_image }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{providerName.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <IconSymbol name="checkmark.seal.fill" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <ThemedText type="subtitle" style={styles.cardName}>
                  {providerName}
                </ThemedText>
                {experience && (
                  <View style={styles.experienceBadge}>
                    <IconSymbol name="clock.fill" size={12} color="#6366F1" />
                    <Text style={styles.experienceText}>{experience}</Text>
                  </View>
                )}
              </View>
              {apiRole && (
                <View style={[styles.roleBadge, apiRole === 'business' && styles.roleBadgeBusiness]}>
                  <Text style={styles.roleBadgeText}>
                    {apiRole === 'business' ? 'Business' : 'Helper'}
                  </Text>
                </View>
              )}

              {/* Price Row */}
              {price > 0 && (
                <View style={styles.priceRow}>
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceLabelSmall}>Starting from</Text>
                    <Text style={styles.priceAmount}>₨{Math.floor(price).toLocaleString()}/mo</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Bio Section */}
        <ThemedText style={styles.cardBio} numberOfLines={2}>
          {bio}
        </ThemedText>

        {/* Services Tags for Businesses */}
        {!isHelper && (item.service_listings || item.services) && (() => {
          // Get unique service types
          const uniqueServices: string[] = [];
          const seenServices = new Set<string>();

          // Check service_listings first (similar to helpers)
          if (item.service_listings && Array.isArray(item.service_listings) && item.service_listings.length > 0) {
            for (let i = 0; i < item.service_listings.length; i++) {
              const serviceListing = item.service_listings[i];
              if (serviceListing.service_type) {
                const serviceType = serviceListing.service_type.toLowerCase();
                if (!seenServices.has(serviceType)) {
                  seenServices.add(serviceType);
                  const serviceName = serviceListing.service_type.charAt(0).toUpperCase() + serviceListing.service_type.slice(1).replace('_', ' ');
                  uniqueServices.push(serviceName);
                }
              }
            }
          }

          // Fallback to services array
          if (uniqueServices.length === 0 && item.services && Array.isArray(item.services) && item.services.length > 0) {
            for (let i = 0; i < item.services.length; i++) {
              const service = item.services[i];
              if (service.service_type) {
                const serviceType = service.service_type.toLowerCase();
                if (!seenServices.has(serviceType)) {
                  seenServices.add(serviceType);
                  const serviceName = service.service_type.charAt(0).toUpperCase() + service.service_type.slice(1).replace('_', ' ');
                  uniqueServices.push(serviceName);
                }
              }
            }
          }

          return uniqueServices.length > 0 ? (
            <View style={styles.cardServicesContainer}>
              {uniqueServices.slice(0, 2).map((serviceName, index) => (
                <View key={index} style={styles.cardServiceTag}>
                  <Text style={styles.cardServiceTagText}>{serviceName}</Text>
                </View>
              ))}
              {uniqueServices.length > 2 && (
                <View style={styles.cardServiceTagMore}>
                  <Text style={styles.cardServiceTagMoreText}>+{uniqueServices.length - 2} more</Text>
                </View>
              )}
            </View>
          ) : null;
        })()}

        {/* Services Tags for Helpers */}
        {isHelper && item.service_listings && item.service_listings.length > 0 && (() => {
          // Get unique service types
          const uniqueServices: string[] = [];
          const seenServices = new Set<string>();

          for (let i = 0; i < item.service_listings.length; i++) {
            const serviceListing = item.service_listings[i];
            if (serviceListing.service_type) {
              const serviceType = serviceListing.service_type.toLowerCase();
              if (!seenServices.has(serviceType)) {
                seenServices.add(serviceType);
                const serviceName = serviceListing.service_type.charAt(0).toUpperCase() + serviceListing.service_type.slice(1).replace('_', ' ');
                uniqueServices.push(serviceName);
              }
            }
          }

          return uniqueServices.length > 0 ? (
            <View style={styles.cardServicesContainer}>
              {uniqueServices.slice(0, 2).map((serviceName, index) => (
                <View key={index} style={styles.cardServiceTag}>
                  <Text style={styles.cardServiceTagText}>{serviceName}</Text>
                </View>
              ))}
              {uniqueServices.length > 2 && (
                <View style={styles.cardServiceTagMore}>
                  <Text style={styles.cardServiceTagMoreText}>+{uniqueServices.length - 2} more</Text>
                </View>
              )}
            </View>
          ) : null;
        })()}

        {/* Areas Tags for Helpers - From service_listings location_details */}
        {isHelper && item.service_listings && item.service_listings.length > 0 && (() => {
          // Get unique areas
          const uniqueAreas: string[] = [];
          const seenAreas = new Set<string>();

          for (let i = 0; i < item.service_listings.length; i++) {
            const serviceListing = item.service_listings[i];
            if (serviceListing.location_details && Array.isArray(serviceListing.location_details)) {
              for (let j = 0; j < serviceListing.location_details.length; j++) {
                const locationDetail = serviceListing.location_details[j];
                const area = locationDetail.area || locationDetail.area_name || '';
                if (area) {
                  const areaLower = area.toLowerCase().trim();
                  if (!seenAreas.has(areaLower)) {
                    seenAreas.add(areaLower);
                    uniqueAreas.push(area);
                  }
                }
              }
            }
          }

          return uniqueAreas.length > 0 ? (
            <View style={styles.locationTagsContainer}>
              <IconSymbol name="location.fill" size={14} color="#8B5CF6" />
              <View style={styles.locationTags}>
                {uniqueAreas.slice(0, 2).map((area, index) => (
                  <View key={index} style={styles.locationTag}>
                    <Text style={styles.locationTagText}>{area}</Text>
                  </View>
                ))}
                {uniqueAreas.length > 2 && (
                  <View style={styles.locationTagMore}>
                    <Text style={styles.locationTagMoreText}>+{uniqueAreas.length - 2} more</Text>
                  </View>
                )}
              </View>
            </View>
          ) : null;
        })()}

        {/* Location Tags for Businesses */}
        {!isHelper && locations.length > 0 && (() => {
          // Get unique locations
          const uniqueLocations: string[] = [];
          const seenLocations = new Set<string>();

          for (let i = 0; i < locations.length; i++) {
            const location = locations[i];
            if (location) {
              const locationLower = location.toLowerCase().trim();
              if (!seenLocations.has(locationLower)) {
                seenLocations.add(locationLower);
                uniqueLocations.push(location);
              }
            }
          }

          return uniqueLocations.length > 0 ? (
            <View style={styles.locationTagsContainer}>
              <IconSymbol name="location.fill" size={14} color="#8B5CF6" />
              <View style={styles.locationTags}>
                {uniqueLocations.slice(0, 2).map((location, index) => (
                  <View key={index} style={styles.locationTag}>
                    <Text style={styles.locationTagText}>{location}</Text>
                  </View>
                ))}
                {uniqueLocations.length > 2 && (
                  <View style={styles.locationTagMore}>
                    <Text style={styles.locationTagMoreText}>+{uniqueLocations.length - 2} more</Text>
                  </View>
                )}
              </View>
            </View>
          ) : null;
        })()}

        {/* Footer with Contact Options and Action */}
        <View style={styles.cardFooter}>
          <View style={styles.contactOptionsContainer}>
            <View style={styles.contactButtonsRow}>
              <TouchableOpacity
                style={styles.contactOptionIconButton}
                onPress={(e) => handleCall(phoneNumber, e)}
                activeOpacity={0.7}
              >
                <IconSymbol name="phone.fill" size={16} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactOptionIconButton}
                onPress={(e) => handleWhatsApp(phoneNumber, e)}
                activeOpacity={0.7}
              >
                <FontAwesome name="whatsapp" size={16} color="#25D366" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactOptionIconButton}
                onPress={(e) => handleInAppMessage(providerId, providerName, e)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="message" size={16} color="#6366F1" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles.viewProfileButton}
            onPress={(e) => {
              e.stopPropagation();
              const profileType = apiRole === 'business' ? 'business' : 'helper';
              router.push(`/profile/${profileType}/${providerId}` as any);
            }}
          >
            <Text style={styles.viewProfileButtonText}>View Profile</Text>
            <IconSymbol name="chevron.right" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Helper function to get all services for a helper
  const getAllServices = (helper: Helper): string[] => {
    // Check service_listings first (for helpers)
    if (helper.service_listings && helper.service_listings.length > 0) {
      return helper.service_listings.map((s) => {
        const serviceType = s.service_type || '';
        return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('_', ' ');
      });
    }
    // Fallback to services
    if (helper.services && helper.services.length > 0) {
      return helper.services.map((s) => {
        const serviceType = s.service_type || '';
        return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('_', ' ');
      });
    }
    return [];
  };

  // Helper function to get all locations for a helper
  const getAllLocations = (helper: Helper): string[] => {
    const locationList: string[] = [];
    const seenLocations = new Set<string>();

    // Helper function to add unique location
    const addUniqueLocation = (location: string) => {
      if (location) {
        const locationLower = location.toLowerCase().trim();
        if (!seenLocations.has(locationLower)) {
          seenLocations.add(locationLower);
          locationList.push(location);
        }
      }
    };

    // First, check service_listings for helpers (primary source)
    if (helper.service_listings && Array.isArray(helper.service_listings) && helper.service_listings.length > 0) {
      for (let i = 0; i < helper.service_listings.length; i++) {
        const serviceListing = helper.service_listings[i];
        if (serviceListing.location_details && Array.isArray(serviceListing.location_details)) {
          for (let j = 0; j < serviceListing.location_details.length; j++) {
            const loc = serviceListing.location_details[j];
            const locationName = loc.name || loc.location_name || '';
            const area = loc.area || loc.area_name || '';
            if (locationName && area) {
              addUniqueLocation(`${locationName}, ${area}`);
            } else if (locationName) {
              addUniqueLocation(locationName);
            } else if (area) {
              addUniqueLocation(area);
            }
          }
        }
      }
    }

    // Check for location_details (primary source for helpers from API)
    if (locationList.length === 0 && helper.location_details && Array.isArray(helper.location_details) && helper.location_details.length > 0) {
      helper.location_details.forEach((loc) => {
        const locationName = loc.name || loc.location_name || '';
        const area = loc.area || loc.area_name || '';
        if (locationName && area) {
          addUniqueLocation(`${locationName}, ${area}`);
        } else if (locationName) {
          addUniqueLocation(locationName);
        } else if (area) {
          addUniqueLocation(area);
        }
      });
    }

    // Fallback to locations array
    if (locationList.length === 0 && helper.locations && Array.isArray(helper.locations)) {
      helper.locations.forEach((loc) => {
        if (loc) addUniqueLocation(loc);
      });
    }

    // Fallback to services locations
    if (locationList.length === 0 && helper.services && helper.services.length > 0) {
      helper.services.forEach((service) => {
        if (service.location?.name) {
          addUniqueLocation(service.location.name);
        }
        if (service.area) {
          addUniqueLocation(service.area);
        }
      });
    }

    // Check if area is at helper level
    if (locationList.length === 0 && helper.area) {
      addUniqueLocation(helper.area);
    }

    return locationList;
  };

  // Get filtered providers based on tab selection
  const getFilteredByTab = () => {
    let providers = currentData;

    switch (selectedTab) {
      case 'top-rated':
        // Sort by rating (highest first) and take top rated
        providers = [...currentData].sort((a, b) => {
          const ratingA = typeof a.rating === 'number' ? a.rating : (typeof a.rating === 'string' ? parseFloat(a.rating) : 0);
          const ratingB = typeof b.rating === 'number' ? b.rating : (typeof b.rating === 'string' ? parseFloat(b.rating) : 0);
          return ratingB - ratingA;
        }).filter((h) => {
          const rating = typeof h.rating === 'number' ? h.rating : (typeof h.rating === 'string' ? parseFloat(h.rating) : 0);
          return !isNaN(rating) && rating >= 4.0; // Top rated = 4.0 and above
        });
        break;
      case 'experienced':
        // Filter by experience (5+ years)
        providers = currentData.filter((h) => h.experience_years !== undefined && h.experience_years >= 5);
        break;
      case 'verified':
        // Filter verified helpers (check if there's a verified field)
        providers = currentData.filter((h) => (h as any).verified === true || (h as any).is_verified === true);
        break;
      case 'all':
      default:
        providers = currentData;
    }

    return providers;
  };

  // Filter providers (helpers and businesses) based on all filters
  const filteredProviders = getFilteredByTab().filter((h: Helper) => {
    const providerName = getHelperName(h).toLowerCase();
    const service = getPrimaryService(h).toLowerCase();
    const role = getRole(h).toLowerCase();
    const bio = (h.bio || '').toLowerCase();

    // Get the actual role from API data (not the formatted display role)
    const apiRole = ((h as any).role || (h as any).user_type || (h as any).userType || '').toLowerCase();

    // If current user is a helper, exclude other helpers (only show businesses)
    if (user?.userType === 'helper' && (apiRole === 'helper' || apiRole === '')) {
      return false;
    }

    // Filter by role (helper or business)
    const matchesRole = selectedFilter === 'all' ||
      apiRole === selectedFilter.toLowerCase() ||
      (selectedFilter === 'helper' && (apiRole === 'helper' || apiRole === '')) ||
      (selectedFilter === 'business' && apiRole === 'business');

    const matchesSearch = searchQuery.trim() === '' ||
      providerName.includes(searchQuery.toLowerCase()) ||
      service.includes(searchQuery.toLowerCase()) ||
      role.includes(searchQuery.toLowerCase()) ||
      bio.includes(searchQuery.toLowerCase());

    const matchesServiceFilter = !serviceFilter ||
      service.includes(serviceFilter.toLowerCase()) ||
      serviceFilter.toLowerCase().includes(service);

    // Filter by selected services
    const matchesServices = filters.services.length === 0 ||
      getAllServices(h).some((s) => filters.services.includes(s));

    // Filter by selected locations
    const matchesLocations = filters.locations.length === 0 ||
      getAllLocations(h).some((loc) =>
        filters.locations.some((filterLoc) =>
          loc.toLowerCase().includes(filterLoc.toLowerCase()) ||
          filterLoc.toLowerCase().includes(loc.toLowerCase())
        )
      );

    // Filter by minimum experience
    const matchesExperience = filters.minExperience === null ||
      (h.experience_years !== undefined && h.experience_years >= filters.minExperience);

    return matchesRole && matchesSearch && matchesServiceFilter && matchesServices &&
      matchesLocations && matchesExperience;
  });

  // Count active filters for current tab
  const activeFiltersCount = useMemo(() => {
    const currentFilters = mainTab === 'helpers' ? filtersHelpers : filtersServices;
    const currentRoleFilter = mainTab === 'helpers' ? selectedFilterHelpers : selectedFilterServices;
    let count = 0;
    if (currentRoleFilter !== 'all') count++;
    if (currentFilters.services.length > 0) count++;
    if (currentFilters.locations.length > 0) count++;
    if (currentFilters.minExperience !== null) count++;
    return count;
  }, [mainTab, filtersHelpers, filtersServices, selectedFilterHelpers, selectedFilterServices]);

  const clearFilters = () => {
    setFilters({
      services: [],
      locations: [],
      minExperience: null,
    });
    setSelectedFilter('all');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        horizontal={false}
        contentContainerStyle={{ width: '100%' }}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 20
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.subtitle}>
            {mainTab === 'helpers'
              ? 'Find helpers and businesses near you'
              : serviceFilter
                ? `Find ${serviceFilter.toLowerCase()} services near you`
                : 'Find services near you'}
          </ThemedText>
          {serviceFilter && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <ThemedText style={styles.clearFilterText}>Clear Filter</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder={mainTab === 'helpers' ? "Search helpers..." : "Search services..."}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setShowFilterModal(true)}
          >
            <IconSymbol name="slider.horizontal.3" size={20} color={activeFiltersCount > 0 ? "#6366F1" : "#999"} />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Main Tabs */}
        <View style={styles.mainTabs}>
          <TouchableOpacity
            style={[styles.mainTabButton, mainTab === 'helpers' && styles.mainTabButtonActive]}
            onPress={() => setMainTab('helpers')}
          >
            <Text style={[styles.mainTabText, mainTab === 'helpers' && styles.mainTabTextActive]}>
              Helpers
            </Text>
            {mainTab === 'helpers' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainTabButton, mainTab === 'service-providers' && styles.mainTabButtonActive]}
            onPress={() => setMainTab('service-providers')}
          >
            <Text style={[styles.mainTabText, mainTab === 'service-providers' && styles.mainTabTextActive]}>
              Services
            </Text>
            {mainTab === 'service-providers' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Results */}
        <View style={styles.results}>
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {mainTab === 'helpers' ? 'Helpers' : 'Services'} ({filteredProviders.length})
            </ThemedText>
            {isLoadingHelpers && mainTab === 'helpers' ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <ThemedText style={styles.loadingText}>Loading helpers...</ThemedText>
              </View>
            ) : filteredProviders.length > 0 ? (
              filteredProviders.map((provider: Helper) => renderProviderCard(provider))
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol name="person.fill" size={48} color="#CCCCCC" />
                <ThemedText style={styles.emptyText}>
                  {searchQuery.trim() || serviceFilter
                    ? `No ${mainTab === 'helpers' ? 'helpers' : 'services'} found matching your search`
                    : `No ${mainTab === 'helpers' ? 'helpers' : 'services'} available at the moment`}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={styles.modalTitle}>Filters</ThemedText>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <IconSymbol name="xmark" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Type/Role Filter */}
              <View style={styles.filterSection}>
                <ThemedText type="subtitle" style={styles.filterSectionTitle}>Type</ThemedText>
                <View style={styles.chipContainer}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      selectedFilter === 'all' && styles.chipActive
                    ]}
                    onPress={() => setSelectedFilter('all')}
                  >
                    <Text style={[
                      styles.chipText,
                      selectedFilter === 'all' && styles.chipTextActive
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      selectedFilter === 'helper' && styles.chipActive
                    ]}
                    onPress={() => setSelectedFilter('helper')}
                  >
                    <Text style={[
                      styles.chipText,
                      selectedFilter === 'helper' && styles.chipTextActive
                    ]}>
                      Helpers
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      selectedFilter === 'business' && styles.chipActive
                    ]}
                    onPress={() => setSelectedFilter('business')}
                  >
                    <Text style={[
                      styles.chipText,
                      selectedFilter === 'business' && styles.chipTextActive
                    ]}>
                      Businesses
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Services Filter */}
              <View style={styles.filterSection}>
                <ThemedText type="subtitle" style={styles.filterSectionTitle}>Services</ThemedText>
                <View style={styles.chipContainer}>
                  {availableServices.map((service) => (
                    <TouchableOpacity
                      key={service}
                      style={[
                        styles.chip,
                        filters.services.includes(service) && styles.chipActive
                      ]}
                      onPress={() => {
                        setFilters((prev) => ({
                          ...prev,
                          services: prev.services.includes(service)
                            ? prev.services.filter((s) => s !== service)
                            : [...prev.services, service],
                        }));
                      }}
                    >
                      <Text style={[
                        styles.chipText,
                        filters.services.includes(service) && styles.chipTextActive
                      ]}>
                        {service}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Locations Filter */}
              <View style={styles.filterSection}>
                <ThemedText type="subtitle" style={styles.filterSectionTitle}>Locations</ThemedText>
                <TextInput
                  style={styles.locationSearchInput}
                  placeholder="Search locations..."
                  placeholderTextColor="#999"
                  value={locationSearch}
                  onChangeText={setLocationSearch}
                />
                {isLoadingLocations && (
                  <ActivityIndicator size="small" color="#6366F1" style={styles.loadingIndicator} />
                )}
                <View style={styles.chipContainer}>
                  {/* Show available locations from helpers */}
                  {availableLocationsFromHelpers.map((location) => (
                    <TouchableOpacity
                      key={location}
                      style={[
                        styles.chip,
                        filters.locations.includes(location) && styles.chipActive
                      ]}
                      onPress={() => {
                        setFilters((prev) => ({
                          ...prev,
                          locations: prev.locations.includes(location)
                            ? prev.locations.filter((l) => l !== location)
                            : [...prev.locations, location],
                        }));
                      }}
                    >
                      <Text style={[
                        styles.chipText,
                        filters.locations.includes(location) && styles.chipTextActive
                      ]}>
                        {location}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {/* Show API search results - show all locations from API */}
                  {locations.map((location) => {
                    const locationDisplayName = location.area
                      ? `${location.name}, ${location.area}`
                      : location.name;
                    const locationKey = `${location.id}-${locationDisplayName}`;
                    return (
                      <TouchableOpacity
                        key={locationKey}
                        style={[
                          styles.chip,
                          filters.locations.includes(locationDisplayName) && styles.chipActive
                        ]}
                        onPress={() => {
                          setFilters((prev) => ({
                            ...prev,
                            locations: prev.locations.includes(locationDisplayName)
                              ? prev.locations.filter((l) => l !== locationDisplayName)
                              : [...prev.locations, locationDisplayName],
                          }));
                        }}
                      >
                        <Text style={[
                          styles.chipText,
                          filters.locations.includes(locationDisplayName) && styles.chipTextActive
                        ]}>
                          {locationDisplayName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Experience Filter */}
              <View style={styles.filterSection}>
                <ThemedText type="subtitle" style={styles.filterSectionTitle}>Minimum Experience (Years)</ThemedText>
                <View style={styles.experienceContainer}>
                  {[0, 1, 2, 3, 5, 10].map((years) => (
                    <TouchableOpacity
                      key={years}
                      style={[
                        styles.experienceChip,
                        filters.minExperience === years && styles.experienceChipActive
                      ]}
                      onPress={() => {
                        setFilters((prev) => ({
                          ...prev,
                          minExperience: prev.minExperience === years ? null : years,
                        }));
                      }}
                    >
                      <Text style={[
                        styles.experienceChipText,
                        filters.minExperience === years && styles.experienceChipTextActive
                      ]}>
                        {years === 0 ? 'Any' : `${years}+`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <ThemedText style={styles.clearFiltersText}>Clear All</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => setShowFilterModal(false)}
              >
                <ThemedText style={styles.applyFiltersText}>Apply Filters</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  clearFilterButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  clearFilterText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  filterIconButton: {
    padding: 4,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalScrollView: {
    maxHeight: '70%',
  },
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  locationSearchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  loadingIndicator: {
    marginVertical: 8,
  },
  experienceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  experienceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  experienceChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  experienceChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  experienceChipTextActive: {
    color: '#FFFFFF',
  },
  ratingFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ratingChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  ratingChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  ratingChipTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mainTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  mainTabButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mainTabButtonActive: {
    // Active state handled by indicator
  },
  mainTabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  mainTabTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#6366F1',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#6366F1',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  tabButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
  },
  tabButtonActive: {
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
  results: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.light.primaryLight,
    // Enhanced shadow for depth
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  cardHeaderWrapper: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E7FF',
    // Embossment effect - subtle inner highlight
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    // Enhanced shadow for embossment
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  roleBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  roleBadgeBusiness: {
    backgroundColor: '#FEF3C7',
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rating: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  reviews: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  experienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 8,
  },
  experienceText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  priceBadge: {
    alignItems: 'flex-end',
  },
  priceLabelSmall: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  contactButton: {
    padding: 4,
  },
  contactButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardBio: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  cardServicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  cardServiceTag: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  cardServiceTagText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  cardServiceTagMore: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardServiceTagMoreText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  helperInfoContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  helperInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helperInfoText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoItemContent: {
    flex: 1,
  },
  infoItemLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoItemValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '700',
  },
  locationTagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  locationTags: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  locationTag: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  locationTagText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
  },
  locationTagMore: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationTagMoreText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    backgroundColor: Colors.light.primaryLight,
    borderTopWidth: 1,
    borderTopColor: '#E0E7FF',
    // Embossment effect - subtle inner shadow
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  priceContainer: {
    flex: 1,
  },
  contactOptionsContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  contactOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactOptionIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  viewProfileButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    color: '#1A1A1A',
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
  requestDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 14,
    lineHeight: 20,
    color: '#666',
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestLocation: {
    fontSize: 13,
    opacity: 0.6,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.6,
  },
  // Service Listing Card Styles
  serviceListingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: Colors.light.primaryLight,
  },
  serviceListingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  serviceHeaderInfo: {
    flex: 1,
  },
  serviceListingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceListingProvider: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  serviceListingPrice: {
    alignItems: 'flex-end',
  },
  servicePriceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  servicePricePeriod: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  serviceListingBody: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceMetaDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  serviceMetaText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  serviceListingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  serviceListingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  serviceListingTag: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  serviceListingTagText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  serviceListingTagMore: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  serviceListingTagMoreText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  serviceAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  serviceAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366F1',
  },
});

