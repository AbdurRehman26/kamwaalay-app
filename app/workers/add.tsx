import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
        // Validate
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

            console.log('Worker Data:', workerData);

            Alert.alert('Success', 'Worker added successfully', [
                {
                    text: 'Add Another',
                    onPress: () => {
                        // Clear form
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
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView 
                    style={styles.scrollView} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                >
                    <View style={styles.form}>
                        {/* Basic Information */}
                        <View style={styles.section}>
                            <ThemedText type="subtitle" style={styles.sectionTitle}>
                                Basic Information
                            </ThemedText>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Full Name *</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter full name"
                                    placeholderTextColor="#999"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Phone *</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    placeholder="03XXXXXXXXX"
                                    placeholderTextColor="#999"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Photo</ThemedText>
                                <TouchableOpacity style={styles.fileButton}>
                                    <Text style={styles.fileButtonText}>Choose file</Text>
                                    <Text style={styles.fileButtonSubtext}>No file chosen</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Select Service Types */}
                        <View style={styles.section}>
                            <ThemedText type="subtitle" style={styles.sectionTitle}>
                                Select Service Types *
                            </ThemedText>
                            <ThemedText style={styles.sectionDescription}>
                                Choose the services this worker can provide. You can select multiple.
                            </ThemedText>

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
                                        <Text style={styles.serviceLabel}>{service.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Select Locations */}
                        <View style={styles.section}>
                            <ThemedText type="subtitle" style={styles.sectionTitle}>
                                Select Locations *
                            </ThemedText>
                            <ThemedText style={styles.sectionDescription}>
                                Add locations where this worker can provide services. You can add multiple locations.
                            </ThemedText>

                            <View style={styles.inputGroup}>
                                {/* Location Search */}
                                <View style={styles.locationSearchContainer}>
                                    <TextInput
                                        style={styles.locationInput}
                                        placeholder="Search location (e.g., Karachi, Clifton or type area name)..."
                                        placeholderTextColor="#999"
                                        value={locationSearch}
                                        onChangeText={setLocationSearch}
                                    />
                                    {isSearchingLocations && (
                                        <ActivityIndicator size="small" color="#6366F1" style={styles.loader} />
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
                                                    <Text style={styles.locationDropdownText}>
                                                        {suggestion.area ? `${suggestion.name}, ${suggestion.area}` : suggestion.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                                <ThemedText style={styles.helperText}>
                                    Type to search and select locations. Each location will be added as a tag.
                                </ThemedText>
                            </View>

                            {selectedLocations.length > 0 && (
                                <View style={styles.tagContainer}>
                                    {selectedLocations.map((location) => (
                                        <View key={location.id} style={styles.tag}>
                                            <Text style={styles.tagText}>
                                                {location.area ? `${location.name}, ${location.area}` : location.name}
                                            </Text>
                                            <TouchableOpacity onPress={() => removeLocation(location.id)}>
                                                <IconSymbol name="xmark.circle.fill" size={18} color="#666" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Professional Details */}
                        <View style={styles.section}>
                            <ThemedText type="subtitle" style={styles.sectionTitle}>
                                Professional Details
                            </ThemedText>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <ThemedText style={styles.label}>Experience (Years) *</ThemedText>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g., 5"
                                        placeholderTextColor="#999"
                                        value={experienceYears}
                                        onChangeText={setExperienceYears}
                                        keyboardType="numeric"
                                    />
                                </View>

                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <ThemedText style={styles.label}>Availability *</ThemedText>
                                    <TouchableOpacity
                                        style={styles.dropdown}
                                        onPress={() => setShowAvailabilityPicker(!showAvailabilityPicker)}
                                    >
                                        <Text style={styles.dropdownText}>
                                            {AVAILABILITY_OPTIONS.find(o => o.value === availability)?.label}
                                        </Text>
                                        <IconSymbol name="chevron.down" size={20} color="#666" />
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
                                                    <Text style={styles.dropdownItemText}>{option.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Skills</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., Cooking, Cleaning, Child Care"
                                    placeholderTextColor="#999"
                                    value={skills}
                                    onChangeText={setSkills}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Bio / Description</ThemedText>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Describe the worker's experience, skills, and qualifications..."
                                    placeholderTextColor="#999"
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
                            <Text style={styles.submitButtonText}>
                                {isSubmitting ? 'Adding Worker...' : 'Add Worker'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    form: {
        padding: 20,
    },
    section: {
        marginBottom: 32,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        color: '#1A1A1A',
    },
    sectionDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        lineHeight: 20,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#1A1A1A',
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 14,
        fontSize: 15,
        color: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    textArea: {
        minHeight: 100,
        paddingTop: 14,
    },
    helperText: {
        fontSize: 12,
        color: '#999',
        marginTop: 6,
    },
    fileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 14,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    fileButtonText: {
        color: '#6366F1',
        fontSize: 14,
        fontWeight: '600',
    },
    fileButtonSubtext: {
        fontSize: 14,
        color: '#999',
    },
    serviceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    serviceCard: {
        width: '30%',
        minHeight: 90,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E8E8E8',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    serviceCardActive: {
        borderColor: '#6366F1',
        backgroundColor: '#EEF2FF',
    },
    serviceEmoji: {
        fontSize: 28,
        marginBottom: 6,
    },
    serviceLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EEF2FF',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    tagText: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '600',
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 14,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    dropdownText: {
        fontSize: 15,
        color: '#1A1A1A',
    },
    dropdownMenu: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 1000,
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemText: {
        fontSize: 15,
        color: '#1A1A1A',
    },
    submitButton: {
        backgroundColor: '#6366F1',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 20,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#CCCCCC',
        shadowOpacity: 0,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    locationSearchContainer: {
        position: 'relative',
    },
    locationInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 14,
        fontSize: 15,
        color: '#1A1A1A',
        backgroundColor: '#FFFFFF',
    },
    loader: {
        position: 'absolute',
        right: 16,
        top: 16,
    },
    locationDropdown: {
        maxHeight: 200,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    locationDropdownScroll: {
        maxHeight: 200,
    },
    locationDropdownItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    locationDropdownText: {
        fontSize: 16,
        color: '#1A1A1A',
    },
});
