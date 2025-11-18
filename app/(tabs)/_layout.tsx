import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();
  const isHelperOrBusiness = user?.userType === 'helper' || user?.userType === 'business';
  const insets = useSafeAreaInsets();

  // Debug logging
  console.log('[TabLayout] User type:', user?.userType);
  console.log('[TabLayout] Is helper or business:', isHelperOrBusiness);
  console.log('[TabLayout] Should show explore:', !isHelperOrBusiness);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366F1', // Primary indigo for active tabs
        tabBarInactiveTintColor: '#8E8E93', // Medium gray for inactive tabs - more visible
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8E8E8',
          height: 70 + insets.bottom,
          paddingBottom: Math.max(10, insets.bottom),
          paddingTop: 8,
          paddingHorizontal: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="house.fill"
              color={color}
            />
          ),
        }}
      />
      {/* Explore tab - only for users/customers */}
      {!isHelperOrBusiness && (
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={focused ? 26 : 24}
                name="magnifyingglass"
                color={color}
              />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="requests"
        options={{
          title: isHelperOrBusiness ? 'Requests' : 'Requests',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="list.bullet"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="message.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="person.fill"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
