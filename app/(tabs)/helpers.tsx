import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
  };
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
  user_type?: string;
  role?: string;
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

export default function HelpersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'helper' | 'business'>('all');
  const [selectedTab, setSelectedTab] = useState<'all' | 'top-rated' | 'experienced' | 'verified'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    services: [],
    locations: [],
    minExperience: null,
    minRating: null,
  });

  // Fetch helpers from API
  const fetchHelpers = async (pageNum: number = 1, sortBy: string = 'rating', userType: string = 'all') => {
    try {
      setIsLoading(pageNum === 1);
      const response = await apiService.get(
        API_ENDPOINTS.HELPERS.LIST,
        undefined,
        {
          sort_by: sortBy,
          user_type: userType,
          page: pageNum.toString(),
        },
        false // Public endpoint
      );

      if (response.success && response.data) {
        let helpersData: Helper[] = [];

        // Handle different response formats
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

        if (pageNum === 1) {
          setHelpers(helpersData);
        } else {
          setHelpers((prev) => [...prev, ...helpersData]);
        }

        // Check if there's more data
        setHasMore(helpersData.length > 0);
      } else {
        if (pageNum === 1) {
          setHelpers([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching helpers:', error);
      if (pageNum === 1) {
        setHelpers([]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchHelpers(1, 'rating', 'all');
  }, []);

  // Extract unique services from helpers
  const availableServices = useMemo(() => {
    const serviceSet = new Set<string>();
    helpers.forEach((helper: Helper) => {
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
  }, [helpers]);

  // Extract unique locations from helpers
  const availableLocationsFromHelpers = useMemo(() => {
    const locationSet = new Set<string>();
    helpers.forEach((helper: Helper) => {
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
      if (helper.area) {
        locationSet.add(helper.area);
      }
    });
    return Array.from(locationSet).sort();
  }, [helpers]);

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

  // For helpers/businesses, redirect to requests tab
  useEffect(() => {
    if (user?.userType === 'helper' || user?.userType === 'business') {
      router.replace('/(tabs)/requests');
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

  // Helper function to get helper ID
  const getHelperId = (helper: Helper) => {
    return helper.id?.toString() || helper.user?.id?.toString() || '';
  };

  // Helper function to get role/type
  const getRole = (helper: Helper) => {
    const role = helper.role || helper.user_type || (helper as any).userType;
    if (role) {
      return role.charAt(0).toUpperCase() + role.slice(1);
    }
    return 'Helper';
  };

  // Helper function to get primary service
  const getPrimaryService = (helper: Helper) => {
    if (helper.services && helper.services.length > 0) {
      const serviceType = helper.services[0].service_type || '';
      return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('_', ' ');
    }
    return 'Service Provider';
  };

  // Helper function to get price
  const getPrice = (helper: Helper) => {
    if (helper.services && helper.services.length > 0) {
      return helper.services[0].monthly_rate || 0;
    }
    return 0;
  };

  // Helper function to get all locations formatted
  const getAllLocationsFormatted = (helper: Helper): string[] => {
    const locationList: string[] = [];
    
    // First, check for location_details (primary source)
    if (helper.location_details && Array.isArray(helper.location_details) && helper.location_details.length > 0) {
      helper.location_details.forEach((loc) => {
        const locationName = loc.name || loc.location_name || '';
        const area = loc.area || loc.area_name || '';
        
        if (locationName && area) {
          const formatted = `${locationName}, ${area}`;
          if (!locationList.includes(formatted)) {
            locationList.push(formatted);
          }
        } else if (locationName) {
          if (!locationList.includes(locationName)) {
            locationList.push(locationName);
          }
        } else if (area) {
          if (!locationList.includes(area)) {
            locationList.push(area);
          }
        }
      });
    }
    
    // Fallback to locations array if location_details is not available
    if (locationList.length === 0 && helper.locations && Array.isArray(helper.locations) && helper.locations.length > 0) {
      helper.locations.forEach((loc) => {
        if (loc && !locationList.includes(loc)) {
          locationList.push(loc);
        }
      });
    }
    
    // Fallback to services locations
    if (locationList.length === 0 && helper.services && helper.services.length > 0) {
      helper.services.forEach((service) => {
        const locationName = service.location?.name || '';
        const area = service.area || '';
        
        if (locationName && area) {
          const formatted = `${locationName}, ${area}`;
          if (!locationList.includes(formatted)) {
            locationList.push(formatted);
          }
        } else if (locationName) {
          if (!locationList.includes(locationName)) {
            locationList.push(locationName);
          }
        } else if (area) {
          if (!locationList.includes(area)) {
            locationList.push(area);
          }
        }
      });
    }
    
    // Check if area is at helper level
    if (locationList.length === 0 && helper.area && !locationList.includes(helper.area)) {
      locationList.push(helper.area);
    }
    
    return locationList.length > 0 ? locationList : ['Location not specified'];
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

    return (
      <TouchableOpacity
        key={providerId}
        style={styles.card}
        onPress={() => router.push(`/profile/helper/${providerId}` as any)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            {item.profile_image ? (
              <Image source={{ uri: item.profile_image }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{providerName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.cardInfo}>
            <ThemedText type="subtitle" style={styles.cardName}>
              {providerName}
            </ThemedText>

            {/* Services Tags */}
            <View style={styles.cardServicesContainer}>
              {item.services && item.services.length > 0 ? (
                item.services.map((s, index) => {
                  const serviceName = s.service_type
                    ? s.service_type.charAt(0).toUpperCase() + s.service_type.slice(1).replace('_', ' ')
                    : 'Service';
                  return (
                    <View key={index} style={styles.cardServiceTag}>
                      <Text style={styles.cardServiceTagText}>{serviceName}</Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.cardServiceTag}>
                  <Text style={styles.cardServiceTagText}>Service Provider</Text>
                </View>
              )}
            </View>

            {experience && (
              <ThemedText style={styles.experience}>{experience} experience</ThemedText>
            )}
            <View style={styles.ratingContainer}>
              <IconSymbol name="star.fill" size={14} color="#FFC107" />
              <ThemedText style={styles.rating}>
                {isNaN(rating) ? '0.0' : rating.toFixed(1)}
              </ThemedText>
              {reviewsCount > 0 && (
                <ThemedText style={styles.reviews}>({reviewsCount} reviews)</ThemedText>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push(`/chat/${providerId}?name=${encodeURIComponent(providerName)}`)}
          >
            <IconSymbol name="message.fill" size={20} color="#6366F1" />
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.cardBio} numberOfLines={2}>
          {bio}
        </ThemedText>
        <View style={styles.cardFooter}>
          <View style={styles.locationContainer}>
            <IconSymbol name="location.fill" size={14} color="#999" />
            <ThemedText style={styles.location} numberOfLines={2}>
              {locations.join(', ')}
            </ThemedText>
          </View>
          {price > 0 && (
            <ThemedText style={styles.price}>₨{price.toLocaleString()}/month</ThemedText>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Helper function to get all services for a helper
  const getAllServices = (helper: Helper): string[] => {
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
    if (helper.location_details && Array.isArray(helper.location_details) && helper.location_details.length > 0) {
      helper.location_details.forEach((loc) => {
        const locationName = loc.name || loc.location_name || '';
        const area = loc.area || loc.area_name || '';
        if (locationName && area) {
          locationList.push(`${locationName}, ${area}`);
        } else if (locationName) {
          locationList.push(locationName);
        } else if (area) {
          locationList.push(area);
        }
      });
    }
    if (helper.locations && Array.isArray(helper.locations)) {
      helper.locations.forEach((loc) => {
        if (loc) locationList.push(loc);
      });
    }
    if (helper.area) {
      locationList.push(helper.area);
    }
    return locationList;
  };

  // Get filtered providers based on tab selection
  const getFilteredByTab = () => {
    let providers = helpers;

    switch (selectedTab) {
      case 'top-rated':
        providers = [...helpers].sort((a, b) => {
          const ratingA = typeof a.rating === 'number' ? a.rating : (typeof a.rating === 'string' ? parseFloat(a.rating) : 0);
          const ratingB = typeof b.rating === 'number' ? b.rating : (typeof b.rating === 'string' ? parseFloat(b.rating) : 0);
          return ratingB - ratingA;
        }).filter((h) => {
          const rating = typeof h.rating === 'number' ? h.rating : (typeof h.rating === 'string' ? parseFloat(h.rating) : 0);
          return !isNaN(rating) && rating >= 4.0;
        });
        break;
      case 'experienced':
        providers = helpers.filter((h) => h.experience_years !== undefined && h.experience_years >= 5);
        break;
      case 'verified':
        providers = helpers.filter((h) => (h as any).verified === true || (h as any).is_verified === true);
        break;
      case 'all':
      default:
        providers = helpers;
    }

    return providers;
  };

  // Filter providers (helpers and businesses) based on all filters
  const filteredProviders = getFilteredByTab().filter((h: Helper) => {
    const providerName = getHelperName(h).toLowerCase();
    const service = getPrimaryService(h).toLowerCase();
    const role = getRole(h).toLowerCase();
    const bio = (h.bio || '').toLowerCase();

    const apiRole = (h.role || h.user_type || (h as any).userType || '').toLowerCase();

    if (user?.userType === 'helper' && (apiRole === 'helper' || apiRole === '')) {
      return false;
    }

    const matchesRole = selectedFilter === 'all' ||
      apiRole === selectedFilter.toLowerCase() ||
      (selectedFilter === 'helper' && (apiRole === 'helper' || apiRole === '')) ||
      (selectedFilter === 'business' && apiRole === 'business');

    const matchesSearch = searchQuery.trim() === '' ||
      providerName.includes(searchQuery.toLowerCase()) ||
      service.includes(searchQuery.toLowerCase()) ||
      role.includes(searchQuery.toLowerCase()) ||
      bio.includes(searchQuery.toLowerCase());

    const matchesServices = filters.services.length === 0 ||
      getAllServices(h).some((s) => filters.services.includes(s));

    const matchesLocations = filters.locations.length === 0 ||
      getAllLocations(h).some((loc) =>
        filters.locations.some((filterLoc) =>
          loc.toLowerCase().includes(filterLoc.toLowerCase()) ||
          filterLoc.toLowerCase().includes(loc.toLowerCase())
        )
      );

    const matchesExperience = filters.minExperience === null ||
      (h.experience_years !== undefined && h.experience_years >= filters.minExperience);

    const rating = typeof h.rating === 'number' ? h.rating : (typeof h.rating === 'string' ? parseFloat(h.rating) : 0);
    const matchesRating = filters.minRating === null ||
      (!isNaN(rating) && rating >= filters.minRating);

    return matchesRole && matchesSearch && matchesServices &&
      matchesLocations && matchesExperience && matchesRating;
  });

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.services.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.minExperience !== null) count++;
    if (filters.minRating !== null) count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      services: [],
      locations: [],
      minExperience: null,
      minRating: null,
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 20
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.subtitle}>
            Find helpers and businesses near you
          </ThemedText>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search helpers..."
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

        {/* Role Filters */}
        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'helper' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('helper')}
          >
            <Text style={[styles.filterText, selectedFilter === 'helper' && styles.filterTextActive]}>
              Helpers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'business' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('business')}
          >
            <Text style={[styles.filterText, selectedFilter === 'business' && styles.filterTextActive]}>
              Businesses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        <View style={styles.results}>
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Helpers ({filteredProviders.length})
            </ThemedText>
            {isLoading ? (
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
                  {searchQuery.trim()
                    ? 'No helpers found matching your search'
                    : 'No helpers available at the moment'}
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

              {/* Rating Filter */}
              <View style={styles.filterSection}>
                <ThemedText type="subtitle" style={styles.filterSectionTitle}>Minimum Rating</ThemedText>
                <View style={styles.ratingFilterContainer}>
                  {[0, 3, 3.5, 4, 4.5, 5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingChip,
                        filters.minRating === rating && styles.ratingChipActive
                      ]}
                      onPress={() => {
                        setFilters((prev) => ({
                          ...prev,
                          minRating: prev.minRating === rating ? null : rating,
                        }));
                      }}
                    >
                      <IconSymbol name="star.fill" size={14} color={filters.minRating === rating ? "#FFFFFF" : "#FFC107"} />
                      <Text style={[
                        styles.ratingChipText,
                        filters.minRating === rating && styles.ratingChipTextActive
                      ]}>
                        {rating === 0 ? 'Any' : rating.toFixed(1) + '+'}
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
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
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
  results: {
    paddingHorizontal: 20,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardServicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  cardServiceTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardServiceTagText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviews: {
    fontSize: 12,
    opacity: 0.6,
  },
  contactButton: {
    padding: 8,
  },
  cardBio: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  location: {
    fontSize: 12,
    opacity: 0.6,
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
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
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  experience: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
});

