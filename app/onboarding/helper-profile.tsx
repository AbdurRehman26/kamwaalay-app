import { IconSymbol } from '@/components/ui/icon-symbol';
import { Stepper } from '@/components/ui/stepper';
import { HelperProfile, useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { toast } from '@/utils/toast';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
  languages: number[];
  address?: string; // New
  latitude?: number; // New
  longitude?: number; // New
}

const STEP_LABELS = ['Service Offer', 'Verification', 'Complete Profile'];

export default function HelperProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    languages: [],
    address: '',
    latitude: undefined,
    longitude: undefined,
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
      toast.error('Name is required');
      return;
    }

    if (!profileData.address || !profileData.latitude || !profileData.longitude) {
      setErrorMessage('Please pin your location on the map in the final step.');
      setErrorModalVisible(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Map service offer data to service offerings
      const serviceOfferings = serviceOfferData.serviceTypes.map((serviceId) => ({
        id: serviceId,
        serviceName: `Service ${serviceId}`, // We only have ID here, real name will be fetched/updated by API
        category: serviceId,
        description: serviceOfferData.description,
        price: serviceOfferData.monthlyRate ? parseFloat(serviceOfferData.monthlyRate) : undefined,
        priceUnit: 'month' as const,
        locations: [profileData.address || ''], // Use specific address
      }));

      // Create HelperProfile with all data
      const helperProfile: HelperProfile = {
        name: user.name,
        bio: profileData.bio,
        experience: profileData.experience,
        serviceOfferings,
        locations: [profileData.address || ''],
        age: profileData.age,
        gender: profileData.gender,
        religion: profileData.religion,
        languages: profileData.languages,
      };

      // Store verification and service offer data in a way that completeOnboarding can access
      await completeOnboarding(helperProfile, {
        verification: {
          nicFile: verificationData.nicFile,
          nicNumber: verificationData.nicNumber,
          photoFile: verificationData.photoFile
        },
        serviceOffer: {
          serviceTypes: serviceOfferData.serviceTypes,
          // If the API supports detailed location object in locations array, we can construct it
          // OR if we updated AuthContext to look for locations elsewhere.
          // For now, let's assume we pass the address/coords in a way AuthContext understands if we modify it,
          // or we just pass it here and handle it in AuthContext.
          // Since completeOnboarding takes specific structure, we should adhere to it or modify it.
          // Let's pass the raw address string in locations for now as placeholder if API expects string/number array,
          // BUT we are modifying AuthContext to look for lat/long too.
          locations: serviceOfferData.locations, // Keep this empty if step 1 doesn't have it
          workType: serviceOfferData.workType,
          monthlyRate: serviceOfferData.monthlyRate,
          description: serviceOfferData.description,
          // Pass new fields to completeOnboarding (we need to update AuthContext type signature if strictly typed, but it's apt to accept additional props if typed 'any' or extended)
          // Actually completeOnboarding signature is:
          // (profileData: HelperProfile | BusinessProfile, additionalData?: { ... })
          // We can add fields to additionalData object even if type definition in this file doesn't show it, if we cast or update type.
          // Let's pass it in serviceOffer or a new field.
          // We'll add it to 'serviceOffer' part of additionalData as that seems most relevant place for 'locations'.
          ...({
            latitude: profileData.latitude,
            longitude: profileData.longitude,
            address: profileData.address
          } as any)
        }
      });

      // Navigate to tabs
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      // Stay on the same screen so user can retry
      // Stay on the same screen so user can retry
      let msg = error.message || 'Failed to complete onboarding. Please try again.';

      if (error.validationErrors) {
        if (typeof error.validationErrors === 'object') {
          // Format object errors (e.g. { field: ['error'] }) into a list
          const errors = Object.values(error.validationErrors).flat();
          if (errors.length > 0) {
            msg = errors.join('\n• ');
            // Add bullet point to first item if there are multiple lines
            if (errors.length > 0) msg = '• ' + msg;
          }
        } else if (Array.isArray(error.validationErrors)) {
          const errors = error.validationErrors;
          if (errors.length > 0) {
            msg = errors.join('\n• ');
            if (errors.length > 0) msg = '• ' + msg;
          }
        }
      }

      setErrorMessage(msg);
      setErrorModalVisible(true);
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
            isLoading={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  /* 
  // Removed full screen loader to show button loader instead
  if (isSubmitting) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.loadingContainer, { backgroundColor }]}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      </View>
    );
  } 
  */

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

      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: backgroundColor }]}>
            <View style={styles.errorIconContainer}>
              <IconSymbol name="exclamationmark.circle.fill" size={48} color="#FF3B30" />
            </View>
            <Text style={[styles.modalTitle, { color: primaryColor }]}>Error</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: primaryColor }]}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
