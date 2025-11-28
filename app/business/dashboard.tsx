import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function BusinessDashboardScreen() {
    const router = useRouter();
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
        <ThemedView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <ThemedText type="title" style={styles.title}>
                        Business Dashboard
                    </ThemedText>
                    <ThemedText style={styles.subtitle}>
                        Manage your agency workers and bookings
                    </ThemedText>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/workers/add')}
                >
                    <Text style={styles.addButtonText}>Add New Worker</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.totalWorkers}</Text>
                        <Text style={styles.statLabel}>Total Workers</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardGreen]}>
                        <Text style={[styles.statValue, styles.statValueGreen]}>{stats.activeWorkers}</Text>
                        <Text style={styles.statLabel}>Active Workers</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardYellow]}>
                        <Text style={[styles.statValue, styles.statValueYellow]}>{stats.pending}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardBlue]}>
                        <Text style={[styles.statValue, styles.statValueBlue]}>{stats.verified}</Text>
                        <Text style={styles.statLabel}>Verified</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardPurple]}>
                        <Text style={[styles.statValue, styles.statValuePurple]}>{stats.bookings}</Text>
                        <Text style={styles.statLabel}>Bookings</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'workers' && styles.tabActive]}
                        onPress={() => setActiveTab('workers')}
                    >
                        <Text style={[styles.tabText, activeTab === 'workers' && styles.tabTextActive]}>
                            Recent Workers
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'bookings' && styles.tabActive]}
                        onPress={() => setActiveTab('bookings')}
                    >
                        <Text style={[styles.tabText, activeTab === 'bookings' && styles.tabTextActive]}>
                            Recent Bookings
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.contentSection}>
                    <View style={styles.sectionHeader}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            Recent Workers
                        </ThemedText>
                        <TouchableOpacity onPress={() => router.push('/workers')}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {workers.length === 0 ? (
                        <View style={styles.emptyState}>
                            <ThemedText style={styles.emptyText}>No workers yet</ThemedText>
                            <TouchableOpacity
                                style={styles.addWorkerLink}
                                onPress={() => router.push('/workers/add')}
                            >
                                <Text style={styles.addWorkerLinkText}>Add Your First Worker</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // Render workers list here
                        <View />
                    )}
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    addButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginLeft: 12,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '30%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    statCardGreen: {
        backgroundColor: '#F0FDF4',
        borderColor: '#BBF7D0',
    },
    statCardYellow: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FEF3C7',
    },
    statCardBlue: {
        backgroundColor: '#EFF6FF',
        borderColor: '#DBEAFE',
    },
    statCardPurple: {
        backgroundColor: '#FAF5FF',
        borderColor: '#E9D5FF',
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    statValueGreen: {
        color: '#16A34A',
    },
    statValueYellow: {
        color: '#D97706',
    },
    statValueBlue: {
        color: '#2563EB',
    },
    statValuePurple: {
        color: '#9333EA',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 2,
        borderBottomColor: '#E8E8E8',
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginRight: 20,
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#6366F1',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    tabTextActive: {
        color: '#6366F1',
        fontWeight: '600',
    },
    contentSection: {
        padding: 20,
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
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 12,
    },
    addWorkerLink: {
        marginTop: 8,
    },
    addWorkerLinkText: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '600',
    },
});
