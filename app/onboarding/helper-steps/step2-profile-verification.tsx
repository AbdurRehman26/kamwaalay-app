import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

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

  const handleNICUpload = async () => {
    // TODO: Implement file upload when expo-image-picker and expo-document-picker are installed
    // For now, this is a placeholder that simulates file selection
    Alert.alert(
      'Upload NIC',
      'File upload will be implemented with expo-image-picker and expo-document-picker',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Upload',
          onPress: () => {
            // Simulate file upload for now
            const mockFile = {
              uri: 'file://mock-nic.jpg',
              name: 'NIC.jpg',
              type: 'image/jpeg',
            };
            setNicFileUri('file://mock-nic.jpg');
            onChange({
              ...data,
              nicFile: mockFile,
            });
          },
        },
      ]
    );
  };

  const handlePhotoUpload = async () => {
    // TODO: Implement file upload when expo-image-picker is installed
    // For now, this is a placeholder that simulates file selection
    Alert.alert(
      'Upload Photo',
      'File upload will be implemented with expo-image-picker',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Upload',
          onPress: () => {
            // Simulate file upload for now
            const mockFile = {
              uri: 'file://mock-photo.jpg',
              name: 'Photo.jpg',
              type: 'image/jpeg',
            };
            setPhotoFileUri('file://mock-photo.jpg');
            onChange({
              ...data,
              photoFile: mockFile,
            });
          },
        },
      ]
    );
  };

  const handleNext = () => {
    // NIC number is still required, but file upload is optional
    if (!data.nicNumber.trim()) {
      Alert.alert('Required', 'Please enter your NIC number');
      return;
    }
    onNext();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Profile Verification
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Please upload your documents for verification
          </ThemedText>
        </View>

        <View style={styles.form}>
          {/* NIC Upload */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              National Identity Card (NIC) (Optional)
            </ThemedText>
            <ThemedText style={styles.instruction}>
              Upload a clear photo or scan of your NIC (front and back if needed)
            </ThemedText>
            <TouchableOpacity
              style={styles.uploadArea}
              onPress={handleNICUpload}
            >
              {nicFileUri ? (
                <View style={styles.uploadedFile}>
                  <IconSymbol name="checkmark.circle.fill" size={48} color="#34C759" />
                  <Text style={styles.uploadedFileText}>NIC Uploaded</Text>
                  <Text style={styles.uploadedFileName}>
                    {data.nicFile?.name || 'NIC Document'}
                  </Text>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <IconSymbol name="doc.fill" size={48} color="#999" />
                  <Text style={styles.uploadText}>Click or drag to upload NIC</Text>
                  <Text style={styles.uploadHint}>
                    Supports: JPG, PNG, PDF (Max 5MB)
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* NIC Number */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              NIC Number <Text style={styles.required}>*</Text>
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g., 42101-1234567-1"
              placeholderTextColor="#999"
              value={data.nicNumber}
              onChangeText={(value) => onChange({ ...data, nicNumber: value })}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Photo Upload */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Photo (Optional)</ThemedText>
            <ThemedText style={styles.instruction}>
              Upload your profile photo (optional)
            </ThemedText>
            <TouchableOpacity
              style={styles.uploadArea}
              onPress={handlePhotoUpload}
            >
              {photoFileUri ? (
                <View style={styles.uploadedFile}>
                  <IconSymbol name="checkmark.circle.fill" size={48} color="#34C759" />
                  <Text style={styles.uploadedFileText}>Photo Uploaded</Text>
                  <Text style={styles.uploadedFileName}>
                    {data.photoFile?.name || 'Profile Photo'}
                  </Text>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <IconSymbol name="camera.fill" size={48} color="#999" />
                  <Text style={styles.uploadText}>Click or drag to upload photo</Text>
                  <Text style={styles.uploadHint}>
                    Supports: JPG, PNG (Max 2MB)
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.nextButton,
                !data.nicNumber.trim() && styles.nextButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={!data.nicNumber.trim()}
            >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  required: {
    color: '#FF3B30',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    minHeight: 180,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  uploadedFile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedFileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
    marginTop: 12,
    marginBottom: 4,
  },
  uploadedFileName: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 8,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '700',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

