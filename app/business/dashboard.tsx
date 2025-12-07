import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function BusinessDashboardScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'workers' | 'bookings'>('workers');

    // Mock data - replace with real data from API
    const stats = {
        totalWorkers: 0,
        activeWorkers: 0,
        pending: 0,
        verified: 0,
        bookings: 0,
    };

    const workers: any[] = []; // Replace with actual workers data

    return (
        <View style={styles.container}>
            {/* Decorative Background Elements */}
            <View style={styles.topCircle} />
            <View style={styles.bottomCircle} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <ThemedText type="title" style={styles.title}>
                            Dashboard
                        </ThemedText>
                        <ThemedText style={styles.subtitle}>
                            Overview of your agency
                        </ThemedText>
                    </View>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => router.push('/workers/add')}
                    >
                        <IconSymbol name="plus.circle.fill" size={32} color="#6366F1" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                >
                    {/* Stats Cards */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
                                <IconSymbol name="person.2.fill" size={20} color="#6366F1" />
                            </View>
                            <Text style={styles.statValue}>{stats.totalWorkers}</Text>
                            <Text style={styles.statLabel}>Total Workers</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
                                <IconSymbol name="checkmark.circle.fill" size={20} color="#16A34A" />
                            </View>
                            <Text style={[styles.statValue, { color: '#16A34A' }]}>{stats.activeWorkers}</Text>
                            <Text style={styles.statLabel}>Active</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#FFFBEB' }]}>
                                <IconSymbol name="clock.fill" size={20} color="#D97706" />
                            </View>
                            <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.pending}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#FAF5FF' }]}>
                                <IconSymbol name="calendar" size={20} color="#9333EA" />
                            </View>
                            <Text style={[styles.statValue, { color: '#9333EA' }]}>{stats.bookings}</Text>
                            <Text style={styles.statLabel}>Bookings</Text>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsContainer}>
                        <View style={styles.tabs}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'workers' && styles.tabActive]}
                                onPress={() => setActiveTab('workers')}
                            >
                                <Text style={[styles.tabText, activeTab === 'workers' && styles.tabTextActive]}>
                                    Workers
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'bookings' && styles.tabActive]}
                                onPress={() => setActiveTab('bookings')}
                            >
                                <Text style={[styles.tabText, activeTab === 'bookings' && styles.tabTextActive]}>
                                    Bookings
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Content */}
                    <View style={styles.contentSection}>
                        <View style={styles.sectionHeader}>
                            <ThemedText type="subtitle" style={styles.sectionTitle}>
                                {activeTab === 'workers' ? 'Recent Workers' : 'Recent Bookings'}
                            </ThemedText>
                            <TouchableOpacity onPress={() => router.push(activeTab === 'workers' ? '/workers' : '/bookings')}>
                                <Text style={styles.viewAllText}>View All</Text>
                            </TouchableOpacity>
                        </View>

                        {workers.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconContainer}>
                                    <IconSymbol
                                        name={activeTab === 'workers' ? "person.2.fill" : "calendar"}
                                        size={48}
                                        color="#9CA3AF"
                                    />
                                </View>
                                <ThemedText style={styles.emptyText}>
                                    {activeTab === 'workers' ? 'No workers added yet' : 'No bookings yet'}
                                </ThemedText>
                                {activeTab === 'workers' && (
                                    <TouchableOpacity
                                        style={styles.createButton}
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
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    addButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 24,
        gap: 12,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
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
        color: '#1A1A1A',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    tabsContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    tabActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    tabTextActive: {
        color: '#6366F1',
    },
    contentSection: {
        paddingHorizontal: 24,
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
        color: '#1A1A1A',
    },
    viewAllText: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderStyle: 'dashed',
    },
    emptyIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
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
