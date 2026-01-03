import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
    title: string;
    showBackButton?: boolean;
    onBackPress?: () => void;
    rightAction?: {
        icon?: string;
        label?: string;
        onPress: () => void;
    };
    displayRightPlaceholder?: boolean;
    leftElement?: React.ReactNode;
    rightElement?: React.ReactNode;
}

export function ScreenHeader({
    title,
    showBackButton = true,
    onBackPress,
    rightAction,
    rightElement,
    displayRightPlaceholder = true,
    leftElement,
}: ScreenHeaderProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleBack = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            router.back();
        }
    };

    return (
        <View style={styles.headerBackground}>
            {/* Top Spacer including Safe Area */}
            <View style={{ height: insets.top - 5 }} />

            {/* Content Row - Fixed Height */}
            <View style={styles.headerRow}>
                {/* Left side - Back button or placeholder */}
                {leftElement ? (
                    leftElement
                ) : showBackButton ? (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <IconSymbol name="chevron.left" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}

                {/* Title */}
                <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>

                {/* Right side - Custom element, action button, or placeholder */}
                {rightElement ? (
                    rightElement
                ) : rightAction ? (
                    <TouchableOpacity onPress={rightAction.onPress} style={styles.actionButton}>
                        {rightAction.icon && (
                            <IconSymbol name={rightAction.icon as any} size={18} color="#FFFFFF" />
                        )}
                        {rightAction.label && (
                            <Text style={styles.actionButtonText}>{rightAction.label}</Text>
                        )}
                    </TouchableOpacity>
                ) : displayRightPlaceholder ? (
                    <View style={styles.placeholder} />
                ) : null}
            </View>

            {/* Bottom Spacer */}
            <View style={{ height: 10 }} />
        </View>
    );
}

const styles = StyleSheet.create({
    headerBackground: {
        backgroundColor: '#6366F1',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        zIndex: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 44,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        gap: 6,
        height: 36, // Enforce standard height
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    placeholder: {
        width: 36, // Match backButton width for symmetry
    },
});
