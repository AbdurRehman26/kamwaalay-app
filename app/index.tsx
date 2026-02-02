import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const { user, isLoading, hasSeenGuide, isBeginningGuidePassed } = useAuth();

    // Show a loading screen while checking authentication status
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    // MANDATORY: On app opening always show the guide flow first no matter what
    if (!isBeginningGuidePassed) {
        return <Redirect href="/guide" />;
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

    // HIGHEST PRIORITY REDIRECTION: Workers see guide BEFORE onboarding
    // OR if they have no services (even if onboarding is technically "complete")
    const normalizedType = user.userType?.toLowerCase();
    const helperProfile = user.profileData as any;
    const hasNoServices = !helperProfile || !helperProfile.serviceOfferings || helperProfile.serviceOfferings.length === 0;

    const shouldShowBusinessGuide = normalizedType === 'business' && !hasSeenGuide;

    if (normalizedType === 'helper' && (!hasSeenGuide || (user.onboardingStatus === 'completed' && hasNoServices))) {
        return <Redirect href="/guide" />;
    }

    if (shouldShowBusinessGuide) {
        return <Redirect href="/guide" />;
    }

    // Customer guide after onboarding
    if (normalizedType === 'user' && !hasSeenGuide && user.onboardingStatus === 'completed') {
        return <Redirect href="/guide" />;
    }

    // If onboarding is not completed, redirect to onboarding start
    if (user.onboardingStatus !== 'completed') {
        return <Redirect href="/onboarding/start" />;
    }

    // All checks passed, redirect to the main tabs
    return <Redirect href="/(tabs)" />;
}
