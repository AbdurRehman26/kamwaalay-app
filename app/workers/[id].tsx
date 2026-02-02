import MapView, { Marker, PROVIDER_GOOGLE, Region } from '@/components/MapLib';
import { ScreenHeader } from '@/components/ScreenHeader';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { mapDarkStyle } from '@/constants/MapStyle';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import { toast } from '@/utils/toast';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

interface LocationType {
    id: number;
    name: string;
    area?: string;
}

export default function EditWorkerScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const { serviceTypes } = useApp();
    const { colorScheme } = useTheme();

    // Theme colors
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const textMuted = useThemeColor({}, 'textMuted');
    const primaryColor = useThemeColor({}, 'primary');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const cardBg = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');

    // Loading state
    const [isLoadingWorker, setIsLoadingWorker] = useState(true);

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

    // Location Search State
    const [locationSearchQuery, setLocationSearchQuery] = useState('');
    const [locationSearchResults, setLocationSearchResults] = useState<any[]>([]);
    const [isSearchingLocations, setIsSearchingLocations] = useState(false);

    // Fetch worker data on mount
    useEffect(() => {
        if (id) {
            fetchWorkerData();
            fetchLanguages();
        }
    }, [id]);

    const fetchWorkerData = async () => {
        try {
            setIsLoadingWorker(true);
            const endpoint = API_ENDPOINTS.WORKERS.EDIT.replace(':id', id as string);
            const response = await apiService.get(endpoint);

            if (response.success && response.data) {
                // Try multiple possible response structures
                let worker = response.data;
                if (response.data.helper) {
                    worker = response.data.helper;
                } else if (response.data.worker) {
                    worker = response.data.worker;
                }

                // Pre-fill form with worker data
                setFullName(worker.name || worker.full_name || worker.user?.name || '');

                // Handle phone - remove +92 prefix if present
                let phoneNumber = worker.phone || worker.user?.phone || '';
                if (phoneNumber.startsWith('+92')) {
                    phoneNumber = phoneNumber.substring(3);
                }
                setPhone(phoneNumber);

                // Set experience and age
                setExperienceYears(worker.experience_years?.toString() || '');
                setAge(worker.age?.toString() || '');
                setGender(worker.gender || '');

                // Handle religion - could be object with value or direct string
                const religionValue = typeof worker.religion === 'object'
                    ? worker.religion?.value || worker.religion?.id
                    : worker.religion;
                setReligion(religionValue || '');

                // Handle availability - could be object with value or direct string
                const availabilityValue = typeof worker.availability === 'object'
                    ? worker.availability?.value || worker.availability?.id
                    : worker.availability;
                setAvailability(availabilityValue || 'full_time');

                setBio(worker.bio || worker.description || '');

                // Set services - try multiple structures
                let serviceSlugs: string[] = [];
                if (worker.service_listings?.[0]?.service_types) {
                    serviceSlugs = worker.service_listings[0].service_types.map((s: any) => s.slug);
                } else if (worker.service_types && Array.isArray(worker.service_types)) {
                    serviceSlugs = worker.service_types.map((s: any) => s.slug || s.id?.toString());
                } else if (worker.services && Array.isArray(worker.services)) {
                    serviceSlugs = worker.services.map((s: any) => s.slug || s.id?.toString());
                }
                if (serviceSlugs.length > 0) {
                    setSelectedServices(serviceSlugs);
                }

                // Set languages
                if (worker.languages && Array.isArray(worker.languages)) {
                    const langNames = worker.languages.map((l: any) => l.name || l);
                    setLanguages(langNames);
                }

                // Set location data - try multiple structures
                const pinAddress = worker.profile?.pin_address || worker.pin_address || worker.address;
                const pinLat = worker.profile?.pin_latitude || worker.pin_latitude || worker.latitude;
                const pinLng = worker.profile?.pin_longitude || worker.pin_longitude || worker.longitude;
                const cityName = worker.city?.name || (typeof worker.city === 'string' ? worker.city : '');

                if (pinAddress) {
                    setLocationData({
                        address: pinAddress,
                        city: cityName,
                        latitude: pinLat || 0,
                        longitude: pinLng || 0,
                    });
                }
            }
        } catch (error) {
            toast.error('Failed to load worker data');
        } finally {
            setIsLoadingWorker(false);
        }
    };

    const searchLocations = async (query: string) => {
        if (query.trim().length < 2) {
            setLocationSearchResults([]);
            return;
        }

        try {
            setIsSearchingLocations(true);
            const response = await apiService.get(
                API_ENDPOINTS.LOCATIONS.SEARCH,
                undefined,
                { q: query },
                false
            );

            if (response.success && response.data) {
                let locationsData: any[] = [];
                if (response.data.locations) {
                    locationsData = Array.isArray(response.data.locations.data)
                        ? response.data.locations.data
                        : (Array.isArray(response.data.locations) ? response.data.locations : []);
                } else if (Array.isArray(response.data)) {
                    locationsData = response.data;
                } else if (response.data.data) {
                    locationsData = Array.isArray(response.data.data) ? response.data.data : [];
                }
                setLocationSearchResults(locationsData);
            }
        } catch (error) {
        } finally {
            setIsSearchingLocations(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (locationSearchQuery.trim()) {
                searchLocations(locationSearchQuery);
            } else {
                setLocationSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [locationSearchQuery]);

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
        }
    };

    const openMap = () => {
        setIsMapVisible(true);
        if (!locationData) {
            getCurrentLocation();
        }
    };

    const handleMapConfirm = async () => {
        if (!selectedCoordinate) return;

        try {
            setIsGeocoding(true);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedCoordinate.latitude}&lon=${selectedCoordinate.longitude}&addressdetails=1`,
                { headers: { 'User-Agent': 'KamwaalayApp/1.0' } }
            );
            const data = await response.json();

            if (data && data.display_name) {
                const address = data.address || {};
                const city = address.city || address.town || address.village || address.state || '';

                setLocationData({
                    address: data.display_name,
                    city,
                    latitude: selectedCoordinate.latitude,
                    longitude: selectedCoordinate.longitude,
                });
                setIsMapVisible(false);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to get address');
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleSubmit = async () => {
        if (!fullName.trim()) {
            toast.error('Full name is required');
            return;
        }

        if (selectedServices.length === 0) {
            toast.error('Please select at least one service type');
            return;
        }

        if (!experienceYears) {
            toast.error('Years of experience is required');
            return;
        }

        if (!age) {
            toast.error('Age is required');
            return;
        }

        if (!gender) {
            toast.error('Gender is required');
            return;
        }

        if (!religion) {
            toast.error('Religion is required');
            return;
        }

        if (languages.length === 0) {
            toast.error('Please select at least one language');
            return;
        }

        setIsSubmitting(true);

        try {
            // Map service slugs to IDs
            const serviceTypeIds = selectedServices.map(slug => {
                const service = serviceTypes.find((s: any) => s.slug === slug || s.id?.toString() === slug);
                return service?.id ? parseInt(service.id) : null;
            }).filter((id): id is number => id !== null);

            // Map language names to IDs as an array
            const languageIdsArray = languages.map(name => {
                const lang = availableLanguages.find(l => l.name === name);
                return lang?.id ? (typeof lang.id === 'number' ? lang.id : parseInt(lang.id as string)) : null;
            }).filter((id): id is number => id !== null);

            const workerData: any = {
                name: fullName.trim(),
                service_types: serviceTypeIds,
                experience_years: parseInt(experienceYears),
                age: parseInt(age),
                gender: gender,
                religion: religion,
                languages: JSON.stringify(languageIdsArray),
                availability: availability,
                bio: bio.trim() || null,
            };

            // Only include location data if set
            if (locationData) {
                workerData.pin_address = locationData.address;
                workerData.city = locationData.city;
                workerData.latitude = locationData.latitude;
                workerData.longitude = locationData.longitude;
            }

            const endpoint = API_ENDPOINTS.WORKERS.UPDATE.replace(':id', id as string);
            const response = await apiService.put(endpoint, workerData);

            if (response.success) {
                toast.success('Worker updated successfully!');
                setTimeout(() => router.back(), 1000);
            } else {
                toast.error(response.message || 'Failed to update worker. Please try again.');
            }
        } catch (error) {
            toast.error('Failed to update worker. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingWorker) {
        return (
            <View style={[styles.container, { backgroundColor }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={primaryColor} />
                    <Text style={[styles.loadingText, { color: textSecondary }]}>Loading worker...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {/* Header */}
            <ScreenHeader title="Edit Worker" />

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
                            <Text style={[styles.label, { color: textColor }]}>Phone Number</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor, opacity: 0.6 }]}>
                                <IconSymbol name="phone" size={20} color={textMuted} style={styles.inputIcon} />
                                <View style={styles.phonePrefixContainer}>
                                    <Text style={[styles.phonePrefixText, { color: textSecondary }]}>+92</Text>
                                    <View style={[styles.prefixDivider, { backgroundColor: borderColor }]} />
                                </View>
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="3001234567"
                                    placeholderTextColor={textMuted}
                                    value={phone}
                                    onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    editable={false}
                                />
                            </View>
                            <Text style={[styles.helperText, { color: textMuted }]}>Phone number cannot be changed</Text>
                        </View>



                        <View style={[styles.divider, { backgroundColor: borderColor }]} />

                        {/* Location */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Location <Text style={styles.required}>*</Text></Text>
                            <Text style={[styles.sectionDescription, { color: textSecondary, marginBottom: 12 }]}>
                                Pin the worker&apos;s location on the map
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
                                <Text style={styles.submitButtonText}>Update Worker</Text>
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
                <View style={[styles.modalContainer, { backgroundColor }]}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => {
                            setIsMapVisible(false);
                            setLocationSearchQuery('');
                            setLocationSearchResults([]);
                        }} style={styles.closeButton}>
                            <IconSymbol name="chevron.left" size={24} color={textColor} />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: textColor }]}>Pin Location</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.mapSearchContainer}>
                        <View style={[styles.mapSearchInputWrapper, { backgroundColor: cardBg, borderColor }]}>
                            <IconSymbol name="magnifyingglass" size={20} color={textMuted} />
                            <TextInput
                                style={[styles.mapSearchInput, { color: textColor }]}
                                placeholder="Search neighborhood or area..."
                                placeholderTextColor={textMuted}
                                value={locationSearchQuery}
                                onChangeText={setLocationSearchQuery}
                            />
                            {locationSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setLocationSearchQuery('')}>
                                    <IconSymbol name="xmark.circle.fill" size={20} color={textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {locationSearchResults.length > 0 && (
                            <View style={[styles.mapSearchResults, { backgroundColor: cardBg, borderColor }]}>
                                <ScrollView keyboardShouldPersistTaps="handled">
                                    {locationSearchResults.map((loc, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.mapSearchResultItem, { borderBottomColor: borderColor }]}
                                            onPress={() => {
                                                const lat = parseFloat(loc.latitude);
                                                const lng = parseFloat(loc.longitude);
                                                if (!isNaN(lat) && !isNaN(lng)) {
                                                    const newRegion = {
                                                        latitude: lat,
                                                        longitude: lng,
                                                        latitudeDelta: 0.01,
                                                        longitudeDelta: 0.01,
                                                    };
                                                    setMapRegion(newRegion);
                                                    setSelectedCoordinate({ latitude: lat, longitude: lng });
                                                    setLocationSearchQuery('');
                                                    setLocationSearchResults([]);
                                                }
                                            }}
                                        >
                                            <IconSymbol name="mappin.circle.fill" size={18} color={primaryColor} />
                                            <View>
                                                <Text style={[styles.mapSearchResultName, { color: textColor }]}>{loc.name}</Text>
                                                {loc.area && <Text style={[styles.mapSearchResultArea, { color: textSecondary }]}>{loc.area}</Text>}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        region={mapRegion}
                        onRegionChangeComplete={setMapRegion}
                        onPress={(e) => setSelectedCoordinate(e.nativeEvent.coordinate)}
                        showsUserLocation
                        showsMyLocationButton
                        customMapStyle={colorScheme === 'dark' ? mapDarkStyle : []}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
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
    phonePrefixContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    phonePrefixText: {
        fontSize: 16,
        fontWeight: '600',
        paddingLeft: 4,
    },
    prefixDivider: {
        width: 1,
        height: 20,
        marginHorizontal: 12,
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
    helperText: {
        fontSize: 12,
        marginTop: 6,
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
        borderTopWidth: 1,
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
    // Map Search Styles
    mapSearchContainer: {
        position: 'absolute',
        top: 80,
        left: 20,
        right: 20,
        zIndex: 10,
    },
    mapSearchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        gap: 10,
    },
    mapSearchInput: {
        flex: 1,
        fontSize: 16,
    },
    mapSearchResults: {
        maxHeight: 250,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        overflow: 'hidden',
    },
    mapSearchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        gap: 12,
    },
    mapSearchResultName: {
        fontSize: 15,
        fontWeight: '600',
    },
    mapSearchResultArea: {
        fontSize: 13,
    },


});
