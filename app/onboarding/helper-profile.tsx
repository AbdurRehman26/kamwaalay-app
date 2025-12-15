import { Stepper } from '@/components/ui/stepper';
import { HelperProfile, useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Step1ServiceOffer from './helper-steps/step1-service-offer';
import Step2ProfileVerification from './helper-steps/step2-profile-verification';
import Step3CompleteProfile from './helper-steps/step3-complete-profile';

const { width } = Dimensions.get('window');

interface Location {
  id: number | string;
  name: string;
  area?: string;
}

interface ServiceOfferData {
  serviceTypes: string[];
  locations: Location[];
  workType: string;
  monthlyRate: string;
  description: string;
}

interface ProfileVerificationData {
  nicFile: any | null;
  nicNumber: string;
  photoFile: any | null;
}

interface CompleteProfileData {
  experience: string;
  bio: string;
  age: string;
  gender: string;
  religion: string;
  languages: string;
}

const STEP_LABELS = ['Service Offer', 'Verification', 'Complete Profile'];

export default function HelperProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');

  // Step 1: Service Offer
  const [serviceOfferData, setServiceOfferData] = useState<ServiceOfferData>({
    serviceTypes: [],
    locations: [],
    workType: '',
    monthlyRate: '',
    description: '',
  });

  // Step 2: Profile Verification
  const [verificationData, setVerificationData] = useState<ProfileVerificationData>({
    nicFile: null,
    nicNumber: '',
    photoFile: null,
  });

  // Step 3: Complete Profile
  const [profileData, setProfileData] = useState<CompleteProfileData>({
    experience: '',
    bio: '',
    age: '',
    gender: '',
    religion: '',
    languages: '',
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.name) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Map service offer data to service offerings
      const serviceOfferings = serviceOfferData.serviceTypes.map((serviceType) => ({
        id: `${serviceType}-${Date.now()}`,
        serviceName: serviceType,
        category: serviceType,
        description: serviceOfferData.description,
        price: serviceOfferData.monthlyRate ? parseFloat(serviceOfferData.monthlyRate) : undefined,
        priceUnit: 'month' as const,
        locations: serviceOfferData.locations.map((loc) => loc.area || loc.name),
      }));

      // Create HelperProfile with all data
      const helperProfile: HelperProfile = {
        name: user.name,
        bio: profileData.bio,
        experience: profileData.experience,
        serviceOfferings,
        locations: serviceOfferData.locations.map((loc) => loc.area || loc.name),
        age: profileData.age,
        gender: profileData.gender,
        religion: profileData.religion,
        languages: profileData.languages ? profileData.languages.split(',').map(l => l.trim()).filter(l => l) : [],
      };

      // Store verification and service offer data in a way that completeOnboarding can access
      // We'll pass this through the profileData or extend the interface
      // For now, we'll store it in a way that the API can use
      await completeOnboarding(helperProfile);

      // Navigate to tabs
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Onboarding error:', error);
      // Stay on the same screen so user can retry
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1ServiceOffer
            data={serviceOfferData}
            onChange={setServiceOfferData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <Step2ProfileVerification
            data={verificationData}
            onChange={setVerificationData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <Step3CompleteProfile
            data={profileData}
            onChange={setProfileData}
            onBack={handleBack}
            onSubmit={handleSubmit}
          />
        );
      default:
        return null;
    }
  };

  if (isSubmitting) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.loadingContainer, { backgroundColor }]}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>

      <View style={[styles.content, { paddingTop: insets.top }]}>
        <Stepper
          currentStep={currentStep}
          totalSteps={3}
          stepLabels={STEP_LABELS}
        />
        <View style={styles.stepContainer}>
          {renderStep()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCircle: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
  },
});
