import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function OTPVerifyScreen() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();
  const { verifyOTP, resendOTP, user } = useAuth();

  // If user is already verified, redirect to appropriate screen
  useEffect(() => {
    if (user && user.isVerified === true) {
      if (user.onboardingStatus === 'completed') {
        router.replace('/(tabs)');
      } else if (user.onboardingStatus === 'in_progress') {
        router.replace('/onboarding/start');
      } else if (user.userType) {
        router.replace('/onboarding/start');
      } else {
        router.replace('/auth/user-type');
      }
    }
  }, [user, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const handleOtpChange = (value: string, index: number) => {
    // Only allow numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // If the value contains non-numeric characters, ignore it
    if (numericValue !== value && value.length > 0) {
      return; // Reject non-numeric input
    }
    
    if (numericValue.length > 1) {
      // If multiple digits pasted, take only the first one
      const newOtp = [...otp];
      newOtp[index] = numericValue[0];
      setOtp(newOtp);
      
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Removed automatic verification - user must click verify button
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code');
      return;
    }

    if (isVerifying) {
      return; // Prevent multiple submissions
    }

    // Clear any previous error message
    setErrorMessage(null);

    setIsVerifying(true);
    try {
      const isValid = await verifyOTP(code);
      if (isValid) {
        // Navigation will be handled by the useEffect that checks isVerified
        // No need to manually navigate here
      } else {
        const errorMsg = 'The code you entered is incorrect. Please try again.';
        setErrorMessage(errorMsg);
        Alert.alert('Invalid OTP', errorMsg);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      // Extract backend error message from various possible formats
      const errorMsg = error.message || error.error || 'Failed to verify OTP. Please try again.';
      setErrorMessage(errorMsg);
      Alert.alert('Error', errorMsg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    // Clear any previous error message
    setErrorMessage(null);
    
    try {
      await resendOTP();
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Success', 'OTP has been resent. Please check your email or phone.');
    } catch (error: any) {
      // Extract backend error message from various possible formats
      const errorMsg = error.message || error.error || 'Failed to resend OTP. Please try again.';
      setErrorMessage(errorMsg);
      Alert.alert('Error', errorMsg);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.gradientBackground}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>🔐</Text>
            </View>
            <Text style={styles.title}>
              {user?.email && (!user?.phoneNumber || user.phoneNumber.trim() === '') 
                ? 'Verify Your Email' 
                : 'Verify Your Phone'}
            </Text>
            <Text style={styles.subtitle}>
              {user?.email && (!user?.phoneNumber || user.phoneNumber.trim() === '') ? (
                <>
                  We've sent a 6-digit code to{'\n'}
                  <Text style={styles.phoneNumber}>{user.email}</Text>
                </>
              ) : (
                <>
                  We've sent a 6-digit code to{'\n'}
                  <Text style={styles.phoneNumber}>+92 {user?.phoneNumber || 'your number'}</Text>
                </>
              )}
            </Text>
            <View style={styles.demoHint}>
              <Text style={styles.demoHintText}>💡 Demo: Enter any 6-digit code (e.g., 123456)</Text>
            </View>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoComplete="off"
                textContentType="none"
                autoCorrect={false}
                spellCheck={false}
                importantForAutofill="no"
              />
            ))}
          </View>

          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, (otp.some((d) => !d) || isVerifying) && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={otp.some((d) => !d) || isVerifying}
          >
            <Text style={styles.buttonText}>{isVerifying ? 'Verifying...' : 'Verify'}</Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            {timer > 0 ? (
              <Text style={styles.timerText}>Resend in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_PADDING = 24;
const OTP_GAP = 8;
const OTP_COUNT = 6;
// Calculate available width: screen width - content padding (both sides)
const AVAILABLE_WIDTH = SCREEN_WIDTH - (CONTENT_PADDING * 2);
// Calculate total gap space: (number of inputs - 1) * gap
const TOTAL_GAP_SPACE = (OTP_COUNT - 1) * OTP_GAP;
// Calculate width per input, but limit max width to 50
const CALCULATED_WIDTH = Math.floor((AVAILABLE_WIDTH - TOTAL_GAP_SPACE) / OTP_COUNT);
const OTP_INPUT_WIDTH = Math.min(CALCULATED_WIDTH, 50);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 12,
    color: '#666',
    lineHeight: 24,
  },
  phoneNumber: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  demoHint: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  demoHintText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '600',
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 0,
    gap: OTP_GAP,
  },
  otpInput: {
    width: OTP_INPUT_WIDTH,
    height: 50,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  otpInputFilled: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F7FF',
  },
  button: {
    backgroundColor: '#6366F1',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  resendText: {
    fontSize: 14,
    opacity: 0.7,
    color: '#666',
    fontWeight: '500',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

