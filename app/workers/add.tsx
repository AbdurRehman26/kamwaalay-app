import MapView, { Marker, PROVIDER_GOOGLE, Region } from '@/components/MapLib';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useApp } from '@/contexts/AppContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

const { width } = Dimensions.get('window');

interface ServiceType {
    id: string | number;
    slug: string;
    name: string;
    icon?: string;
}

const AVAILABILITY_OPTIONS = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'live_in', label: '24/7 Live-in' },
];

interface Location {
    id: number;
    name: string;
    area?: string;
}

export default function AddWorkerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { serviceTypes } = useApp();

    // Theme colors
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const textMuted = useThemeColor({}, 'textMuted');
    const primaryColor = useThemeColor({}, 'primary');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const cardBg = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');

    // Basic Info
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');

    // Service Types
    const [selectedServices, setSelectedServices] = useState<string[]>([]);



    // Professional Details
    const [experienceYears, setExperienceYears] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [religion, setReligion] = useState('');
    const [languages, setLanguages] = useState<string[]>([]);
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
    const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

    const [availability, setAvailability] = useState('full_time');
    const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false);
    const [skills, setSkills] = useState('');
    const [bio, setBio] = useState('');

    // Location State
    const [locationData, setLocationData] = useState<{
        address: string;
        city: string;
        latitude: number;
        longitude: number;
    } | null>(null);
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [mapRegion, setMapRegion] = useState<Region>({
        latitude: 24.8607,
        longitude: 67.0011, // Karachi default
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [selectedCoordinate, setSelectedCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
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
        if (languages.includes(languageName)) {
            setLanguages(languages.filter(l => l !== languageName));
        } else {
            setLanguages([...languages, languageName]);
        }
    };

    const toggleService = (serviceId: string) => {
        if (selectedServices.includes(serviceId)) {
            setSelectedServices(selectedServices.filter(s => s !== serviceId));
        } else {
            setSelectedServices([...selectedServices, serviceId]);
        }
    }


    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Allow location access to pin worker location');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const region = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
            setMapRegion(region);
            setSelectedCoordinate({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
        } catch (error) {
            console.log('Error getting location', error);
        }
    };

    const openMap = () => {
        setIsMapVisible(true);
        if (!locationData) {
            getCurrentLocation();
        } else {
            setMapRegion({
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
            setSelectedCoordinate({
                latitude: locationData.latitude,
                longitude: locationData.longitude
            });
        }
    };

    const handleMapConfirm = async () => {
        if (!selectedCoordinate) return;

        setIsGeocoding(true);
        try {
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: selectedCoordinate.latitude,
                longitude: selectedCoordinate.longitude
            });

            let addressString = '';
            let cityString = 'Karachi'; // Default

            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                addressString = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}, ${addr.region || ''}`.replace(/\s+/g, ' ').trim();
                if (addr.city) cityString = addr.city;
            } else {
                addressString = `${selectedCoordinate.latitude.toFixed(6)}, ${selectedCoordinate.longitude.toFixed(6)}`;
            }

            setLocationData({
                address: addressString,
                city: cityString,
                latitude: selectedCoordinate.latitude,
                longitude: selectedCoordinate.longitude
            });

            setIsMapVisible(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to get address details');
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleSubmit = async () => {
        if (!fullName.trim()) {
            Alert.alert('Required', 'Full name is required');
            return;
        }

        if (!phone.trim()) {
            Alert.alert('Required', 'Phone number is required');
            return;
        }

        if (!locationData) {
            Alert.alert('Required', 'Please pin the location on the map');
            return;
        }

        if (selectedServices.length === 0) {
            Alert.alert('Required', 'Please select at least one service type');
            return;
        }

        if (!experienceYears.trim()) {
            Alert.alert('Required', 'Experience is required');
            return;
        }

        if (!age.trim()) {
            Alert.alert('Required', 'Age is required');
            return;
        }

        if (!gender) {
            Alert.alert('Required', 'Gender is required');
            return;
        }

        if (!religion) {
            Alert.alert('Required', 'Religion is required');
            return;
        }

        if (languages.length === 0) {
            Alert.alert('Required', 'Please select at least one language');
            return;
        }

        setIsSubmitting(true);

        try {
            const workerData = {
                full_name: fullName.trim(),
                phone: phone.trim(),
                service_types: selectedServices,
                experience_years: parseInt(experienceYears),
                age: parseInt(age),
                gender,
                religion,
                languages,
                availability,
                skills: skills.trim() || null,
                bio: bio.trim() || null,
                address: locationData.address,
                city: locationData.city,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
            };

            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('Worker Data:', workerData);

            Alert.alert('Success', 'Worker added successfully', [
                {
                    text: 'Add Another',
                    onPress: () => {
                        setFullName('');
                        setPhone('');
                        setSelectedServices([]);
                        setExperienceYears('');
                        setAge('');
                        setGender('');
                        setReligion('');
                        setLanguages([]);
                        setAvailability('full_time');

                        setSkills('');
                        setBio('');
                        setLocationData(null);
                    },
                },
                {
                    text: 'Done',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to add worker. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {/* Header Background */}
            <View style={styles.headerBackground}>
                <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add New Worker</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >


                <ScrollView
                    style={[styles.scrollView, { backgroundColor, marginTop: 16 }]}
                    showsHorizontalScrollIndicator={false}
                    horizontal={false}
                    bounces={false}
                    alwaysBounceHorizontal={false}
                    alwaysBounceVertical={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 40, width: width, maxWidth: width }}
                >

                    <View style={styles.formContainer}>
                        {/* Basic Information */}
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Basic Information</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Full Name <Text style={styles.required}>*</Text></Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                                <IconSymbol name="person" size={20} color={textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="Enter full name"
                                    placeholderTextColor={textMuted}
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Phone Number <Text style={styles.required}>*</Text></Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                                <IconSymbol name="phone" size={20} color={textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="03XXXXXXXXX"
                                    placeholderTextColor={textMuted}
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                />
                            </View>
                        </View>



                        <View style={[styles.divider, { backgroundColor: borderColor }]} />

                        {/* Location */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Location <Text style={styles.required}>*</Text></Text>
                            <Text style={[styles.sectionDescription, { color: textSecondary, marginBottom: 12 }]}>
                                Pin the worker's location on the map
                            </Text>

                            {locationData && (
                                <View style={[styles.locationPreview, { backgroundColor: cardBg, borderColor }]}>
                                    <IconSymbol name="mappin.and.ellipse" size={20} color={primaryColor} />
                                    <Text style={[styles.locationText, { color: textColor }]}>
                                        {locationData.address}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setLocationData(null)}
                                        style={styles.clearLocationButton}
                                    >
                                        <IconSymbol name="xmark.circle.fill" size={20} color={textMuted} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.mapButton, { backgroundColor: primaryLight, borderColor: primaryColor }]}
                                onPress={openMap}
                            >
                                <IconSymbol name="map.fill" size={20} color={primaryColor} />
                                <Text style={[styles.mapButtonText, { color: primaryColor }]}>
                                    {locationData ? 'Change Location' : 'Pin Location on Map'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.divider, { backgroundColor: borderColor }]} />

                        {/* Service Types */}
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Services</Text>
                        <Text style={[styles.sectionDescription, { color: textSecondary }]}>
                            Select the services this worker can provide.
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Service Types <Text style={styles.required}>*</Text></Text>
                            <View style={styles.serviceGrid}>
                                {serviceTypes.map((service: any) => {
                                    const serviceId = service.slug?.toString() || service.id?.toString();
                                    return (
                                        <TouchableOpacity
                                            key={serviceId}
                                            style={[
                                                styles.serviceCard,
                                                { backgroundColor: cardBg, borderColor },
                                                selectedServices.includes(serviceId) && { borderColor: primaryColor, backgroundColor: primaryLight },
                                            ]}
                                            onPress={() => toggleService(serviceId)}
                                        >
                                            <Text style={styles.serviceEmoji}>{service.icon || '🛠️'}</Text>
                                            <Text style={[
                                                styles.serviceLabel,
                                                { color: textSecondary },
                                                selectedServices.includes(serviceId) && { color: primaryColor }
                                            ]}>{service.name}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: borderColor }]} />

                        {/* Professional Details */}
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Professional Details</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Experience (Yrs) <Text style={styles.required}>*</Text></Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="e.g. 5"
                                    placeholderTextColor={textMuted}
                                    value={experienceYears}
                                    onChangeText={setExperienceYears}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Age and Gender Row */}
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={[styles.label, { color: textColor }]}>Age <Text style={styles.required}>*</Text></Text>
                                <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                                    <TextInput
                                        style={[styles.input, { color: textColor }]}
                                        placeholder="e.g. 25"
                                        placeholderTextColor={textMuted}
                                        value={age}
                                        onChangeText={setAge}
                                        keyboardType="numeric"
                                        maxLength={3}
                                    />
                                </View>
                            </View>

                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={[styles.label, { color: textColor }]}>Gender <Text style={styles.required}>*</Text></Text>
                                <View style={styles.genderContainer}>
                                    {['Male', 'Female'].map((genderOption) => (
                                        <TouchableOpacity
                                            key={genderOption}
                                            style={[
                                                styles.genderButton,
                                                { backgroundColor: cardBg, borderColor },
                                                gender === genderOption.toLowerCase() && { backgroundColor: primaryColor, borderColor: primaryColor }
                                            ]}
                                            onPress={() => setGender(genderOption.toLowerCase())}
                                        >
                                            <Text
                                                style={[
                                                    styles.genderText,
                                                    { color: textSecondary },
                                                    gender === genderOption.toLowerCase() && { color: '#FFFFFF' }
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
                            <Text style={[styles.label, { color: textColor }]}>Religion <Text style={styles.required}>*</Text></Text>
                            <View style={styles.religionContainer}>
                                {RELIGION_OPTIONS.map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        style={[
                                            styles.religionButton,
                                            { backgroundColor: cardBg, borderColor },
                                            religion === option.id && { backgroundColor: primaryColor, borderColor: primaryColor }
                                        ]}
                                        onPress={() => setReligion(option.id)}
                                    >
                                        <Text
                                            style={[
                                                styles.religionText,
                                                { color: textSecondary },
                                                religion === option.id && { color: '#FFFFFF' }
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
                            <Text style={[styles.label, { color: textColor }]}>Languages <Text style={styles.required}>*</Text></Text>

                            {/* Selected Languages Chips */}
                            {languages.length > 0 && (
                                <View style={styles.tagContainer}>
                                    {languages.map((lang, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.tag, { backgroundColor: primaryLight, borderColor: primaryColor }]}
                                            onPress={() => toggleLanguage(lang)}
                                        >
                                            <Text style={[styles.tagText, { color: primaryColor }]}>{lang}</Text>
                                            <IconSymbol name="xmark.circle.fill" size={16} color={primaryColor} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Language Dropdown Selector */}
                            <TouchableOpacity
                                style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor, justifyContent: 'space-between' }]}
                                onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
                            >
                                <Text style={[styles.inputText, { color: languages.length > 0 ? textColor : textMuted }]}>
                                    {languages.length > 0 ? `${languages.length} selected` : 'Select languages'}
                                </Text>
                                <IconSymbol name="chevron.down" size={20} color={textMuted} />
                            </TouchableOpacity>

                            {/* Dropdown Content */}
                            {showLanguageDropdown && (
                                <View style={[styles.locationDropdown, { backgroundColor: cardBg, borderColor }]}>
                                    {isLoadingLanguages ? (
                                        <View style={{ padding: 20, alignItems: 'center' }}>
                                            <ActivityIndicator size="small" color={primaryColor} />
                                        </View>
                                    ) : (
                                        <ScrollView style={styles.locationDropdownScroll} nestedScrollEnabled>
                                            {availableLanguages.map((lang) => {
                                                const isSelected = languages.includes(lang.name);
                                                return (
                                                    <TouchableOpacity
                                                        key={lang.id}
                                                        style={[
                                                            styles.locationDropdownItem,
                                                            { borderBottomColor: borderColor },
                                                            isSelected && { backgroundColor: primaryLight }
                                                        ]}
                                                        onPress={() => toggleLanguage(lang.name)}
                                                    >
                                                        <Text style={[styles.locationDropdownText, { color: textColor }]}>{lang.name}</Text>
                                                        {isSelected && <IconSymbol name="checkmark" size={16} color={primaryColor} />}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    )}
                                </View>
                            )}
                        </View>

                        <View style={[styles.inputGroup, { zIndex: 10 }]}>
                            <Text style={[styles.label, { color: textColor }]}>Availability <Text style={styles.required}>*</Text></Text>
                            <TouchableOpacity
                                style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}
                                onPress={() => setShowAvailabilityPicker(!showAvailabilityPicker)}
                            >
                                <IconSymbol name="clock.fill" size={20} color={textMuted} style={styles.inputIcon} />
                                <Text style={[styles.inputText, { color: textColor }]}>
                                    {AVAILABILITY_OPTIONS.find(o => o.value === availability)?.label}
                                </Text>
                                <IconSymbol name="chevron.down" size={20} color={textMuted} />
                            </TouchableOpacity>
                            {showAvailabilityPicker && (
                                <View style={[styles.dropdownMenu, { backgroundColor: cardBg, borderColor }]}>
                                    {AVAILABILITY_OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[styles.dropdownItem, { borderBottomColor: borderColor }]}
                                            onPress={() => {
                                                setAvailability(option.value);
                                                setShowAvailabilityPicker(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                { color: textColor },
                                                availability === option.value && { color: primaryColor, fontWeight: '600' }
                                            ]}>{option.label}</Text>
                                            {availability === option.value && (
                                                <IconSymbol name="checkmark.circle.fill" size={16} color={primaryColor} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Skills</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
                                <IconSymbol name="star.fill" size={20} color={textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="e.g. Cooking, Cleaning"
                                    placeholderTextColor={textMuted}
                                    value={skills}
                                    onChangeText={setSkills}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Bio / Description</Text>
                            <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: cardBg, borderColor }]}>
                                <TextInput
                                    style={[styles.input, styles.textArea, { color: textColor }]}
                                    placeholder="Describe the worker's experience and qualifications..."
                                    placeholderTextColor={textMuted}
                                    value={bio}
                                    onChangeText={setBio}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: primaryColor }, isSubmitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Add Worker</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                visible={isMapVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsMapVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Pin Location</Text>
                        <TouchableOpacity onPress={() => setIsMapVisible(false)} style={styles.closeButton}>
                            <IconSymbol name="xmark.circle.fill" size={30} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        region={mapRegion}
                        onRegionChangeComplete={setMapRegion}
                        onPress={(e) => setSelectedCoordinate(e.nativeEvent.coordinate)}
                        showsUserLocation
                        showsMyLocationButton
                    >
                        {selectedCoordinate && (
                            <Marker coordinate={selectedCoordinate} />
                        )}
                    </MapView>

                    <View style={styles.mapFooter}>
                        <Text style={styles.mapHelpText}>Tap on the map to place a pin</Text>
                        <TouchableOpacity
                            style={[
                                styles.confirmLocationButton,
                                { backgroundColor: primaryColor },
                                (!selectedCoordinate || isGeocoding) && { opacity: 0.7 }
                            ]}
                            onPress={handleMapConfirm}
                            disabled={!selectedCoordinate || isGeocoding}
                        >
                            {isGeocoding ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.confirmLocationText}>Confirm Location</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View >
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
    headerBackground: {
        backgroundColor: '#6366F1',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },

    scrollView: {
        flex: 1,
        width: width,
        maxWidth: width,
    },
    formContainer: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        marginBottom: 20,
    },
    divider: {
        height: 1,
        marginVertical: 24,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    inputText: {
        flex: 1,
        fontSize: 16,
    },
    textAreaWrapper: {
        height: 'auto',
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },

    serviceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    serviceCard: {
        width: '30%',
        aspectRatio: 1,
        borderRadius: 16,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    serviceEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    serviceLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 13,
        fontWeight: '600',
    },
    locationDropdown: {
        maxHeight: 200,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        overflow: 'hidden',
    },
    locationDropdownScroll: {
        maxHeight: 200,
    },
    locationDropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        gap: 12,
    },
    locationDropdownText: {
        fontSize: 15,
        fontWeight: '500',
    },
    dropdownMenu: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        zIndex: 1000,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    dropdownItemText: {
        fontSize: 15,
    },
    submitButton: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
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
        paddingVertical: 14, // Matched input height mostly
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 16,
    },
    genderText: {
        fontSize: 14,
        fontWeight: '600',
    },
    religionContainer: {
        gap: 8,
    },
    religionButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 12,
    },
    religionText: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
    },

    // Map Styles
    locationPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        gap: 12,
    },
    locationText: {
        flex: 1,
        fontSize: 14,
    },
    clearLocationButton: {
        padding: 4,
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        gap: 8,
    },
    mapButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#fff',
        zIndex: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    map: {
        flex: 1,
    },
    mapFooter: {
        padding: 24,
        paddingBottom: 40,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
        alignItems: 'center',
    },
    mapHelpText: {
        marginBottom: 16,
        color: '#666',
    },
    confirmLocationButton: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmLocationText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },


});
