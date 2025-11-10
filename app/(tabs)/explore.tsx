import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

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
}

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getHelpers } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'helpers' | 'businesses'>('all');
  const helpers = getHelpers();
  
  // Get service filter from route params
  const routeParams = useLocalSearchParams();
  const serviceFilter = routeParams?.service as string | undefined;

  // For helpers/businesses, redirect to requests tab (which shows service requests)
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

  // Helper function to get primary service
  const getPrimaryService = (helper: Helper) => {
    if (helper.services && helper.services.length > 0) {
      const serviceType = helper.services[0].service_type || '';
      return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('_', ' ');
    }
    return 'Helper';
  };

  // Helper function to get price
  const getPrice = (helper: Helper) => {
    if (helper.services && helper.services.length > 0) {
      return helper.services[0].monthly_rate || 0;
    }
    return 0;
  };

  // Helper function to get location
  const getLocation = (helper: Helper) => {
    if (helper.services && helper.services.length > 0) {
      const service = helper.services[0];
      const locationName = service.location?.name || '';
      const area = service.area || helper.area || '';
      
      if (locationName && area) {
        return `${locationName}, ${area}`;
      } else if (locationName) {
        return locationName;
      } else if (area) {
        return area;
      }
      return 'Location not specified';
    }
    // Check if area is at helper level
    if (helper.area) {
      return helper.area;
    }
    return 'Location not specified';
  };

  // For users/customers - show helpers and businesses
  const renderHelperCard = (item: Helper) => {
    const helperId = getHelperId(item);
    const helperName = getHelperName(item);
    const service = getPrimaryService(item);
    const price = getPrice(item);
    const location = getLocation(item);
    const rating = typeof item.rating === 'number' ? item.rating : (typeof item.rating === 'string' ? parseFloat(item.rating) : 0);
    const reviewsCount = typeof item.reviews_count === 'number' ? item.reviews_count : (typeof item.reviews_count === 'string' ? parseInt(item.reviews_count, 10) : 0);
    const bio = item.bio || 'No bio available';
    const experience = item.experience_years ? `${item.experience_years} years` : '';

    return (
      <TouchableOpacity
        key={helperId}
        style={styles.card}
        onPress={() => router.push(`/profile/helper/${helperId}` as any)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            {item.profile_image ? (
              <Image source={{ uri: item.profile_image }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{helperName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.cardInfo}>
            <ThemedText type="subtitle" style={styles.cardName}>
              {helperName}
            </ThemedText>
            <ThemedText style={styles.cardService}>{service}</ThemedText>
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
            onPress={() => router.push(`/chat/${helperId}?name=${encodeURIComponent(helperName)}`)}
          >
            <IconSymbol name="message.fill" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.cardBio} numberOfLines={2}>
          {bio}
        </ThemedText>
        <View style={styles.cardFooter}>
          <View style={styles.locationContainer}>
            <IconSymbol name="location.fill" size={14} color="#999" />
            <ThemedText style={styles.location}>{location}</ThemedText>
          </View>
          {price > 0 && (
            <ThemedText style={styles.price}>₨{price.toLocaleString()}/month</ThemedText>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Filter helpers based on search query and service filter
  const filteredHelpers = helpers.filter((h: Helper) => {
    const helperName = getHelperName(h).toLowerCase();
    const service = getPrimaryService(h).toLowerCase();
    const bio = (h.bio || '').toLowerCase();
    
    const matchesSearch = searchQuery.trim() === '' ||
      helperName.includes(searchQuery.toLowerCase()) ||
      service.includes(searchQuery.toLowerCase()) ||
      bio.includes(searchQuery.toLowerCase());
    
    const matchesService = !serviceFilter || 
      service.includes(serviceFilter.toLowerCase()) ||
      serviceFilter.toLowerCase().includes(service);
    
    return matchesSearch && matchesService;
  });

  // For now, businesses are empty (removed from app)
  const filteredBusinesses: any[] = [];

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {serviceFilter ? `${serviceFilter} Services` : 'Explore'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {serviceFilter 
              ? `Find ${serviceFilter.toLowerCase()} helpers and businesses near you`
              : 'Find helpers and businesses near you'}
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
            placeholder="Search helpers or businesses..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
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
            style={[styles.filterButton, selectedFilter === 'helpers' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('helpers')}
          >
            <Text style={[styles.filterText, selectedFilter === 'helpers' && styles.filterTextActive]}>
              Helpers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'businesses' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('businesses')}
          >
            <Text style={[styles.filterText, selectedFilter === 'businesses' && styles.filterTextActive]}>
              Businesses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        <View style={styles.results}>
          {(selectedFilter === 'all' || selectedFilter === 'helpers') && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Helpers ({filteredHelpers.length})
              </ThemedText>
              {filteredHelpers.length > 0 ? (
                filteredHelpers.map((helper: Helper) => renderHelperCard(helper))
              ) : (
                <View style={styles.emptyState}>
                  <IconSymbol name="person.fill" size={48} color="#CCCCCC" />
                  <ThemedText style={styles.emptyText}>
                    {searchQuery.trim() || serviceFilter
                      ? 'No helpers found matching your search'
                      : 'No helpers available at the moment'}
                  </ThemedText>
                </View>
              )}
            </View>
          )}

          {(selectedFilter === 'all' || selectedFilter === 'businesses') && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Businesses ({filteredBusinesses.length})
              </ThemedText>
              {filteredBusinesses.length > 0 ? (
                filteredBusinesses.map((business: any) => (
                  <View key={business.id} style={styles.emptyState}>
                    <ThemedText style={styles.emptyText}>Businesses coming soon</ThemedText>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <IconSymbol name="building.2.fill" size={48} color="#CCCCCC" />
                  <ThemedText style={styles.emptyText}>No businesses available</ThemedText>
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
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
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
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  clearFilterText: {
    fontSize: 14,
    color: '#007AFF',
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
    backgroundColor: '#007AFF',
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
    backgroundColor: '#E3F2FD',
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
  cardService: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
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
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 12,
    opacity: 0.6,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 10,
    shadowColor: '#007AFF',
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
