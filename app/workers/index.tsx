import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WorkersListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // TODO: Fetch workers from API
    const workers: any[] = [];

    return (
        <ThemedView style={styles.container}>
            <ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            >
                {workers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <IconSymbol name="person.2.fill" size={64} color="#CCCCCC" />
                        <ThemedText type="subtitle" style={styles.emptyTitle}>
                            No Workers Yet
                        </ThemedText>
                        <ThemedText style={styles.emptyText}>
                            Add your first worker to get started
                        </ThemedText>
                        <TouchableOpacity
                            style={styles.addWorkerButton}
                            onPress={() => router.push('/workers/add')}
                        >
                            <Text style={styles.addWorkerButtonText}>Add Worker</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.workersList}>
                        {/* TODO: Render workers list */}
                    </View>
                )}
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollView: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 24,
        marginBottom: 8,
        color: '#1A1A1A',
    },
    emptyText: {
        fontSize: 15,
        opacity: 0.6,
        textAlign: 'center',
        color: '#666',
        lineHeight: 22,
        marginBottom: 24,
    },
    addWorkerButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
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
        padding: 20,
    },
});
