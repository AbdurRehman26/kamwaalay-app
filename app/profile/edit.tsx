import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

const { width } = Dimensions.get('window');

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const insets = useSafeAreaInsets();

  // Basic profile fields
  const [name, setName] = useState(
    user?.userType === 'helper'
      ? (user?.profileData as any)?.name || user?.name || ''
      : user?.name || ''
  );

  // Helper/Business profile fields
  const [bio, setBio] = useState(
    user?.userType === 'helper'
      ? (user?.profileData as any)?.bio || ''
      : user?.userType === 'business'
        ? (user?.profileData as any)?.bio || ''
        : ''
  );
  const [experience, setExperience] = useState(
    user?.userType === 'helper' ? (user?.profileData as any)?.experience || '' : ''
  );
  const [businessName, setBusinessName] = useState(
    user?.userType === 'business' ? (user?.profileData as any)?.businessName || '' : ''
  );
  const [ownerName, setOwnerName] = useState(
    user?.userType === 'business' ? (user?.profileData as any)?.ownerName || '' : ''
  );

  const handleSave = async () => {
    const finalName = user?.userType === 'business' ? ownerName : name;
    if (!finalName.trim()) {
      Alert.alert('Error', `${user?.userType === 'business' ? 'Owner name' : 'Name'} is required`);
      return;
    }

    if (user?.userType === 'business' && !businessName.trim()) {
      Alert.alert('Error', 'Business name is required');
      return;
    }

    setIsLoading(true);
    try {
      const updatedUser: any = {
        name: finalName.trim(),
      };

      // Update profile data for helpers/businesses
      if (user?.userType === 'helper' && user.profileData) {
        updatedUser.profileData = {
          ...user.profileData,
          name: finalName.trim(),
          bio: bio.trim() || undefined,
          experience: experience.trim() || undefined,
        };
      } else if (user?.userType === 'business' && user.profileData) {
        updatedUser.profileData = {
          ...user.profileData,
          businessName: businessName.trim(),
          ownerName: ownerName.trim(),
          bio: bio.trim() || undefined,
          experience: bio.trim() || undefined, // Mapping bio to experience/description for business if needed
        };
        // Also update the main name field for businesses
        updatedUser.name = ownerName.trim();
      }

      await updateUser(updatedUser);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Decorative Background Elements */}
      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
          {/* Profile Picture Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(name || user?.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity style={styles.cameraButton}>
                <IconSymbol name="camera.fill" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>

            {/* Account Type Badge */}
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <IconSymbol
                  name={user?.userType === 'business' ? 'building.2.fill' : user?.userType === 'helper' ? 'person.fill' : 'person'}
                  size={14}
                  color="#6366F1"
                />
                <Text style={styles.badgeText}>
                  {user?.userType === 'user'
                    ? 'Customer'
                    : user?.userType === 'helper'
                      ? 'Helper'
                      : 'Business'} Profile
                </Text>
              </View>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {user?.userType === 'business' ? 'Owner Name' : 'Full Name'} <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <IconSymbol name="person" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={user?.userType === 'business' ? ownerName : name}
                  onChangeText={user?.userType === 'business' ? setOwnerName : setName}
                  placeholder={`Enter ${user?.userType === 'business' ? 'owner' : 'your full'} name`}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {user?.userType === 'business' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Name <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <IconSymbol name="building.2" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Enter business name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
                <IconSymbol name="phone" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={user?.phoneNumber || ''}
                  editable={false}
                  placeholderTextColor="#9CA3AF"
                />
                <IconSymbol name="lock.fill" size={16} color="#9CA3AF" style={styles.lockIcon} />
              </View>
              <Text style={styles.helperText}>
                Phone number cannot be changed
              </Text>
            </View>

            {/* Profile Details for Helpers/Businesses */}
            {(user?.userType === 'helper' || user?.userType === 'business') && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Profile Details</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Bio</Text>
                  <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={bio}
                      onChangeText={setBio}
                      placeholder="Tell us about yourself..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>

                {user?.userType === 'helper' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Experience</Text>
                    <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={experience}
                        onChangeText={setExperience}
                        placeholder="Describe your experience..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
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
  topCircle: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#EEF2FF',
    opacity: 0.6,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#F5F3FF',
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 246, 255, 0.5)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  changePhotoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  textAreaWrapper: {
    height: 'auto',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    height: '100%',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  disabledInputWrapper: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
    shadowOpacity: 0,
  },
  disabledInput: {
    color: '#9CA3AF',
  },
  lockIcon: {
    marginLeft: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
  },
});
