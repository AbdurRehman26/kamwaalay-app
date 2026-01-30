import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { BusinessProfile, useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { toast } from '@/utils/toast';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
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

import { useThemeColor } from '@/hooks/use-theme-color';

const { width } = Dimensions.get('window');

export default function BusinessProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, completeOnboarding, refreshProfile } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  const [nicImage, setNicImage] = useState<string | null>(null);
  const [nicImageName, setNicImageName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const inputBg = cardBg;

  const pickNicImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNicImage(result.assets[0].uri);
        const uriParts = result.assets[0].uri.split('/');
        setNicImageName(uriParts[uriParts.length - 1]);
      }
    } catch (error) {
      toast.error('Failed to select image');
    }
  };

  const handleContinue = async () => {
    if (!businessName.trim()) {
      toast.error('Please enter your business name');
      return;
    }

    if (!nicImage) {
      toast.error('Please upload your NIC image');
      return;
    }

    if (!nicNumber.trim() || nicNumber.length < 13) {
      toast.error('Please enter a valid 13-digit NIC number');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Submit basic profile info
      const profileData: BusinessProfile = {
        businessName,
        ownerName: user?.name || '',
        serviceOfferings: [],
        locations: [],
      };

      await completeOnboarding(profileData);

      // 2. Submit verification data
      const formData = new FormData();
      formData.append('nic_number', nicNumber.trim());

      if (Platform.OS === 'web') {
        const response = await fetch(nicImage);
        const blob = await response.blob();
        const fileName = nicImageName || 'nic.jpg';
        const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
        formData.append('nic', file);
      } else {
        const uriParts = nicImage.split('.');
        const fileExt = uriParts[uriParts.length - 1].toLowerCase();
        const mimeType = fileExt === 'pdf' ? 'application/pdf' :
          fileExt === 'png' ? 'image/png' :
            fileExt === 'gif' ? 'image/gif' :
              'image/jpeg';

        formData.append('nic', {
          uri: nicImage,
          name: nicImageName || `nic.${fileExt}`,
          type: mimeType,
        } as any);
      }

      const response = await apiService.post(
        API_ENDPOINTS.ONBOARDING.BUSINESS,
        formData,
        undefined,
        true
      );

      if (response.success) {
        toast.success('Onboarding completed successfully!');
        await refreshProfile();
        router.replace('/(tabs)');
      } else {
        toast.error(response.message || 'Failed to submit verification');
      }
    } catch (error) {
      toast.error('Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.topCircle, { backgroundColor: primaryLight, opacity: 0.3 }]} />
      <View style={[styles.bottomCircle, { backgroundColor: primaryLight, opacity: 0.2 }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.headerSection, { marginTop: insets.top + 20 }]}>
            <Text style={[styles.title, { color: textColor }]}>Business Profile</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>
              Enter your business details to get started
            </Text>
          </View>

          <View style={styles.form}>
            {/* Business Name */}
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

            {/* NIC Image Upload */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>NIC Image</Text>
              <TouchableOpacity
                style={[styles.uploadArea, { borderColor: primaryColor, backgroundColor: inputBg }]}
                onPress={pickNicImage}
              >
                {nicImage ? (
                  <View style={styles.uploadedContent}>
                    <Image source={{ uri: nicImage }} style={styles.previewImage} />
                    <Text style={[styles.fileName, { color: textSecondary }]} numberOfLines={1}>
                      {nicImageName}
                    </Text>
                    <Text style={[styles.changeText, { color: primaryColor }]}>
                      Tap to change
                    </Text>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <IconSymbol name="plus.circle.fill" size={32} color={primaryColor} />
                    <Text style={[styles.uploadText, { color: textSecondary }]}>
                      Upload NIC Image
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* NIC Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>NIC Number</Text>
              <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                <IconSymbol name="number" size={20} color={textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="e.g. 4210112345678"
                  placeholderTextColor={textSecondary}
                  value={nicNumber}
                  onChangeText={(text) => setNicNumber(text.replace(/[^0-9]/g, ''))}
                  maxLength={13}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: primaryColor, shadowColor: primaryColor },
              (!businessName.trim() || !nicImage || nicNumber.length < 13 || isLoading) && [styles.buttonDisabled, { backgroundColor: borderColor }]
            ]}
            onPress={handleContinue}
            disabled={!businessName.trim() || !nicImage || nicNumber.length < 13 || isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Saving...' : 'Complete Onboarding'}</Text>
            {!isLoading && <IconSymbol name="arrow.right" size={20} color="#FFF" />}
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
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  uploadedContent: {
    alignItems: 'center',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  fileName: {
    marginTop: 12,
    fontSize: 14,
    maxWidth: 200,
  },
  changeText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
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
