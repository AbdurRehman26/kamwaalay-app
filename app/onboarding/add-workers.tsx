import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
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

import { useThemeColor } from '@/hooks/use-theme-color';

const { width } = Dimensions.get('window');

interface Worker {
    id: string;
    name: string;
    phoneNumber: string;
    cnic: string;
    serviceType: string;
    age: string;
    gender: string;
    religion: string;
    languages: string[];
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

export default function AddWorkersOnboardingScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [cnic, setCnic] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [religion, setReligion] = useState('');
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

    // Dropdown states
    const [showGenderDropdown, setShowGenderDropdown] = useState(false);
    const [showReligionDropdown, setShowReligionDropdown] = useState(false);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

    // Data states
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
    const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);

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
        if (selectedLanguages.includes(languageName)) {
            setSelectedLanguages(selectedLanguages.filter(l => l !== languageName));
        } else {
            setSelectedLanguages([...selectedLanguages, languageName]);
        }
    };

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const primaryColor = useThemeColor({}, 'primary');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const cardBg = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const errorColor = useThemeColor({}, 'error');
    const iconColor = useThemeColor({}, 'icon');

    const handleAddWorker = () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Worker name is required');
            return;
        }

        if (!phoneNumber.trim()) {
            Alert.alert('Required', 'Phone number is required');
            return;
        }

        if (!cnic.trim()) {
            Alert.alert('Required', 'CNIC number is required');
            return;
        }

        const newWorker: Worker = {
            id: Date.now().toString(),
            name: name.trim(),
            phoneNumber: phoneNumber.trim(),
            cnic: cnic.trim(),
            serviceType: serviceType.trim(),
            age: age.trim(),
            gender: gender,
            religion: religion,
            languages: selectedLanguages
        };

        setWorkers([...workers, newWorker]);

        // Clear form
        setName('');
        setPhoneNumber('');
        setCnic('');
        setServiceType('');
        setAge('');
        setGender('');
        setReligion('');
        setSelectedLanguages([]);

        Alert.alert('Success', 'Worker added successfully');
    };

    const handleRemoveWorker = (id: string) => {
        setWorkers(workers.filter(w => w.id !== id));
    };

    const handleComplete = async () => {
        // TODO: Submit workers to API
        router.replace('/(tabs)');
    };

    const handleSkip = () => {
        router.replace('/(tabs)');
    };

    return (
        <View style={[styles.container, { backgroundColor }]}>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Decorative Background Elements */}
                    <View style={[styles.topCircle, { backgroundColor: primaryLight, opacity: 0.3 }]} />
                    <View style={[styles.bottomCircle, { backgroundColor: primaryLight, opacity: 0.2 }]} />

                    <View style={[styles.headerSection, { marginTop: insets.top + 20 }]}>
                        <Text style={[styles.title, { color: textColor }]}>Add Your Workers</Text>
                        <Text style={[styles.subtitle, { color: textSecondary }]}>
                            Add workers to your agency roster (you can add more later)
                        </Text>
                    </View>

                    {/* Added Workers List */}
                    {workers.length > 0 && (
                        <View style={styles.workersList}>
                            <Text style={[styles.sectionTitle, { color: textColor }]}>
                                Added Workers ({workers.length})
                            </Text>
                            {workers.map((worker) => (
                                <View key={worker.id} style={[styles.workerCard, { backgroundColor: cardBg, borderColor }]}>
                                    <View style={styles.workerInfo}>
                                        <View style={[styles.workerIconContainer, { backgroundColor: primaryLight }]}>
                                            <IconSymbol name="person.fill" size={24} color={primaryColor} />
                                        </View>
                                        <View style={styles.workerDetails}>
                                            <Text style={[styles.workerName, { color: textColor }]}>{worker.name}</Text>
                                            <Text style={[styles.workerPhone, { color: textSecondary }]}>{worker.phoneNumber}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleRemoveWorker(worker.id)}
                                        style={styles.removeButton}
                                    >
                                        <IconSymbol name="trash.fill" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Add Worker Form */}
                    <View style={styles.form}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>
                            {workers.length > 0 ? 'Add Another Worker' : 'Add First Worker'}
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Full Name</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                                <IconSymbol name="person.fill" size={20} color={textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="Enter worker's full name"
                                    placeholderTextColor={textSecondary}
                                    value={name}
                                    onChangeText={setName}
                                    autoComplete="name"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Phone Number</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                                <IconSymbol name="phone.fill" size={20} color={textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="03XXXXXXXXX"
                                    placeholderTextColor={textSecondary}
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                    autoComplete="tel"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>CNIC Number</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                                <IconSymbol name="creditcard.fill" size={20} color={textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="XXXXX-XXXXXXX-X"
                                    placeholderTextColor={textSecondary}
                                    value={cnic}
                                    onChangeText={setCnic}
                                    keyboardType="number-pad"
                                    maxLength={15}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Age</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                                <IconSymbol name="calendar" size={20} color={textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="e.g., 25"
                                    placeholderTextColor={textSecondary}
                                    value={age}
                                    onChangeText={setAge}
                                    keyboardType="number-pad"
                                    maxLength={3}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Gender</Text>
                            <TouchableOpacity
                                style={[styles.dropdownSelector, { backgroundColor: cardBg, borderColor }]}
                                onPress={() => {
                                    setShowGenderDropdown(!showGenderDropdown);
                                    setShowReligionDropdown(false);
                                    setShowLanguageDropdown(false);
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconSymbol name="person.2.fill" size={20} color={textSecondary} style={styles.inputIcon} />
                                    <Text style={[styles.input, { color: gender ? textColor : textSecondary, paddingVertical: 14 }]}>
                                        {gender || "Select Gender"}
                                    </Text>
                                </View>
                                <IconSymbol name="chevron.down" size={20} color={textSecondary} style={{ marginRight: 16 }} />
                            </TouchableOpacity>
                            {showGenderDropdown && (
                                <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor }]}>
                                    {['Male', 'Female'].map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={[styles.dropdownItem, gender === option && { backgroundColor: primaryLight }]}
                                            onPress={() => {
                                                setGender(option);
                                                setShowGenderDropdown(false);
                                            }}
                                        >
                                            <Text style={[styles.dropdownItemText, { color: textColor }]}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Religion</Text>
                            <TouchableOpacity
                                style={[styles.dropdownSelector, { backgroundColor: cardBg, borderColor }]}
                                onPress={() => {
                                    setShowReligionDropdown(!showReligionDropdown);
                                    setShowGenderDropdown(false);
                                    setShowLanguageDropdown(false);
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconSymbol name="star.fill" size={20} color={textSecondary} style={styles.inputIcon} />
                                    <Text style={[styles.input, { color: religion ? textColor : textSecondary, paddingVertical: 14 }]}>
                                        {RELIGION_OPTIONS.find(r => r.id === religion)?.label || "Select Religion"}
                                    </Text>
                                </View>
                                <IconSymbol name="chevron.down" size={20} color={textSecondary} style={{ marginRight: 16 }} />
                            </TouchableOpacity>
                            {showReligionDropdown && (
                                <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor }]}>
                                    {RELIGION_OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option.id}
                                            style={[styles.dropdownItem, religion === option.id && { backgroundColor: primaryLight }]}
                                            onPress={() => {
                                                setReligion(option.id);
                                                setShowReligionDropdown(false);
                                            }}
                                        >
                                            <Text style={[styles.dropdownItemText, { color: textColor }]}>{option.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Languages</Text>

                            {/* Selected Languages Chips */}
                            {selectedLanguages.length > 0 && (
                                <View style={styles.selectedLanguagesContainer}>
                                    {selectedLanguages.map((lang, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.languageChip, { backgroundColor: primaryColor }]}
                                            onPress={() => toggleLanguage(lang)}
                                        >
                                            <Text style={styles.languageChipText}>{lang} ✕</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.dropdownSelector, { backgroundColor: cardBg, borderColor }]}
                                onPress={() => {
                                    setShowLanguageDropdown(!showLanguageDropdown);
                                    setShowGenderDropdown(false);
                                    setShowReligionDropdown(false);
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconSymbol name="globe" size={20} color={textSecondary} style={styles.inputIcon} />
                                    <Text style={[styles.input, { color: textSecondary, paddingVertical: 14 }]}>
                                        Select Languages
                                    </Text>
                                </View>
                                <IconSymbol name="chevron.down" size={20} color={textSecondary} style={{ marginRight: 16 }} />
                            </TouchableOpacity>

                            {showLanguageDropdown && (
                                <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor, maxHeight: 200 }]}>
                                    {isLoadingLanguages ? (
                                        <View style={{ padding: 20, alignItems: 'center' }}>
                                            <ActivityIndicator size="small" color={primaryColor} />
                                        </View>
                                    ) : (
                                        <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                                            {availableLanguages.map((lang) => {
                                                const isSelected = selectedLanguages.includes(lang.name);
                                                return (
                                                    <TouchableOpacity
                                                        key={lang.id}
                                                        style={[
                                                            styles.dropdownItem,
                                                            isSelected && { backgroundColor: primaryLight }
                                                        ]}
                                                        onPress={() => toggleLanguage(lang.name)}
                                                    >
                                                        <Text style={[styles.dropdownItemText, { color: textColor }]}>{lang.name}</Text>
                                                        {isSelected && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    )}
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Service Type (Optional)</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                                <IconSymbol name="briefcase.fill" size={20} color={textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="e.g., Cleaning, Cooking"
                                    placeholderTextColor={textSecondary}
                                    value={serviceType}
                                    onChangeText={setServiceType}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: primaryColor }]}
                            onPress={handleAddWorker}
                        >
                            <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                            <Text style={styles.addButtonText}>Add Worker</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        {workers.length > 0 && (
                            <TouchableOpacity
                                style={[styles.completeButton, { backgroundColor: primaryColor, shadowColor: primaryColor }]}
                                onPress={handleComplete}
                            >
                                <Text style={styles.completeButtonText}>
                                    Complete Setup ({workers.length} worker{workers.length > 1 ? 's' : ''})
                                </Text>
                                <IconSymbol name="arrow.right" size={20} color="#FFF" />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={handleSkip}
                        >
                            <Text style={[styles.skipButtonText, { color: textSecondary }]}>
                                {workers.length > 0 ? 'Done for now' : 'Skip for now'}
                            </Text>
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
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
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
    workersList: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    workerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    workerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    workerIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    workerDetails: {
        flex: 1,
    },
    workerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    workerPhone: {
        fontSize: 14,
        color: '#666',
    },
    removeButton: {
        padding: 8,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
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
        height: '100%',
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        padding: 16,
        borderRadius: 16,
        marginTop: 8,
        gap: 8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    actions: {
        paddingBottom: 40,
    },
    completeButton: {
        backgroundColor: '#6366F1',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        gap: 8,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    completeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    skipButton: {
        padding: 16,
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
    dropdownSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 8,
    },
    dropdownList: {
        borderWidth: 1,
        borderRadius: 12,
        marginTop: 4,
        overflow: 'hidden',
        zIndex: 1000,
    },
    dropdownItem: {
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E7EB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownItemText: {
        fontSize: 16,
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
});
