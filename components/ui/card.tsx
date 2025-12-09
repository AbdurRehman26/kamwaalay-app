import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
    onPress?: () => void;
    style?: ViewStyle;
    padding?: number;
}

export function Card({
    children,
    variant = 'default',
    onPress,
    style,
    padding = 16,
}: CardProps) {
    const cardBg = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const shadowColor = useThemeColor({}, 'shadow');

    const getVariantStyles = (): ViewStyle => {
        switch (variant) {
            case 'elevated':
                return {
                    backgroundColor: cardBg,
                    shadowColor: shadowColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 8,
                    elevation: 3,
                };
            case 'outlined':
                return {
                    backgroundColor: cardBg,
                    borderWidth: 1,
                    borderColor: borderColor,
                };
            case 'gradient':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: borderColor,
                };
            default:
                return {
                    backgroundColor: cardBg,
                    shadowColor: shadowColor,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 1,
                    shadowRadius: 3,
                    elevation: 1,
                };
        }
    };

    const cardStyles = [
        styles.card,
        { padding },
        getVariantStyles(),
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={cardStyles}
            >
                {children}
            </TouchableOpacity>
        );
    }

    return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        overflow: 'hidden',
    },
});
