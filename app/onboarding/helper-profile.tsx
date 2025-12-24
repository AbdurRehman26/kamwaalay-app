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
          locations: serviceOfferData.locations,
          workType: serviceOfferData.workType,
          monthlyRate: serviceOfferData.monthlyRate,
          description: serviceOfferData.description
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
