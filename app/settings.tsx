import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [emailNotifications, setEmailNotifications] = React.useState(false);

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#6366F1" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Settings
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Notifications
          </ThemedText>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol name="bell.fill" size={24} color="#6366F1" />
              <ThemedText style={styles.settingLabel}>Push Notifications</ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E0E0E0', true: '#6366F1' }}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol name="envelope.fill" size={24} color="#6366F1" />
              <ThemedText style={styles.settingLabel}>Email Notifications</ThemedText>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#E0E0E0', true: '#6366F1' }}
            />
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Account
          </ThemedText>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/profile/edit')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="person.fill" size={24} color="#6366F1" />
              <ThemedText style={styles.menuItemText}>Edit Profile</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#CCCCCC" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/settings/change-password')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="lock.fill" size={24} color="#6366F1" />
              <ThemedText style={styles.menuItemText}>Change Password</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#CCCCCC" />
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            App
          </ThemedText>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/about')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="info.circle.fill" size={24} color="#6366F1" />
              <ThemedText style={styles.menuItemText}>About</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#CCCCCC" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/terms')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="doc.text.fill" size={24} color="#6366F1" />
              <ThemedText style={styles.menuItemText}>Terms & Conditions</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#CCCCCC" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/privacy')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="hand.raised.fill" size={24} color="#6366F1" />
              <ThemedText style={styles.menuItemText}>Privacy Policy</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#CCCCCC" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
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

