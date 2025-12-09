/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Enhanced with comprehensive dark mode support and premium color palette.
 */

import { Platform } from 'react-native';

// Primary brand colors - Indigo/Purple theme from kamwaalay.com
const tintColorLight = '#6366F1'; // Primary indigo
const tintColorDark = '#818CF8'; // Lighter indigo for dark mode

export const Colors = {
  light: {
    // Base colors
    text: '#11181C',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    backgroundTertiary: '#F3F4F6',

    // Brand colors
    tint: tintColorLight,
    primary: '#6366F1', // Primary indigo
    primaryLight: '#EEF2FF', // Light indigo background
    primaryDark: '#4F46E5', // Darker indigo for hover/pressed states
    secondary: '#A855F7', // Purple accent
    secondaryLight: '#F3E8FF',
    secondaryDark: '#9333EA',

    // UI elements
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    card: '#FFFFFF',
    cardHover: '#F9FAFB',

    // Icons
    icon: '#6366F1',
    iconSecondary: '#6B7280',
    iconMuted: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,

    // Status colors
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',

    // Gradients
    gradientStart: '#6366F1',
    gradientEnd: '#A855F7',

    // Shadows
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowDark: 'rgba(0, 0, 0, 0.2)',
  },
  dark: {
    // Base colors
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textMuted: '#9CA3AF',
    background: '#0F172A', // Slate 900
    backgroundSecondary: '#1E293B', // Slate 800
    backgroundTertiary: '#334155', // Slate 700

    // Brand colors
    tint: tintColorDark,
    primary: '#818CF8', // Lighter indigo for dark mode
    primaryLight: '#312E81', // Dark indigo background
    primaryDark: '#6366F1', // Standard indigo
    secondary: '#C084FC', // Lighter purple for dark mode
    secondaryLight: '#581C87',
    secondaryDark: '#A855F7',

    // UI elements
    border: '#334155',
    borderLight: '#1E293B',
    card: '#1E293B',
    cardHover: '#334155',

    // Icons
    icon: '#818CF8',
    iconSecondary: '#D1D5DB',
    iconMuted: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorDark,

    // Status colors
    success: '#34D399',
    successLight: '#064E3B',
    warning: '#FBBF24',
    warningLight: '#78350F',
    error: '#F87171',
    errorLight: '#7F1D1D',
    info: '#60A5FA',
    infoLight: '#1E3A8A',

    // Gradients
    gradientStart: '#818CF8',
    gradientEnd: '#C084FC',

    // Shadows
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowDark: 'rgba(0, 0, 0, 0.5)',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
