import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { id, name, type, otherUserId } = useLocalSearchParams();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [chatUserName, setChatUserName] = useState<string>(name ? decodeURIComponent(name as string) : 'Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card'); // For other user's message bubble
  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'tabIconDefault'); // Using a muted color for placeholder

  // Initialize chat
  useEffect(() => {
    initializeChat();
  }, [id, type, otherUserId]);

  // Poll for new messages every 10 seconds
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(() => {
      fetchMessages(conversationId);
    }, 10000);

    return () => clearInterval(interval);
  }, [conversationId]);

  const initializeChat = async () => {
    let convId: string | null = null;
    let recipId: string | null = null;
    let resolvedName: string | null = name ? decodeURIComponent(name as string) : null;

    if (type === 'conversation') {
      convId = id as string;
      recipId = otherUserId as string;
    } else {
      // Type is 'user' (or undefined), so id is the recipientId
      recipId = id as string;
    }

    // If we have a recipient but no conversation, create or get existing conversation
    if (!convId && recipId) {
      try {
        const response = await apiService.post(
          API_ENDPOINTS.MESSAGES.CREATE_CONVERSATION,
          { recipient_id: parseInt(recipId) },
          undefined,
          true
        );
        if (response.success && response.data?.conversation) {
          convId = response.data.conversation.id.toString();
          if (!resolvedName && response.data.conversation.other_user?.name) {
            resolvedName = response.data.conversation.other_user.name;
          }
        }
      } catch (error) {
        console.error('Error creating/getting conversation:', error);
      }
    } else if (convId && !resolvedName) {
      // We have a conversation ID but no name, fetch conversations to get the name
      try {
        const response = await apiService.get(API_ENDPOINTS.MESSAGES.CONVERSATIONS, undefined, undefined, true);
        if (response.success && response.data?.conversations) {
          const existingConv = response.data.conversations.find((c: any) => c.id.toString() === convId);
          if (existingConv?.other_user?.name) {
            resolvedName = existingConv.other_user.name;
          }
        }
      } catch (error) {
        console.error('Error fetching conversation details:', error);
      }
    }

    setConversationId(convId);
    setRecipientId(recipId);

    if (resolvedName) {
      setChatUserName(resolvedName);
    } else {
      // Fallback if name still not found
      setChatUserName('User');
    }

    if (convId) {
      fetchMessages(convId);
    } else {
      setMessages([]);
      setIsLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const response = await apiService.get(
        API_ENDPOINTS.MESSAGES.GET_MESSAGES.replace(':id', convId),
        undefined,
        undefined,
        true
      );

      if (response.success && response.data?.messages?.data) {
        // Initial sort: Newest first (from API) -> Reverse to Oldest first
        // But to be safe, let's explicit sort by created_at
        const apiMessages = response.data.messages.data
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((msg: any) => ({
            id: msg.id.toString(),
            text: msg.message,
            sender: msg.sender_id?.toString() === user?.id?.toString() ? 'me' : 'other',
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: msg.sender?.name || 'Unknown',
          }));
        setMessages(apiMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set navigation title
  useLayoutEffect(() => {
    navigation.setOptions({
      title: chatUserName !== 'Loading...' ? chatUserName : 'Chat',
      headerStyle: { backgroundColor },
      headerTintColor: textColor,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => { }}
          style={{ marginRight: 16 }}
        >
          <IconSymbol name="phone.fill" size={24} color={primaryColor} />
        </TouchableOpacity>
      ),
    });
  }, [chatUserName, navigation, backgroundColor, textColor, primaryColor]);

  const handleSend = async () => {
    if (!message.trim() || !recipientId) return;

    const messageText = message.trim();
    setMessage(''); // Clear input immediately

    // Optimistic update
    const tempMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderName: user?.name || 'Me',
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const response = await apiService.post(
        API_ENDPOINTS.MESSAGES.SEND,
        {
          recipient_id: parseInt(recipientId),
          message: messageText,
        },
        undefined,
        true
      );

      if (response.success) {
        // If this was a new conversation, get the conversation ID from the response
        // API returns { message: {...}, conversation: { id: ... } }
        const newConvId = response.data?.conversation?.id?.toString();
        if (!conversationId && newConvId) {
          setConversationId(newConvId);
        }
        // Refresh messages to get the real ID and timestamp
        if (conversationId) {
          fetchMessages(conversationId);
        } else if (newConvId) {
          fetchMessages(newConvId);
        }
      } else {
        // Handle error (maybe remove optimistic message or show error)
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteModalVisible(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;

    const messageId = messageToDelete;
    // Optimistic update
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    setDeleteModalVisible(false);
    setMessageToDelete(null);

    try {
      await apiService.delete(
        API_ENDPOINTS.MESSAGES.DELETE.replace(':id', messageId),
        undefined,
        true
      );
    } catch (error) {
      console.error("Error deleting message:", error);
      // Optionally revert state here if needed
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ThemedView style={styles.container}>
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messages}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => {
            const isMe = msg.sender === 'me';
            // Always show the actual name of the sender
            const senderName = isMe ? (user?.name || 'Unknown') : (chatUserName !== 'Loading...' ? chatUserName : 'Unknown');

            return (
              <TouchableOpacity
                key={msg.id}
                onLongPress={() => isMe ? handleDeleteMessage(msg.id) : null}
                activeOpacity={isMe ? 0.8 : 1}
                style={[
                  styles.message,
                  isMe ? styles.messageMe : styles.messageOther,
                ]}
              >
                <Text style={[styles.messageSender, isMe ? { color: primaryColor, textAlign: 'right' } : { color: textSecondary, textAlign: 'left' }]}>
                  {senderName}
                </Text>
                <Text
                  style={[
                    styles.messageText,
                    isMe ? { backgroundColor: primaryColor, color: '#FFFFFF', borderBottomRightRadius: 4 } : { backgroundColor: cardBg, color: textColor, borderBottomLeftRadius: 4 },
                  ]}
                >
                  {msg.text}
                </Text>
                <Text style={[styles.messageTime, { color: textSecondary }]}>{msg.time}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor, borderTopColor: borderColor, paddingBottom: Math.max(16, insets.bottom) }]}>
          <TextInput
            style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
            placeholder="Type a message..."
            placeholderTextColor={placeholderColor}
            value={message}
            onChangeText={setMessage}
            multiline
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <IconSymbol
              name="arrow.up.circle.fill"
              size={32}
              color={message.trim() ? primaryColor : placeholderColor}
            />
          </TouchableOpacity>
        </View>
        {/* Delete Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={deleteModalVisible}
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setDeleteModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>Delete Message</Text>
                  <Text style={[styles.modalText, { color: textSecondary }]}>
                    Are you sure you want to delete this message? This action cannot be undone.
                  </Text>
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setDeleteModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.deleteButton]}
                      onPress={confirmDeleteMessage}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  messages: {
    flex: 1,
    width: '100%',
  },
  messagesContent: {
    padding: 16,
  },
  message: {
    maxWidth: '75%',
    marginBottom: 12,
  },
  messageMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  messageSenderMe: {
    color: '#6366F1',
    textAlign: 'right',
  },
  messageSenderOther: {
    color: '#666',
    textAlign: 'left',
  },
  messageText: {
    fontSize: 16,
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  messageTextMe: {
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    borderBottomRightRadius: 4,
  },
  messageTextOther: {
    backgroundColor: '#F0F0F0',
    color: '#000000',
    borderBottomLeftRadius: 4,
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.5,
    paddingHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    padding: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
