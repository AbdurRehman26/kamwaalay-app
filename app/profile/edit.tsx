import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
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

const RELIGION_OPTIONS = [
  { id: 'sunni_nazar_niyaz', label: 'Sunni (Nazar/Niyaz)' },
  { id: 'sunni_no_nazar_niyaz', label: 'Sunni (No Nazar/Niyaz)' },
  { id: 'shia', label: 'Shia' },
  { id: 'christian', label: 'Christian' },
];

const GENDER_OPTIONS = ['Male', 'Female'];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const insets = useSafeAreaInsets();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const iconMuted = useThemeColor({}, 'iconMuted');

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

  // New Helper Fields
  const [age, setAge] = useState(
    user?.userType === 'helper' ? (user?.profileData as any)?.age || '' : ''
  );
  const [gender, setGender] = useState(
    user?.userType === 'helper' ? (user?.profileData as any)?.gender || '' : ''
  );
  const [religion, setReligion] = useState(
    user?.userType === 'helper' ? (user?.profileData as any)?.religion || '' : ''
  );
  const [languages, setLanguages] = useState(
    user?.userType === 'helper'
      ? Array.isArray((user?.profileData as any)?.languages)
        ? (user?.profileData as any)?.languages.join(', ')
        : (user?.profileData as any)?.languages || ''
      : ''
  );

  // Language fetching/handling
  const [availableLanguages, setAvailableLanguages] = useState<any[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showReligionDropdown, setShowReligionDropdown] = useState(false);

  React.useEffect(() => {
    if (user?.userType === 'helper') {
      fetchLanguages();
    }
  }, [user?.userType]);

  const fetchLanguages = async () => {
    try {
      setIsLoadingLanguages(true);
      const response = await apiService.get(API_ENDPOINTS.LANGUAGES.LIST, undefined, undefined, false);

      if (response.success && response.data) {
        let langs: any[] = [];
        if (Array.isArray(response.data)) {
          langs = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          langs = response.data.data;
        } else if (response.data.languages) {
          langs = Array.isArray(response.data.languages) ? response.data.languages : (response.data.languages.data || []);
        }

        // Ensure standard format
        const formattedLangs = langs.map((l: any) => ({
          id: l.id || l.name,
          name: l.name || l
        }));

        setAvailableLanguages(formattedLangs);
      }
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    } finally {
      setIsLoadingLanguages(false);
    }
  };

  const toggleLanguage = (languageName: string) => {
    const currentLanguages = languages ? languages.split(',').map((l: string) => l.trim()).filter((l: string) => l) : [];

    let updatedLanguages: string[];
    if (currentLanguages.includes(languageName)) {
      updatedLanguages = currentLanguages.filter((l: string) => l !== languageName);
    } else {
      updatedLanguages = [...currentLanguages, languageName];
    }

    setLanguages(updatedLanguages.join(', '));
  };

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
          age: age.trim() || undefined,
          gender: gender || undefined,
          religion: religion || undefined,
          languages: languages ? languages.split(',').map((l: string) => l.trim()).filter((l: string) => l) : [],
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
    <View style={[styles.container, { backgroundColor }]}>
      {/* Decorative Background Elements */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.keyboardView, { backgroundColor }]}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: borderColor }]}>
            <IconSymbol name="chevron.left" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, { backgroundColor: primaryLight }]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <Text style={[styles.saveButtonText, { color: primaryColor }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={[styles.scrollView, { backgroundColor }]}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          bounces={false}
          alwaysBounceHorizontal={false}
          alwaysBounceVertical={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 40,
            width: width,
            maxWidth: width,
          }}
        >
          <View style={[styles.topCircle, { backgroundColor: primaryLight }]} />
          <View style={[styles.bottomCircle, { backgroundColor: primaryLight }]} />

          {/* Profile Picture Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: cardBg, borderColor: cardBg, shadowColor: primaryColor }]}>
                <Text style={[styles.avatarText, { color: primaryColor }]}>
                  {(name || user?.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity style={[styles.cameraButton, { backgroundColor: primaryColor, borderColor: cardBg }]}>
                <IconSymbol name="camera.fill" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.changePhotoText, { color: textSecondary }]}>Tap to change photo</Text>

            {/* Account Type Badge */}
            <View style={styles.badgeContainer}>
              <View style={[styles.badge, { backgroundColor: primaryLight }]}>
                <IconSymbol
                  name={user?.userType === 'business' ? 'building.2.fill' : user?.userType === 'helper' ? 'person.fill' : 'person'}
                  size={14}
                  color={primaryColor}
                />
                <Text style={[styles.badgeText, { color: primaryColor }]}>
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
            <Text style={[styles.sectionTitle, { color: textColor }]}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>
                {user?.userType === 'business' ? 'Owner Name' : 'Full Name'} <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}>
                <IconSymbol name="person" size={20} color={iconMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={user?.userType === 'business' ? ownerName : name}
                  onChangeText={user?.userType === 'business' ? setOwnerName : setName}
                  placeholder={`Enter ${user?.userType === 'business' ? 'owner' : 'your full'} name`}
                  placeholderTextColor={textMuted}
                />
              </View>
            </View>

            {user?.userType === 'business' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>Business Name <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}>
                  <IconSymbol name="building.2" size={20} color={iconMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Enter business name"
                    placeholderTextColor={textMuted}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Phone Number</Text>
              <View style={[styles.inputWrapper, styles.disabledInputWrapper, { backgroundColor: borderColor, borderColor, shadowColor: textColor }]}>
                <IconSymbol name="phone" size={20} color={iconMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.disabledInput, { color: textMuted }]}
                  value={user?.phoneNumber || ''}
                  editable={false}
                  placeholderTextColor={textMuted}
                />
                <IconSymbol name="lock.fill" size={16} color={iconMuted} style={styles.lockIcon} />
              </View>
              <Text style={[styles.helperText, { color: textMuted }]}>
                Phone number cannot be changed
              </Text>
            </View>

            {/* Profile Details for Helpers/Businesses */}
            {(user?.userType === 'helper' || user?.userType === 'business') && (
              <>
                <View style={[styles.divider, { backgroundColor: borderColor }]} />
                <Text style={[styles.sectionTitle, { color: textColor }]}>Profile Details</Text>

                {user?.userType === 'helper' && (
                  <>
                    {/* Age */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: textColor }]}>Age</Text>
                      <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}>
                        <IconSymbol name="calendar" size={20} color={iconMuted} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          value={age}
                          onChangeText={setAge}
                          placeholder="Enter your age"
                          placeholderTextColor={textMuted}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                    </View>

                    {/* Gender */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: textColor }]}>Gender</Text>
                      <TouchableOpacity
                        style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}
                        onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                      >
                        <IconSymbol name="person" size={20} color={iconMuted} style={styles.inputIcon} />
                        <Text style={[styles.input, { color: gender ? textColor : textMuted, paddingVertical: 16 }]}>
                          {gender || 'Select Gender'}
                        </Text>
                        <IconSymbol name="chevron.down" size={20} color={iconMuted} />
                      </TouchableOpacity>
                      {showGenderDropdown && (
                        <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor }]}>
                          {GENDER_OPTIONS.map((g) => (
                            <TouchableOpacity
                              key={g}
                              style={[styles.dropdownItem, { borderBottomColor: borderColor }]}
                              onPress={() => {
                                setGender(g);
                                setShowGenderDropdown(false);
                              }}
                            >
                              <Text style={[styles.dropdownText, { color: textColor }]}>{g}</Text>
                              {gender === g && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Religion */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: textColor }]}>Religion</Text>
                      <TouchableOpacity
                        style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}
                        onPress={() => setShowReligionDropdown(!showReligionDropdown)}
                      >
                        <IconSymbol name="star.fill" size={20} color={iconMuted} style={styles.inputIcon} />
                        <Text style={[styles.input, { color: religion ? textColor : textMuted, paddingVertical: 16 }]}>
                          {RELIGION_OPTIONS.find(r => r.id === religion)?.label || 'Select Religion'}
                        </Text>
                        <IconSymbol name="chevron.down" size={20} color={iconMuted} />
                      </TouchableOpacity>
                      {showReligionDropdown && (
                        <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor }]}>
                          {RELIGION_OPTIONS.map((r) => (
                            <TouchableOpacity
                              key={r.id}
                              style={[styles.dropdownItem, { borderBottomColor: borderColor }]}
                              onPress={() => {
                                setReligion(r.id);
                                setShowReligionDropdown(false);
                              }}
                            >
                              <Text style={[styles.dropdownText, { color: textColor }]}>{r.label}</Text>
                              {religion === r.id && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Languages */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: textColor }]}>Languages</Text>

                      {/* Selected Chips */}
                      <View style={styles.chipsContainer}>
                        {languages ? languages.split(',').map((l: string) => l.trim()).filter((l: string) => l).map((lang: string, index: number) => (
                          <TouchableOpacity
                            key={index}
                            style={[styles.chip, { backgroundColor: primaryColor }]}
                            onPress={() => toggleLanguage(lang)}
                          >
                            <Text style={styles.chipText}>{lang} ✕</Text>
                          </TouchableOpacity>
                        )) : null}
                      </View>

                      <TouchableOpacity
                        style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}
                        onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
                      >
                        <IconSymbol name="globe" size={20} color={iconMuted} style={styles.inputIcon} />
                        <Text style={[styles.input, { color: textMuted, paddingVertical: 16 }]}>
                          Select Languages
                        </Text>
                        <IconSymbol name="chevron.down" size={20} color={iconMuted} />
                      </TouchableOpacity>

                      {showLanguageDropdown && (
                        <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor, maxHeight: 200 }]}>
                          <ScrollView nestedScrollEnabled>
                            {isLoadingLanguages ? (
                              <ActivityIndicator size="small" color={primaryColor} style={{ padding: 20 }} />
                            ) : (
                              availableLanguages.map((lang: any) => {
                                const isSelected = languages?.split(',').map((l: string) => l.trim()).includes(lang.name);
                                return (
                                  <TouchableOpacity
                                    key={lang.id}
                                    style={[styles.dropdownItem, { borderBottomColor: borderColor }, isSelected && { backgroundColor: primaryLight + '40' }]}
                                    onPress={() => toggleLanguage(lang.name)}
                                  >
                                    <Text style={[styles.dropdownText, { color: textColor }]}>{lang.name}</Text>
                                    {isSelected && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
                                  </TouchableOpacity>
                                );
                              })
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </>
                )}

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: textColor }]}>Bio</Text>
                  <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}>
                    <TextInput
                      style={[styles.input, styles.textArea, { color: textColor }]}
                      value={bio}
                      onChangeText={setBio}
                      placeholder="Tell us about yourself..."
                      placeholderTextColor={textMuted}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>

                {user?.userType === 'helper' && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: textColor }]}>Experience</Text>
                    <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: cardBg, borderColor, shadowColor: textColor }]}>
                      <TextInput
                        style={[styles.input, styles.textArea, { color: textColor }]}
                        value={experience}
                        onChangeText={setExperience}
                        placeholder="Describe your experience..."
                        placeholderTextColor={textMuted}
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
    width: width,
    maxWidth: width,
  },
  keyboardView: {
    flex: 1,
    width: width,
    maxWidth: width,
  },
  topCircle: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    opacity: 0.6,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    width: width,
    maxWidth: width,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    width: width,
    maxWidth: width,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  changePhotoText: {
    fontSize: 14,
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  formContainer: {
    paddingHorizontal: 24,
    width: width,
    maxWidth: width,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    width: width - 48, // screen width - padding*2
    maxWidth: width - 48,
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
    height: '100%',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  disabledInputWrapper: {
    shadowOpacity: 0,
  },
  disabledInput: {
    // Color applied inline
  },
  lockIcon: {
    marginLeft: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownText: {
    fontSize: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
