import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface BadgeProps {
    text: string;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary';
    size?: 'small' | 'medium' | 'large';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export function Badge({
    text,
    variant = 'primary',
    size = 'medium',
    style,
    textStyle,
}: BadgeProps) {
    const successColor = useThemeColor({}, 'success');
    const successLight = useThemeColor({}, 'successLight');
    const warningColor = useThemeColor({}, 'warning');
    const warningLight = useThemeColor({}, 'warningLight');
    const errorColor = useThemeColor({}, 'error');
    const errorLight = useThemeColor({}, 'errorLight');
    const infoColor = useThemeColor({}, 'info');
    const infoLight = useThemeColor({}, 'infoLight');
    const primaryColor = useThemeColor({}, 'primary');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const secondaryColor = useThemeColor({}, 'secondary');
    const secondaryLight = useThemeColor({}, 'secondaryLight');

    const getVariantColors = () => {
        switch (variant) {
            case 'success':
                return { bg: successLight, text: successColor };
            case 'warning':
                return { bg: warningLight, text: warningColor };
            case 'error':
                return { bg: errorLight, text: errorColor };
            case 'info':
                return { bg: infoLight, text: infoColor };
            case 'secondary':
                return { bg: secondaryLight, text: secondaryColor };
            default:
                return { bg: primaryLight, text: primaryColor };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return { paddingVertical: 4, paddingHorizontal: 8, fontSize: 12 };
            case 'large':
                return { paddingVertical: 8, paddingHorizontal: 16, fontSize: 16 };
            default:
                return { paddingVertical: 6, paddingHorizontal: 12, fontSize: 14 };
        }
    };

    const colors = getVariantColors();
    const sizeStyles = getSizeStyles();

    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: colors.bg,
                    paddingVertical: sizeStyles.paddingVertical,
                    paddingHorizontal: sizeStyles.paddingHorizontal,
                },
                style,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    {
                        color: colors.text,
                        fontSize: sizeStyles.fontSize,
                    },
                    textStyle,
                ]}
            >
                {text}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        borderRadius: 16,
        alignSelf: 'flex-start',
    },
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
});
