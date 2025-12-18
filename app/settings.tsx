import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View
} from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { themeMode, setThemeMode, colorScheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        horizontal={false}
        contentContainerStyle={{ width: '100%' }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={iconColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Settings
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Theme Settings */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Appearance
          </ThemedText>
          <View style={[styles.settingItem, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.settingLeft}>
              <IconSymbol
                name={colorScheme === 'dark' ? 'moon.fill' : 'sun.max.fill'}
                size={24}
                color={iconColor}
              />
              <ThemedText style={styles.settingLabel}>Theme</ThemedText>
            </View>
          </View>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: cardBg, borderColor },
                themeMode === 'light' && { borderColor: primaryColor, borderWidth: 2 }
              ]}
              onPress={() => setThemeMode('light')}
            >
              <IconSymbol name="sun.max.fill" size={20} color={iconColor} />
              <ThemedText style={styles.themeOptionText}>Light</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: cardBg, borderColor },
                themeMode === 'dark' && { borderColor: primaryColor, borderWidth: 2 }
              ]}
              onPress={() => setThemeMode('dark')}
            >
              <IconSymbol name="moon.fill" size={20} color={iconColor} />
              <ThemedText style={styles.themeOptionText}>Dark</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: cardBg, borderColor },
                themeMode === 'auto' && { borderColor: primaryColor, borderWidth: 2 }
              ]}
              onPress={() => setThemeMode('auto')}
            >
              <IconSymbol name="circle.lefthalf.filled" size={20} color={iconColor} />
              <ThemedText style={styles.themeOptionText}>Auto</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Notifications
          </ThemedText>
          <View style={[styles.settingItem, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.settingLeft}>
              <IconSymbol name="bell.fill" size={24} color={iconColor} />
              <ThemedText style={styles.settingLabel}>Push Notifications</ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: borderColor, true: primaryColor }}
            />
          </View>
        </View>

        {/* Business Section - Only for business users */}
        {user?.userType === 'business' && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Business
            </ThemedText>
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push('/business/dashboard')}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol name="chart.bar.fill" size={24} color={iconColor} />
                <ThemedText style={styles.menuItemText}>Business Dashboard</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color={textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push('/workers')}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol name="person.2.fill" size={24} color={iconColor} />
                <ThemedText style={styles.menuItemText}>Manage Workers</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color={textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Account Settings */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Account
          </ThemedText>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: cardBg, borderColor }]}
            onPress={() => router.push('/profile/edit')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="person.fill" size={24} color={iconColor} />
              <ThemedText style={styles.menuItemText}>Edit Profile</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: cardBg, borderColor }]}
            onPress={() => router.push('/settings/change-password')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="lock.fill" size={24} color={iconColor} />
              <ThemedText style={styles.menuItemText}>Change Password</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={textSecondary} />
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            App
          </ThemedText>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: cardBg, borderColor }]}
            onPress={() => router.push('/about')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="info.circle.fill" size={24} color={iconColor} />
              <ThemedText style={styles.menuItemText}>About</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: cardBg, borderColor }]}
            onPress={() => router.push('/terms')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="doc.text.fill" size={24} color={iconColor} />
              <ThemedText style={styles.menuItemText}>Terms & Conditions</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: cardBg, borderColor }]}
            onPress={() => router.push('/privacy')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="hand.raised.fill" size={24} color={iconColor} />
              <ThemedText style={styles.menuItemText}>Privacy Policy</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={textSecondary} />
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
    fontSize: 14,
    fontWeight: '500',
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
});

