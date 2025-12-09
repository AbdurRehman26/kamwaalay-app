import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
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

    // Theme colors
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const textMuted = useThemeColor({}, 'textMuted');
    const primaryColor = useThemeColor({}, 'primary');
    const cardBg = useThemeColor({}, 'card');

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
                        <IconSymbol name="person.2.fill" size={64} color={textMuted} />
                        <ThemedText type="subtitle" style={[styles.emptyTitle, { color: textColor }]}>
                            No Workers Yet
                        </ThemedText>
                        <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                            Add your first worker to get started
                        </ThemedText>
                        <TouchableOpacity
                            style={[styles.addWorkerButton, { backgroundColor: primaryColor }]}
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
    },
    emptyText: {
        fontSize: 15,
        opacity: 0.6,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    addWorkerButton: {
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
