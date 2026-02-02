import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { toast } from '@/utils/toast';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProfileVerificationData {
  nicFile: any | null;
  nicNumber: string;
  photoFile: any | null;
}

interface Step2ProfileVerificationProps {
  data: ProfileVerificationData;
  onChange: (data: ProfileVerificationData) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2ProfileVerification({
  data,
  onChange,
  onNext,
  onBack,
}: Step2ProfileVerificationProps) {
  const [nicFileUri, setNicFileUri] = useState<string | null>(null);
  const [photoFileUri, setPhotoFileUri] = useState<string | null>(null);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const successColor = useThemeColor({}, 'success');

  const handleNICUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: asset.fileName || 'NIC_Image.jpg',
          type: asset.mimeType || 'image/jpeg',
        };
        setNicFileUri(asset.uri);
        onChange({
          ...data,
          nicFile: file,
        });
      }
    } catch (error) {
      toast.error('Failed to pick NIC image');
      console.error(error);
    }
  };

  const handlePhotoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: asset.fileName || 'Profile_Photo.jpg',
          type: asset.mimeType || 'image/jpeg',
        };

        setPhotoFileUri(asset.uri);
        onChange({
          ...data,
          photoFile: file,
        });
      }
    } catch (error) {
      toast.error('Failed to pick photo');
      console.error(error);
    }
  };

  const insets = useSafeAreaInsets();

  const handleNext = () => {
    // NIC number is still required, but file upload is optional
    if (!data.nicNumber.trim()) {
      toast.error('Please enter your NIC number');
      return;
    }
    onNext();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Profile Verification
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
            Please upload your documents for verification
          </ThemedText>
        </View>

        <View style={styles.form}>
          {/* NIC Upload */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>
              National Identity Card (NIC) (Optional)
            </ThemedText>
            <ThemedText style={[styles.instruction, { color: textSecondary }]}>
              Upload a clear photo or scan of your NIC (front and back if needed)
            </ThemedText>
            <TouchableOpacity
              style={[styles.uploadArea, { backgroundColor: cardBg, borderColor }]}
              onPress={handleNICUpload}
            >
              {nicFileUri ? (
                <View style={styles.uploadedFile}>
                  <IconSymbol name="checkmark.circle.fill" size={48} color={successColor} />
                  <Text style={[styles.uploadedFileText, { color: successColor }]}>NIC Uploaded</Text>
                  <Text style={[styles.uploadedFileName, { color: textSecondary }]}>
                    {data.nicFile?.name || 'NIC Document'}
                  </Text>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <IconSymbol name="doc.fill" size={48} color={textMuted} />
                  <Text style={[styles.uploadText, { color: textSecondary }]}>Click or drag to upload NIC</Text>
                  <Text style={[styles.uploadHint, { color: textMuted }]}>
                    Supports: JPG, PNG, PDF (Max 5MB)
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* NIC Number */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>
              NIC Number <Text style={[styles.required, { color: errorColor }]}>*</Text>
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
              placeholder="e.g., 4210112345671"
              placeholderTextColor={textMuted}
              value={data.nicNumber}
              onChangeText={(value) => onChange({ ...data, nicNumber: value.replace(/[^0-9]/g, '') })}
              maxLength={13}
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Photo Upload */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>Photo (Optional)</ThemedText>
            <ThemedText style={[styles.instruction, { color: textSecondary }]}>
              Upload your profile photo (optional)
            </ThemedText>
            <TouchableOpacity
              style={[styles.uploadArea, { backgroundColor: cardBg, borderColor }]}
              onPress={handlePhotoUpload}
            >
              {photoFileUri ? (
                <View style={styles.uploadedFile}>
                  <IconSymbol name="checkmark.circle.fill" size={48} color={successColor} />
                  <Text style={[styles.uploadedFileText, { color: successColor }]}>Photo Uploaded</Text>
                  <Text style={[styles.uploadedFileName, { color: textSecondary }]}>
                    {data.photoFile?.name || 'Profile Photo'}
                  </Text>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <IconSymbol name="camera.fill" size={48} color={textMuted} />
                  <Text style={[styles.uploadText, { color: textSecondary }]}>Click or drag to upload photo</Text>
                  <Text style={[styles.uploadHint, { color: textMuted }]}>
                    Supports: JPG, PNG (Max 2MB)
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: cardBg }]} onPress={onBack}>
          <Text style={[styles.backButtonText, { color: textSecondary }]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: primaryColor },
            !data.nicNumber.trim() && { backgroundColor: textMuted, opacity: 0.5 },
          ]}
          onPress={handleNext}
          disabled={!data.nicNumber.trim()}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
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
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  form: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  instruction: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  required: {
    fontWeight: 'bold',
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  uploadedFile: {
    alignItems: 'center',
    gap: 8,
  },
  uploadedFileText: {
    fontSize: 16,
    fontWeight: '700',
  },
  uploadedFileName: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
