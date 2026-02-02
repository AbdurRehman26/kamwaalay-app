import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Worker {
    id: number;
    name?: string;
    full_name?: string;
    phone: string;
    photo?: string;
    service_types?: any[];
    experience_years?: number;
    status?: string;
    verification_status?: string;
    service_listings?: any[];
    languages?: any[];
    religion?: { value: string; label: string };
}

export default function WorkersListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Theme colors
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const textMuted = useThemeColor({}, 'textMuted');
    const primaryColor = useThemeColor({}, 'primary');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const cardBg = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');

    // Fetch workers from API
    const fetchWorkers = async () => {
        try {
            setIsLoading(true);
            const response = await apiService.get(API_ENDPOINTS.WORKERS.LIST);

            if (response.success && response.data) {
                let workersData: Worker[] = [];
                const data = response.data;

                // Handle different response structures
                if (Array.isArray(data)) {
                    workersData = data;
                } else if (data.workers && data.workers.data && Array.isArray(data.workers.data)) {
                    // Paginated response: { workers: { data: [...] } }
                    workersData = data.workers.data;
                } else if (data.workers && Array.isArray(data.workers)) {
                    workersData = data.workers;
                } else if (data.data && Array.isArray(data.data)) {
                    workersData = data.data;
                }

                setWorkers(workersData);
            }
        } catch (error) {
            // Handle error silently
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkers();
    }, []);

    // Get service types display string
    const getServiceTypes = (worker: Worker) => {
        if (worker.service_listings && worker.service_listings.length > 0) {
            const services = worker.service_listings[0]?.service_types || [];
            return services.slice(0, 2).map((s: any) => s.name).join(', ');
        }
        return '';
    };

    // Get worker details string
    const getWorkerDetails = (worker: Worker) => {
        const parts: string[] = [];

        const services = getServiceTypes(worker);
        if (services) parts.push(services);

        if (worker.experience_years) parts.push(`${worker.experience_years}y exp`);
        if (worker.religion?.label) parts.push(worker.religion.label.split(' ')[0]);

        return parts.join(' • ') || 'No details';
    };

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {/* Header */}
            <ScreenHeader
                title="My Workers"
                rightAction={{
                    icon: 'plus',
                    onPress: () => router.push('/workers/add')
                }}
            />

            <ScrollView
                style={[styles.scrollView, { backgroundColor }]}
                showsHorizontalScrollIndicator={false}
                horizontal={false}
                bounces={false}
                alwaysBounceHorizontal={false}
                alwaysBounceVertical={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            >
                <View style={{ marginTop: 16 }}>
                    {/* Content */}
                    <View style={styles.contentContainer}>
                        {isLoading ? (
                            <View style={[styles.emptyStateCard, { backgroundColor: cardBg, borderColor }]}>
                                <ActivityIndicator size="large" color={primaryColor} />
                                <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
                                    Loading workers...
                                </ThemedText>
                            </View>
                        ) : workers.length === 0 ? (
                            <View style={[styles.emptyStateCard, { backgroundColor: cardBg, borderColor }]}>
                                <View style={[styles.emptyIconContainer, { backgroundColor: primaryLight }]}>
                                    <IconSymbol name="person.2.fill" size={48} color={primaryColor} />
                                </View>
                                <ThemedText type="subtitle" style={[styles.emptyTitle, { color: textColor }]}>
                                    No Workers Yet
                                </ThemedText>
                                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                                    Add your first worker to get started managing your team
                                </ThemedText>
                                <TouchableOpacity
                                    style={[styles.addWorkerButton, { backgroundColor: primaryColor }]}
                                    onPress={() => router.push('/workers/add')}
                                >
                                    <Text style={styles.addWorkerButtonText}>Add Your First Worker</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.workersList}>
                                {workers.map((worker) => (
                                    <TouchableOpacity
                                        key={worker.id}
                                        style={[styles.workerCard, { backgroundColor: cardBg, borderColor }]}
                                        onPress={() => router.push(`/workers/${worker.id}` as any)}
                                    >
                                        <View style={[styles.workerAvatar, { backgroundColor: primaryLight }]}>
                                            <IconSymbol name="person.fill" size={28} color={primaryColor} />
                                        </View>
                                        <View style={styles.workerInfo}>
                                            <Text style={[styles.workerName, { color: textColor }]}>
                                                {worker.name || worker.full_name}
                                            </Text>
                                            <Text style={[styles.workerPhone, { color: textSecondary }]}>
                                                {worker.phone}
                                            </Text>
                                            <Text style={[styles.workerServices, { color: textMuted }]} numberOfLines={1}>
                                                {getWorkerDetails(worker)}
                                            </Text>
                                        </View>
                                        <IconSymbol name="chevron.right" size={20} color={textMuted} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    contentContainer: {
        paddingHorizontal: 20,
    },
    emptyStateCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    addWorkerButton: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 16,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addWorkerButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    workersList: {
        gap: 12,
    },
    workerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    workerAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    workerInfo: {
        flex: 1,
    },
    workerName: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 2,
    },
    workerPhone: {
        fontSize: 14,
        marginBottom: 2,
    },
    workerServices: {
        fontSize: 13,
    },
    workerStatus: {
        alignItems: 'flex-end',
        gap: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
