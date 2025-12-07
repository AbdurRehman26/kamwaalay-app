import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SERVICE_TYPES = [
    { id: 'maid', label: 'Maid', emoji: '🧹' },
    { id: 'cook', label: 'Cook', emoji: '👨‍🍳' },
    { id: 'babysitter', label: 'Babysitter', emoji: '👶' },
    { id: 'caregiver', label: 'Caregiver', emoji: '👴' },
    { id: 'cleaner', label: 'Cleaner', emoji: '✨' },
    { id: 'all_rounder', label: 'All Rounder', emoji: '⭐' },
];

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

    // Basic Info
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');

    // Service Types
    const [selectedServices, setSelectedServices] = useState<string[]>([]);

    // Locations
    const [locationSearch, setLocationSearch] = useState('');
    const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
    const [locationSuggestions, setLocationSuggestions] = useState<Location[]>([]);
    const [isSearchingLocations, setIsSearchingLocations] = useState(false);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

    // Professional Details
    const [experienceYears, setExperienceYears] = useState('');
    const [availability, setAvailability] = useState('full_time');
    const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false);
    const [skills, setSkills] = useState('');
    const [bio, setBio] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debounced location search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (locationSearch.trim().length >= 2) {
                searchLocations(locationSearch.trim());
            } else if (locationSearch.trim().length === 0) {
                setLocationSuggestions([]);
                setShowLocationSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [locationSearch]);

    const searchLocations = async (query: string) => {
        setIsSearchingLocations(true);
        setShowLocationSuggestions(true);
        try {
            const response = await apiService.get(
                API_ENDPOINTS.LOCATIONS.SEARCH,
                undefined,
                { q: query },
                false
            );

            if (response.success && response.data) {
                let locationsData: Location[] = [];

                if (response.data.locations) {
                    locationsData = Array.isArray(response.data.locations.data)
                        ? response.data.locations.data
                        : Array.isArray(response.data.locations)
                            ? response.data.locations
                            : [];
                } else if (Array.isArray(response.data)) {
                    locationsData = response.data;
                } else if (response.data.data) {
                    locationsData = Array.isArray(response.data.data) ? response.data.data : [];
                }

                const mappedLocations: Location[] = locationsData.map((loc: any) => ({
                    id: loc.id || loc.location_id || loc.name,
                    name: loc.name || loc.location_name || '',
                    area: loc.area || loc.area_name,
                }));

                setLocationSuggestions(mappedLocations);
                setShowLocationSuggestions(mappedLocations.length > 0);
            } else {
                setLocationSuggestions([]);
                setShowLocationSuggestions(false);
            }
        } catch (error) {
            console.error('Error searching locations:', error);
            setLocationSuggestions([]);
            setShowLocationSuggestions(false);
        } finally {
            setIsSearchingLocations(false);
        }
    };

    const toggleService = (serviceId: string) => {
        if (selectedServices.includes(serviceId)) {
            setSelectedServices(selectedServices.filter(s => s !== serviceId));
        } else {
            setSelectedServices([...selectedServices, serviceId]);
        }
    };

    const selectLocationFromSuggestion = (location: Location) => {
        if (!selectedLocations.find(l => l.id === location.id)) {
            setSelectedLocations([...selectedLocations, location]);
        }
        setLocationSearch('');
        setShowLocationSuggestions(false);
    };

    const removeLocation = (locationId: number) => {
        setSelectedLocations(selectedLocations.filter(l => l.id !== locationId));
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

        if (selectedServices.length === 0) {
            Alert.alert('Required', 'Please select at least one service type');
            return;
        }

        if (selectedLocations.length === 0) {
            Alert.alert('Required', 'Please select at least one location');
            return;
        }

        if (!experienceYears.trim()) {
            Alert.alert('Required', 'Experience is required');
            return;
        }

        setIsSubmitting(true);

        try {
            const workerData = {
                full_name: fullName.trim(),
                phone: phone.trim(),
                service_types: selectedServices,
                locations: selectedLocations.map(l => ({ id: l.id, name: l.name, area: l.area })),
                experience_years: parseInt(experienceYears),
                availability,
                skills: skills.trim() || null,
                bio: bio.trim() || null,
            };

            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay if needed, though real API call is likely preferred but 'apiService.post' for this might be missing in original file, let's assume 'apiService.post' or similar would exist. 
            // Original code didn't actually call an API to save, it just logged. I'll keep the log behavior but structure it to be ready for API. 
            // Wait, looking at the original 'handleSubmit', it just logs 'Worker Data' and alerts success. 
            // I will maintain that behavior but fix the UI.

            console.log('Worker Data:', workerData);

            Alert.alert('Success', 'Worker added successfully', [
                {
                    text: 'Add Another',
                    onPress: () => {
                        setFullName('');
                        setPhone('');
                        setSelectedServices([]);
                        setSelectedLocations([]);
                        setExperienceYears('');
                        setAvailability('full_time');
                        setSkills('');
                        setBio('');
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
        <View style={styles.container}>
            {/* Decorative Background Elements */}
            <View style={styles.topCircle} />
            <View style={styles.bottomCircle} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >


                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                >
                    <View style={styles.formContainer}>
                        {/* Basic Information */}
                        <Text style={styles.sectionTitle}>Basic Information</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
                            <View style={styles.inputWrapper}>
                                <IconSymbol name="person" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter full name"
                                    placeholderTextColor="#9CA3AF"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
                            <View style={styles.inputWrapper}>
                                <IconSymbol name="phone" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="03XXXXXXXXX"
                                    placeholderTextColor="#9CA3AF"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                />
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Service Types */}
                        <Text style={styles.sectionTitle}>Services & Location</Text>
                        <Text style={styles.sectionDescription}>
                            Select the services this worker can provide and their service areas.
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Service Types <Text style={styles.required}>*</Text></Text>
                            <View style={styles.serviceGrid}>
                                {SERVICE_TYPES.map((service) => (
                                    <TouchableOpacity
                                        key={service.id}
                                        style={[
                                            styles.serviceCard,
                                            selectedServices.includes(service.id) && styles.serviceCardActive,
                                        ]}
                                        onPress={() => toggleService(service.id)}
                                    >
                                        <Text style={styles.serviceEmoji}>{service.emoji}</Text>
                                        <Text style={[
                                            styles.serviceLabel,
                                            selectedServices.includes(service.id) && styles.serviceLabelActive
                                        ]}>{service.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Service Locations <Text style={styles.required}>*</Text></Text>

                            {/* Selected Locations */}
                            {selectedLocations.length > 0 && (
                                <View style={styles.tagContainer}>
                                    {selectedLocations.map((location) => (
                                        <View key={location.id} style={styles.tag}>
                                            <Text style={styles.tagText}>
                                                {location.area ? `${location.name}, ${location.area}` : location.name}
                                            </Text>
                                            <TouchableOpacity onPress={() => removeLocation(location.id)}>
                                                <IconSymbol name="xmark.circle.fill" size={18} color="#6366F1" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <View style={styles.inputWrapper}>
                                <IconSymbol name="magnifyingglass" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Search location (e.g. Clifton)"
                                    placeholderTextColor="#9CA3AF"
                                    value={locationSearch}
                                    onChangeText={setLocationSearch}
                                />
                                {isSearchingLocations && (
                                    <ActivityIndicator size="small" color="#6366F1" style={{ marginLeft: 8 }} />
                                )}
                            </View>

                            {/* Location Dropdown */}
                            {showLocationSuggestions && locationSuggestions.length > 0 && (
                                <View style={styles.locationDropdown}>
                                    <ScrollView style={styles.locationDropdownScroll} nestedScrollEnabled>
                                        {locationSuggestions.map((suggestion, index) => (
                                            <TouchableOpacity
                                                key={suggestion.id || `location-${index}`}
                                                style={styles.locationDropdownItem}
                                                onPress={() => selectLocationFromSuggestion(suggestion)}
                                            >
                                                <IconSymbol name="mappin.circle.fill" size={18} color="#6366F1" />
                                                <Text style={styles.locationDropdownText}>
                                                    {suggestion.area ? `${suggestion.name}, ${suggestion.area}` : suggestion.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        <View style={styles.divider} />

                        {/* Professional Details */}
                        <Text style={styles.sectionTitle}>Professional Details</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Experience (Yrs) <Text style={styles.required}>*</Text></Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 5"
                                    placeholderTextColor="#9CA3AF"
                                    value={experienceYears}
                                    onChangeText={setExperienceYears}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={[styles.inputGroup, { zIndex: 10 }]}>
                            <Text style={styles.label}>Availability <Text style={styles.required}>*</Text></Text>
                            <TouchableOpacity
                                style={styles.inputWrapper}
                                onPress={() => setShowAvailabilityPicker(!showAvailabilityPicker)}
                            >
                                <IconSymbol name="clock.fill" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <Text style={styles.inputText}>
                                    {AVAILABILITY_OPTIONS.find(o => o.value === availability)?.label}
                                </Text>
                                <IconSymbol name="chevron.down" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                            {showAvailabilityPicker && (
                                <View style={styles.dropdownMenu}>
                                    {AVAILABILITY_OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setAvailability(option.value);
                                                setShowAvailabilityPicker(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                availability === option.value && styles.dropdownItemTextSelected
                                            ]}>{option.label}</Text>
                                            {availability === option.value && (
                                                <IconSymbol name="checkmark.circle.fill" size={16} color="#6366F1" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Skills</Text>
                            <View style={styles.inputWrapper}>
                                <IconSymbol name="star.fill" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Cooking, Cleaning"
                                    placeholderTextColor="#9CA3AF"
                                    value={skills}
                                    onChangeText={setSkills}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Bio / Description</Text>
                            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Describe the worker's experience and qualifications..."
                                    placeholderTextColor="#9CA3AF"
                                    value={bio}
                                    onChangeText={setBio}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
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
    topCircle: {
        position: 'absolute',
        top: -width * 0.4,
        right: -width * 0.2,
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: '#EEF2FF',
        opacity: 0.6,
    },
    bottomCircle: {
        position: 'absolute',
        bottom: -width * 0.3,
        left: -width * 0.2,
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: width * 0.35,
        backgroundColor: '#F5F3FF',
        opacity: 0.6,
    },

    scrollView: {
        flex: 1,
    },
    formContainer: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    required: {
        color: '#EF4444',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
        color: '#1A1A1A',
        height: '100%',
    },
    inputText: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    serviceCardActive: {
        borderColor: '#6366F1',
        backgroundColor: '#EEF2FF',
    },
    serviceEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    serviceLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'center',
    },
    serviceLabelActive: {
        color: '#6366F1',
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
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    tagText: {
        fontSize: 13,
        color: '#6366F1',
        fontWeight: '600',
    },
    locationDropdown: {
        maxHeight: 200,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    locationDropdownText: {
        fontSize: 15,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    dropdownMenu: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemText: {
        fontSize: 15,
        color: '#374151',
    },
    dropdownItemTextSelected: {
        color: '#6366F1',
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#6366F1',
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
});
