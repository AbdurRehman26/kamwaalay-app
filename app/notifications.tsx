import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Notification, notificationService } from '@/services/notification.service';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';

// ... (imports)

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        console.log('Failed to fetch notifications:', response.error);

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#6366F1" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Notifications
        </ThemedText>
        <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.actionButton}>
          <IconSymbol name="checkmark.circle" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : error && notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <ThemedText>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.notifications}>
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="bell.slash" size={48} color="#C7C7CC" />
                <ThemedText style={styles.emptyText}>No notifications yet</ThemedText>
              </View>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.notificationItemUnread,
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
                    <ThemedText type="subtitle" style={styles.notificationTitle}>
                      {notification.title}
                    </ThemedText>
                    <ThemedText style={styles.notificationMessage}>
                      {notification.message}
                    </ThemedText>
                    <ThemedText style={styles.notificationTime}>
                      {formatTimeAgo(notification.createdAt)}
                    </ThemedText>
                  </View>
                  {!notification.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 4,
  },
  actionButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifications: {
    padding: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationItemUnread: {
    backgroundColor: '#F0F7FF',
    borderColor: '#6366F1',
    borderWidth: 1,
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
    color: '#1A1A1A',
  },
  notificationMessage: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 6,
    color: '#666',
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    opacity: 0.5,
    color: '#666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
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
    color: '#8E8E93',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

