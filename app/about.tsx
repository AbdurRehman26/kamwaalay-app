import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AboutScreen() {
  const router = useRouter();

  const handleSocialLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      // Failed to open URL
    });
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#6366F1" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          About Kamwaalay
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* App Logo/Icon Section */}
          <View style={styles.logoSection}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>K</Text>
            </View>
            <ThemedText type="title" style={styles.appName}>Kamwaalay</ThemedText>
            <ThemedText style={styles.version}>Version 1.0.0</ThemedText>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              About Us
            </ThemedText>
            <ThemedText style={styles.text}>
              Kamwaalay is a platform that connects customers with trusted helpers and businesses for household services. Whether you need cleaning, cooking, babysitting, elderly care, or other household services, Kamwaalay makes it easy to find and hire qualified professionals.
            </ThemedText>
            <ThemedText style={styles.text}>
              Our mission is to create a reliable and convenient marketplace where customers can find quality service providers, and helpers and businesses can grow their client base.
            </ThemedText>
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Key Features
            </ThemedText>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={styles.featureText}>Easy service request creation</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={styles.featureText}>Verified helpers and businesses</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={styles.featureText}>Secure messaging and communication</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={styles.featureText}>Booking management</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={styles.featureText}>Service offerings management</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={styles.featureText}>Location-based search</ThemedText>
              </View>
            </View>
          </View>

          {/* Contact Section */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Contact Us
            </ThemedText>
            <View style={styles.contactCard}>
              <View style={styles.contactRow}>
                <IconSymbol name="envelope.fill" size={20} color="#6366F1" />
                <ThemedText style={styles.contactText}>info@kamwaalay.com</ThemedText>
              </View>
              <View style={styles.contactRow}>
                <IconSymbol name="phone.fill" size={20} color="#6366F1" />
                <ThemedText style={styles.contactText}>+92-300-1234567</ThemedText>
              </View>
              <View style={styles.contactRow}>
                <IconSymbol name="location.fill" size={20} color="#6366F1" />
                <ThemedText style={styles.contactText}>Karachi, Pakistan</ThemedText>
              </View>
            </View>
          </View>

          {/* Social Media Section */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Follow Us
            </ThemedText>
            <View style={styles.socialLinks}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLink('https://facebook.com/kamwaalay')}
              >
                <IconSymbol name="message.fill" size={24} color="#6366F1" />
                <ThemedText style={styles.socialText}>Facebook</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLink('https://twitter.com/kamwaalay')}
              >
                <IconSymbol name="message.fill" size={24} color="#6366F1" />
                <ThemedText style={styles.socialText}>Twitter</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLink('https://instagram.com/kamwaalay')}
              >
                <IconSymbol name="message.fill" size={24} color="#6366F1" />
                <ThemedText style={styles.socialText}>Instagram</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Legal Links */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push('/terms')}
            >
              <ThemedText style={styles.linkText}>Terms & Conditions</ThemedText>
              <IconSymbol name="chevron.right" size={20} color="#CCCCCC" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push('/privacy')}
            >
              <ThemedText style={styles.linkText}>Privacy Policy</ThemedText>
              <IconSymbol name="chevron.right" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          </View>

          {/* Copyright */}
          <View style={styles.footer}>
            <ThemedText style={styles.copyright}>
              © 2024 Kamwaalay. All rights reserved.
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
  logoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  version: {
    fontSize: 14,
    color: '#999',
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
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 8,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
  },
  copyright: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

