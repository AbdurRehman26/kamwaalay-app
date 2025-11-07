import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const DUMMY_PHONE = '9876543210';

export default function PhoneLoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleContinue = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
      return;
    }

    try {
      await login(phoneNumber);
      router.push('/auth/otp-verify');
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    }
  };

  const handleUseDummy = () => {
    setPhoneNumber(DUMMY_PHONE);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.gradientBackground}>
        <View style={styles.content}>
          {/* Logo/Header */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>K</Text>
            </View>
            <Text style={styles.title}>
              Welcome to Kamwaalay
            </Text>
            <Text style={styles.subtitle}>
              Pakistan's trusted platform for household services
            </Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <View style={styles.phonePrefix}>
                <Text style={styles.flag}>🇵🇰</Text>
                <Text style={styles.prefixText}>+92</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={10}
              />
            </View>

            {/* Dummy Number Button */}
            <TouchableOpacity style={styles.dummyButton} onPress={handleUseDummy}>
              <Text style={styles.dummyButtonText}>
                🔓 Use Demo Number: {DUMMY_PHONE}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, phoneNumber.length < 10 && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={phoneNumber.length < 10}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    color: '#666',
  },
  inputSection: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRightWidth: 2,
    borderRightColor: '#E8E8E8',
    gap: 8,
  },
  flag: {
    fontSize: 20,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  input: {
    flex: 1,
    padding: 18,
    fontSize: 18,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  dummyButton: {
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  dummyButtonText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
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
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 18,
    paddingHorizontal: 20,
    color: '#666',
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

