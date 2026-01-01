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

export default function PrivacyScreen() {
  const router = useRouter();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Background */}
        <View style={styles.headerBackground}>
          <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ThemedText style={[styles.lastUpdated, { color: textMuted }]}>Last Updated: January 2024</ThemedText>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              Introduction
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              Kamwaalay ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              1. Information We Collect
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              We collect information that you provide directly to us, including:
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Personal information (name, phone number, email address)</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Profile information (bio, experience, service offerings)</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Location information</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Payment information (processed securely through third-party providers)</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Communications and messages sent through the app</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              2. How We Use Your Information
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              We use the information we collect to:
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Provide, maintain, and improve our services</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Process transactions and send related information</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Send you technical notices and support messages</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Respond to your comments and questions</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Monitor and analyze trends and usage</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Personalize and improve your experience</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              3. Information Sharing
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              We do not sell your personal information. We may share your information in the following circumstances:
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• With other users as necessary to facilitate jobs and bookings</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• With service providers who assist us in operating our platform</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• When required by law or to protect our rights</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• In connection with a business transfer or merger</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              4. Data Security
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              5. Your Rights
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              You have the right to:
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Access and receive a copy of your personal data</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Request correction of inaccurate data</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Request deletion of your personal data</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Object to processing of your personal data</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Request restriction of processing</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Withdraw consent at any time</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              6. Cookies and Tracking
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              We use cookies and similar tracking technologies to track activity on our app and hold certain information. You can instruct your device to refuse all cookies or to indicate when a cookie is being sent.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              7. Children's Privacy
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              Our service is not intended for children under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              8. Changes to This Privacy Policy
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              9. Contact Us
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              If you have any questions about this Privacy Policy, please contact us at:
            </ThemedText>
            <ThemedText style={[styles.contactInfo, { color: primaryColor }]}>
              Email: privacy@kamwaalay.com{'\n'}
              Phone: +92-300-1234567{'\n'}
              Address: Karachi, Pakistan
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
    fontSize: 22,
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

