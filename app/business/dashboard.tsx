import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Worker {
    id: number;
    full_name: string;
    phone: string;
    photo?: string;
    service_types?: string[];
    experience_years?: number;
    status?: string;
}

export default function BusinessDashboardScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'workers' | 'bookings'>('workers');
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

    // Stats based on workers data
    const stats = {
        totalWorkers: workers.length,
        bookings: 0,
    };

    // Fetch workers from API
    const fetchWorkers = async () => {
        try {
            setIsLoading(true);
            const response = await apiService.get(API_ENDPOINTS.WORKERS.LIST);
            console.log('Workers API Response:', response);

            if (response.success && response.data) {
                let workersData: Worker[] = [];
                if (Array.isArray(response.data)) {
                    workersData = response.data;
                } else if (response.data.workers && Array.isArray(response.data.workers)) {
                    workersData = response.data.workers;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    workersData = response.data.data;
                }
                setWorkers(workersData);
            }
        } catch (error) {
            console.log('Error fetching workers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkers();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {/* Header */}
            <ScreenHeader title="Business Dashboard" />

            <ScrollView
                style={[styles.scrollView, { backgroundColor, marginTop: 16 }]}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                horizontal={false}
                bounces={false}
                alwaysBounceHorizontal={false}
                alwaysBounceVertical={false}
                contentContainerStyle={{
                    paddingBottom: insets.bottom + 20,
                    width: width,
                    maxWidth: width,
                }}
            >

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
                        <View style={[styles.statIcon, { backgroundColor: primaryLight }]}>
                            <IconSymbol name="person.2.fill" size={20} color={primaryColor} />
                        </View>
                        <Text style={[styles.statValue, { color: textColor }]}>{stats.totalWorkers}</Text>
                        <Text style={[styles.statLabel, { color: textSecondary }]}>Total Workers</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
                        <View style={[styles.statIcon, { backgroundColor: '#FAF5FF' }]}>
                            <IconSymbol name="calendar" size={20} color="#9333EA" />
                        </View>
                        <Text style={[styles.statValue, { color: '#9333EA' }]}>{stats.bookings}</Text>
                        <Text style={[styles.statLabel, { color: textSecondary }]}>Bookings</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <View style={[styles.tabs, { backgroundColor: cardBg, borderColor }]}>
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                { backgroundColor: cardBg },
                                activeTab === 'workers' && { backgroundColor: primaryColor }
                            ]}
                            onPress={() => setActiveTab('workers')}
                        >
                            <Text style={[
                                styles.tabText,
                                { color: textSecondary },
                                activeTab === 'workers' && { color: '#FFFFFF' }
                            ]}>
                                Workers
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                { backgroundColor: cardBg },
                                activeTab === 'bookings' && { backgroundColor: primaryColor }
                            ]}
                            onPress={() => setActiveTab('bookings')}
                        >
                            <Text style={[
                                styles.tabText,
                                { color: textSecondary },
                                activeTab === 'bookings' && { color: '#FFFFFF' }
                            ]}>
                                Bookings
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.contentSection}>
                    <View style={styles.sectionHeader}>
                        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
                            {activeTab === 'workers' ? 'Recent Workers' : 'Recent Bookings'}
                        </ThemedText>
                        <TouchableOpacity onPress={() => router.push(activeTab === 'workers' ? '/workers' : '/profile/bookings')}>
                            <Text style={[styles.viewAllText, { color: primaryColor }]}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {workers.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: cardBg, borderColor }]}>
                            <View style={[styles.emptyIconContainer, { backgroundColor: cardBg }]}>
                                <IconSymbol
                                    name={activeTab === 'workers' ? "person.2.fill" : "calendar"}
                                    size={48}
                                    color={textMuted}
                                />
                            </View>
                            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                                {activeTab === 'workers' ? 'No workers added yet' : 'No bookings yet'}
                            </ThemedText>
                            {activeTab === 'workers' && (
                                <TouchableOpacity
                                    style={[styles.createButton, { backgroundColor: primaryColor }]}
                                    onPress={() => router.push('/workers/add')}
                                >
                                    <Text style={styles.createButtonText}>Add Your First Worker</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        // Render workers list here
                        <View />
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: width,
        maxWidth: width,
    },
    headerBackground: {
        backgroundColor: '#6366F1',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
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
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 24,
        gap: 12,
        width: width,
        maxWidth: width,
    },
    statCard: {
        width: (width - 48 - 12) / 2, // (screen width - padding*2 - gap) / 2
        maxWidth: (width - 48 - 12) / 2,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    tabsContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
        width: width,
        maxWidth: width,
    },
    tabs: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 4,
        borderWidth: 1,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    contentSection: {
        paddingHorizontal: 24,
        width: width,
        maxWidth: width,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    emptyIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        marginBottom: 20,
        fontWeight: '500',
    },
    createButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
