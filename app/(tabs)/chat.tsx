import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getHelpers, getServiceRequests } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  // Build chat list from actual data
  const chats = useMemo(() => {
    const chatMap = new Map<string, ChatItem>();
    const helpers = getHelpers();
    const serviceRequests = getServiceRequests();

    if (user?.userType === 'user') {
      // For users: show chats with helpers who applied to their requests
      serviceRequests
        .filter((r) => r.userId === user?.id)
        .forEach((request) => {
          if (request.applicants && request.applicants.length > 0) {
            request.applicants.forEach((applicantId: string) => {
              if (!chatMap.has(applicantId)) {
                const helper = helpers.find((h: any) => {
                  const helperId = h.user_id?.toString() || h.id?.toString() || '';
                  return helperId === applicantId;
                });

                if (helper) {
                  const helperName = helper.name || 
                                   helper.user?.name || 
                                   helper.profile?.name ||
                                   (helper.first_name && helper.last_name ? `${helper.first_name} ${helper.last_name}` : helper.first_name || helper.last_name) ||
                                   'Helper';
                  const avatarText = helperName.charAt(0).toUpperCase();
                  
                  chatMap.set(applicantId, {
                    id: applicantId,
                    name: helperName,
                    lastMessage: `Applied to your ${request.serviceName} request`,
                    time: 'Recently',
                    unread: 0,
                    avatar: avatarText,
                  });
                }
              }
            });
          }
        });
    } else {
      // For helpers/businesses: show chats with users who created requests
      serviceRequests.forEach((request) => {
        const userId = request.userId?.toString() || '';
        if (userId && !chatMap.has(userId)) {
          chatMap.set(userId, {
            id: userId,
            name: request.userName || 'User',
            lastMessage: `Service request: ${request.serviceName}`,
            time: 'Recently',
            unread: 0,
            avatar: (request.userName || 'U').charAt(0).toUpperCase(),
          });
        }
      });
    }

    return Array.from(chatMap.values());
  }, [user, getHelpers, getServiceRequests]);

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => router.push(`/chat/${item.id}?name=${encodeURIComponent(item.name)}`)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.avatar}</Text>
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <ThemedText type="subtitle" style={styles.chatName}>
            {item.name}
          </ThemedText>
          <ThemedText style={styles.chatTime}>{item.time}</ThemedText>
        </View>
        <View style={styles.chatFooter}>
          <ThemedText style={styles.chatMessage} numberOfLines={1}>
            {item.lastMessage}
          </ThemedText>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Messages
        </ThemedText>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Chat List */}
      {filteredChats.length > 0 ? (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <IconSymbol name="message" size={48} color="#CCCCCC" />
          <ThemedText style={styles.emptyText}>No conversations yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Start chatting with helpers or businesses
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  chatList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
  },
  chatTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 8,
  },
});

