import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface CompleteProfileData {
  experience: string;
  bio: string;
  age: string;
  gender: string;
  religion: string;
  languages: string;
}

interface Step3CompleteProfileProps {
  data: CompleteProfileData;
  onChange: (data: CompleteProfileData) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const RELIGION_OPTIONS = [
  { id: 'sunni_nazar_niyaz', label: 'Sunni (Nazar/Niyaz)' },
  { id: 'sunni_no_nazar_niyaz', label: 'Sunni (No Nazar/Niyaz)' },
  { id: 'shia', label: 'Shia' },
  { id: 'christian', label: 'Christian' },
];

interface Language {
  id: string | number;
  name: string;
}

export default function Step3CompleteProfile({
  data,
  onChange,
  onBack,
  onSubmit,
}: Step3CompleteProfileProps) {
  // Theme colors
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  const [availableLanguages, setAvailableLanguages] = React.useState<Language[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = React.useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = React.useState(false);

  React.useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      setIsLoadingLanguages(true);
      const response = await apiService.get(API_ENDPOINTS.LANGUAGES.LIST, undefined, undefined, false);

      if (response.success && response.data) {
        let langs: Language[] = [];
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
    const currentLanguages = data.languages ? data.languages.split(',').map(l => l.trim()).filter(l => l) : [];

    let updatedLanguages: string[];
    if (currentLanguages.includes(languageName)) {
      updatedLanguages = currentLanguages.filter(l => l !== languageName);
    } else {
      updatedLanguages = [...currentLanguages, languageName];
    }

    onChange({ ...data, languages: updatedLanguages.join(', ') });
  };

  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Your Profile
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
            Optional: Add more details about yourself
          </ThemedText>
        </View>

        <View style={styles.form}>
          {/* Years of Experience */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>Years of Experience</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
              placeholder="e.g., 5"
              placeholderTextColor={textMuted}
              value={data.experience}
              onChangeText={(value) => onChange({ ...data, experience: value })}
              keyboardType="numeric"
            />
          </View>

          {/* Age and Gender Row */}
          <View style={styles.row}>
            {/* Age */}
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <ThemedText style={[styles.label, { color: textColor }]}>Age</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
                placeholder="e.g., 25"
                placeholderTextColor={textMuted}
                value={data.age}
                onChangeText={(value) => onChange({ ...data, age: value })}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            {/* Gender */}
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <ThemedText style={[styles.label, { color: textColor }]}>Gender</ThemedText>
              <View style={styles.genderContainer}>
                {['Male', 'Female'].map((genderOption) => (
                  <TouchableOpacity
                    key={genderOption}
                    style={[
                      styles.genderButton,
                      { backgroundColor: cardBg, borderColor },
                      data.gender === genderOption && { backgroundColor: primaryColor, borderColor: primaryColor }
                    ]}
                    onPress={() => onChange({ ...data, gender: genderOption })}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        { color: textSecondary },
                        data.gender === genderOption && { color: '#FFFFFF' }
                      ]}
                    >
                      {genderOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>


          {/* Religion */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>Religion</ThemedText>
            <View style={styles.religionContainer}>
              {RELIGION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.religionButton,
                    { backgroundColor: cardBg, borderColor },
                    data.religion === option.id && { backgroundColor: primaryColor, borderColor: primaryColor }
                  ]}
                  onPress={() => onChange({ ...data, religion: option.id })}
                >
                  <Text
                    style={[
                      styles.religionText,
                      { color: textSecondary },
                      data.religion === option.id && { color: '#FFFFFF' }
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Languages */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>Languages</ThemedText>
            <ThemedText style={[styles.helperText, { color: textSecondary }]}>Select languages you can speak</ThemedText>

            {/* Selected Languages Chips */}
            {data.languages ? (
              <View style={styles.selectedLanguagesContainer}>
                {data.languages.split(',').map(l => l.trim()).filter(l => l).map((lang, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.languageChip, { backgroundColor: primaryColor }]}
                    onPress={() => toggleLanguage(lang)}
                  >
                    <Text style={styles.languageChipText}>{lang} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {/* Language Dropdown Selector */}
            <TouchableOpacity
              style={[
                styles.dropdownSelector,
                { backgroundColor: cardBg, borderColor },
              ]}
              onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
            >
              <Text style={[styles.dropdownSelectorText, { color: textColor }]}>
                Select Languages
              </Text>
              <IconSymbol name="chevron.down" size={20} color={textSecondary} />
            </TouchableOpacity>

            {/* Dropdown Content */}
            {showLanguageDropdown && (
              <View style={[styles.languagesList, { borderColor, backgroundColor: cardBg }]}>
                {isLoadingLanguages ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={primaryColor} />
                  </View>
                ) : (
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                    {availableLanguages.map((lang) => {
                      const isSelected = data.languages?.split(',').map(l => l.trim()).includes(lang.name);
                      return (
                        <TouchableOpacity
                          key={lang.id}
                          style={[
                            styles.languageItem,
                            isSelected && { backgroundColor: primaryColor + '20' }
                          ]}
                          onPress={() => toggleLanguage(lang.name)}
                        >
                          <Text style={[styles.languageItemText, { color: textColor }]}>{lang.name}</Text>
                          {isSelected && <Text style={{ color: primaryColor }}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* Bio */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>Bio</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: cardBg, borderColor, color: textColor }]}
              placeholder="Tell us about yourself..."
              placeholderTextColor={textMuted}
              multiline
              numberOfLines={6}
              value={data.bio}
              onChangeText={(value) => onChange({ ...data, bio: value })}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: cardBg }]} onPress={onBack}>
            <Text style={[styles.backButtonText, { color: textSecondary }]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: primaryColor }]} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    marginBottom: 8,
    marginTop: -4,
  },
  religionContainer: {
    gap: 8,
  },
  religionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  religionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedLanguagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  languageChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  languageChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  dropdownSelectorText: {
    fontSize: 16,
  },
  languagesList: {
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 200,
    overflow: 'hidden', // Ensure scrolling works if content overflows
  },
  languageItem: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  languageItemText: {
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 8,
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});


