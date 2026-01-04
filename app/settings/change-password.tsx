import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
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

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { changePassword } = useAuth();
  const insets = useSafeAreaInsets();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');


  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return t('changePassword.validation.length');
    }
    if (!/[A-Z]/.test(password)) {
      return t('changePassword.validation.uppercase');
    }
    if (!/[a-z]/.test(password)) {
      return t('changePassword.validation.lowercase');
    }
    if (!/[0-9]/.test(password)) {
      return t('changePassword.validation.number');
    }
    return null;
  };

  const handleChangePassword = async () => {
    setFormError(null);

    // Validation
    if (!currentPassword.trim()) {
      setFormError(t('changePassword.validation.requiredCurrent'));
      return;
    }

    if (!newPassword.trim()) {
      setFormError(t('changePassword.validation.requiredNew'));
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError(t('changePassword.validation.matchError'));
      return;
    }

    if (currentPassword === newPassword) {
      setFormError(t('changePassword.validation.different'));
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert(t('changePassword.alerts.success'), t('changePassword.alerts.successMessage'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      // Show backend error inline
      setFormError(error.message || t('changePassword.alerts.error'));
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
        <ScreenHeader title={t('changePassword.title')} />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          contentContainerStyle={{ width: '100%', paddingBottom: 40 }}
        >
          {/* Info Section */}
          <View style={[styles.infoSection, { backgroundColor: cardBg, borderColor: borderColor }]}>
            <IconSymbol name="info.circle.fill" size={24} color={primaryColor} />
            <ThemedText style={[styles.infoText, { color: textColor }]}>
              {t('changePassword.info')}
            </ThemedText>
          </View>

          {/* Current Password */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>{t('changePassword.currentPassword')}</ThemedText>
            <View style={[styles.passwordContainer, { backgroundColor: cardBg, borderColor: borderColor }]}>
              <TextInput
                style={[styles.input, { color: textColor }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder={t('changePassword.placeholders.current')}
                placeholderTextColor={textMuted}
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
                  color={textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>{t('changePassword.newPassword')}</ThemedText>
            <View style={[styles.passwordContainer, { backgroundColor: cardBg, borderColor: borderColor }]}>
              <TextInput
                style={[styles.input, { color: textColor }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={t('changePassword.placeholders.new')}
                placeholderTextColor={textMuted}
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
                  color={textMuted}
                />
              </TouchableOpacity>
            </View>
            {newPassword.length > 0 && (
              <ThemedText style={[
                styles.helperText,
                !validatePassword(newPassword) && styles.helperTextSuccess
              ]}>
                {validatePassword(newPassword) || t('changePassword.validation.valid')}
              </ThemedText>
            )}
          </View>

          {/* Confirm New Password */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>{t('changePassword.confirmPassword')}</ThemedText>
            <View style={[styles.passwordContainer, { backgroundColor: cardBg, borderColor: borderColor }]}>
              <TextInput
                style={[styles.input, { color: textColor }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('changePassword.placeholders.confirm')}
                placeholderTextColor={textMuted}
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
                  color={textMuted}
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
                  ? t('changePassword.validation.match')
                  : t('changePassword.validation.noMatch')}
              </ThemedText>
            )}
          </View>

          {/* Change Password Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.changeButton, { backgroundColor: primaryColor }, isLoading && styles.changeButtonDisabled]}
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              <Text style={styles.changeButtonText}>
                {isLoading ? t('changePassword.actions.changing') : t('changePassword.actions.change')}
              </Text>
            </TouchableOpacity>

            {formError ? (
              <Text style={{ color: '#FF3B30', marginTop: 10, textAlign: 'center', fontWeight: '500' }}>
                {formError}
              </Text>
            ) : null}
          </View>

          {/* Security Tips */}
          <View style={[styles.tipsSection, { backgroundColor: cardBg, borderColor: borderColor }]}>
            <ThemedText type="subtitle" style={styles.tipsTitle}>
              {t('changePassword.tips.title')}
            </ThemedText>
            <View style={styles.tipItem}>
              <IconSymbol name="checkmark.circle.fill" size={16} color="#34C759" />
              <ThemedText style={[styles.tipText, { color: textMuted }]}>{t('changePassword.tips.unique')}</ThemedText>
            </View>
            <View style={styles.tipItem}>
              <IconSymbol name="checkmark.circle.fill" size={16} color="#34C759" />
              <ThemedText style={[styles.tipText, { color: textMuted }]}>{t('changePassword.tips.share')}</ThemedText>
            </View>
            <View style={styles.tipItem}>
              <IconSymbol name="checkmark.circle.fill" size={16} color="#34C759" />
              <ThemedText style={[styles.tipText, { color: textMuted }]}>{t('changePassword.tips.regular')}</ThemedText>
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
    width: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    width: '100%',
    marginTop: 20,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
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
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    height: 56,
  },
  eyeButton: {
    padding: 16,
    paddingLeft: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 6,
    marginLeft: 4,
  },
  helperTextSuccess: {
    color: '#34C759',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
    marginTop: 10,
  },
  changeButton: {
    borderRadius: 16,
    padding: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
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
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 32,
    borderWidth: 1,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
});

