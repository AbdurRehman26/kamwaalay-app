import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { toast } from '@/utils/toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

export default function OnboardingStartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState('');
  const [cityId, setCityId] = useState<number | null>(null);
  const [cities, setCities] = useState<any[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const iconColor = useThemeColor({}, 'icon');

  // Prefill name if it exists in user context
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  // Fetch cities on mount for normal users
  useEffect(() => {
    if (user?.userType === 'user') {
      fetchCities();
    }
  }, [user?.userType]);

  const fetchCities = async () => {
    try {
      setIsLoadingCities(true);
      const response = await apiService.get(API_ENDPOINTS.CITIES.LIST, undefined, undefined, false);
      if (response.success && response.data) {
        let citiesData: any[] = [];
        if (Array.isArray(response.data)) {
          citiesData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          citiesData = response.data.data;
        }
        const formattedCities = citiesData.map((c: any) => ({
          ...c,
          id: typeof c.id === 'string' ? parseInt(c.id, 10) : c.id,
        }));
        setCities(formattedCities);
      }
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Check token on mount and log out if not found
  useEffect(() => {
    const checkTokenAndLogout = async () => {
      try {
        // Check if token exists in AsyncStorage
        let token = await AsyncStorage.getItem('authToken');

        // If no token in separate key, check user object
        if (!token && user) {
          const userToken = (user as any).token;
          if (userToken) {
            // Save token to AsyncStorage for API service to use
            await AsyncStorage.setItem('authToken', userToken);
            token = userToken;
          }
        }

        // If no token found, log out and redirect to login
        if (!token) {
          await logout();
          router.replace('/auth/phone-login');
        }
      } catch (error) {
        // Error checking token - log out as a safety measure
        await logout();
        router.replace('/auth/phone-login');
      }
    };

    checkTokenAndLogout();
  }, [user, logout, router]);

  const handleContinue = async () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    // Clear any previous error
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Ensure token is available before making API call
      let token = await AsyncStorage.getItem('authToken');

      // If no token in AsyncStorage, check user object
      if (!token && user) {
        const userToken = (user as any).token;
        if (userToken) {
          // Save token to AsyncStorage for API service to use
          await AsyncStorage.setItem('authToken', userToken);
          token = userToken;
        }
      }

      // Check if token exists
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Prepare profile update data
      const profileUpdateData: { name: string; city_id?: number } = {
        name: name.trim(),
      };

      // Include city_id for normal users
      if (user?.userType === 'user' && cityId) {
        profileUpdateData.city_id = cityId;
      }

      // Call profile update API (this will use the token from AsyncStorage)
      // Update name and email, but don't mark onboarding as completed yet
      await updateUser({
        ...profileUpdateData,
        // Don't set onboardingStatus to 'completed' here - let the stepper flow handle it
      });

      // Redirect based on user type
      // Helpers and businesses go to their specific onboarding screens
      // Regular users go directly to tabs
      // Get the updated user to ensure we have the latest userType
      const updatedUser = { ...user, ...profileUpdateData };

      setTimeout(() => {
        const userType = updatedUser?.userType || user?.userType;

        if (userType === 'helper') {
          console.log('Navigating to helper-profile stepper');
          router.replace('/onboarding/helper-profile');
        } else if (userType === 'business') {
          router.replace('/onboarding/business-profile');
        } else {
          // For regular users, complete onboarding and go to tabs
          updateUser({
            ...profileUpdateData,
            onboardingStatus: 'completed',
          });
          router.replace('/(tabs)');
        }
      }, 100);
    } catch (error: any) {
      // Profile update error

      // Extract error message
      let extractedErrorMessage = 'Failed to update profile. Please try again.';

      if (error instanceof Error) {
        extractedErrorMessage = error.message;
      } else if (typeof error === 'string') {
        extractedErrorMessage = error;
      } else if (error && typeof error === 'object') {
        extractedErrorMessage = error.message || error.error || error.toString();
      }

      setErrorMessage(extractedErrorMessage);
      toast.error(extractedErrorMessage);
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
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header Section */}
            <View style={[styles.headerSection, { marginTop: insets.top + 20 }]}>
              <Text style={[styles.title, { color: textColor }]}>Let's get started</Text>
              <Text style={[styles.subtitle, { color: textSecondary }]}>
                Tell us a bit about yourself to personalize your experience
              </Text>
            </View>

            <View style={styles.form} nativeID="onboarding-form" data-form="onboarding">
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>
                  {user?.userType === 'business' ? 'Business Owner Name' : 'Full Name'}
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                  <IconSymbol name="person.fill" size={20} color={textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder={user?.userType === 'business' ? 'Enter owner name' : 'Enter your name'}
                    placeholderTextColor={textSecondary}
                    value={name}
                    onChangeText={setName}
                    autoComplete="name"
                    textContentType="name"
                    autoCorrect={false}
                    spellCheck={false}
                    importantForAutofill="yes"
                    nativeID="name-input"
                    accessibilityLabel={user?.userType === 'business' ? 'Business Owner Name' : 'Full Name'}
                    data-autocomplete="name"
                    data-content-type="name"
                  />
                </View>
              </View>

              {/* City Selection for Normal Users */}
              {user?.userType === 'user' && (
                <View style={[styles.inputGroup, { zIndex: 100 }]}>
                  <Text style={[styles.label, { color: textColor }]}>City</Text>
                  <TouchableOpacity
                    style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}
                    onPress={() => setShowCityDropdown(!showCityDropdown)}
                  >
                    <IconSymbol name="mappin.and.ellipse" size={20} color={textSecondary} style={styles.inputIcon} />
                    <Text style={[styles.input, { color: cityId ? textColor : textSecondary, paddingVertical: 16 }]}>
                      {cityId ? cities.find(c => c.id === cityId)?.name : 'Select City'}
                    </Text>
                    <IconSymbol name="chevron.down" size={20} color={textSecondary} style={{ marginRight: 16 }} />
                  </TouchableOpacity>

                  {showCityDropdown && (
                    <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor, maxHeight: 200 }]}>
                      <ScrollView nestedScrollEnabled>
                        {isLoadingCities ? (
                          <ActivityIndicator size="small" color={primaryColor} style={{ padding: 20 }} />
                        ) : (
                          cities.map((city: any) => (
                            <TouchableOpacity
                              key={city.id}
                              style={[styles.dropdownItem, { borderBottomColor: borderColor }]}
                              onPress={() => {
                                setCityId(city.id);
                                setShowCityDropdown(false);
                              }}
                            >
                              <Text style={[styles.dropdownText, { color: textColor }]}>{city.name}</Text>
                              {cityId === city.id && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
                            </TouchableOpacity>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Error Message Display */}
            {errorMessage && (
              <View style={[styles.errorCard, { backgroundColor: '#FEF2F2' }]}>
                <IconSymbol name="exclamationmark.circle.fill" size={16} color={errorColor} />
                <Text style={[styles.errorText, { color: errorColor }]}>{errorMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: primaryColor, shadowColor: primaryColor },
                (!name.trim() || isLoading) && [styles.buttonDisabled, { backgroundColor: borderColor }]
              ]}
              onPress={handleContinue}
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Continue</Text>
                  <IconSymbol name="arrow.right" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
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
  inputWrapperDisabled: {
    backgroundColor: '#F3F4F6',
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
  inputDisabled: {
    color: '#6B7280',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 4,
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
    marginBottom: 24,
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
  dropdownList: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
