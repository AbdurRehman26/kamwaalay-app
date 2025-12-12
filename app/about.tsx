import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

export default function AboutScreen() {
  const router = useRouter();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  const handleSocialLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      // Failed to open URL
    });
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={primaryColor} />
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.title, { color: textColor }]}>
          About Kamwaalay
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor }]} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* App Logo/Icon Section */}
          <View style={styles.logoSection}>
            <View style={styles.logo}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <ThemedText type="title" style={[styles.appName, { color: textColor }]}>Kamwaalay</ThemedText>
            <ThemedText style={[styles.version, { color: textMuted }]}>Version 1.0.0</ThemedText>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              About Us
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              Kamwaalay is a platform that connects customers with trusted helpers and businesses for household services. Whether you need cleaning, cooking, babysitting, elderly care, or other household services, Kamwaalay makes it easy to find and hire qualified professionals.
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              Our mission is to create a reliable and convenient marketplace where customers can find quality service providers, and helpers and businesses can grow their client base.
            </ThemedText>
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              Key Features
            </ThemedText>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={[styles.featureText, { color: textSecondary }]}>Easy job creation</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={[styles.featureText, { color: textSecondary }]}>Verified helpers and businesses</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={[styles.featureText, { color: textSecondary }]}>Secure messaging and communication</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={[styles.featureText, { color: textSecondary }]}>Booking management</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={[styles.featureText, { color: textSecondary }]}>Service offerings management</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={[styles.featureText, { color: textSecondary }]}>Location-based search</ThemedText>
              </View>
            </View>
          </View>

          {/* Contact Section */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              Contact Us
            </ThemedText>
            <View style={[styles.contactCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.contactRow}>
                <IconSymbol name="envelope.fill" size={20} color={primaryColor} />
                <ThemedText style={[styles.contactText, { color: textColor }]}>info@kamwaalay.com</ThemedText>
              </View>
              <View style={styles.contactRow}>
                <IconSymbol name="phone.fill" size={20} color={primaryColor} />
                <ThemedText style={[styles.contactText, { color: textColor }]}>+92-300-1234567</ThemedText>
              </View>
              <View style={styles.contactRow}>
                <IconSymbol name="location.fill" size={20} color={primaryColor} />
                <ThemedText style={[styles.contactText, { color: textColor }]}>Karachi, Pakistan</ThemedText>
              </View>
            </View>
          </View>

          {/* Social Media Section */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              Follow Us
            </ThemedText>
            <View style={styles.socialLinks}>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleSocialLink('https://facebook.com/kamwaalay')}
              >
                <IconSymbol name="message.fill" size={24} color={primaryColor} />
                <ThemedText style={[styles.socialText, { color: textColor }]}>Facebook</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleSocialLink('https://twitter.com/kamwaalay')}
              >
                <IconSymbol name="message.fill" size={24} color={primaryColor} />
                <ThemedText style={[styles.socialText, { color: textColor }]}>Twitter</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleSocialLink('https://instagram.com/kamwaalay')}
              >
                <IconSymbol name="message.fill" size={24} color={primaryColor} />
                <ThemedText style={[styles.socialText, { color: textColor }]}>Instagram</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Legal Links */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push('/terms')}
            >
              <ThemedText style={[styles.linkText, { color: textColor }]}>Terms & Conditions</ThemedText>
              <IconSymbol name="chevron.right" size={20} color={textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push('/privacy')}
            >
              <ThemedText style={[styles.linkText, { color: textColor }]}>Privacy Policy</ThemedText>
              <IconSymbol name="chevron.right" size={20} color={textMuted} />
            </TouchableOpacity>
          </View>

          {/* Copyright */}
          <View style={styles.footer}>
            <ThemedText style={[styles.copyright, { color: textMuted }]}>
              © 2024 Kamwaalay. All rights reserved.
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: 150,
    height: 150,
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
  },
  version: {
    fontSize: 14,
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
    flex: 1,
  },
  contactCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 15,
    fontWeight: '500',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    gap: 8,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
  },
  copyright: {
    fontSize: 12,
    textAlign: 'center',
  },
});

