import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const { user, isLoading } = useAuth();

    // Show a loading screen while checking authentication status
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    // If no user, redirect to login
    if (!user) {
        return <Redirect href="/auth/phone-login" />;
    }

    // If user is not verified, redirect to OTP verify
    if (user.isVerified === false) {
        return <Redirect href="/auth/otp-verify" />;
    }

    // If user has no type selected, redirect to user-type selection
    if (!user.userType) {
        return <Redirect href="/auth/user-type" />;
    }

    // If onboarding is not completed, redirect to onboarding start
    if (user.onboardingStatus !== 'completed') {
        return <Redirect href="/onboarding/start" />;
    }

    // All checks passed, redirect to the main tabs
    return <Redirect href="/(tabs)" />;
}
