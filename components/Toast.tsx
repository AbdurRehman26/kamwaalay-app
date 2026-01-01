import { toast, ToastType } from '@/utils/toast';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const Toast = () => {
    const [message, setMessage] = useState<string | null>(null);
    const [type, setType] = useState<ToastType>('info');
    const opacity = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const unsubscribe = toast.subscribe((msg, t) => {
            setMessage(msg);
            setType(t);

            // Reset opacity if a new toast comes while one is showing
            opacity.setValue(0);

            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(1500), // Faster auto-hide (1.5s)
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Only clear message if component is still mounted/valid
                // But we rely on opacity 0 to hide it visually
            });
        });

        return unsubscribe;
    }, []);

    if (!message) return null;

    const bgColors = {
        success: 'rgba(76, 175, 80, 0.85)', // Green with transparency
        error: 'rgba(244, 67, 54, 0.85)',   // Red with transparency
        info: 'rgba(33, 150, 243, 0.85)',    // Blue with transparency
    };

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    backgroundColor: bgColors[type],
                    bottom: insets.bottom + 80, // Position above tabs/bottom area
                }
            ]}
            pointerEvents="none" // Allow clicks to pass through if transparent, but here we want it visible
        >
            <Text style={styles.icon}>{icons[type]}</Text>
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    text: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 10,
        flex: 1,
    },
    icon: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
