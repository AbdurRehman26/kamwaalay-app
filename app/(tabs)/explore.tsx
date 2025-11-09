import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Mock data for helpers and businesses
const MOCK_HELPERS = [
  {
    id: '1',
    name: 'Fatima Ali',
    service: 'Cooking',
    rating: 4.8,
    reviews: 127,
    price: 15000,
    location: 'Karachi',
    distance: '2.3 km',
    experience: '5 years',
    bio: 'Expert in Pakistani cuisine and traditional dishes',
  },
  {
    id: '2',
    name: 'Ahmed Khan',
    service: 'Cleaning',
    rating: 4.9,
    reviews: 203,
    price: 12000,
    location: 'Lahore',
    distance: '1.8 km',
    experience: '7 years',
    bio: 'Professional house cleaning with eco-friendly products',
  },
  {
    id: '3',
    name: 'Ayesha Malik',
    service: 'Babysitting',
    rating: 4.7,
    reviews: 89,
    price: 20000,
    location: 'Islamabad',
    distance: '3.5 km',
    experience: '8 years',
    bio: 'Experienced babysitter with first aid certification',
  },
];

const MOCK_BUSINESSES = [
  {
    id: '1',
    name: 'HomeCare Services',
    service: 'All-Rounder',
    rating: 4.6,
    reviews: 76,
    price: 18000,
    location: 'Karachi',
    distance: '4.2 km',
    bio: 'Professional home care services',
  },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getServiceRequests } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'helpers' | 'businesses'>('all');
  const serviceRequests = getServiceRequests();
  
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

  // For users/customers - show helpers and businesses
  const renderHelperCard = (item: typeof MOCK_HELPERS[0]) => (
    <TouchableOpacity
      key={item.id}
      style={styles.card}
      onPress={() => router.push(`/profile/helper/${item.id}` as any)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.name || 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <ThemedText type="subtitle" style={styles.cardName}>
            {item.name}
          </ThemedText>
          <ThemedText style={styles.cardService}>{item.service}</ThemedText>
          <View style={styles.ratingContainer}>
            <IconSymbol name="star.fill" size={14} color="#FFC107" />
            <ThemedText style={styles.rating}>{item.rating}</ThemedText>
            <ThemedText style={styles.reviews}>({item.reviews} reviews)</ThemedText>
          </View>
        </View>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => router.push(`/chat/${item.id}`)}
        >
          <IconSymbol name="message.fill" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
      <ThemedText style={styles.cardBio} numberOfLines={2}>
        {item.bio}
      </ThemedText>
      <View style={styles.cardFooter}>
        <View style={styles.locationContainer}>
          <IconSymbol name="location.fill" size={14} color="#999" />
          <ThemedText style={styles.location}>{item.distance} away</ThemedText>
        </View>
        <ThemedText style={styles.price}>₨{item.price}/month</ThemedText>
      </View>
    </TouchableOpacity>
  );

  const renderBusinessCard = (item: typeof MOCK_BUSINESSES[0]) => (
    <TouchableOpacity
      key={item.id}
      style={styles.card}
      onPress={() => router.push(`/profile/business/${item.id}` as any)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: '#FFF3E0' }]}>
          <Text style={styles.avatarText}>🏢</Text>
        </View>
        <View style={styles.cardInfo}>
          <ThemedText type="subtitle" style={styles.cardName}>
            {item.name}
          </ThemedText>
          <ThemedText style={styles.cardService}>{item.service}</ThemedText>
          <View style={styles.ratingContainer}>
            <IconSymbol name="star.fill" size={14} color="#FFC107" />
            <ThemedText style={styles.rating}>{item.rating}</ThemedText>
            <ThemedText style={styles.reviews}>({item.reviews} reviews)</ThemedText>
          </View>
        </View>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => router.push(`/chat/${item.id}`)}
        >
          <IconSymbol name="message.fill" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
      <ThemedText style={styles.cardBio} numberOfLines={2}>
        {item.bio}
      </ThemedText>
      <View style={styles.cardFooter}>
        <View style={styles.locationContainer}>
          <IconSymbol name="location.fill" size={14} color="#999" />
          <ThemedText style={styles.location}>{item.distance} away</ThemedText>
        </View>
        <ThemedText style={styles.price}>₨{item.price}/month</ThemedText>
      </View>
    </TouchableOpacity>
  );

  // Filter helpers and businesses based on search query and service filter
  const filteredHelpers = MOCK_HELPERS.filter((h) => {
    const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesService = !serviceFilter || h.service.toLowerCase() === serviceFilter.toLowerCase();
    return matchesSearch && matchesService;
  });

  const filteredBusinesses = MOCK_BUSINESSES.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesService = !serviceFilter || b.service.toLowerCase() === serviceFilter.toLowerCase();
    return matchesSearch && matchesService;
  });

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
              {filteredHelpers.map(renderHelperCard)}
            </View>
          )}

          {(selectedFilter === 'all' || selectedFilter === 'businesses') && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Businesses ({filteredBusinesses.length})
              </ThemedText>
              {filteredBusinesses.map(renderBusinessCard)}
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
});
