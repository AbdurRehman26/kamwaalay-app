import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import { toast } from '@/utils/toast';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
  View
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
  const { user, updateUser, uploadProfilePhoto, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

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
  const [languages, setLanguages] = useState<number[]>(
    user?.userType === 'helper'
      ? Array.isArray((user?.profileData as any)?.languages)
        ? (user?.profileData as any)?.languages.map((l: any) => {
          const id = typeof l === 'string' ? parseInt(l) : l;
          return typeof id === 'number' && !isNaN(id) ? id : null;
        }).filter((l: any) => l !== null)
        : []
      : []
  );

  // Language fetching/handling
  const [availableLanguages, setAvailableLanguages] = useState<any[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showReligionDropdown, setShowReligionDropdown] = useState(false);

  React.useEffect(() => {
    refreshProfile();
    if (user?.userType === 'helper') {
      fetchLanguages();
    }
  }, []);

  // Sync internal state when user object changes (e.g., after refreshProfile)
  React.useEffect(() => {
    if (user) {
      if (user.userType === 'helper') {
        const pd = user.profileData as any;
        setName(pd?.name || user.name || '');
        setBio(pd?.bio || (user as any).bio || '');
        setExperience(pd?.experience || (user as any).experience || '');
        setAge(pd?.age?.toString() || (user as any).age?.toString() || '');

        const rawGender = pd?.gender || (user as any).gender;
        if (rawGender && typeof rawGender === 'object') {
          setGender(rawGender.id || rawGender.value || rawGender.name || '');
        } else {
          setGender(rawGender || '');
        }

        const rawReligion = pd?.religion || (user as any).religion;
        if (rawReligion && typeof rawReligion === 'object') {
          setReligion(rawReligion.id || rawReligion.value || rawReligion.key || '');
        } else {
          setReligion(rawReligion || '');
        }

        const rawLangs = pd?.languages || (user as any).languages;
        if (Array.isArray(rawLangs)) {
          const parsedLangs = rawLangs.map((l: any) => {
            if (l && typeof l === 'object') {
              return l.id || l.value;
            }
            const id = typeof l === 'string' ? parseInt(l) : l;
            return typeof id === 'number' && !isNaN(id) ? id : null;
          }).filter((l: any) => l !== null);
          setLanguages(parsedLangs);
        }
      } else if (user.userType === 'business') {
        const pd = user.profileData as any;
        setOwnerName(pd?.ownerName || (user as any).ownerName || user.name || '');
        setBusinessName(pd?.businessName || (user as any).businessName || '');
        setBio(pd?.bio || (user as any).bio || '');
        setName(user.name || '');
      } else {
        setName(user.name || '');
      }
    }
  }, [user]);

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

  const toggleLanguage = (languageId: number) => {
    const currentLanguages = languages || [];

    let updatedLanguages: number[];
    if (currentLanguages.includes(languageId)) {
      updatedLanguages = currentLanguages.filter((id) => id !== languageId);
    } else {
      updatedLanguages = [...currentLanguages, languageId];
    }

    setLanguages(updatedLanguages);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSelectedImageUri(uri);

        // Immediate upload
        setIsUploadingPhoto(true);
        try {
          await uploadProfilePhoto(uri);
          toast.success('Profile photo updated successfully');
        } catch (error: any) {
          toast.error(error.message || 'Failed to upload photo');
          setSelectedImageUri(null); // Reset preview on failure
        } finally {
          setIsUploadingPhoto(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      toast.error('Failed to pick image');
    }
  };

  const handleSave = async () => {
    const finalName = user?.userType === 'business' ? ownerName : name;
    if (!finalName.trim()) {
      toast.error(`${user?.userType === 'business' ? 'Owner name' : 'Name'} is required`);
      return;
    }

    if (user?.userType === 'business' && !businessName.trim()) {
      toast.error('Business name is required');
      return;
    }

    setIsLoading(true);
    try {
      // 2. Update profile data (Photo is now uploaded immediately in pickImage)
      // Sending flat payload as per requirement
      const profileUpdateData: any = {
        name: finalName.trim(),
      };

      if (user?.userType === 'helper') {
        profileUpdateData.bio = bio.trim() || undefined;
        profileUpdateData.experience = experience.trim() || undefined;
        profileUpdateData.age = age.trim() ? parseInt(age) : undefined;
        profileUpdateData.gender = gender ? gender.toLowerCase() : undefined;
        profileUpdateData.religion = religion || undefined;
        profileUpdateData.languages = languages;
      } else if (user?.userType === 'business') {
        profileUpdateData.businessName = businessName.trim() || undefined;
        profileUpdateData.ownerName = ownerName.trim() || undefined;
        profileUpdateData.bio = bio.trim() || undefined;
      }

      await updateUser(profileUpdateData);
      toast.success('Profile updated successfully');
      router.back();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile. Please try again.');
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
                {isUploadingPhoto ? (
                  <ActivityIndicator size="large" color={primaryColor} />
                ) : selectedImageUri || user?.profileImage ? (
                  <ExpoImage
                    source={{ uri: selectedImageUri || user?.profileImage }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={[styles.avatarText, { color: primaryColor }]}>
                    {(name || user?.name || 'U').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.cameraButton, { backgroundColor: primaryColor, borderColor: cardBg }]}
                onPress={pickImage}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <IconSymbol name="camera.fill" size={20} color="#FFFFFF" />
                )}
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
                        {languages && languages.length > 0 ? languages.map((langId: number, index: number) => {
                          const langName = availableLanguages.find(l => l.id === langId)?.name || langId.toString();
                          return (
                            <TouchableOpacity
                              key={index}
                              style={[styles.chip, { backgroundColor: primaryColor }]}
                              onPress={() => toggleLanguage(langId)}
                            >
                              <Text style={styles.chipText}>{langName} ✕</Text>
                            </TouchableOpacity>
                          );
                        }) : null}
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
                                const langId = typeof lang.id === 'string' ? parseInt(lang.id) : lang.id;
                                const isSelected = languages?.includes(langId);
                                return (
                                  <TouchableOpacity
                                    key={lang.id}
                                    style={[styles.dropdownItem, { borderBottomColor: borderColor }, isSelected && { backgroundColor: primaryLight + '40' }]}
                                    onPress={() => toggleLanguage(langId)}
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
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
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
