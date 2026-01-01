
export type ToastType = 'success' | 'error' | 'info';
type ToastListener = (message: string, type: ToastType) => void;

let listeners: ToastListener[] = [];

/**
 * Toast utility for providing user feedback
 * Supports cross-platform custom toasts via subscription
 */
export const toast = {
    /**
     * Subscribe to toast events
     */
    subscribe: (listener: ToastListener) => {
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    /**
     * Show a success message
     */
    success: (message: string) => {
        emit(message, 'success');
        // Fallback for Android native toast if desired, but we'll stick to custom for consistency
        // if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT); 
    },

    /**
     * Show an error message
     */
    error: (message: string) => {
        emit(message, 'error');
    },

    /**
     * Show a generic info message
     */
    info: (message: string) => {
        emit(message, 'info');
    }
};

const emit = (message: string, type: ToastType) => {
    listeners.forEach(l => l(message, type));
};

export default toast;
