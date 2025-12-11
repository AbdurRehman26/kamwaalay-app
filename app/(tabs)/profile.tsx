import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
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

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Theme colors
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const errorColor = useThemeColor({}, 'error');

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
      title: 'Edit Profile',
      icon: 'person.fill',
      onPress: () => router.push('/profile/edit'),
    },
    {
      id: 'business-dashboard',
      title: 'Business Dashboard',
      icon: 'briefcase.fill',
      onPress: () => router.push('/business/dashboard'),
      show: user?.userType === 'business',
    },
    {
      id: 'manage-workers',
      title: 'Manage Workers',
      icon: 'person.3.fill',
      onPress: () => router.push('/workers'),
      show: user?.userType === 'business',
    },
    {
      id: 'service-offerings',
      title: 'Service Offerings',
      icon: 'list.bullet',
      onPress: () => router.push('/profile/service-offerings'),
      show: user?.userType === 'helper' || user?.userType === 'business',
    },
    {
      id: 'bookings',
      title: 'My Bookings',
      icon: 'calendar',
      onPress: () => router.push('/profile/bookings'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'bell.fill',
      onPress: () => router.push('/notifications'),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'gearshape.fill',
      onPress: () => router.push('/settings'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'questionmark.circle.fill',
      onPress: () => router.push('/help'),
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'arrow.right.square.fill',
      onPress: handleLogout,
      destructive: true,
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.show !== false);

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        horizontal={false}
        contentContainerStyle={{ width: '100%' }}
      >
        {/* Profile Header */}
        <View style={styles.header}>
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
                ? 'Customer'
                : user?.userType === 'helper'
                  ? 'Helper'
                  : 'Business'}
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 32,
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
});

