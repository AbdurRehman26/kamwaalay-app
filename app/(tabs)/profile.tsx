import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    console.log('Logout button clicked - starting immediate logout');
    try {
      // Navigate first to ensure we get to login screen
      console.log('Navigating to login screen first...');
      router.replace('/auth/phone-login');
      
      // Small delay to let navigation start
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Then call logout function to clear state and storage
      console.log('Calling logout function...');
      await logout();
      console.log('Logout function completed');
    } catch (error) {
      console.error('Logout error:', error);
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
      id: 'saved',
      title: 'Saved Helpers',
      icon: 'heart.fill',
      onPress: () => router.push('/profile/saved'),
      show: user?.userType === 'user',
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <ThemedText type="title" style={styles.name}>
            {user?.name || 'User'}
          </ThemedText>
          <ThemedText style={styles.phone}>{user?.phoneNumber}</ThemedText>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
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
              style={styles.menuItem}
              onPress={() => {
                console.log('Menu item pressed:', item.id);
                if (item.onPress) {
                  item.onPress();
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  name={item.icon}
                  size={24}
                  color={item.destructive ? '#FF3B30' : '#007AFF'}
                />
                <ThemedText
                  style={[
                    styles.menuItemText,
                    item.destructive && styles.menuItemTextDestructive,
                  ]}
                >
                  {item.title}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#CCCCCC" />
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
  },
  scrollView: {
    flex: 1,
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
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
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
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
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
  menuItemTextDestructive: {
    color: '#FF3B30',
  },
});

