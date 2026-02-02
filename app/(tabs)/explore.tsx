import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { Colors } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
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
  gender?: string;
  religion?: string;
  age?: number;
  languages?: string[];
  total_workers?: number;
  address?: string;
}

interface Location {
  id: number | string;
  name: string;
  area?: string;
}

interface FilterState {
  services: string[];
  city: string | null;
  nearMe: boolean;
  minExperience: number | null;
  minRating: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getHelpers, serviceTypes = [] } = useApp();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const { t } = useTranslation();
  const isDark = colorScheme === 'dark';
  const themeColors = Colors[isDark ? 'dark' : 'light'];
  const [mainTab, setMainTab] = useState<'helpers'>('helpers');

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
    city: null,
    nearMe: false,
    minExperience: null,
    minRating: null,
  });
  const [filtersServices, setFiltersServices] = useState<FilterState>({
    services: [],
    city: null,
    nearMe: false,
    minExperience: null,
    minRating: null,
  });

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [helpersFromAPI, setHelpersFromAPI] = useState<Helper[]>([]);
  const [serviceListingsFromAPI, setServiceListingsFromAPI] = useState<Helper[]>([]);
  const [isLoadingHelpers, setIsLoadingHelpers] = useState(false);
  const [isLoadingServiceListings, setIsLoadingServiceListings] = useState(false);
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
  const serviceTypeId = routeParams?.service_type_id as string | undefined;

  // Fetch helpers from API when helpers tab is selected
  useEffect(() => {
    fetchCities();
    if (mainTab === 'helpers') {
      fetchHelpersFromAPI();
      // Clear filters when switching tabs (unless it's the initial load with params, but here we just clear on tab switch event really)
      // Actually, we should probably clear only if we are manually switching. 
      // But the requirement is "Switching tab should ... clear the filters completely".
      // We can do this in the onPress handlers for tabs instead to be cleaner? 
      // Or here? If we do it here, it might conflict with params on load?
      // On load, mainTab is initialized. Route params are read.
      // If we switch TABS, we want to clear.

      // Let's rely on the tab onPress to clear filters.
    }
  }, [mainTab]);

  const fetchCities = async () => {
    try {
      setIsLoadingCities(true);
      const response = await apiService.get(API_ENDPOINTS.CITIES.LIST);
      if (response.success && Array.isArray(response.data)) {
        setCities(response.data);
      }
    } catch (error) {
    } finally {
      setIsLoadingCities(false);
    }
  };

  const fetchHelpersFromAPI = async () => {
    try {
      setIsLoadingHelpers(true);

      // Build query params from filters
      const queryParams: Record<string, string> = { page: '1' };

      // Add service type filter
      if (filtersHelpers.services.length > 0) {
        const matchedService = serviceTypes.find((t: any) => filtersHelpers.services.includes(t.name));
        if (matchedService) {
          queryParams.service_type_id = matchedService.id.toString();
        }
      }

      // Add city filter
      if (filtersHelpers.city) {
        queryParams.city_id = filtersHelpers.city.toString();
      }

      // Add near me location filter
      if (filtersHelpers.nearMe && filtersHelpers.latitude && filtersHelpers.longitude) {
        queryParams.latitude = filtersHelpers.latitude.toString();
        queryParams.longitude = filtersHelpers.longitude.toString();
        queryParams.radius = '10'; // 10km radius
      }

      const response = await apiService.get(
        API_ENDPOINTS.HELPERS.LIST,
        undefined,
        queryParams,
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
      setHelpersFromAPI([]);
    } finally {
      setIsLoadingHelpers(false);
    }
  };

  // Service listings fetch removed - now only showing helpers

  // Pre-select the service filter based on service_type_id or service param
  useEffect(() => {
    let matchedServiceName: string | null = null;

    // First, try to match by service_type_id
    if (serviceTypeId && serviceTypes.length > 0) {
      const matchingService = serviceTypes.find((t: any) => t.id == serviceTypeId);
      if (matchingService) {
        matchedServiceName = matchingService.name;
      }
    }

    // If no match by ID, try to match by service name param
    if (!matchedServiceName && serviceFilter && serviceTypes.length > 0) {
      // Try exact match first
      let matchingService = serviceTypes.find((t: any) =>
        t.name.toLowerCase() === serviceFilter.toLowerCase()
      );
      // If not exact, try partial match (e.g., "domestic_helper" matches "Domestic Helper")
      if (!matchingService) {
        const normalizedFilter = serviceFilter.toLowerCase().replace(/_/g, ' ');
        matchingService = serviceTypes.find((t: any) =>
          t.name.toLowerCase() === normalizedFilter ||
          t.name.toLowerCase().replace(/\s+/g, '_') === serviceFilter.toLowerCase()
        );
      }
      if (matchingService) {
        matchedServiceName = matchingService.name;
      }
    }

    // Update both filter states if we found a match
    if (matchedServiceName) {
      const updateFilter = (prev: FilterState) => {
        if (prev.services.length === 1 && prev.services[0] === matchedServiceName) {
          return prev;
        }
        return {
          ...prev,
          services: [matchedServiceName!]
        };
      };

      setFiltersHelpers(updateFilter);
      setFiltersServices(updateFilter);
    }
  }, [serviceTypeId, serviceFilter, serviceTypes]);

  const fetchServiceListingsFromAPI = async () => {
    // Determine the service ID to filter by
    let filterServiceId = serviceTypeId;

    // If a service filter is selected in the internal state, look up its ID
    if (filtersServices.services.length > 0 && serviceTypes.length > 0) {
      const selectedServiceName = filtersServices.services[0];
      const selectedServiceObj = serviceTypes.find((t: any) => t.name.toLowerCase() === selectedServiceName.toLowerCase());
      if (selectedServiceObj) {
        filterServiceId = selectedServiceObj.id;
      }
    }

    if (!filterServiceId) {
      // If no filter, we might want to fetch all listings or handle differently.
      // For now, let's allow fetching all if no specific filter is set, 
      // OR return if we strictly strictly want a filtered view.
      // The user's request implies "switched to or filter is selected", so let's try to fetch even if no ID is there??
      // But the API might require it or return everything. Let's fetch all if no ID.
      // Actually, currently explore defaults to useApp() data if no API call. 
      // But let's support API fetch without ID if needed.
      // If we want to rely on serviceTypeId ONLY, we return.
      // But if user manually filters, we need that ID.

      // If no filter selected, we fetch all listings (empty query params)

      // Update: If we have an ID, we fetch from API. If not, we might fall back to context?
      // Let's stick to the prompt: filter is selected -> API call.

      // If no filter selected, we fetch all listings (empty query params)
    }

    try {
      setIsLoadingServiceListings(true);
      const queryParams: any = {};

      if (filterServiceId) {
        queryParams.service_type_id = filterServiceId;
      }

      const response = await apiService.get(
        API_ENDPOINTS.SERVICE_LISTINGS.LIST,
        undefined,
        queryParams,
        false
      );

      if (response.success && response.data) {
        let listings = [];
        if (response.data.listings) {
          if (response.data.listings.data) {
            listings = Array.isArray(response.data.listings.data) ? response.data.listings.data : [];
          } else {
            listings = Array.isArray(response.data.listings) ? response.data.listings : [];
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

        // Map to Helper format
        const mappedListings = listings
          .filter((listing: any) => listing.user)
          .map((listing: any) => {
            const user = listing.user;
            let experience = 0;
            const expRaw = user.profileData?.experience || user.experience;
            if (typeof expRaw === 'number') experience = expRaw;
            else if (typeof expRaw === 'string') {
              const match = expRaw.match(/(\d+)/);
              if (match) experience = parseInt(match[1], 10);
            }

            return {
              id: listing.id,
              name: user.name,
              user: user,
              bio: user.profileData?.bio || user.bio || listing.description || '',
              experience_years: experience,
              services: listing.service_types && Array.isArray(listing.service_types)
                ? listing.service_types.map((st: any) => {
                  const serviceTypeName = typeof st === 'object' && st ? (st.name || st.label || st.slug || '') : st;
                  return {
                    id: listing.id,
                    service_type: serviceTypeName,
                    monthly_rate: listing.monthly_rate,
                    location_id: listing.location_id,
                    location: listing.location,
                    area: listing.area
                  };
                })
                : (listing.service_type ? [{
                  id: listing.id,
                  service_type: listing.service_type,
                  monthly_rate: listing.monthly_rate,
                  location_id: listing.location_id,
                  location: listing.location,
                  area: listing.area
                }] : []),
              area: listing.area || listing.location?.name || '',
              rating: user.rating || 0,
              reviews_count: user.reviews_count || 0,
              profile_image: user.profile_image,
              role: user.user_type || user.role || 'helper',
              location_details: listing.location_details,
              locations: listing.locations,
              religion: user.profileData?.religion || user.religion,
              gender: user.profileData?.gender || user.gender,
              age: user.profileData?.age || user.age,
              languages: user.profileData?.languages || user.languages
            };
          });

        setServiceListingsFromAPI(mappedListings);
      } else {
        setServiceListingsFromAPI([]);
      }
    } catch (error) {
      setServiceListingsFromAPI([]);
    } finally {
      setIsLoadingServiceListings(false);
    }
  };

  // Get current data source based on main tab
  // Get current data source based on main tab
  // Always use API data for service-providers tab now, as we fetch on tab switch
  const currentData = mainTab === 'helpers'
    ? helpersFromAPI
    : serviceListingsFromAPI;

  // Extract unique services from current data, but prefer using the Master List from AppContext
  const availableServices = useMemo(() => {
    // If we have master list of services from API (via context), use their names
    if (serviceTypes && serviceTypes.length > 0) {
      return serviceTypes.map((s: { name: string }) => s.name).sort();
    }

    // Fallback to extracting from current loaded data if context is empty
    const serviceSet = new Set<string>();
    currentData.forEach((helper: Helper) => {
      if (helper.services && helper.services.length > 0) {
        helper.services.forEach((service) => {
          if (service.service_type) {
            const st = service.service_type;
            const rawType = typeof st === 'object' && st ? ((st as any).name || (st as any).label || (st as any).slug || '') : st;
            if (typeof rawType === 'string') {
              const serviceType = rawType.charAt(0).toUpperCase() + rawType.slice(1).replace(/_/g, ' ');
              serviceSet.add(serviceType);
            }
          }
        });
      }
    });
    return Array.from(serviceSet).sort();
  }, [currentData, serviceTypes]);





  // Count active filters for current tab
  const activeFiltersCount = useMemo(() => {
    const currentFilters = mainTab === 'helpers' ? filtersHelpers : filtersServices;
    const currentRoleFilter = mainTab === 'helpers' ? selectedFilterHelpers : selectedFilterServices;
    let count = 0;
    if (currentRoleFilter !== 'all') count++;
    if (currentFilters.services.length > 0) count++;
    if (currentFilters.city !== null) count++;
    if (currentFilters.nearMe) count++;
    if (currentFilters.minExperience !== null) count++;
    return count;
  }, [mainTab, filtersHelpers, filtersServices, selectedFilterHelpers, selectedFilterServices]);

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
      const st = helper.services[0].service_type || '';
      const serviceType = typeof st === 'object' && st ? ((st as any).name || (st as any).label || (st as any).slug || '') : st;
      if (typeof serviceType === 'string') {
        return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace(/_/g, ' ');
      }
    }
    return 'Helper';
  };

  // Helper function to get primary service
  const getPrimaryService = (helper: Helper) => {
    // Check service_listings first (for helpers)
    if (helper.service_listings && helper.service_listings.length > 0) {
      const st = helper.service_listings[0].service_type || '';
      const serviceType = typeof st === 'object' && st ? ((st as any).name || (st as any).label || (st as any).slug || '') : st;
      if (typeof serviceType === 'string') {
        return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace(/_/g, ' ');
      }
    }
    // Fallback to services
    if (helper.services && helper.services.length > 0) {
      const serviceTypeRaw = helper.services[0].service_type || '';
      const serviceType = typeof serviceTypeRaw === 'object' && serviceTypeRaw ? ((serviceTypeRaw as any).name || (serviceTypeRaw as any).label || (serviceTypeRaw as any).slug || '') : serviceTypeRaw;
      if (typeof serviceType === 'string') {
        return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace(/_/g, ' ');
      }
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

    return locationList.length > 0 ? locationList : ['Karachi'];
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
  const handleCall = async (phoneNumber: string | null, e?: any) => {
    if (e) e.stopPropagation();
    if (!phoneNumber) {
      Alert.alert('Phone Number', 'Phone number not available for this provider');
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
  const handleWhatsApp = async (phoneNumber: string | null, e?: any) => {
    if (e) e.stopPropagation();
    if (!phoneNumber) {
      Alert.alert('Phone Number', 'Phone number not available for this provider');
      return;
    }
    const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
    // Use whatsapp:// scheme first as it provides better UX if installed, fallback to web
    const appUrl = `whatsapp://send?phone=${formattedPhone}`;
    const webUrl = `https://wa.me/${formattedPhone.replace(/\+/g, '')}`;

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

  // Handle in-app message
  const handleInAppMessage = (providerId: string, providerName: string, e?: any) => {
    if (e) e.stopPropagation();
    router.push(`/chat/${providerId}?name=${encodeURIComponent(providerName)}`);
  };

  // Helper function to format services as "x, x +2 more"
  const formatServicesText = (helper: Helper): string => {
    if (!helper.services || helper.services.length === 0) return '';
    const serviceNames = helper.services.map((s) => {
      const st = s.service_type || '';
      const serviceType = typeof st === 'object' && st ? ((st as any).name || (st as any).label || (st as any).slug || '') : st;
      if (typeof serviceType === 'string') {
        return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace(/_/g, ' ');
      }
      return '';
    }).filter(Boolean);

    if (serviceNames.length <= 2) {
      return serviceNames.join(', ');
    }
    return `${serviceNames.slice(0, 2).join(', ')} +${serviceNames.length - 2} more`;
  };


  // Helper function to get all services for a helper
  const getAllServices = (helper: Helper): string[] => {
    let services: string[] = [];
    // Check service_listings first (for helpers)
    if (helper.service_listings && Array.isArray(helper.service_listings) && helper.service_listings.length > 0) {
      services = helper.service_listings.map((s) => {
        const st = s.service_type || '';
        const serviceType = typeof st === 'object' && st ? ((st as any).name || (st as any).label || (st as any).slug || '') : st;
        if (typeof serviceType === 'string') {
          return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace(/_/g, ' ');
        }
        return '';
      }).filter(Boolean);
    }
    // Fallback to services
    else if (helper.services && Array.isArray(helper.services) && helper.services.length > 0) {
      services = helper.services.map((s) => {
        const st = s.service_type || '';
        const serviceType = typeof st === 'object' && st ? ((st as any).name || (st as any).label || (st as any).slug || '') : st;
        if (typeof serviceType === 'string') {
          return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace(/_/g, ' ');
        }
        return '';
      });
    }
    return [...new Set(services)];
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
    if (locationList.length === 0 && helper.services && Array.isArray(helper.services) && helper.services.length > 0) {
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

    // Default design for Helpers
    return (
      <TouchableOpacity
        key={providerId}
        style={[
          styles.helperCard,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.border,
            shadowColor: themeColors.shadow,
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            elevation: 5,
            paddingBottom: 0, // Footer handles bottom padding
            overflow: 'hidden'
          }
        ]}
        onPress={() => {
          const profileType = apiRole === 'business' ? 'business' : 'helper';
          router.push(`/profile/${profileType}/${providerId}` as any);
        }}
        activeOpacity={0.9}
      >
        {/* ID Card Header Bar (Name + Role) */}
        <View style={{
          height: 70,
          backgroundColor: themeColors.primary,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingHorizontal: 16,
          paddingTop: 12
        }}>          {/* Avatar inside header */}
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: themeColors.card,
            padding: 2,
            marginLeft: 4
          }}>
            <View style={{
              flex: 1,
              borderRadius: 23,
              backgroundColor: themeColors.backgroundSecondary,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {item.profile_image ? (
                <Image source={{ uri: item.profile_image }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={{ fontSize: 18, fontWeight: '700', color: themeColors.textSecondary }}>
                  {providerName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          </View>

          <View style={{ marginLeft: 12, flex: 1, justifyContent: 'center' }}>
            <Text style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '700',
              marginBottom: 2
            }} numberOfLines={1}>{providerName}</Text>

            <Text style={{
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              opacity: 0.9
            }}>
              {role}
            </Text>
          </View>

          {/* Verification Badge (if verified) */}
          {isVerified && (
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4
            }}>
              <IconSymbol name="checkmark.circle.fill" size={14} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{t('explore.verified')}</Text>
            </View>
          )}
        </View>

        {/* Content Body */}
        <View style={{ padding: 16, paddingTop: 16 }}>

          {/* ID Details Grid */}
          <View style={{
            backgroundColor: themeColors.backgroundTertiary,
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: themeColors.border
          }}>
            {apiRole === 'business' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 10, color: themeColors.textSecondary, marginBottom: 2, textTransform: 'uppercase' }}>{t('explore.totalWorkers')}</Text>
                  <Text style={{ fontSize: 14, color: themeColors.text, fontWeight: '700' }}>
                    {item.total_workers || 0}
                  </Text>
                </View>
                <IconSymbol name="person.2.fill" size={20} color={themeColors.primary} style={{ opacity: 0.5 }} />
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ width: '45%' }}>
                    <Text style={{ fontSize: 10, color: themeColors.textSecondary, marginBottom: 1, textTransform: 'uppercase' }}>{t('explore.religion')}</Text>
                    <Text style={{ fontSize: 12, color: themeColors.text, fontWeight: '600' }}>{item.religion ? (typeof item.religion === 'object' ? (item.religion as any).label : item.religion) : '-'}</Text>
                  </View>
                  <View style={{ width: '45%' }}>
                    <Text style={{ fontSize: 10, color: themeColors.textSecondary, marginBottom: 1, textTransform: 'uppercase' }}>{t('explore.languages')}</Text>
                    <Text style={{ fontSize: 12, color: themeColors.text, fontWeight: '600' }}>
                      {Array.isArray(item.languages) && item.languages.length > 0 ? `${item.languages.length} ${t('explore.spoken')}` : '-'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ width: '45%' }}>
                    <Text style={{ fontSize: 10, color: themeColors.textSecondary, marginBottom: 1, textTransform: 'uppercase' }}>{t('explore.age')}</Text>
                    <Text style={{ fontSize: 12, color: themeColors.text, fontWeight: '600' }}>{item.age ? `${item.age} ${t('explore.years')}` : '-'}</Text>
                  </View>
                  <View style={{ width: '45%' }}>
                    <Text style={{ fontSize: 10, color: themeColors.textSecondary, marginBottom: 1, textTransform: 'uppercase' }}>{t('explore.exp')}</Text>
                    <Text style={{ fontSize: 12, color: themeColors.text, fontWeight: '600' }}>{experience || t('explore.entry')}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Skills */}
          {(() => {
            const srvs = getAllServices(item);
            if (srvs.length === 0) return null;
            return (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: themeColors.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>{t('explore.expertise')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {srvs.slice(0, 4).map((s, i) => (
                    <View key={i} style={{
                      backgroundColor: themeColors.card,
                      borderWidth: 1,
                      borderColor: themeColors.border,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '500', color: themeColors.textSecondary }}>{s}</Text>
                    </View>
                  ))}
                  {srvs.length > 4 && <Text style={{ fontSize: 11, color: themeColors.textSecondary, alignSelf: 'center' }}>+{srvs.length - 4}</Text>}
                </View>
              </View>
            );
          })()}

          {/* Location */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <IconSymbol name="mappin.and.ellipse" size={14} color="#EF4444" />
            <Text style={{ fontSize: 12, color: themeColors.textSecondary, flex: 1 }} numberOfLines={1}>
              {item.address || (item as any).pin_address || (locations.length > 0 ? locations[0] : 'Remote')}
            </Text>
          </View>

        </View>

        {/* Footer Actions */}
        <View style={{
          backgroundColor: themeColors.backgroundSecondary,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: themeColors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Price */}
          <View>
            {apiRole !== 'business' && (
              <>
                <Text style={{ fontSize: 11, color: themeColors.textSecondary }}>{t('explore.startingRate')}</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: themeColors.primary }}>
                  {price > 0 ? `₨${(price / 1000).toFixed(0)}k` : 'N/A'} <Text style={{ fontSize: 12, fontWeight: 'normal', color: themeColors.textSecondary }}>{t('explore.mo')}</Text>
                </Text>
              </>
            )}
            {apiRole === 'business' && (
              <Text style={{ fontSize: 12, color: themeColors.textSecondary, fontWeight: '500' }}>
                {t('explore.businessAccount')}
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}
              onPress={(e) => handleCall(phoneNumber, e)}
            >
              <IconSymbol name="phone.fill" size={18} color="#1E293B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}
              onPress={(e) => handleWhatsApp(phoneNumber, e)}
            >
              <FontAwesome name="whatsapp" size={22} color="#25D366" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: themeColors.primary, alignItems: 'center', justifyContent: 'center' }}
              onPress={(e) => handleInAppMessage(providerId, providerName, e)}
            >
              <MaterialIcons name="message" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

      </TouchableOpacity>
    );
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

    // matchesServiceFilter removed - we rely on filters.services (initialized from params)
    // to allow user to deselect/change filters without URL params forcing persistence.

    // Filter by selected services
    const matchesServices = filters.services.length === 0 ||
      getAllServices(h).some((s) => filters.services.includes(s));

    // Filter by selected locations
    const matchesCity = !filters.city ||
      (h.location_details?.some(l => l.name === filters.city) ?? false) ||
      (h.services?.some(s => s.location?.name === filters.city) ?? false) ||
      (h.locations?.includes(filters.city ?? '') ?? false);

    // For now, Near Me is a placeholder for filtering logic or API parameter
    // If we wanted local filtering, we'd need lat/long. 
    // Assuming API handles it or we just show all if no lat/long available locally.
    const matchesNearMe = !filters.nearMe || true;

    return matchesRole && matchesSearch && matchesServices &&
      matchesCity && matchesNearMe;
  });

  const clearFilters = () => {
    setFilters({
      services: [],
      city: null,
      nearMe: false,
      minExperience: null,
      minRating: null,
    });
    setSelectedFilter('all');
    router.setParams({ service: undefined, service_type_id: undefined });
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title={t('explore.title')}
        showBackButton={false}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        horizontal={false}
        contentContainerStyle={{
          width: '100%',
          paddingTop: 20,
          paddingBottom: insets.bottom + 20
        }}
      >

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: themeColors.backgroundSecondary }]}>
          <IconSymbol name="magnifyingglass" size={20} color={themeColors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder={mainTab === 'helpers' ? t('explore.searchHelpers') : t('explore.searchServices')}
            placeholderTextColor={themeColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setShowFilterModal(true)}
          >
            <IconSymbol name="slider.horizontal.3" size={20} color={activeFiltersCount > 0 ? themeColors.primary : themeColors.textSecondary} />
            {activeFiltersCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: themeColors.error }]}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Tab header - Services tab removed, only Helpers now */}

        {/* Results */}
        <View style={styles.results}>
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('explore.helpers')} ({filteredProviders.length})
            </ThemedText>
            {isLoadingHelpers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <ThemedText style={styles.loadingText}>
                  {t('explore.loadingHelpers')}
                </ThemedText>
              </View>
            ) : filteredProviders.length > 0 ? (
              filteredProviders.map((provider: Helper) => renderProviderCard(provider))
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol name="person.fill" size={48} color="#CCCCCC" />
                <ThemedText style={styles.emptyText}>
                  {searchQuery.trim() || serviceFilter
                    ? t('explore.noHelpersFound')
                    : t('explore.noHelpersAvailable')}
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
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#334155' : '#F0F0F0' }]}>
              <ThemedText type="title" style={[styles.modalTitle, { color: isDark ? '#F8FAFC' : '#000000' }]}>{t('explore.filter')}</ThemedText>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#F8FAFC' : '#000000'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Type/Role Filter - Only show for Helpers tab */}
              {mainTab === 'helpers' && (
                <View style={[styles.filterSection, { borderBottomColor: isDark ? '#334155' : '#F0F0F0' }]}>
                  <ThemedText type="subtitle" style={[styles.filterSectionTitle, { color: isDark ? '#F8FAFC' : '#000000' }]}>{t('explore.type')}</ThemedText>
                  <View style={styles.chipContainer}>
                    {[
                      { id: 'all', label: t('explore.all') },
                      { id: 'helper', label: t('explore.individual') },
                      { id: 'business', label: t('explore.business') }
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selectedFilter === option.id
                              ? themeColors.primary
                              : (isDark ? '#334155' : '#F5F5F5'),
                            borderColor: selectedFilter === option.id
                              ? themeColors.primary
                              : (isDark ? '#475569' : '#E0E0E0')
                          }
                        ]}
                        onPress={() => setSelectedFilter(option.id as any)}
                      >
                        <Text style={[
                          styles.chipText,
                          {
                            color: selectedFilter === option.id
                              ? '#FFFFFF'
                              : (isDark ? '#CBD5E1' : '#666666')
                          }
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Services Filter */}
              <View style={[styles.filterSection, { borderBottomColor: isDark ? '#334155' : '#F0F0F0' }]}>
                <ThemedText type="subtitle" style={[styles.filterSectionTitle, { color: isDark ? '#F8FAFC' : '#000000' }]}>{t('explore.services')}</ThemedText>
                <View style={styles.chipContainer}>
                  {availableServices.map((service) => (
                    <TouchableOpacity
                      key={service}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: filters.services.includes(service)
                            ? themeColors.primary
                            : (isDark ? '#334155' : '#F5F5F5'),
                          borderColor: filters.services.includes(service)
                            ? themeColors.primary
                            : (isDark ? '#475569' : '#E0E0E0')
                        }
                      ]}
                      onPress={() => {
                        setFilters((prev) => ({
                          ...prev,
                          services: prev.services.includes(service)
                            ? [] // Deselect if already selected
                            : [service], // Select only this one (single selection)
                        }));
                      }}
                    >
                      <Text style={[
                        styles.chipText,
                        {
                          color: filters.services.includes(service)
                            ? '#FFFFFF'
                            : (isDark ? '#CBD5E1' : '#666666')
                        }
                      ]}>
                        {service}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Cities and Near Me Filter */}
              <View style={[styles.filterSection, { borderBottomColor: isDark ? '#334155' : '#F0F0F0' }]}>
                <ThemedText type="subtitle" style={[styles.filterSectionTitle, { color: isDark ? '#F8FAFC' : '#000000' }]}>{t('explore.cityLocation')}</ThemedText>

                {/* Near Me Toggle */}
                <TouchableOpacity
                  style={[
                    styles.chip,
                    {
                      backgroundColor: filters.nearMe
                        ? themeColors.primary
                        : (isDark ? '#334155' : '#F5F5F5'),
                      borderColor: filters.nearMe
                        ? themeColors.primary
                        : (isDark ? '#475569' : '#E0E0E0'),
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 12,
                      alignSelf: 'flex-start'
                    }
                  ]}
                  onPress={() => {
                    setFilters((prev) => ({
                      ...prev,
                      nearMe: !prev.nearMe,
                      city: !prev.nearMe ? null : prev.city // Clear city if Near Me is enabled, optional
                    }));
                  }}
                >
                  <IconSymbol name="location.fill" size={16} color={filters.nearMe ? '#FFFFFF' : (isDark ? '#CBD5E1' : '#666666')} style={{ marginRight: 6 }} />
                  <Text style={[
                    styles.chipText,
                    {
                      color: filters.nearMe
                        ? '#FFFFFF'
                        : (isDark ? '#CBD5E1' : '#666666')
                    }
                  ]}>
                    {t('explore.pinNearMe')}
                  </Text>
                </TouchableOpacity>

                {/* Cities Searchable Dropdown */}
                <View style={{ marginBottom: 12 }}>
                  <TextInput
                    style={[
                      styles.locationSearchInput,
                      {
                        backgroundColor: isDark ? '#334155' : '#F5F5F5',
                        color: isDark ? '#F8FAFC' : '#000000',
                        marginBottom: 8
                      }
                    ]}
                    placeholder={t('explore.searchCity')}
                    placeholderTextColor={isDark ? '#94A3B8' : '#999999'}
                    value={citySearch}
                    onChangeText={setCitySearch}
                  />

                  {/* Selected City Chip (if any) */}
                  {filters.city && (
                    <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                      <TouchableOpacity
                        style={[
                          styles.chip,
                          {
                            backgroundColor: themeColors.primary,
                            borderColor: themeColors.primary,
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingRight: 8
                          }
                        ]}
                        onPress={() => setFilters(prev => ({ ...prev, city: null }))}
                      >
                        <Text style={[styles.chipText, { color: '#FFFFFF', marginRight: 4 }]}>
                          {filters.city}
                        </Text>
                        <IconSymbol name="xmark" size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Cities List */}
                  <View style={{
                    maxHeight: 200,
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark ? '#334155' : '#F0F0F0',
                    overflow: 'hidden'
                  }}>
                    <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                      {cities
                        .filter(c =>
                          !citySearch.trim() ||
                          c.name.toLowerCase().includes(citySearch.toLowerCase())
                        )
                        .map((city, index) => {
                          const isSelected = filters.city === city.name;
                          return (
                            <TouchableOpacity
                              key={city.id}
                              style={{
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderBottomWidth: index === cities.length - 1 ? 0 : 1,
                                borderBottomColor: isDark ? '#334155' : '#F0F0F0',
                                backgroundColor: isSelected
                                  ? (isDark ? '#334155' : '#F5F5F5')
                                  : 'transparent',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                opacity: filters.nearMe ? 0.5 : 1
                              }}
                              disabled={filters.nearMe}
                              onPress={() => {
                                setFilters((prev) => ({
                                  ...prev,
                                  city: city.name,
                                }));
                                setCitySearch(''); // Clear search on selection
                              }}
                            >
                              <Text style={{
                                fontSize: 14,
                                color: isSelected
                                  ? themeColors.primary
                                  : (isDark ? '#CBD5E1' : '#334155'),
                                fontWeight: isSelected ? '600' : '400'
                              }}>
                                {city.name}
                              </Text>
                              {isSelected && (
                                <IconSymbol name="checkmark" size={16} color={themeColors.primary} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      {cities.length === 0 && !isLoadingCities && (
                        <View style={{ padding: 16, alignItems: 'center' }}>
                          <Text style={{ color: isDark ? '#94A3B8' : '#666666' }}>{t('explore.noCitiesFound')}</Text>
                        </View>
                      )}
                      {isLoadingCities && (
                        <ActivityIndicator size="small" color={themeColors.primary} style={{ margin: 12 }} />
                      )}
                    </ScrollView>
                  </View>
                </View>
              </View>




            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: isDark ? '#334155' : '#F0F0F0' }]}>
              <TouchableOpacity
                style={[
                  styles.clearFiltersButton,
                  { backgroundColor: isDark ? '#334155' : '#F5F5F5' }
                ]}
                onPress={clearFilters}
              >
                <ThemedText style={[
                  styles.clearFiltersText,
                  { color: isDark ? '#CBD5E1' : '#666666' }
                ]}>{t('explore.clearAll')}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.applyFiltersButton,
                  { backgroundColor: themeColors.primary }
                ]}
                onPress={() => {
                  setShowFilterModal(false);
                  if (mainTab === 'helpers') {
                    fetchHelpersFromAPI();
                  }
                }}
              >
                <ThemedText style={styles.applyFiltersText}>{t('explore.applyFilters')}</ThemedText>
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
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
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
    backgroundColor: 'transparent',
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
  },
  mainTabTextActive: {
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
  // New Helper Card Styles
  helperCard: {
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  helperCardHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  helperCardVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 4,
  },
  helperCardVerifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  helperCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  helperCardRatingText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '700',
  },
  helperProfileSection: {
    alignItems: 'center',
    marginTop: -20,
    marginBottom: 20,
  },
  helperAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 4,
    borderColor: '#1E293B',
  },
  helperAvatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  helperRoleTag: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  helperRoleText: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helperName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  helperLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  helperLocationText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
  helperInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
    justifyContent: 'center',
  },
  helperInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  helperInfoText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '500',
  },
  helperSectionTitle: {
    color: '#FCD34D',
    fontSize: 13,
    fontWeight: '700',
  },
  helperTagsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  helperTag: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  helperTagText: {
    color: '#C7D2FE',
    fontSize: 13,
    fontWeight: '500',
  },
  helperFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  helperActionButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  helperAvatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#94A3B8',
  },
  // New Styles for Helper Card Detail Update
  helperDetailsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 16,
  },
  helperDemographicsColumn: {
    flex: 1,
    gap: 8,
  },
  helperLanguagesColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  helperDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helperDetailText: {
    fontSize: 13,
    fontWeight: '500',
  },
  helperSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  languageChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  languageChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  languageChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  helperPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  helperPriceText: {
    fontSize: 16,
    fontWeight: '700',
  },
  // --- New Helper Card Redesign Styles ---
  helperCardCover: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: 'transparent', // Overlap effect if needed, or just container
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  helperCardContent: {
    marginTop: -20, // Negative margin to overlap with cover or just pull up
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  helperHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  helperNameColumn: {
    flex: 1,
    paddingTop: 8, // Align with avatar center roughly
    gap: 4,
  },
  divider: {
    height: 1,
    marginVertical: 16,
    opacity: 0.5,
  },
  helperDetailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skillPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  skillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionButtonPrimary: {
    flex: 1.2, // Slightly larger
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerBackground: {
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  screenHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

