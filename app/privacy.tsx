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

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#6366F1" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Privacy Policy
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <ThemedText style={styles.lastUpdated}>Last Updated: January 2024</ThemedText>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Introduction
            </ThemedText>
            <ThemedText style={styles.text}>
              Kamwaalay ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              1. Information We Collect
            </ThemedText>
            <ThemedText style={styles.text}>
              We collect information that you provide directly to us, including:
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={styles.listItem}>• Personal information (name, phone number, email address)</ThemedText>
              <ThemedText style={styles.listItem}>• Profile information (bio, experience, service offerings)</ThemedText>
              <ThemedText style={styles.listItem}>• Location information</ThemedText>
              <ThemedText style={styles.listItem}>• Payment information (processed securely through third-party providers)</ThemedText>
              <ThemedText style={styles.listItem}>• Communications and messages sent through the app</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              2. How We Use Your Information
            </ThemedText>
            <ThemedText style={styles.text}>
              We use the information we collect to:
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={styles.listItem}>• Provide, maintain, and improve our services</ThemedText>
              <ThemedText style={styles.listItem}>• Process transactions and send related information</ThemedText>
              <ThemedText style={styles.listItem}>• Send you technical notices and support messages</ThemedText>
              <ThemedText style={styles.listItem}>• Respond to your comments and questions</ThemedText>
              <ThemedText style={styles.listItem}>• Monitor and analyze trends and usage</ThemedText>
              <ThemedText style={styles.listItem}>• Personalize and improve your experience</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              3. Information Sharing
            </ThemedText>
            <ThemedText style={styles.text}>
              We do not sell your personal information. We may share your information in the following circumstances:
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={styles.listItem}>• With other users as necessary to facilitate service requests and bookings</ThemedText>
              <ThemedText style={styles.listItem}>• With service providers who assist us in operating our platform</ThemedText>
              <ThemedText style={styles.listItem}>• When required by law or to protect our rights</ThemedText>
              <ThemedText style={styles.listItem}>• In connection with a business transfer or merger</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              4. Data Security
            </ThemedText>
            <ThemedText style={styles.text}>
              We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              5. Your Rights
            </ThemedText>
            <ThemedText style={styles.text}>
              You have the right to:
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={styles.listItem}>• Access and receive a copy of your personal data</ThemedText>
              <ThemedText style={styles.listItem}>• Request correction of inaccurate data</ThemedText>
              <ThemedText style={styles.listItem}>• Request deletion of your personal data</ThemedText>
              <ThemedText style={styles.listItem}>• Object to processing of your personal data</ThemedText>
              <ThemedText style={styles.listItem}>• Request restriction of processing</ThemedText>
              <ThemedText style={styles.listItem}>• Withdraw consent at any time</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              6. Cookies and Tracking
            </ThemedText>
            <ThemedText style={styles.text}>
              We use cookies and similar tracking technologies to track activity on our app and hold certain information. You can instruct your device to refuse all cookies or to indicate when a cookie is being sent.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              7. Children's Privacy
            </ThemedText>
            <ThemedText style={styles.text}>
              Our service is not intended for children under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              8. Changes to This Privacy Policy
            </ThemedText>
            <ThemedText style={styles.text}>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              9. Contact Us
            </ThemedText>
            <ThemedText style={styles.text}>
              If you have any questions about this Privacy Policy, please contact us at:
            </ThemedText>
            <ThemedText style={styles.contactInfo}>
              Email: privacy@kamwaalay.com{'\n'}
              Phone: +92-300-1234567{'\n'}
              Address: Karachi, Pakistan
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
    color: '#6366F1',
    marginTop: 8,
    fontWeight: '600',
  },
});

