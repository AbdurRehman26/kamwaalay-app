import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColor } from '@/hooks/use-theme-color';

const { width } = Dimensions.get('window');

export default function OTPVerifyScreen() {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();
  const { verifyOTP, resendOTP, user } = useAuth();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const iconColor = useThemeColor({}, 'icon');

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
      } else {
        const errorMsg = 'The code you entered is incorrect. Please try again.';
        setErrorMessage(errorMsg);
        Alert.alert('Invalid OTP', errorMsg);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
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
    setErrorMessage(null);

    try {
      await resendOTP();
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Success', 'OTP has been resent. Please check your email or phone.');
    } catch (error: any) {
      const errorMsg = error.message || error.error || 'Failed to resend OTP. Please try again.';
      setErrorMessage(errorMsg);
      Alert.alert('Error', errorMsg);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Decorative Background Elements */}
      <View style={[styles.topCircle, { backgroundColor: primaryLight, opacity: 0.3 }]} />
      <View style={[styles.bottomCircle, { backgroundColor: primaryLight, opacity: 0.2 }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.headerSection, { marginTop: insets.top + 40 }]}>
            <View style={[styles.iconContainer, { backgroundColor: primaryLight }]}>
              <IconSymbol name="lock.shield.fill" size={40} color={primaryColor} />
            </View>
            <Text style={[styles.title, { color: textColor }]}>
              {user?.email && (!user?.phoneNumber || user.phoneNumber.trim() === '')
                ? 'Verify Email'
                : 'Verify Phone'}
            </Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>
              {user?.email && (!user?.phoneNumber || user.phoneNumber.trim() === '') ? (
                <>
                  We've sent a 6-digit code to{'\n'}
                  <Text style={[styles.highlightText, { color: textColor }]}>{user.email}</Text>
                </>
              ) : (
                <>
                  We've sent a 6-digit code to{'\n'}
                  <Text style={[styles.highlightText, { color: textColor }]}>+92 {user?.phoneNumber || 'your number'}</Text>
                </>
              )}
            </Text>
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
                  { backgroundColor: cardBg, borderColor, color: textColor },
                  digit && styles.otpInputFilled,
                  digit && { borderColor: primaryColor, backgroundColor: cardBg, shadowColor: primaryColor }
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoComplete="off"
                textContentType="oneTimeCode"
              />
            ))}
          </View>

          {errorMessage && (
            <View style={[styles.errorCard, { backgroundColor: '#FEF2F2' }]}>
              <IconSymbol name="exclamationmark.circle.fill" size={16} color={errorColor} />
              <Text style={[styles.errorText, { color: errorColor }]}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: primaryColor, shadowColor: primaryColor },
              (otp.some((d) => !d) || isVerifying) && [styles.buttonDisabled, { backgroundColor: borderColor }]
            ]}
            onPress={handleVerify}
            disabled={otp.some((d) => !d) || isVerifying}
          >
            <Text style={styles.buttonText}>{isVerifying ? 'Verifying...' : 'Verify Code'}</Text>
            {!isVerifying && <IconSymbol name="arrow.right" size={20} color="#FFF" />}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: textSecondary }]}>Didn't receive code? </Text>
            {timer > 0 ? (
              <Text style={[styles.timerText, { color: primaryColor }]}>Resend in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={[styles.resendLink, { color: primaryColor }]}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.demoHint, { backgroundColor: primaryLight, borderColor: primaryColor }]}>
            <IconSymbol name="lightbulb.fill" size={16} color={primaryColor} />
            <Text style={[styles.demoHintText, { color: primaryColor }]}>Demo: Enter any 6-digit code (e.g., 123456)</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_PADDING = 24;
const OTP_GAP = 8;
const OTP_COUNT = 6;
const AVAILABLE_WIDTH = SCREEN_WIDTH - (CONTENT_PADDING * 2);
const TOTAL_GAP_SPACE = (OTP_COUNT - 1) * OTP_GAP;
const CALCULATED_WIDTH = Math.floor((AVAILABLE_WIDTH - TOTAL_GAP_SPACE) / OTP_COUNT);
const OTP_INPUT_WIDTH = Math.min(CALCULATED_WIDTH, 50);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  topCircle: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#EEF2FF',
    opacity: 0.7,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#F5F3FF',
    opacity: 0.7,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
  highlightText: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: OTP_GAP,
  },
  otpInput: {
    width: OTP_INPUT_WIDTH,
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    backgroundColor: '#F9FAFB',
    color: '#1A1A1A',
  },
  otpInputFilled: {
    borderColor: '#6366F1',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
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
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  demoHintText: {
    fontSize: 13,
    color: '#4338CA',
    fontWeight: '600',
  },
});
