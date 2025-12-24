import { Alert, Platform, ToastAndroid } from 'react-native';

/**
 * Toast utility for providing user feedback
 * Uses ToastAndroid on Android for a non-intrusive experience
 * Falls back to Alert on iOS (or can be extended with a custom toast component)
 */
export const toast = {
    /**
     * Show a success or info message
     */
    success: (message: string) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            // iOS fallback
            Alert.alert('Success', message);
        }
    },

    /**
     * Show an error message
     */
    error: (message: string) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.LONG);
        } else {
            // iOS fallback
            Alert.alert('Error', message);
        }
    },

    /**
     * Show a generic info message
     */
    info: (message: string) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            // iOS fallback
            Alert.alert('Info', message);
        }
    }
};

export default toast;
