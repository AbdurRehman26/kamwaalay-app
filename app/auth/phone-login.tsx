import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from '@/utils/toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function PhoneLoginScreen() {
  const insets = useSafeAreaInsets();
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('password');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { setLanguage } = useApp();
  const { t, language } = useTranslation();

  const themeBackgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const iconColor = useThemeColor({}, 'icon');

  // Clear unverified user data when component mounts to allow fresh login
  useEffect(() => {
    const clearUnverifiedUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsed = JSON.parse(userData);
          // If user is not verified, clear it to allow fresh login
          if (parsed.isVerified === false || parsed.isVerified === undefined) {
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('authToken');
          }
        }
      } catch (error) {
        // Error clearing storage
      }
    };
    clearUnverifiedUser();
  }, []);

  const handleContinue = async () => {
    // Clear any previous error
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Validate phone number
      if (phoneNumber.length < 10) {
        toast.error(t('auth.pleaseEnterValidPhone'));
        setIsLoading(false);
        return;
      }

      // Validate password if using password auth
      if (authMethod === 'password' && !password.trim()) {
        toast.error(t('auth.pleaseEnterPassword'));
        setIsLoading(false);
        return;
      }

      // Call login with phone number
      const loginData: {
        phone: string;
        password?: string;
        authMethod: 'otp' | 'password';
      } = {
        phone: phoneNumber,
        authMethod,
      };

      if (authMethod === 'password') {
        loginData.password = password;
      }

      const result = await login(loginData);

      // Only navigate if login was successful (no error thrown)
      // If OTP is required (either by otp auth method or verification_token in response),
      // navigate to OTP verify screen
      if (result?.requiresOTP) {
        router.push('/auth/otp-verify');
      } else if (result === undefined || !result.requiresOTP) {
        // Login successful with token - user should be saved and verified
        // Wait a moment for state to update, then navigate
        setTimeout(async () => {
          try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
              const parsedUser = JSON.parse(userData);
              if (parsedUser && parsedUser.isVerified) {
                if (parsedUser.onboardingStatus === 'completed') {
                  router.replace('/(tabs)');
                } else {
                  router.replace('/onboarding/start');
                }
              }
            }
          } catch (error) {
          }
        }, 500);
      }
    } catch (error: any) {
      // Extract backend error message
      const errorMsg = error.message || error.error || t('auth.loginFailed');
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      return;
    } finally {
      setIsLoading(false);
    }
  };



  const isFormValid = () => {
    if (phoneNumber.length < 10) return false;
    if (authMethod === 'password' && !password.trim()) return false;
    return true;
  };

  return (
    <View style={[styles.container, { backgroundColor: themeBackgroundColor }]}>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Decorative Background Elements */}
          <View style={[styles.topCircle, { backgroundColor: primaryLight, opacity: 0.3 }]} />
          <View style={[styles.bottomCircle, { backgroundColor: primaryLight, opacity: 0.2 }]} />

          <View style={[styles.langContainer, { top: insets.top + 10 }]}>
            <TouchableOpacity
              style={[styles.langButton, { backgroundColor: cardBg }]}
              onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
            >
              <Text style={[styles.langText, { color: primaryColor }]}>
                {language === 'en' ? 'English' : language === 'ur' ? 'اردو' : 'Roman Urdu'}
              </Text>
              <IconSymbol name="chevron.down" size={16} color={primaryColor} />
            </TouchableOpacity>

            {showLanguageDropdown && (
              <View style={[styles.langDropdown, { backgroundColor: cardBg }]}>
                <TouchableOpacity
                  style={[styles.langOption, language === 'en' && { backgroundColor: primaryLight }]}
                  onPress={() => {
                    setLanguage('en');
                    setShowLanguageDropdown(false);
                  }}
                >
                  <Text style={[styles.langOptionText, { color: textColor }]}>English</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.langOption, language === 'ur' && { backgroundColor: primaryLight }]}
                  onPress={() => {
                    setLanguage('ur');
                    setShowLanguageDropdown(false);
                  }}
                >
                  <Text style={[styles.langOptionText, { color: textColor }]}>اردو</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.langOption, language === 'roman' && { backgroundColor: primaryLight }]}
                  onPress={() => {
                    setLanguage('roman');
                    setShowLanguageDropdown(false);
                  }}
                >
                  <Text style={[styles.langOptionText, { color: textColor }]}>Roman Urdu</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.content}>
            {/* Header Section */}
            <View style={[styles.headerSection, { marginTop: insets.top + 40 }]}>
              <View style={[styles.logoContainer, { backgroundColor: cardBg, shadowColor: primaryColor }]}>
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.welcomeText, { color: textColor }]}>{t('auth.welcomeBack')}</Text>
              <Text style={[styles.subtitleText, { color: textSecondary }]}>
                {t('auth.loginSubtitle')}
              </Text>
            </View>

            {/* Auth Method Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: authMethod === 'otp' ? primaryLight : cardBg }]}>
              <TouchableOpacity
                style={[styles.tab, authMethod === 'password' && [styles.activeTab, { backgroundColor: cardBg }]]}
                onPress={() => setAuthMethod('password')}
              >
                <Text style={[styles.tabText, { color: textSecondary }, authMethod === 'password' && [styles.activeTabText, { color: textColor }]]}>
                  {t('auth.password')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, authMethod === 'otp' && [styles.activeTab, { backgroundColor: cardBg }]]}
                onPress={() => setAuthMethod('otp')}
              >
                <Text style={[styles.tabText, { color: textSecondary }, authMethod === 'otp' && [styles.activeTabText, { color: textColor }]]}>
                  {t('auth.otpLogin')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>{t('auth.phoneNumber')}</Text>
                <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                  <View style={styles.prefixContainer}>
                    <Text style={styles.flag}>🇵🇰</Text>
                    <Text style={[styles.prefix, { color: textColor }]}>+92</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: borderColor }]} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="300 1234567"
                    placeholderTextColor={textSecondary}
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    maxLength={10}
                    autoComplete="tel"
                  />
                </View>
              </View>

              {authMethod === 'password' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: textColor }]}>{t('auth.password')}</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                    <IconSymbol name="lock.fill" size={20} color={textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      placeholder={t('auth.enterPassword')}
                      placeholderTextColor={textSecondary}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      autoComplete="password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <IconSymbol
                        name={showPassword ? "eye.fill" : "eye.slash.fill"}
                        size={20}
                        color={textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {errorMessage && (
                <View style={[styles.errorCard, { backgroundColor: authMethod === 'otp' ? '#FEF2F2' : 'transparent' }]}>
                  <IconSymbol name="exclamationmark.circle.fill" size={16} color={errorColor} />
                  <Text style={[styles.errorText, { color: errorColor }]}>{errorMessage}</Text>
                </View>
              )}



              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: primaryColor, shadowColor: primaryColor },
                  (!isFormValid() || isLoading) && [styles.submitButtonDisabled, { backgroundColor: borderColor }]
                ]}
                onPress={handleContinue}
                disabled={!isFormValid() || isLoading}
              >
                {isLoading ? (
                  <Text style={styles.submitButtonText}>{t('auth.processing')}</Text>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {authMethod === 'otp' ? t('auth.sendVerificationCode') : t('auth.login')}
                  </Text>
                )}
                {!isLoading && <IconSymbol name="arrow.right" size={20} color="#FFF" />}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: textSecondary }]}>{t('auth.dontHaveAccount')}</Text>
              <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                <Text style={[styles.footerLink, { color: primaryColor }]}>{t('auth.createAccount')}</Text>
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  topCircle: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#EEF2FF', // Very light indigo
    opacity: 0.7,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#F5F3FF', // Very light purple
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#1A1A1A',
  },
  formSection: {
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
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    gap: 8,
  },
  flag: {
    fontSize: 20,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
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
  eyeButton: {
    padding: 16,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  submitButton: {
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
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  footerLink: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '700',
  },
  langContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 50,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
  },
  langDropdown: {
    position: 'absolute',
    top: '120%',
    right: 0,
    minWidth: 140,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  langOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  langOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

