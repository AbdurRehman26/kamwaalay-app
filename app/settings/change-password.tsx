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

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { changePassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Invalid Password', passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password. Please try again.');
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
            <IconSymbol name="chevron.left" size={24} color="#007AFF" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Change Password
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Info Section */}
          <View style={styles.infoSection}>
            <IconSymbol name="info.circle.fill" size={24} color="#007AFF" />
            <ThemedText style={styles.infoText}>
              Your password must be at least 8 characters long and contain uppercase, lowercase, and numbers.
            </ThemedText>
          </View>

          {/* Current Password */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Current Password *</ThemedText>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#999"
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <IconSymbol
                  name={showCurrentPassword ? 'eye.fill' : 'eye.slash.fill'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>New Password *</ThemedText>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#999"
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <IconSymbol
                  name={showNewPassword ? 'eye.fill' : 'eye.slash.fill'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
            {newPassword.length > 0 && (
              <ThemedText style={styles.helperText}>
                {validatePassword(newPassword) || '✓ Password is valid'}
              </ThemedText>
            )}
          </View>

          {/* Confirm New Password */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Confirm New Password *</ThemedText>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <IconSymbol
                  name={showConfirmPassword ? 'eye.fill' : 'eye.slash.fill'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && (
              <ThemedText
                style={[
                  styles.helperText,
                  newPassword === confirmPassword && styles.helperTextSuccess,
                ]}
              >
                {newPassword === confirmPassword
                  ? '✓ Passwords match'
                  : '✗ Passwords do not match'}
              </ThemedText>
            )}
          </View>

          {/* Change Password Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.changeButton, isLoading && styles.changeButtonDisabled]}
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              <Text style={styles.changeButtonText}>
                {isLoading ? 'Changing Password...' : 'Change Password'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Tips */}
          <View style={styles.tipsSection}>
            <ThemedText type="subtitle" style={styles.tipsTitle}>
              Password Tips
            </ThemedText>
            <View style={styles.tipItem}>
              <IconSymbol name="checkmark.circle.fill" size={16} color="#34C759" />
              <ThemedText style={styles.tipText}>Use a unique password</ThemedText>
            </View>
            <View style={styles.tipItem}>
              <IconSymbol name="checkmark.circle.fill" size={16} color="#34C759" />
              <ThemedText style={styles.tipText}>Don't share your password with anyone</ThemedText>
            </View>
            <View style={styles.tipItem}>
              <IconSymbol name="checkmark.circle.fill" size={16} color="#34C759" />
              <ThemedText style={styles.tipText}>Change your password regularly</ThemedText>
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
  scrollView: {
    flex: 1,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginBottom: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  eyeButton: {
    padding: 16,
    paddingLeft: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 6,
  },
  helperTextSuccess: {
    color: '#34C759',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  changeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  changeButtonDisabled: {
    opacity: 0.6,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  tipsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

