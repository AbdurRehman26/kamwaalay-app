import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
  const scrollViewRef = React.useRef<ScrollView>(null);

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

    if (type === 'conversation') {
      convId = id as string;
      recipId = otherUserId as string;
    } else {
      // Type is 'user' (or undefined), so id is the recipientId
      recipId = id as string;
      // Try to find existing conversation
      try {
        const response = await apiService.get(API_ENDPOINTS.MESSAGES.CONVERSATIONS, undefined, undefined, true);
        if (response.success && response.data?.conversations) {
          const existingConv = response.data.conversations.find(
            (c: any) => c.other_user?.id?.toString() === recipId
          );
          if (existingConv) {
            convId = existingConv.id.toString();
          }
        }
      } catch (error) {
        console.error('Error finding conversation:', error);
      }
    }

    setConversationId(convId);
    setRecipientId(recipId);

    if (convId) {
      fetchMessages(convId);
    } else {
      setMessages([]);
      setIsLoading(false);
    }

    // Set name if not provided
    if (!name && recipId) {
      // Fetch user details to get name (omitted for brevity, using fallback)
      setChatUserName('User');
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
        const apiMessages = response.data.messages.data.reverse().map((msg: any) => ({
          id: msg.id.toString(),
          text: msg.message,
          sender: msg.sender_id === user?.id ? 'me' : 'other',
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
      headerRight: () => (
        <TouchableOpacity
          onPress={() => { }}
          style={{ marginRight: 16 }}
        >
          <IconSymbol name="phone.fill" size={24} color="#6366F1" />
        </TouchableOpacity>
      ),
    });
  }, [chatUserName, navigation]);

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
        // If this was a new conversation, we now have a conversation ID (implicitly, or we need to fetch it)
        // The response might contain the message with conversation_id
        if (!conversationId && response.data?.conversation_id) {
          setConversationId(response.data.conversation_id.toString());
        }
        // Refresh messages to get the real ID and timestamp
        if (conversationId) {
          fetchMessages(conversationId);
        } else if (response.data?.conversation_id) {
          fetchMessages(response.data.conversation_id.toString());
        }
      } else {
        // Handle error (maybe remove optimistic message or show error)
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
          contentContainerStyle={{ width: '100%' }}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => {
            const isMe = msg.sender === 'me';
            // Always show the actual name of the sender
            const senderName = isMe ? (user?.name || 'Unknown') : (chatUserName !== 'Loading...' ? chatUserName : 'Unknown');

            return (
              <View
                key={msg.id}
                style={[
                  styles.message,
                  isMe ? styles.messageMe : styles.messageOther,
                ]}
              >
                <Text style={[styles.messageSender, isMe ? styles.messageSenderMe : styles.messageSenderOther]}>
                  {senderName}
                </Text>
                <Text
                  style={[
                    styles.messageText,
                    isMe ? styles.messageTextMe : styles.messageTextOther,
                  ]}
                >
                  {msg.text}
                </Text>
                <Text style={styles.messageTime}>{msg.time}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999"
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
              color={message.trim() ? "#6366F1" : "#CCCCCC"}
            />
          </TouchableOpacity>
        </View>
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
});
