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

export default function TermsScreen() {
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

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <ScreenHeader title={t('terms.title')} />

      <ScrollView style={[styles.scrollView, { backgroundColor }]} showsVerticalScrollIndicator={false}>

        {/* Content Container */}
        <View style={styles.content}>
          <ThemedText style={[styles.lastUpdated, { color: textMuted }]}>{t('terms.lastUpdated')}</ThemedText>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('terms.section1.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('terms.section1.content')}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('terms.section2.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('terms.section2.content')}
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('terms.section2.list.modify')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('terms.section2.list.commercial')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('terms.section2.list.decompile')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('terms.section2.list.remove')}</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('terms.section3.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('terms.section3.content')}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('terms.section4.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('terms.section4.content')}
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('terms.section4.list.accurate')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('terms.section4.list.honor')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('terms.section4.list.communicate')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('terms.section4.list.payment')}</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('terms.section5.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('terms.section5.content')}
            </ThemedText>
            <View style={styles.list}>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('terms.section5.list.false')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('terms.section5.list.harass')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('terms.section5.list.violate')}</ThemedText>
              <ThemedText style={[styles.listItem, { color: textSecondary }]}>{t('terms.section5.list.interfere')}</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('terms.section6.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('terms.section6.content')}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('terms.section7.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('terms.section7.content')}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('terms.section8.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('terms.section8.content')}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('terms.section9.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('terms.section9.content')}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {t('terms.section10.title')}
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              {t('terms.section10.content')}
            </ThemedText>
            <ThemedText style={[styles.contactInfo, { color: primaryColor }]}>
              {t('terms.section10.contactInfo')}
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

