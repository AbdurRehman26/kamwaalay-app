import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'auto';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
    themeMode: ThemeMode;
    colorScheme: ColorScheme;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@kamwaalay_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
    const [colorScheme, setColorScheme] = useState<ColorScheme>('light');

    // Load saved theme preference on mount
    useEffect(() => {
        loadThemePreference();
    }, []);

    // Listen to system theme changes when in auto mode
    useEffect(() => {
        if (themeMode === 'auto') {
            const subscription = Appearance.addChangeListener(({ colorScheme }) => {
                setColorScheme(colorScheme === 'dark' ? 'dark' : 'light');
            });
            return () => subscription.remove();
        }
    }, [themeMode]);

    // Update color scheme when theme mode changes
    useEffect(() => {
        if (themeMode === 'auto') {
            const systemScheme = Appearance.getColorScheme();
            setColorScheme(systemScheme === 'dark' ? 'dark' : 'light');
        } else {
            setColorScheme(themeMode);
        }
    }, [themeMode]);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto')) {
                setThemeModeState(savedTheme as ThemeMode);
            }
        } catch (error) {
            console.error('Error loading theme preference:', error);
        }
    };

    const setThemeMode = async (mode: ThemeMode) => {
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
            setThemeModeState(mode);
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    };

    const toggleTheme = () => {
        const newMode = colorScheme === 'light' ? 'dark' : 'light';
        setThemeMode(newMode);
    };

    return (
        <ThemeContext.Provider
            value={{
                themeMode,
                colorScheme,
                setThemeMode,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
