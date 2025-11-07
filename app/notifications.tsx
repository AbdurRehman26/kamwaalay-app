import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'New Service Request',
    message: 'A new service request matches your profile',
    time: '2m ago',
    read: false,
    type: 'request',
  },
  {
    id: '2',
    title: 'Application Accepted',
    message: 'Your application for house cleaning has been accepted',
    time: '1h ago',
    read: false,
    type: 'success',
  },
  {
    id: '3',
    title: 'New Message',
    message: 'You have a new message from Fatima Ali',
    time: '3h ago',
    read: true,
    type: 'message',
  },
  {
    id: '4',
    title: 'Service Completed',
    message: 'Your service request has been completed',
    time: '1d ago',
    read: true,
    type: 'success',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#007AFF" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Notifications
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Notifications List */}
        <View style={styles.notifications}>
          {MOCK_NOTIFICATIONS.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                !notification.read && styles.notificationItemUnread,
              ]}
            >
              <View style={styles.notificationIcon}>
                <IconSymbol
                  name={
                    notification.type === 'request'
                      ? 'bell.fill'
                      : notification.type === 'message'
                      ? 'message.fill'
                      : 'checkmark.circle.fill'
                  }
                  size={24}
                  color={
                    notification.type === 'request'
                      ? '#007AFF'
                      : notification.type === 'message'
                      ? '#34C759'
                      : '#FF9500'
                  }
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
                  {notification.time}
                </ThemedText>
              </View>
              {!notification.read && <View style={styles.unreadDot} />}
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
    borderColor: '#F0F0F0',
  },
  notificationItemUnread: {
    backgroundColor: '#F0F7FF',
    borderColor: '#007AFF',
  },
  notificationIcon: {
    marginRight: 12,
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
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    opacity: 0.5,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginTop: 8,
  },
});

