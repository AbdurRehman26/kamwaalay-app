import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  const insets = useSafeAreaInsets();

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

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView style={[styles.scrollView, { backgroundColor }]} showsVerticalScrollIndicator={false}>
        {/* Header Background */}
        <View style={styles.headerBackground}>
          <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Help & Support</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Send Message Section */}
          <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              Send us a Message
            </ThemedText>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: textColor }]}>Subject</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: backgroundColor, color: textColor, borderColor }]}
                value={contactSubject}
                onChangeText={setContactSubject}
                placeholder="Enter subject"
                placeholderTextColor={textMuted}
              />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: textColor }]}>Message</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: backgroundColor, color: textColor, borderColor }]}
                value={contactMessage}
                onChangeText={setContactMessage}
                placeholder="Describe your issue or question..."
                placeholderTextColor={textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity style={[styles.sendButton, { backgroundColor: primaryColor }]} onPress={handleEmailSupport}>
              <Text style={styles.sendButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>

          {/* FAQ Section */}
          <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              Frequently Asked Questions
            </ThemedText>
            {FAQ_ITEMS.map((item) => (
              <View key={item.id} style={[styles.faqItem, { borderColor }]}>
                <TouchableOpacity
                  style={[styles.faqQuestion, { backgroundColor: backgroundColor }]}
                  onPress={() => toggleFAQ(item.id)}
                >
                  <ThemedText style={[styles.faqQuestionText, { color: textColor }]}>{item.question}</ThemedText>
                  <IconSymbol
                    name={expandedFAQ === item.id ? 'chevron.up' : 'chevron.down'}
                    size={20}
                    color={primaryColor}
                  />
                </TouchableOpacity>
                {expandedFAQ === item.id && (
                  <View style={[styles.faqAnswer, { backgroundColor: cardBg, borderTopColor: borderColor }]}>
                    <ThemedText style={[styles.faqAnswerText, { color: textSecondary }]}>{item.answer}</ThemedText>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Additional Resources */}
          <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              Additional Resources
            </ThemedText>
            <TouchableOpacity
              style={[styles.resourceItem, { backgroundColor: backgroundColor, borderColor }]}
              onPress={() => router.push('/terms')}
            >
              <IconSymbol name="doc.text.fill" size={24} color={primaryColor} />
              <ThemedText style={[styles.resourceText, { color: textColor }]}>Terms & Conditions</ThemedText>
              <IconSymbol name="chevron.right" size={20} color={textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resourceItem, { backgroundColor: backgroundColor, borderColor }]}
              onPress={() => router.push('/privacy')}
            >
              <IconSymbol name="hand.raised.fill" size={24} color={primaryColor} />
              <ThemedText style={[styles.resourceText, { color: textColor }]}>Privacy Policy</ThemedText>
              <IconSymbol name="chevron.right" size={20} color={textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resourceItem, { backgroundColor: backgroundColor, borderColor }]}
              onPress={() => router.push('/about')}
            >
              <IconSymbol name="info.circle.fill" size={24} color={primaryColor} />
              <ThemedText style={[styles.resourceText, { color: textColor }]}>About Kamwaalay</ThemedText>
              <IconSymbol name="chevron.right" size={20} color={textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  contentContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  section: {
    padding: 20,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  sendButton: {
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
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 12,
  },
  faqAnswer: {
    padding: 16,
    borderTopWidth: 1,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 22,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  resourceText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});

