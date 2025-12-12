import { IconSymbol } from '@/components/ui/icon-symbol';
import { BusinessProfile, useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColor } from '@/hooks/use-theme-color';

const { width } = Dimensions.get('window');

export default function BusinessProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const iconColor = useThemeColor({}, 'icon');

  const handleContinue = async () => {
    if (!businessName.trim()) {
      Alert.alert('Required', 'Please enter your business name');
      return;
    }

    if (!user?.name) {
      Alert.alert('Error', 'Owner name is required');
      return;
    }

    setIsLoading(true);
    try {
      const profileData: BusinessProfile = {
        businessName,
        ownerName: user.name,
        bio: businessDescription,
        businessAddress,
        serviceOfferings: [],
        locations: [],
      };

      await completeOnboarding(profileData);
      // Navigate to add workers step
      router.push('/onboarding/add-workers');
    } catch (error) {
      Alert.alert('Error', 'Failed to save business profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Decorative Background Elements */}
      <View style={[styles.topCircle, { backgroundColor: primaryLight, opacity: 0.3 }]} />
      <View style={[styles.bottomCircle, { backgroundColor: primaryLight, opacity: 0.2 }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.headerSection, { marginTop: insets.top + 20 }]}>
            <Text style={[styles.title, { color: textColor }]}>Business Profile</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>
              Tell us about your business to get started
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Business Name</Text>
              <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                <IconSymbol name="building.2.fill" size={20} color={textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="Enter your business name"
                  placeholderTextColor={textSecondary}
                  value={businessName}
                  onChangeText={setBusinessName}
                  autoComplete="organization"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Business Address (Optional)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                <IconSymbol name="mappin.and.ellipse" size={20} color={textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="Enter your business address"
                  placeholderTextColor={textSecondary}
                  value={businessAddress}
                  onChangeText={setBusinessAddress}
                  autoComplete="street-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Description (Optional)</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: cardBg, borderColor }]}>
                <TextInput
                  style={[styles.input, styles.textArea, { color: textColor }]}
                  placeholder="Describe your business and services..."
                  placeholderTextColor={textSecondary}
                  multiline
                  numberOfLines={4}
                  value={businessDescription}
                  onChangeText={setBusinessDescription}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: primaryColor, shadowColor: primaryColor },
              (!businessName.trim() || isLoading) && [styles.buttonDisabled, { backgroundColor: borderColor }]
            ]}
            onPress={handleContinue}
            disabled={!businessName.trim() || isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Saving...' : 'Continue'}</Text>
            {!isLoading && <IconSymbol name="arrow.right" size={20} color="#FFF" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={async () => {
              const profileData: BusinessProfile = {
                businessName: businessName.trim() || 'My Business',
                ownerName: user?.name || '',
                businessAddress,
                bio: businessDescription,
                serviceOfferings: [],
                locations: [],
              };
              await completeOnboarding(profileData);
              router.replace('/(tabs)');
            }}
          >
            <Text style={[styles.skipButtonText, { color: textSecondary }]}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  topCircle: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#EEF2FF',
    opacity: 0.7,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#F5F3FF',
    opacity: 0.7,
  },
  headerSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 56,
    overflow: 'hidden',
  },
  textAreaWrapper: {
    height: 'auto',
    minHeight: 120,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  textArea: {
    height: '100%',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 24,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
