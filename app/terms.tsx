import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Terms & Conditions
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <ThemedText style={styles.lastUpdated}>Last Updated: January 2024</ThemedText>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              1. Acceptance of Terms
            </ThemedText>
            <ThemedText style={styles.text}>
              By accessing and using the Kamwaalay mobile application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              2. Use License
            </ThemedText>
            <ThemedText style={styles.text}>
              Permission is granted to temporarily download one copy of the materials on Kamwaalay's mobile application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={styles.listItem}>• Modify or copy the materials</ThemedText>
              <ThemedText style={styles.listItem}>• Use the materials for any commercial purpose</ThemedText>
              <ThemedText style={styles.listItem}>• Attempt to decompile or reverse engineer any software</ThemedText>
              <ThemedText style={styles.listItem}>• Remove any copyright or other proprietary notations</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              3. User Accounts
            </ThemedText>
            <ThemedText style={styles.text}>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password. You must notify us immediately of any unauthorized use of your account.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              4. Service Requests and Bookings
            </ThemedText>
            <ThemedText style={styles.text}>
              When you create a service request or apply to provide services, you agree to:
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={styles.listItem}>• Provide accurate and complete information</ThemedText>
              <ThemedText style={styles.listItem}>• Honor all commitments made through the platform</ThemedText>
              <ThemedText style={styles.listItem}>• Communicate professionally with other users</ThemedText>
              <ThemedText style={styles.listItem}>• Pay or receive payment as agreed upon</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              5. Prohibited Activities
            </ThemedText>
            <ThemedText style={styles.text}>
              You agree not to:
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={styles.listItem}>• Post false, misleading, or fraudulent information</ThemedText>
              <ThemedText style={styles.listItem}>• Harass, abuse, or harm other users</ThemedText>
              <ThemedText style={styles.listItem}>• Violate any applicable laws or regulations</ThemedText>
              <ThemedText style={styles.listItem}>• Interfere with the operation of the service</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              6. Limitation of Liability
            </ThemedText>
            <ThemedText style={styles.text}>
              Kamwaalay acts as a platform connecting users with service providers. We are not responsible for the quality, safety, or legality of services provided by users. We do not guarantee the accuracy of user-provided information.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              7. Payment Terms
            </ThemedText>
            <ThemedText style={styles.text}>
              All payments are processed through secure payment methods. Users are responsible for all charges incurred through their account. Refunds are subject to our refund policy and the terms agreed upon between users.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              8. Termination
            </ThemedText>
            <ThemedText style={styles.text}>
              We reserve the right to terminate or suspend your account and access to the service immediately, without prior notice, for any breach of these Terms and Conditions.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              9. Changes to Terms
            </ThemedText>
            <ThemedText style={styles.text}>
              Kamwaalay reserves the right to revise these terms at any time. By continuing to use the service after changes are made, you agree to be bound by the revised terms.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              10. Contact Information
            </ThemedText>
            <ThemedText style={styles.text}>
              If you have any questions about these Terms and Conditions, please contact us at:
            </ThemedText>
            <ThemedText style={styles.contactInfo}>
              Email: legal@kamwaalay.com{'\n'}
              Phone: +92-300-1234567
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1A1A1A',
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: '#666',
    marginBottom: 12,
  },
  list: {
    marginTop: 8,
    marginLeft: 8,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 24,
    color: '#666',
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 15,
    lineHeight: 24,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '600',
  },
});

