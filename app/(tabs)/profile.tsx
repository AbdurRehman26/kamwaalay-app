import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/useTranslation';
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { language, setLanguage } = useApp();
  const { t } = useTranslation();
  const { themeMode, setThemeMode, colorScheme } = useTheme();

  // Theme colors
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const errorColor = useThemeColor({}, 'error');
  const iconColor = useThemeColor({}, 'icon');

  const handleLogout = async () => {
    try {
      // Navigate first to ensure we get to login screen
      router.replace('/auth/phone-login');

      // Small delay to let navigation start
      await new Promise(resolve => setTimeout(resolve, 50));

      // Then call logout function to clear state and storage
      await logout();
    } catch (error) {
      // Logout error
      // Force navigation even if logout fails
      router.replace('/auth/phone-login');
    }
  };

  const menuItems = [
    {
      id: 'edit-profile',
      title: t('profile.editProfile'),
      icon: 'person.fill',
      onPress: () => router.push('/profile/edit'),
    },
    {
      id: 'business-dashboard',
      title: t('profile.businessDashboard'),
      icon: 'briefcase.fill',
      onPress: () => router.push('/business/dashboard'),
      show: user?.userType === 'business',
    },
    {
      id: 'manage-workers',
      title: t('profile.manageWorkers'),
      icon: 'person.3.fill',
      onPress: () => router.push('/workers'),
      show: user?.userType === 'business',
    },
    {
      id: 'service-offerings',
      title: t('profile.serviceOfferings'),
      icon: 'list.bullet',
      onPress: () => router.push('/profile/service-offerings'),
      show: user?.userType === 'helper',
    },
    {
      id: 'bookings',
      title: t('profile.jobApplications'),
      icon: 'calendar',
      onPress: () => router.push('/profile/bookings'),
    },
    {
      id: 'notifications',
      title: t('profile.notifications'),
      icon: 'bell.fill',
      onPress: () => router.push('/notifications'),
    },
    {
      id: 'settings',
      title: t('profile.settings'),
      icon: 'gearshape.fill',
      onPress: () => router.push('/settings'),
    },
    {
      id: 'help',
      title: t('profile.helpSupport'),
      icon: 'questionmark.circle.fill',
      onPress: () => router.push('/help'),
    },
    {
      id: 'logout',
      title: t('profile.logout'),
      icon: 'arrow.right.square.fill',
      onPress: handleLogout,
      destructive: true,
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.show !== false);

  return (
    <ThemedView style={styles.container}>
      {/* Profile Header */}
      <ScreenHeader title={t('profile.title')} showBackButton={false} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        horizontal={false}
        contentContainerStyle={{ width: '100%' }}
      >
        <View style={styles.profileInfoContainer}>
          <View style={[styles.avatar, { backgroundColor: primaryLight }]}>
            <Text style={[styles.avatarText, { color: primaryColor }]}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <ThemedText type="title" style={styles.name}>
            {user?.name || 'User'}
          </ThemedText>
          <ThemedText style={styles.phone}>{user?.phoneNumber}</ThemedText>
          <View style={[styles.badge, { backgroundColor: primaryLight }]}>
            <Text style={[styles.badgeText, { color: primaryColor }]}>
              {user?.userType === 'user'
                ? t('profile.customer')
                : user?.userType === 'helper'
                  ? t('profile.helper')
                  : t('profile.business')}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menu}>
          {visibleMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { backgroundColor: cardBg, borderColor }]}
              onPress={() => {
                if (item.onPress) {
                  item.onPress();
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  name={item.icon as any}
                  size={24}
                  color={item.destructive ? errorColor : primaryColor}
                />
                <ThemedText
                  style={[
                    styles.menuItemText,
                    item.destructive && { color: errorColor },
                  ]}
                >
                  {item.title}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color={textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Language Selection */}
        <View style={styles.themeSection}>
          <ThemedText type="subtitle" style={styles.themeSectionTitle}>
            {t('profile.language')}
          </ThemedText>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: cardBg, borderColor },
                language === 'en' && { borderColor: primaryColor, borderWidth: 2 }
              ]}
              onPress={() => setLanguage('en')}
            >
              <ThemedText style={styles.themeOptionText}>{t('profile.english')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: cardBg, borderColor },
                language === 'ur' && { borderColor: primaryColor, borderWidth: 2 }
              ]}
              onPress={() => setLanguage('ur')}
            >
              <ThemedText style={[styles.themeOptionText, { fontFamily: 'System' }]}>{t('profile.urdu')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: cardBg, borderColor },
                language === 'roman' && { borderColor: primaryColor, borderWidth: 2 }
              ]}
              onPress={() => setLanguage('roman')}
            >
              <ThemedText style={styles.themeOptionText}>{t('profile.roman')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Theme Selection */}
        <View style={styles.themeSection}>
          <ThemedText type="subtitle" style={styles.themeSectionTitle}>
            {t('profile.appearance')}
          </ThemedText>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: cardBg, borderColor },
                themeMode === 'light' && { borderColor: primaryColor, borderWidth: 2 }
              ]}
              onPress={() => setThemeMode('light')}
            >
              <IconSymbol name="sun.max.fill" size={24} color={iconColor} />
              <ThemedText style={styles.themeOptionText}>{t('profile.light')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: cardBg, borderColor },
                themeMode === 'dark' && { borderColor: primaryColor, borderWidth: 2 }
              ]}
              onPress={() => setThemeMode('dark')}
            >
              <IconSymbol name="moon.fill" size={24} color={iconColor} />
              <ThemedText style={styles.themeOptionText}>{t('profile.dark')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: cardBg, borderColor },
                themeMode === 'auto' && { borderColor: primaryColor, borderWidth: 2 }
              ]}
              onPress={() => setThemeMode('auto')}
            >
              <IconSymbol name="circle.lefthalf.filled" size={24} color={iconColor} />
              <ThemedText style={styles.themeOptionText}>{t('profile.auto')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  headerBackground: {
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileInfoContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
    marginTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  menu: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  themeSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

