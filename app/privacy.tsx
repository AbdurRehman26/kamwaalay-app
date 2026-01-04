import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrivacyScreen() {
  const { t } = useTranslation();
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
      {/* Header */}
      <ScreenHeader title={t('privacy.title')} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Content */}
        <View style={styles.content}>
          <ThemedText style={[styles.lastUpdated, { color: textMuted }]}>{t('privacy.lastUpdated')}</ThemedText>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('privacy.introduction.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('privacy.introduction.content')}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('privacy.section1.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('privacy.section1.content')}
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section1.list.personal')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section1.list.profile')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section1.list.location')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section1.list.payment')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section1.list.communications')}</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('privacy.section2.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('privacy.section2.content')}
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section2.list.provide')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section2.list.process')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section2.list.notices')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section2.list.respond')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section2.list.monitor')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section2.list.personalize')}</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('privacy.section3.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('privacy.section3.content')}
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section3.list.users')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section3.list.providers')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section3.list.law')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section3.list.business')}</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('privacy.section4.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('privacy.section4.content')}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('privacy.section5.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('privacy.section5.content')}
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section5.list.access')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section5.list.correct')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section5.list.delete')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section5.list.object')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section5.list.restrict')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('privacy.section5.list.withdraw')}</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('privacy.section6.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('privacy.section6.content')}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('privacy.section7.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('privacy.section7.content')}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('privacy.section8.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('privacy.section8.content')}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('privacy.section9.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('privacy.section9.content')}
            </ThemedText>
            <ThemedText style={[styles.contactInfo, { color: primaryColor }]}>
              {t('privacy.section9.contactInfo')}
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

