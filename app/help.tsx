import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const FAQ_ITEMS = [
  {
    id: '1',
    question: 'How do I create a job?',
    answer:
      'Go to the Home tab and tap "Post a Job". Fill in the service details, location, and budget, then submit your job. Helpers and businesses will be able to see and apply to your job.',
  },
  {
    id: '2',
    question: 'How do I apply to a job?',
    answer:
      'Browse available jobs in the Requests tab. When you find a job you want to apply to, tap "Apply Now". You can also contact the customer directly using the "Contact" button.',
  },
  {
    id: '3',
    question: 'How do I manage my service offerings?',
    answer:
      'Go to your Profile, then tap "Service Offerings". You can add, edit, or remove your service offerings and locations from there.',
  },
  {
    id: '4',
    question: 'How do I contact a helper or business?',
    answer:
      'You can contact helpers or businesses by tapping on their profile and using the "Contact" or "Chat" button. This will open a chat conversation where you can discuss details.',
  },
  {
    id: '5',
    question: 'How do I update my profile?',
    answer:
      'Go to your Profile tab, then tap "Edit Profile". You can update your name, email, bio, and other profile information from there.',
  },
  {
    id: '6',
    question: 'What should I do if I have a problem?',
    answer:
      'You can contact our support team using the contact information below, or send us a message through the app. We typically respond within 24 hours.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubject, setContactSubject] = useState('');

  const handleEmailSupport = () => {
    const email = 'support@kamwaalay.com';
    const subject = encodeURIComponent(contactSubject || 'Support Request');
    const body = encodeURIComponent(contactMessage || '');
    const url = `mailto:${email}?subject=${subject}&body=${body}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Email client is not available on this device');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open email client');
      });
  };

  const handleCallSupport = () => {
    const phoneNumber = '+92-300-1234567';
    const url = `tel:${phoneNumber}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Phone dialer is not available on this device');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open phone dialer');
      });
  };

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#6366F1" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Help & Support
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Contact Support Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Contact Support
          </ThemedText>
          <View style={styles.contactCards}>
            <TouchableOpacity style={styles.contactCard} onPress={handleCallSupport}>
              <IconSymbol name="phone.fill" size={32} color="#6366F1" />
              <ThemedText style={styles.contactLabel}>Call Us</ThemedText>
              <ThemedText style={styles.contactValue}>+92-300-1234567</ThemedText>
              <ThemedText style={styles.contactHours}>Mon-Fri, 9 AM - 6 PM</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
              <IconSymbol name="envelope.fill" size={32} color="#6366F1" />
              <ThemedText style={styles.contactLabel}>Email Us</ThemedText>
              <ThemedText style={styles.contactValue}>support@kamwaalay.com</ThemedText>
              <ThemedText style={styles.contactHours}>24/7 Support</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Send Message Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Send us a Message
          </ThemedText>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Subject</ThemedText>
            <TextInput
              style={styles.input}
              value={contactSubject}
              onChangeText={setContactSubject}
              placeholder="Enter subject"
              placeholderTextColor="#999"
            />
          </View>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Message</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={contactMessage}
              onChangeText={setContactMessage}
              placeholder="Describe your issue or question..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
          <TouchableOpacity style={styles.sendButton} onPress={handleEmailSupport}>
            <Text style={styles.sendButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Frequently Asked Questions
          </ThemedText>
          {FAQ_ITEMS.map((item) => (
            <View key={item.id} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFAQ(item.id)}
              >
                <ThemedText style={styles.faqQuestionText}>{item.question}</ThemedText>
                <IconSymbol
                  name={expandedFAQ === item.id ? 'chevron.up' : 'chevron.down'}
                  size={20}
                  color="#6366F1"
                />
              </TouchableOpacity>
              {expandedFAQ === item.id && (
                <View style={styles.faqAnswer}>
                  <ThemedText style={styles.faqAnswerText}>{item.answer}</ThemedText>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Additional Resources */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Additional Resources
          </ThemedText>
          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => router.push('/terms')}
          >
            <IconSymbol name="doc.text.fill" size={24} color="#6366F1" />
            <ThemedText style={styles.resourceText}>Terms & Conditions</ThemedText>
            <IconSymbol name="chevron.right" size={20} color="#CCCCCC" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => router.push('/privacy')}
          >
            <IconSymbol name="hand.raised.fill" size={24} color="#6366F1" />
            <ThemedText style={styles.resourceText}>Privacy Policy</ThemedText>
            <IconSymbol name="chevron.right" size={20} color="#CCCCCC" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => router.push('/about')}
          >
            <IconSymbol name="info.circle.fill" size={24} color="#6366F1" />
            <ThemedText style={styles.resourceText}>About Kamwaalay</ThemedText>
            <IconSymbol name="chevron.right" size={20} color="#CCCCCC" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8E8E8',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  contactCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    color: '#666',
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  contactHours: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  sendButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  faqItem: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 12,
  },
  faqAnswer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  resourceText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    color: '#1A1A1A',
  },
});

