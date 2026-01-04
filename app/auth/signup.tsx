import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/useTranslation';
import { apiService } from '@/services/api';
import { toast } from '@/utils/toast';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();
  const { setLanguage } = useApp();
  const { t, language } = useTranslation();

  // Form State
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'user' | 'helper' | 'business'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Theme Colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const iconColor = useThemeColor({}, 'icon');

  // City Selection State
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [selectedCity, setSelectedCity] = useState<{ id: number; name: string } | null>(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [searchCityQuery, setSearchCityQuery] = useState('');
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  React.useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setIsLoadingCities(true);
      const response = await apiService.get(API_ENDPOINTS.CITIES.LIST);
      if (response.success && response.data) {
        setCities(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    } finally {
      setIsLoadingCities(false);
    }
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchCityQuery.toLowerCase())
  );

  const handleSignup = async () => {
    if (!name.trim()) {
      toast.error(t('auth.pleaseEnterName'));
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error(t('auth.pleaseEnterValidPhone'));
      return;
    }

    if (phoneNumber.length < 10) {
      toast.error(t('auth.pleaseEnterValidPhone'));
      return;
    }

    if (!selectedCity) {
      toast.error(t('auth.pleaseSelectCity'));
      return;
    }

    if (!password.trim()) {
      toast.error(t('auth.pleaseEnterPassword'));
      return;
    }

    if (password.length < 8) {
      toast.error(t('auth.passwordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.passwordsDoNotMatch'));
      return;
    }

    // Clear any previous error and success messages
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await register({
        name: name.trim(),
        phone: phoneNumber.trim(),
        password,
        password_confirmation: confirmPassword,
        role,
        city_id: selectedCity.id,
      });

      // Show success message if provided by backend
      if (result?.message) {
        setSuccessMessage(result.message);
        toast.success(result.message);
      } else {
        setSuccessMessage(t('auth.accountCreatedSuccess'));
        toast.success(t('auth.accountCreatedSuccess'));
      }

      // Wait a moment to show the success message, then navigate
      setTimeout(() => {
        router.push('/auth/otp-verify');
      }, 1500);
    } catch (error: any) {
      // Extract backend error message
      let extractedErrorMessage = 'Failed to create account. Please try again.';

      if (error instanceof Error) {
        extractedErrorMessage = error.message;
      } else if (typeof error === 'string') {
        extractedErrorMessage = error;
      } else if (error && typeof error === 'object') {
        extractedErrorMessage = error.message || error.error || JSON.stringify(error);
      }

      setErrorMessage(extractedErrorMessage);
      toast.error(extractedErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
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
            <View style={[styles.headerSection, { marginTop: insets.top + 20 }]}>
              <Text style={[styles.welcomeText, { color: textColor }]}>{t('auth.createAccount')}</Text>
              <Text style={[styles.subtitleText, { color: textSecondary }]}>
                {t('auth.joinUs')}
              </Text>
            </View>

            {/* Role Selection */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: textColor }]}>{t('auth.joinAs')}</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[styles.roleCard, { backgroundColor: cardBg, borderColor }, role === 'user' && [styles.roleCardActive, { backgroundColor: primaryLight, borderColor: primaryColor }]]}
                  onPress={() => setRole('user')}
                >
                  <View style={[styles.roleIconContainer, { backgroundColor: primaryLight }, role === 'user' && [styles.roleIconContainerActive, { backgroundColor: cardBg }]]}>
                    <Text style={styles.roleEmoji}>🏠</Text>
                  </View>
                  <Text style={[styles.roleTitle, { color: textSecondary }, role === 'user' && [styles.roleTitleActive, { color: primaryColor }]]}>
                    {t('auth.customer')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleCard, { backgroundColor: cardBg, borderColor }, role === 'helper' && [styles.roleCardActive, { backgroundColor: primaryLight, borderColor: primaryColor }]]}
                  onPress={() => setRole('helper')}
                >
                  <View style={[styles.roleIconContainer, { backgroundColor: primaryLight }, role === 'helper' && [styles.roleIconContainerActive, { backgroundColor: cardBg }]]}>
                    <Text style={styles.roleEmoji}>👷</Text>
                  </View>
                  <Text style={[styles.roleTitle, { color: textSecondary }, role === 'helper' && [styles.roleTitleActive, { color: primaryColor }]]}>
                    {t('auth.worker')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleCard, { backgroundColor: cardBg, borderColor }, role === 'business' && [styles.roleCardActive, { backgroundColor: primaryLight, borderColor: primaryColor }]]}
                  onPress={() => setRole('business')}
                >
                  <View style={[styles.roleIconContainer, { backgroundColor: primaryLight }, role === 'business' && [styles.roleIconContainerActive, { backgroundColor: cardBg }]]}>
                    <Text style={styles.roleEmoji}>💼</Text>
                  </View>
                  <Text style={[styles.roleTitle, { color: textSecondary }, role === 'business' && [styles.roleTitleActive, { color: primaryColor }]]}>
                    {t('auth.business')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>{t('auth.fullName')}</Text>
                <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                  <IconSymbol name="person.fill" size={20} color={textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder={t('auth.enterFullName')}
                    placeholderTextColor={textSecondary}
                    value={name}
                    onChangeText={setName}
                    autoComplete="name"
                  />
                </View>
              </View>

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

              {/* City Selection */}
              <View style={[styles.inputGroup, { zIndex: 10 }]}>
                <Text style={[styles.label, { color: textColor }]}>{t('auth.city')}</Text>
                <TouchableOpacity
                  style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor, justifyContent: 'space-between' }]}
                  onPress={() => setShowCityDropdown(!showCityDropdown)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <IconSymbol name="mappin.and.ellipse" size={20} color={textSecondary} style={styles.inputIcon} />
                    <Text style={[styles.input, { color: selectedCity ? textColor : textSecondary, paddingVertical: 16 }]}>
                      {selectedCity ? selectedCity.name : t('auth.selectCity')}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.down" size={20} color={textSecondary} style={{ marginRight: 16 }} />
                </TouchableOpacity>

                {showCityDropdown && (
                  <View style={[styles.cityDropdown, { backgroundColor: cardBg, borderColor }]}>
                    <View style={[styles.searchContainer, { borderBottomColor: borderColor }]}>
                      <IconSymbol name="magnifyingglass" size={16} color={textSecondary} />
                      <TextInput
                        style={[styles.searchInput, { color: textColor }]}
                        placeholder={t('auth.searchCity')}
                        placeholderTextColor={textSecondary}
                        value={searchCityQuery}
                        onChangeText={setSearchCityQuery}
                        autoFocus
                      />
                    </View>

                    <ScrollView style={styles.cityList} nestedScrollEnabled>
                      {isLoadingCities ? (
                        <View style={styles.loadingContainer}>
                          <Text style={{ color: textSecondary }}>{t('auth.loadingCities')}</Text>
                        </View>
                      ) : filteredCities.length > 0 ? (
                        filteredCities.map((city) => (
                          <TouchableOpacity
                            key={city.id}
                            style={[
                              styles.cityItem,
                              { borderBottomColor: borderColor },
                              selectedCity?.id === city.id && { backgroundColor: primaryLight }
                            ]}
                            onPress={() => {
                              setSelectedCity(city);
                              setShowCityDropdown(false);
                              setSearchCityQuery('');
                            }}
                          >
                            <Text style={[
                              styles.cityItemText,
                              { color: textColor },
                              selectedCity?.id === city.id && { color: primaryColor, fontWeight: '600' }
                            ]}>
                              {city.name}
                            </Text>
                            {selectedCity?.id === city.id && (
                              <IconSymbol name="checkmark" size={16} color={primaryColor} />
                            )}
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View style={styles.loadingContainer}>
                          <Text style={{ color: textSecondary }}>{t('auth.noCitiesFound')}</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>



              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>{t('auth.password')}</Text>
                <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                  <IconSymbol name="lock.fill" size={20} color={textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder={t('auth.createPassword')}
                    placeholderTextColor={textSecondary}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoComplete="password-new"
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

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>{t('auth.confirmPassword')}</Text>
                <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                  <IconSymbol name="lock.fill" size={20} color={textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder={t('auth.confirmYourPassword')}
                    placeholderTextColor={textSecondary}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoComplete="password-new"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    <IconSymbol
                      name={showConfirmPassword ? "eye.fill" : "eye.slash.fill"}
                      size={20}
                      color={textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Success Message Display */}
              {successMessage && (
                <View style={[styles.successCard, { backgroundColor: '#F0FDF4' }]}>
                  <IconSymbol name="checkmark.circle.fill" size={16} color="#2E7D32" />
                  <Text style={[styles.successText, { color: '#15803D' }]}>{successMessage}</Text>
                </View>
              )}

              {/* Error Message Display */}
              {errorMessage && (
                <View style={[styles.errorCard, { backgroundColor: '#FEF2F2' }]}>
                  <IconSymbol name="exclamationmark.circle.fill" size={16} color={errorColor} />
                  <Text style={[styles.errorText, { color: errorColor }]}>{errorMessage}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: primaryColor, shadowColor: primaryColor },
                  (!name.trim() || !password.trim() || password.length < 8 || isLoading) && [styles.submitButtonDisabled, { backgroundColor: borderColor }]
                ]}
                onPress={handleSignup}
                disabled={!name.trim() || !password.trim() || password.length < 8 || isLoading}
              >
                {isLoading ? (
                  <Text style={styles.submitButtonText}>{t('auth.creatingAccount')}</Text>
                ) : (
                  <Text style={styles.submitButtonText}>{t('auth.signUp')}</Text>
                )}
                {!isLoading && <IconSymbol name="arrow.right" size={20} color="#FFF" />}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: textSecondary }]}>{t('auth.alreadyHaveAccount')}</Text>
              <TouchableOpacity onPress={() => router.push('/auth/phone-login')}>
                <Text style={[styles.footerLink, { color: primaryColor }]}>{t('auth.login')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.termsText, { color: textSecondary }]}>
              {t('auth.byRegistering')} {' '}
              <Text style={[styles.linkText, { color: primaryColor }]}>{t('auth.terms')}</Text> {t('auth.and')}{' '}
              <Text style={[styles.linkText, { color: primaryColor }]}>{t('auth.privacyPolicy')}</Text>
            </Text>
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
  content: {
    paddingHorizontal: 24,
  },
  headerSection: {
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleCardActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
    borderWidth: 2,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconContainerActive: {
    backgroundColor: '#FFFFFF',
  },
  roleEmoji: {
    fontSize: 24,
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  roleTitleActive: {
    color: '#6366F1',
    fontWeight: '700',
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
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  successText: {
    color: '#15803D',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
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
    marginBottom: 24,
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
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 18,
    paddingHorizontal: 20,
    color: '#666',
  },
  linkText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  cityDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 16,
    marginTop: 4,
    maxHeight: 250,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: 24,
    padding: 0,
  },
  cityList: {
    maxHeight: 200,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // Will be overridden
  },
  cityItemText: {
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
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









