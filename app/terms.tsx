import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const router = useRouter();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView style={[styles.scrollView, { backgroundColor }]} showsVerticalScrollIndicator={false}>
        {/* Header Background */}
        <View style={styles.headerBackground}>
          <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Terms & Conditions</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>

        {/* Content Container */}
        <View style={styles.content}>
          <ThemedText style={[styles.lastUpdated, { color: textMuted }]}>Last Updated: January 2024</ThemedText>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              1. Acceptance of Terms
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              By accessing and using the Kamwaalay mobile application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              2. Use License
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              Permission is granted to temporarily download one copy of the materials on Kamwaalay's mobile application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Modify or copy the materials</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Use the materials for any commercial purpose</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Attempt to decompile or reverse engineer any software</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Remove any copyright or other proprietary notations</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              3. User Accounts
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password. You must notify us immediately of any unauthorized use of your account.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              4. Jobs and Bookings
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              When you create a job or apply to provide services, you agree to:
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Provide accurate and complete information</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Honor all commitments made through the platform</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Communicate professionally with other users</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Pay or receive payment as agreed upon</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              5. Prohibited Activities
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              You agree not to:
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Post false, misleading, or fraudulent information</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Harass, abuse, or harm other users</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Violate any applicable laws or regulations</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Interfere with the operation of the service</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              6. Limitation of Liability
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              Kamwaalay acts as a platform connecting users with service providers. We are not responsible for the quality, safety, or legality of services provided by users. We do not guarantee the accuracy of user-provided information.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              7. Payment Terms
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              All payments are processed through secure payment methods. Users are responsible for all charges incurred through their account. Refunds are subject to our refund policy and the terms agreed upon between users.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              8. Termination
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              We reserve the right to terminate or suspend your account and access to the service immediately, without prior notice, for any breach of these Terms and Conditions.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              9. Changes to Terms
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              Kamwaalay reserves the right to revise these terms at any time. By continuing to use the service after changes are made, you agree to be bound by the revised terms.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              10. Contact Information
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              If you have any questions about these Terms and Conditions, please contact us at:
            </ThemedText>
            <ThemedText style={[styles.contactInfo, { color: primaryColor }]}>
              Email: legal@kamwaalay.com{'\n'}
              Phone: +92-300-1234567
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerBackground: {
    backgroundColor: '#6366F1',
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
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
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
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  list: {
    marginTop: 8,
    marginLeft: 8,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 15,
    lineHeight: 24,
    marginTop: 8,
    fontWeight: '600',
  },
});

