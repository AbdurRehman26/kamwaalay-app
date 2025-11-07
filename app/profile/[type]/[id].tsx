import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Mock profile data
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

export default function ProfileViewScreen() {
  const router = useRouter();
  const { type, id } = useLocalSearchParams();

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#007AFF" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Profile
          </ThemedText>
          <TouchableOpacity onPress={() => router.push(`/chat/${id}`)}>
            <IconSymbol name="message.fill" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{MOCK_PROFILE.name.charAt(0)}</Text>
          </View>
          <ThemedText type="title" style={styles.name}>
            {MOCK_PROFILE.name}
          </ThemedText>
          <ThemedText style={styles.service}>{MOCK_PROFILE.service}</ThemedText>
          <View style={styles.ratingContainer}>
            <IconSymbol name="star.fill" size={20} color="#FFC107" />
            <ThemedText style={styles.rating}>{MOCK_PROFILE.rating}</ThemedText>
            <ThemedText style={styles.reviews}>({MOCK_PROFILE.reviews} reviews)</ThemedText>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <IconSymbol name="clock.fill" size={24} color="#007AFF" />
            <ThemedText style={styles.statValue}>{MOCK_PROFILE.experience}</ThemedText>
            <ThemedText style={styles.statLabel}>Experience</ThemedText>
          </View>
          <View style={styles.statItem}>
            <IconSymbol name="location.fill" size={24} color="#007AFF" />
            <ThemedText style={styles.statValue}>{MOCK_PROFILE.distance}</ThemedText>
            <ThemedText style={styles.statLabel}>Distance</ThemedText>
          </View>
          <View style={styles.statItem}>
            <IconSymbol name="dollarsign.circle.fill" size={24} color="#007AFF" />
            <ThemedText style={styles.statValue}>₨{MOCK_PROFILE.price}</ThemedText>
            <ThemedText style={styles.statLabel}>Per Month</ThemedText>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            About
          </ThemedText>
          <ThemedText style={styles.bio}>{MOCK_PROFILE.bio}</ThemedText>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Services Offered
          </ThemedText>
          <View style={styles.servicesContainer}>
            {MOCK_PROFILE.services.map((service) => (
              <View key={service} style={styles.serviceTag}>
                <Text style={styles.serviceTagText}>{service}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Locations */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Service Locations
          </ThemedText>
          <View style={styles.locationsContainer}>
            {MOCK_PROFILE.locations.map((location) => (
              <View key={location} style={styles.locationTag}>
                <IconSymbol name="location.fill" size={16} color="#007AFF" />
                <Text style={styles.locationTagText}>{location}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push(`/chat/${id}`)}
          >
            <IconSymbol name="message.fill" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  service: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 18,
    fontWeight: '600',
  },
  reviews: {
    fontSize: 14,
    opacity: 0.6,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.7,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  serviceTagText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  locationsContainer: {
    gap: 8,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  locationTagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    marginBottom: 20,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bookButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

