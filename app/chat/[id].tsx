import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

const MOCK_MESSAGES = [
  { id: '1', text: 'Hello! I saw your service request', sender: 'other', time: '10:30 AM' },
  { id: '2', text: 'Hi! Yes, I need help with house cleaning', sender: 'me', time: '10:32 AM' },
  { id: '3', text: 'I can start from tomorrow. Is that okay?', sender: 'other', time: '10:33 AM' },
  { id: '4', text: 'Yes, that works perfectly!', sender: 'me', time: '10:35 AM' },
];

export default function ChatDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { id, name } = useLocalSearchParams();
  const { user } = useAuth();
  const { getHelpers, getServiceRequests } = useApp();
  const [message, setMessage] = useState('');
  const [chatUserName, setChatUserName] = useState<string>(name ? decodeURIComponent(name as string) : 'Loading...');
  const [isLoadingName, setIsLoadingName] = useState(!name);

  // Set navigation title and header buttons dynamically
  useLayoutEffect(() => {
    navigation.setOptions({
      title: chatUserName !== 'Loading...' ? chatUserName : 'Chat',
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            // Handle call action
            // In a real app, this would initiate a call
          }}
          style={{ marginRight: 16 }}
        >
          <IconSymbol name="phone.fill" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [chatUserName, navigation]);

  useEffect(() => {
    // If name was passed as query param, use it immediately
    if (name) {
      setChatUserName(decodeURIComponent(name as string));
      setIsLoadingName(false);
      return;
    }

    const fetchUserName = async () => {
      if (!id) {
        setChatUserName('Unknown');
        setIsLoadingName(false);
        return;
      }

      try {
        // First, try to find in helpers
        const helpers = getHelpers();
        const helper = helpers.find((h: any) => {
          const helperId = h.user_id?.toString() || h.id?.toString() || '';
          return helperId === id.toString();
        });

        if (helper) {
          // Get helper name
          const helperName = helper.name || 
                           helper.user?.name || 
                           helper.profile?.name ||
                           (helper.first_name && helper.last_name ? `${helper.first_name} ${helper.last_name}` : helper.first_name || helper.last_name) ||
                           'Helper';
          setChatUserName(helperName);
          setIsLoadingName(false);
          return;
        }

        // Try to find in service requests (for users)
        const serviceRequests = getServiceRequests();
        const request = serviceRequests.find((r: any) => {
          const userId = r.userId?.toString() || '';
          const applicantIds = r.applicants || [];
          return userId === id.toString() || applicantIds.includes(id.toString());
        });

        if (request) {
          if (request.userId === id.toString()) {
            setChatUserName(request.userName || 'User');
          } else {
            // It's an applicant - try to fetch their info
            // For now, try to find them in helpers
            const applicantHelper = helpers.find((h: any) => {
              const helperId = h.user_id?.toString() || h.id?.toString() || '';
              return helperId === id.toString();
            });
            if (applicantHelper) {
              const helperName = applicantHelper.name || 
                               applicantHelper.user?.name || 
                               applicantHelper.profile?.name ||
                               (applicantHelper.first_name && applicantHelper.last_name ? `${applicantHelper.first_name} ${applicantHelper.last_name}` : applicantHelper.first_name || applicantHelper.last_name) ||
                               'Helper';
              setChatUserName(helperName);
            } else {
              setChatUserName('User');
            }
          }
          setIsLoadingName(false);
          return;
        }

        // Try to fetch from API (helper endpoint)
        try {
          const response = await apiService.get(
            API_ENDPOINTS.HELPERS.GET.replace(':id', id.toString())
          );
          if (response.success && response.data) {
            const helperData = response.data.helper || response.data;
            const helperName = helperData.name || 
                             helperData.user?.name || 
                             helperData.profile?.name ||
                             (helperData.first_name && helperData.last_name ? `${helperData.first_name} ${helperData.last_name}` : helperData.first_name || helperData.last_name) ||
                             'Helper';
            setChatUserName(helperName);
            setIsLoadingName(false);
            return;
          }
        } catch (apiError) {
          // API fetch failed, continue to fallback
        }

        // Final fallback: try to get name from current user context if it's the current user
        if (id.toString() === user?.id?.toString()) {
          setChatUserName(user.name || 'You');
        } else {
          // Last resort: show "User" instead of ID
          setChatUserName('User');
        }
        setIsLoadingName(false);
      } catch (error) {
        setChatUserName('User');
        setIsLoadingName(false);
      }
    };

    fetchUserName();
  }, [id, getHelpers, getServiceRequests]);

  const handleSend = () => {
    if (message.trim()) {
      // In a real app, this would send the message
      setMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ThemedView style={styles.container}>
        {/* Messages */}
        <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
          {MOCK_MESSAGES.map((msg) => {
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
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <IconSymbol name="arrow.up.circle.fill" size={32} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messages: {
    flex: 1,
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
    color: '#007AFF',
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
    backgroundColor: '#007AFF',
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
});

