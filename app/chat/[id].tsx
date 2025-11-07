import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

const MOCK_MESSAGES = [
  { id: '1', text: 'Hello! I saw your service request', sender: 'other', time: '10:30 AM' },
  { id: '2', text: 'Hi! Yes, I need help with house cleaning', sender: 'me', time: '10:32 AM' },
  { id: '3', text: 'I can start from tomorrow. Is that okay?', sender: 'other', time: '10:33 AM' },
  { id: '4', text: 'Yes, that works perfectly!', sender: 'me', time: '10:35 AM' },
];

export default function ChatDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState('');

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
      keyboardVerticalOffset={90}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <ThemedText type="subtitle" style={styles.headerName}>
              Fatima Ali
            </ThemedText>
            <ThemedText style={styles.headerStatus}>Online</ThemedText>
          </View>
          <TouchableOpacity>
            <IconSymbol name="phone.fill" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
          {MOCK_MESSAGES.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.message,
                msg.sender === 'me' ? styles.messageMe : styles.messageOther,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  msg.sender === 'me' ? styles.messageTextMe : styles.messageTextOther,
                ]}
              >
                {msg.text}
              </Text>
              <Text style={styles.messageTime}>{msg.time}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 12,
    opacity: 0.6,
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

