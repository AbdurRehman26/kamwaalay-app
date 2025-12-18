import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const SERVICE_TYPES = [
    'Cleaning',
    'Cooking',
    'Babysitting',
    'Elderly Care',
    'All-Rounder',
    '24/7 Live-in',
    'Other',
];

const WORK_TYPES = [
    'Full Time',
    'Part Time',
    'Contract',
    'Temporary',
];

interface Location {
    id: number | string;
    name: string;
    area?: string;
}

export default function EditJobScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { user } = useAuth();

    // Theme colors
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textMuted = useThemeColor({}, 'textMuted');
    const cardBg = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const primaryColor = useThemeColor({}, 'primary');

    // Form State
    const [isLoading, setIsLoading] = useState(true);
    const [serviceType, setServiceType] = useState('');
    const [workType, setWorkType] = useState('');
    const [estimatedSalary, setEstimatedSalary] = useState('');
    const [userName, setUserName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [specialRequirements, setSpecialRequirements] = useState('');

    // Location State
    const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
    const [locationSearch, setLocationSearch] = useState('');
    const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);

    // Modal State
    const [activeSelection, setActiveSelection] = useState<'service' | 'work' | 'location' | null>(null);

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchJobDetails();
    }, [id]);

    const fetchJobDetails = async () => {
        try {
            setIsLoading(true);
            const response = await apiService.get(API_ENDPOINTS.JOB_POSTS.GET, { id: id as string });

            if (response.success && response.data) {
                const job = response.data.job_post || response.data.booking || response.data;

                setServiceType(job.service_type ? job.service_type.charAt(0).toUpperCase() + job.service_type.slice(1).replace('_', ' ') : '');
                setWorkType(job.work_type || '');
                setEstimatedSalary(job.monthly_rate ? job.monthly_rate.toString() : '');
                setUserName(job.name || user?.name || '');
                setPhone(job.phone_number || user?.phoneNumber || '');
                setAddress(job.address || ''); // Assuming address is available
                setSpecialRequirements(job.description || job.special_requirements || '');

                if (job.area) {
                    setLocationSearch(job.area);
                    setSelectedLocations([{ id: job.area, name: job.city || '', area: job.area }]);
                }
            } else {
                Alert.alert('Error', 'Failed to load job details');
                router.back();
            }
        } catch (error) {
            console.error('Error fetching job:', error);
            Alert.alert('Error', 'Failed to load job details');
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    // Search locations from API when user types
    useEffect(() => {
        const searchTimeout = setTimeout(() => {
            if (locationSearch.trim().length >= 2) {
                searchLocations(locationSearch.trim());
            } else if (locationSearch.trim().length === 0) {
                setFilteredLocations([]);
            }
        }, 300); // Debounce for 300ms

        return () => clearTimeout(searchTimeout);
    }, [locationSearch]);

    const searchLocations = async (query: string) => {
        try {
            setIsLoadingLocations(true);

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
                        : (Array.isArray(response.data.locations) ? response.data.locations : []);
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

                setFilteredLocations(mappedLocations);
            } else {
                setFilteredLocations([]);
            }
        } catch (error) {
            setFilteredLocations([]);
        } finally {
            setIsLoadingLocations(false);
        }
    };

    const handleLocationSelect = (location: Location) => {
        setSelectedLocations([location]);
        setLocationSearch(location.area || location.name);
        setActiveSelection(null);
    };

    const handleUpdate = async () => {
        if (!serviceType) { Alert.alert('Required', 'Please select a service type'); return; }
        if (!workType) { Alert.alert('Required', 'Please select a work type'); return; }
        if (selectedLocations.length === 0 && !locationSearch) { Alert.alert('Required', 'Please select an area'); return; }

        setIsSubmitting(true);
        try {
            const locationName = selectedLocations.length > 0 ? (selectedLocations[0].area || selectedLocations[0].name) : locationSearch;

            const payload = {
                name: userName,
                service_type: serviceType.toLowerCase().replace(' ', '_'),
                description: specialRequirements,
                location: locationName,
                area: locationName,
                monthly_rate: estimatedSalary ? parseFloat(estimatedSalary) : undefined,
                work_type: workType,
                phone_number: phone,
                address: address
            };

            const response = await apiService.put(
                API_ENDPOINTS.JOB_POSTS.UPDATE,
                { id: id as string },
                payload
            );

            if (response.success) {
                Alert.alert('Success', 'Job updated successfully', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                Alert.alert('Error', 'Failed to update job');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update job');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSelectionModal = () => {
        if (!activeSelection) return null;

        let title = '';
        let options: string[] | Location[] = [];
        let onSelect: (item: any) => void = () => { };

        if (activeSelection === 'service') {
            title = 'Select Service Type';
            options = SERVICE_TYPES;
            onSelect = (item) => {
                setServiceType(item);
                setActiveSelection(null);
            };
        } else if (activeSelection === 'work') {
            title = 'Select Work Type';
            options = WORK_TYPES;
            onSelect = (item) => {
                setWorkType(item);
                setActiveSelection(null);
            };
        } else if (activeSelection === 'location') {
            title = 'Select Area';
            options = filteredLocations;
            onSelect = handleLocationSelect;
        }

        return (
            <Modal
                visible={!!activeSelection}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setActiveSelection(null)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: backgroundColor }}>
                    <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
                        <TouchableOpacity onPress={() => setActiveSelection(null)} style={styles.closeButton}>
                            <IconSymbol name="xmark" size={24} color={textColor} />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: textColor }]}>{title}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {activeSelection === 'location' && (
                        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: borderColor }}>
                            <TextInput
                                style={[styles.input, { backgroundColor: cardBg, borderColor: borderColor, color: textColor }]}
                                placeholder="Type to search area..."
                                placeholderTextColor={textMuted}
                                value={locationSearch}
                                onChangeText={setLocationSearch}
                                autoFocus
                            />
                            {isLoadingLocations && (
                                <ActivityIndicator style={styles.loader} size="small" color={primaryColor} />
                            )}
                        </View>
                    )}

                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        {activeSelection === 'location' && options.length === 0 && locationSearch.length > 0 && !isLoadingLocations ? (
                            <Text style={{ textAlign: 'center', color: textMuted, marginTop: 20 }}>No locations found</Text>
                        ) : (
                            options.map((item: any, index: number) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.modalItem, { borderBottomColor: borderColor }]}
                                    onPress={() => onSelect(item)}
                                >
                                    <Text style={[styles.modalItemText, { color: textColor }]}>
                                        {activeSelection === 'location' ? (item.area ? item.area : item.name) : item}
                                    </Text>
                                    {((activeSelection === 'service' && serviceType === item) ||
                                        (activeSelection === 'work' && workType === item)) && (
                                            <IconSymbol name="checkmark" size={20} color={primaryColor} />
                                        )}
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.loading, { backgroundColor }]}>
                <ActivityIndicator size="large" color={primaryColor} />
            </View>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <IconSymbol name="chevron.left" size={24} color={primaryColor} />
                    </TouchableOpacity>
                    <ThemedText type="title" style={styles.title}>Edit Job Post</ThemedText>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.form}>

                    {/* Row 1: Service Type & Work Type */}
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <ThemedText style={styles.label}>SERVICE TYPE *</ThemedText>
                            <TouchableOpacity
                                style={[styles.dropdownButton, { backgroundColor: cardBg, borderColor: borderColor }]}
                                onPress={() => setActiveSelection('service')}
                            >
                                <Text style={[styles.dropdownButtonText, { color: serviceType ? textColor : textMuted }]}>
                                    {serviceType || 'Select Service'}
                                </Text>
                                <IconSymbol name="chevron.down" size={16} color={textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.col}>
                            <ThemedText style={styles.label}>WORK TYPE *</ThemedText>
                            <TouchableOpacity
                                style={[styles.dropdownButton, { backgroundColor: cardBg, borderColor: borderColor }]}
                                onPress={() => setActiveSelection('work')}
                            >
                                <Text style={[styles.dropdownButtonText, { color: workType ? textColor : textMuted }]}>
                                    {workType || 'Select Type'}
                                </Text>
                                <IconSymbol name="chevron.down" size={16} color={textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Row 2: Salary & Area */}
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <ThemedText style={styles.label}>ESTIMATED SALARY</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: cardBg, borderColor: borderColor, color: textColor }]}
                                placeholder="25000 (PKR/MONTH)"
                                placeholderTextColor={textMuted}
                                keyboardType="numeric"
                                value={estimatedSalary}
                                onChangeText={setEstimatedSalary}
                            />
                        </View>

                        <View style={styles.col}>
                            <ThemedText style={styles.label}>AREA *</ThemedText>
                            <TouchableOpacity
                                style={[styles.dropdownButton, { backgroundColor: cardBg, borderColor: borderColor }]}
                                onPress={() => setActiveSelection('location')}
                            >
                                <Text style={[styles.dropdownButtonText, { color: locationSearch ? textColor : textMuted }]} numberOfLines={1}>
                                    {locationSearch || 'Select Area'}
                                </Text>
                                <IconSymbol name="chevron.down" size={16} color={textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Row 3: Name & Phone */}
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <ThemedText style={styles.label}>YOUR NAME *</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: cardBg, borderColor: borderColor, color: textMuted, opacity: 0.8 }]}
                                placeholder="Full Name"
                                placeholderTextColor={textMuted}
                                value={userName}
                                editable={false}
                            />
                        </View>

                        <View style={styles.col}>
                            <ThemedText style={styles.label}>PHONE *</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: cardBg, borderColor: borderColor, color: textMuted, opacity: 0.8 }]}
                                placeholder="03001234567"
                                placeholderTextColor={textMuted}
                                keyboardType="phone-pad"
                                value={phone}
                                editable={false}
                            />
                        </View>
                    </View>

                    {/* Address */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>ADDRESS</ThemedText>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: cardBg, borderColor: borderColor, color: textColor }]}
                            placeholder="House 123, Street 4, Karachi"
                            placeholderTextColor={textMuted}
                            multiline
                            numberOfLines={3}
                            value={address}
                            onChangeText={setAddress}
                        />
                    </View>

                    {/* Special Requirements */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>SPECIAL REQUIREMENTS</ThemedText>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: cardBg, borderColor: borderColor, color: textColor }]}
                            placeholder="Any special requirements or preferences..."
                            placeholderTextColor={textMuted}
                            multiline
                            numberOfLines={4}
                            value={specialRequirements}
                            onChangeText={setSpecialRequirements}
                        />
                    </View>

                    {/* Buttons */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: primaryColor }, isSubmitting && { opacity: 0.7 }]}
                            onPress={handleUpdate}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Update Job Post</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.secondaryButton, { backgroundColor: cardBg, borderColor: borderColor }]}
                            onPress={() => router.back()}
                        >
                            <Text style={[styles.secondaryButtonText, { color: textColor }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>

            {renderSelectionModal()}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loading: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    form: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    col: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        height: 48,
    },
    textArea: {
        height: 'auto',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    dropdownButton: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        height: 48,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownButtonText: {
        fontSize: 14,
    },
    loader: {
        position: 'absolute',
        right: 12,
        top: 14,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    submitButton: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    secondaryButton: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    secondaryButtonText: {
        fontWeight: '600',
        fontSize: 14,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    closeButton: {
        padding: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalItemText: {
        fontSize: 16,
    },
});
