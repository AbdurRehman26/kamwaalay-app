import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function WorkersListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Theme colors
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const textMuted = useThemeColor({}, 'textMuted');
    const primaryColor = useThemeColor({}, 'primary');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const cardBg = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');

    // TODO: Fetch workers from API
    const workers: any[] = [];

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {/* Header */}
            <ScreenHeader title="My Workers" />

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

                    {/* Decorative Background Elements */}


                    {/* Content */}
                    <View style={styles.contentContainer}>
                        {workers.length === 0 ? (
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
                                {/* TODO: Render workers list */}
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
    topCircle: {
        position: 'absolute',
        top: -width * 0.4,
        right: -width * 0.2,
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
    },
    bottomCircle: {
        position: 'absolute',
        bottom: -width * 0.3,
        left: -width * 0.2,
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: width * 0.35,
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    headerBackground: {
        backgroundColor: '#6366F1',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        zIndex: 10,
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
    addButton: {
        padding: 4,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
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
        padding: 20,
    },
});
