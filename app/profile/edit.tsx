import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Basic profile fields
  const [name, setName] = useState(
    user?.userType === 'helper'
      ? (user?.profileData as any)?.name || user?.name || ''
      : user?.name || ''
  );
  const [email, setEmail] = useState(
    user?.userType === 'helper' || user?.userType === 'business'
      ? (user?.profileData as any)?.email || user?.email || ''
      : user?.email || ''
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
        email: email.trim() || undefined,
      };

      // Update profile data for helpers/businesses
      if (user?.userType === 'helper' && user.profileData) {
        updatedUser.profileData = {
          ...user.profileData,
          name: finalName.trim(),
          email: email.trim() || undefined,
          bio: bio.trim() || undefined,
          experience: experience.trim() || undefined,
        };
      } else if (user?.userType === 'business' && user.profileData) {
        updatedUser.profileData = {
          ...user.profileData,
          businessName: businessName.trim(),
          ownerName: ownerName.trim(),
          email: email.trim() || undefined,
          bio: bio.trim() || undefined,
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
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#6366F1" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Edit Profile
          </ThemedText>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>{isLoading ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Picture Section */}
          <View style={styles.section}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(name || user?.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity style={styles.changePhotoButton}>
                <IconSymbol name="camera.fill" size={20} color="#6366F1" />
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Basic Information
            </ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>
                {user?.userType === 'business' ? 'Owner Name' : 'Name'} *
              </ThemedText>
              <TextInput
                style={styles.input}
                value={user?.userType === 'business' ? ownerName : name}
                onChangeText={user?.userType === 'business' ? setOwnerName : setName}
                placeholder={`Enter ${user?.userType === 'business' ? 'owner' : ''} name`}
                placeholderTextColor="#999"
              />
            </View>

            {user?.userType === 'business' && (
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Business Name *</ThemedText>
                <TextInput
                  style={styles.input}
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="Enter business name"
                  placeholderTextColor="#999"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Phone Number</ThemedText>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={user?.phoneNumber || ''}
                editable={false}
                placeholderTextColor="#999"
              />
              <ThemedText style={styles.helperText}>
                Phone number cannot be changed
              </ThemedText>
            </View>
          </View>

          {/* Profile Details for Helpers/Businesses */}
          {(user?.userType === 'helper' || user?.userType === 'business') && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Profile Details
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Bio</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {user?.userType === 'helper' && (
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Experience</ThemedText>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={experience}
                    onChangeText={setExperience}
                    placeholder="Describe your experience..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              )}
            </View>
          )}

          {/* Account Type Badge */}
          <View style={styles.section}>
            <View style={styles.badgeContainer}>
              <ThemedText style={styles.badgeLabel}>Account Type</ThemedText>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {user?.userType === 'user'
                    ? 'Customer'
                    : user?.userType === 'helper'
                    ? 'Helper'
                    : 'Business'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8E8E8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1A1A1A',
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  changePhotoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366F1',
  },
  inputGroup: {
    marginBottom: 20,
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
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
    textTransform: 'capitalize',
  },
});

