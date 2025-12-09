import { useThemeColor } from '@/hooks/use-theme-color';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';

interface GradientButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
}

export function GradientButton({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    style,
    textStyle,
    fullWidth = false,
}: GradientButtonProps) {
    const gradientStart = useThemeColor({}, 'gradientStart');
    const gradientEnd = useThemeColor({}, 'gradientEnd');
    const primaryColor = useThemeColor({}, 'primary');
    const borderColor = useThemeColor({}, 'border');
    const textColor = useThemeColor({}, 'text');

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return { padding: 12, fontSize: 14 };
            case 'large':
                return { padding: 20, fontSize: 18 };
            default:
                return { padding: 16, fontSize: 16 };
        }
    };

    const sizeStyles = getSizeStyles();

    if (variant === 'primary') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.8}
                style={[
                    styles.container,
                    fullWidth && styles.fullWidth,
                    disabled && styles.disabled,
                    style,
                ]}
            >
                <LinearGradient
                    colors={[gradientStart, gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.gradient,
                        { padding: sizeStyles.padding },
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={[styles.text, { fontSize: sizeStyles.fontSize }, textStyle]}>
                            {title}
                        </Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    if (variant === 'secondary') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.8}
                style={[
                    styles.container,
                    fullWidth && styles.fullWidth,
                    disabled && styles.disabled,
                    style,
                ]}
            >
                <LinearGradient
                    colors={[gradientStart, gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.gradient,
                        styles.secondaryGradient,
                        { padding: sizeStyles.padding },
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator color={primaryColor} />
                    ) : (
                        <Text
                            style={[
                                styles.text,
                                styles.secondaryText,
                                { fontSize: sizeStyles.fontSize, color: primaryColor },
                                textStyle,
                            ]}
                        >
                            {title}
                        </Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    // Outline variant
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[
                styles.container,
                styles.outlineContainer,
                { borderColor: primaryColor, padding: sizeStyles.padding },
                fullWidth && styles.fullWidth,
                disabled && styles.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={primaryColor} />
            ) : (
                <Text
                    style={[
                        styles.text,
                        styles.outlineText,
                        { fontSize: sizeStyles.fontSize, color: textColor },
                        textStyle,
                    ]}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    fullWidth: {
        width: '100%',
    },
    gradient: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    secondaryGradient: {
        opacity: 0.1,
    },
    text: {
        color: '#FFFFFF',
        fontWeight: '600',
        textAlign: 'center',
    },
    secondaryText: {
        fontWeight: '600',
    },
    outlineContainer: {
        borderWidth: 2,
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outlineText: {
        fontWeight: '600',
    },
    disabled: {
        opacity: 0.5,
    },
});
