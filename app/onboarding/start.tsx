import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { apiService } from '@/services/api';
import { toast } from '@/utils/toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
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

export default function OnboardingStartScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();

  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // City Selection State
  const [cityId, setCityId] = useState<number | null>(null);
  const [cities, setCities] = useState<any[]>([]);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');

  // Pre-populate data if it exists in user context
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    if (user?.city_id) {
      setCityId(user.city_id);
    }
  }, [user]);

  // Fetch cities on mount
  useEffect(() => {
    fetchCities();
  }, []);

  // Check token on mount and log out if not found
  useEffect(() => {
    const checkTokenAndLogout = async () => {
      try {
        let token = await AsyncStorage.getItem('authToken');
        if (!token && user) {
          const userToken = (user as any).token;
          if (userToken) {
            await AsyncStorage.setItem('authToken', userToken);
            token = userToken;
          }
        }
        if (!token) {
          await logout();
          router.replace('/auth/phone-login');
        }
      } catch (error) {
        await logout();
        router.replace('/auth/phone-login');
      }
    };
    checkTokenAndLogout();
  }, [user, logout, router]);

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
      // Error fetching cities
    } finally {
      setIsLoadingCities(false);
    }
  };

  const handleContinue = async () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!cityId) {
      toast.error('Please select your city');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Basic profile update - no pin location here anymore
      const profileUpdateData: any = {
        name: name.trim(),
        city_id: cityId,
      };

      await updateUser(profileUpdateData);

      // Redirect based on user type
      setTimeout(() => {
        const type = user?.userType?.toLowerCase();
        if (type === 'helper') {
          router.replace('/onboarding/helper-profile');
        } else if (type === 'business') {
          router.replace('/onboarding/business-profile');
        } else {
          updateUser({ onboardingStatus: 'completed' });
          router.replace('/');
        }
      }, 100);
    } catch (error: any) {
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

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCityModal = () => {
    return (
      <Modal
        visible={isCityModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsCityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>{t('auth.city')}</Text>
              <TouchableOpacity onPress={() => setIsCityModalVisible(false)}>
                <IconSymbol name="xmark" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor }]}>
              <IconSymbol name="magnifyingglass" size={20} color={textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Search city..."
                placeholderTextColor={textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <IconSymbol name="xmark.circle.fill" size={16} color={textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              style={styles.cityList}
              contentContainerStyle={styles.cityListContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {isLoadingCities ? (
                <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 20 }} />
              ) : filteredCities.length > 0 ? (
                filteredCities.map((city: any, index: number) => {
                  const isSelected = cityId === city.id;
                  return (
                    <TouchableOpacity
                      key={city.id}
                      style={[
                        styles.cityItem,
                        {
                          borderBottomColor: borderColor,
                          borderBottomWidth: index === filteredCities.length - 1 ? 0 : 1,
                          backgroundColor: isSelected ? (primaryLight + '30') : 'transparent'
                        }
                      ]}
                      onPress={() => {
                        setCityId(city.id);
                        setIsCityModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.cityItemText,
                          {
                            color: isSelected ? primaryColor : textColor,
                            fontWeight: isSelected ? '600' : '400'
                          }
                        ]}
                      >
                        {city.name}
                      </Text>
                      {isSelected && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: textSecondary }]}>No cities found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
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
          <View style={[styles.topCircle, { backgroundColor: primaryLight, opacity: 0.3 }]} />
          <View style={[styles.bottomCircle, { backgroundColor: primaryLight, opacity: 0.2 }]} />

          <View style={styles.content}>
            <View style={[styles.headerSection, { marginTop: insets.top + 20 }]}>
              <Text style={[styles.title, { color: textColor }]}>{t('onboarding.start.title') || "Your Profile"}</Text>
              <Text style={[styles.subtitle, { color: textSecondary }]}>
                {t('onboarding.start.subtitle') || "Complete your profile to find relevant opportunities nearby"}
              </Text>
            </View>

            <View style={styles.form}>
              {/* Name Selection */}
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
                  />
                </View>
              </View>

              {/* City Selection */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>City</Text>
                <TouchableOpacity
                  style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}
                  onPress={() => setIsCityModalVisible(true)}
                >
                  <IconSymbol name="mappin.and.ellipse" size={20} color={textSecondary} style={styles.inputIcon} />
                  <Text style={[styles.input, { color: cityId ? textColor : textSecondary, paddingVertical: 16 }]}>
                    {cityId ? cities.find(c => c.id === cityId)?.name : 'Select City'}
                  </Text>
                  <IconSymbol name="chevron.down" size={20} color={textSecondary} style={{ marginRight: 16 }} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

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
              (!name.trim() || !cityId || isLoading) && [styles.buttonDisabled, { backgroundColor: borderColor }]
            ]}
            onPress={handleContinue}
            disabled={!name.trim() || !cityId || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.buttonText}>{t('auth.next')}</Text>
                <IconSymbol name="arrow.right" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderCityModal()}
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
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
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
    marginHorizontal: 24,
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
    marginHorizontal: 24,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  cityList: {
    maxHeight: 300,
  },
  cityListContent: {
    paddingBottom: 8,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cityItemText: {
    fontSize: 14,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
  },
});
