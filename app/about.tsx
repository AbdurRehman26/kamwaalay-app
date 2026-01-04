import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/useTranslation';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const { t } = useTranslation();
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

  const handleSocialLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      // Failed to open URL
    });
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <ScreenHeader title={t('about.title')} />

      <ScrollView style={[styles.scrollView, { backgroundColor }]} showsVerticalScrollIndicator={false}>

        {/* Content */}
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
            <ThemedText style={[styles.version, { color: textMuted }]}>{t('about.appInfo.version')}</ThemedText>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('about.aboutUs.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('about.aboutUs.description')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('about.aboutUs.mission')}
            </ThemedText>
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('about.features.title')}
            </ThemedText>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={[styles.featureText, { color: textSecondary }]}>{t('about.features.list.jobCreation')}</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={[styles.featureText, { color: textSecondary }]}>{t('about.features.list.verified')}</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={[styles.featureText, { color: textSecondary }]}>{t('about.features.list.messaging')}</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={[styles.featureText, { color: textSecondary }]}>{t('about.features.list.booking')}</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={[styles.featureText, { color: textSecondary }]}>{t('about.features.list.serviceOfferings')}</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#34C759" />
                <ThemedText style={[styles.featureText, { color: textSecondary }]}>{t('about.features.list.location')}</ThemedText>
              </View>
            </View>
          </View>

          {/* Contact Section */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('about.contact.title')}
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
                <ThemedText style={[styles.contactText, { color: textColor }]}>{t('about.contact.address')}</ThemedText>
              </View>
            </View>
          </View>

          {/* Social Media Section */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('about.followUs.title')}
            </ThemedText>
            <View style={styles.socialLinks}>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleSocialLink('https://facebook.com/kamwaalay')}
              >
                <IconSymbol name="message.fill" size={24} color={primaryColor} />
                <ThemedText style={[styles.socialText, { color: textColor }]}>{t('about.followUs.facebook')}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Legal Links */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push('/terms')}
            >
              <ThemedText style={[styles.linkText, { color: textColor }]}>{t('about.legal.terms')}</ThemedText>
              <IconSymbol name="chevron.right" size={20} color={textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push('/privacy')}
            >
              <ThemedText style={[styles.linkText, { color: textColor }]}>{t('about.legal.privacy')}</ThemedText>
              <IconSymbol name="chevron.right" size={20} color={textMuted} />
            </TouchableOpacity>
          </View>

          {/* Copyright */}
          <View style={styles.footer}>
            <ThemedText style={[styles.copyright, { color: textMuted }]}>
              {t('about.footer.copyright')}
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

