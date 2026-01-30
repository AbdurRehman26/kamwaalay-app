import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import { toast } from '@/utils/toast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const WORK_TYPES = [
    { id: 'full_time', label: 'Full Time' },
    { id: 'part_time', label: 'Part Time' },
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
    const [serviceTypes, setServiceTypes] = useState<{ id: number, name: string }[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    const [serviceType, setServiceType] = useState<number | null>(null);
    const [workType, setWorkType] = useState('');
    const [estimatedSalary, setEstimatedSalary] = useState('');
    const [userName, setUserName] = useState('');
    const [phone, setPhone] = useState('');
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
        fetchServiceTypes();
        fetchJobDetails();
    }, [id]);

    const fetchServiceTypes = async () => {
        try {
            setIsLoadingServices(true);
            const response = await apiService.get(API_ENDPOINTS.SERVICE_TYPES.LIST);
            if (response.data) {
                const data = Array.isArray(response.data) ? response.data : response.data.data;
                if (Array.isArray(data)) {
                    const types = data.map((item: any) => ({
                        id: item.id,
                        name: item.name || item.slug || item.label || ''
                    })).filter((t) => t.id && t.name);
                    setServiceTypes(types);
                }
            }
        } catch (error) {
        } finally {
            setIsLoadingServices(false);
        }
    };

    const fetchJobDetails = async () => {
        try {
            setIsLoading(true);
            const response = await apiService.get(API_ENDPOINTS.JOB_POSTS.GET, { id: id as string });

            if (response.success && response.data) {
                const job = response.data.job_post || response.data.booking || response.data;

                // Handle both ID and slug/name for service_type
                if (typeof job.service_type === 'number') {
                    setServiceType(job.service_type);
                } else if (job.service_type_id) {
                    setServiceType(job.service_type_id);
                } else if (job.service?.id) {
                    setServiceType(job.service.id);
                }

                setWorkType(job.work_type || '');
                const salary = job.estimated_salary || job.monthly_rate || job.budget || job.price || 0;
                setEstimatedSalary(Math.round(Number(salary)).toString());
                setUserName(job.name || user?.name || '');
                setPhone(job.phone || job.phone_number || user?.phoneNumber || '');
                setSpecialRequirements(job.special_requirements || job.description || '');

                if (job.area) {
                    setLocationSearch(job.area);
                    setSelectedLocations([{ id: job.area, name: job.city || '', area: job.area }]);
                }
            } else {
                toast.error('Failed to load job details');
                router.back();
            }
        } catch (error) {
            toast.error('Failed to load job details');
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
        let errorMsg = '';
        if (!serviceType) errorMsg = 'Please select a service type';
        else if (!workType) errorMsg = 'Please select a work type';
        else if (!userName.trim()) errorMsg = 'Please enter your name';
        else if (!phone.trim()) errorMsg = 'Please enter your phone number';

        if (errorMsg) {
            toast.error(errorMsg);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                name: userName,
                service_type: serviceType,
                special_requirements: specialRequirements,
                location: (user as any)?.pin_address || locationSearch,
                area: (user as any)?.pin_address || locationSearch,
                latitude: (user as any)?.pin_latitude,
                longitude: (user as any)?.pin_longitude,
                address: (user as any)?.pin_address || '',
                estimated_salary: estimatedSalary ? parseFloat(estimatedSalary) : undefined,
                work_type: workType,
                phone: phone,
            };

            const response = await apiService.patch(
                API_ENDPOINTS.JOB_POSTS.UPDATE,
                payload,
                { id: id as string }
            );

            if (response.success) {
                toast.success('Job updated successfully');
                router.replace('/(tabs)/job-posts');
            } else {
                toast.error('Failed to update job');
            }
        } catch (error) {
            toast.error('Failed to update job');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSelectionModal = () => {
        if (!activeSelection) return null;

        let title = '';
        let options: any[] = [];
        let onSelect: (item: any) => void = () => { };

        if (activeSelection === 'service') {
            title = 'Select Service Type';
            options = serviceTypes;
            onSelect = (item) => {
                setServiceType(item.id);
                setActiveSelection(null);
            };
        } else if (activeSelection === 'work') {
            title = 'Select Work Type';
            options = WORK_TYPES;
            onSelect = (item) => {
                setWorkType(item.id);
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
                            options.map((item: any, index: number) => {
                                const label = activeSelection === 'service' ? item.name : (activeSelection === 'work' ? item.label : (item.area ? item.area : item.name));
                                const value = activeSelection === 'location' ? item.id : item.id;
                                const isSelected = (activeSelection === 'service' && serviceType === value) ||
                                    (activeSelection === 'work' && workType === value);

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.modalItem, { borderBottomColor: borderColor }]}
                                        onPress={() => onSelect(item)}
                                    >
                                        <Text style={[styles.modalItemText, { color: textColor }]}>
                                            {label}
                                        </Text>
                                        {isSelected && (
                                            <IconSymbol name="checkmark" size={20} color={primaryColor} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })
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
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <ScreenHeader title="Edit Job Post" />

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
                                        {serviceType ? serviceTypes.find(s => s.id === serviceType)?.name : 'Select Service'}
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
                                        {workType ? WORK_TYPES.find(w => w.id === workType)?.label : 'Select Type'}
                                    </Text>
                                    <IconSymbol name="chevron.down" size={16} color={textMuted} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Row 2: Salary */}
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <ThemedText style={styles.label}>ESTIMATED SALARY</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: cardBg, borderColor: borderColor, color: textColor }]}
                                    placeholder="25000"
                                    placeholderTextColor={textMuted}
                                    keyboardType="numeric"
                                    value={estimatedSalary}
                                    onChangeText={setEstimatedSalary}
                                />
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
                                <View style={styles.helperTextContainer}>
                                    <IconSymbol name="info.circle" size={12} color={textMuted} />
                                    <Text style={[styles.helperText, { color: textMuted }]}>
                                        Not visible until you accept an application.
                                    </Text>
                                </View>
                            </View>
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
            </KeyboardAvoidingView>

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
        paddingBottom: 60,
        marginTop: 20,
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
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        height: 56,
    },
    textArea: {
        height: 'auto',
        minHeight: 100,
        textAlignVertical: 'top',
        paddingTop: 16,
    },
    dropdownButton: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        height: 56,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownButtonText: {
        fontSize: 16,
    },
    loader: {
        position: 'absolute',
        right: 16,
        top: 18,
    },
    helperTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
    },
    helperText: {
        fontSize: 12,
    },
    footer: {
        flexDirection: 'column',
        gap: 12,
        marginTop: 24,
    },
    submitButton: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    secondaryButton: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        width: '100%',
    },
    secondaryButtonText: {
        fontWeight: '700',
        fontSize: 16,
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
