import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Notification, notificationService } from '@/services/notification.service';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';

// ... (imports)

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const iconMuted = useThemeColor({}, 'iconMuted');

  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');

  const fetchNotifications = async () => {
    try {
      setError(null);
      const response = await notificationService.getNotifications();
      if (response.success && response.data) {
        // Handle different response structures
        const notifs = Array.isArray(response.data)
          ? response.data
          : (response.data.notifications || []);
        setNotifications(notifs);
      } else {

        // Check if error is 404 (Not Found), which often means "no notifications" in some APIs
        // Also check for "No notifications found" message
        const isNotFound =
          response.error?.includes('404') ||
          response.error?.toLowerCase().includes('not found') ||
          response.message?.toLowerCase().includes('not found');

        if (isNotFound) {
          setNotifications([]);
          // Do not set error, so it renders empty state
        } else {
          if (response.error) {
            setError(response.error);
          } else {
            setError('Failed to load notifications');
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      // If the error itself suggests not found, treat as empty
      if (err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
        setNotifications([]);
      } else {
        setError(err.message || 'An error occurred while loading notifications');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getIconName = (type: string) => {
    switch (type) {
      case 'request':
        return 'bell.fill';
      case 'message':
        return 'message.fill';
      case 'success':
        return 'checkmark.circle.fill';
      case 'warning':
        return 'exclamationmark.triangle.fill';
      case 'error':
        return 'exclamationmark.circle.fill';
      default:
        return 'bell.fill';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'request':
        return '#6366F1';
      case 'message':
        return '#34C759';
      case 'success':
        return '#34C759';
      case 'warning':
        return '#FF9500';
      case 'error':
        return '#FF3B30';
      default:
        return '#6366F1';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <ScreenHeader
        title="Notifications"
        rightElement={
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 }}
          >
            <IconSymbol name="checkmark.circle.fill" size={16} color="#6366F1" />
            <Text style={{ color: '#6366F1', fontSize: 14, fontWeight: '600' }}>Read All</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        horizontal={false}
        contentContainerStyle={{ width: '100%', flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
      >

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {loading && !refreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={primaryColor} />
            </View>
          ) : error && notifications.length === 0 ? (
            <View style={styles.centerContainer}>
              <ThemedText style={{ color: textColor }}>{error}</ThemedText>
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: primaryColor }]} onPress={fetchNotifications}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.notifications}>
              {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <IconSymbol name="bell.slash" size={48} color={iconMuted} />
                  <ThemedText style={[styles.emptyText, { color: textSecondary }]}>No notifications yet</ThemedText>
                </View>
              ) : (
                notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      { backgroundColor: cardBg, borderColor, shadowColor: textColor },
                      !notification.read && { backgroundColor: primaryLight, borderColor: primaryColor },
                    ]}
                    onPress={() => handleMarkAsRead(notification.id)}
                  >
                    <View style={styles.notificationIcon}>
                      <IconSymbol
                        name={getIconName(notification.type)}
                        size={24}
                        color={getIconColor(notification.type)}
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <ThemedText type="subtitle" style={[styles.notificationTitle, { color: textColor }]}>
                        {notification.title}
                      </ThemedText>
                      <ThemedText style={[styles.notificationMessage, { color: textSecondary }]}>
                        {notification.message}
                      </ThemedText>
                      <ThemedText style={[styles.notificationTime, { color: textMuted }]}>
                        {formatTimeAgo(notification.createdAt)}
                      </ThemedText>
                    </View>
                    {!notification.read && <View style={[styles.unreadDot, { backgroundColor: primaryColor }]} />}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
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
    width: '100%',
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
    paddingBottom: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '700',
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    width: '100%',
    alignSelf: 'stretch',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  notifications: {
    padding: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 6,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    opacity: 0.5,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

