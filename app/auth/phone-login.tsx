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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

const DUMMY_PHONE = '9876543210';

export default function PhoneLoginScreen() {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('phone');
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleContinue = async () => {
    // Clear any previous error
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Validate inputs based on login method
      if (loginMethod === 'phone') {
        if (phoneNumber.length < 10) {
          Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
          setIsLoading(false);
          return;
        }
      } else {
        if (!email.trim() || !email.includes('@')) {
          Alert.alert('Invalid Email', 'Please enter a valid email address');
          setIsLoading(false);
          return;
        }
      }

      // Validate password if using password auth
      if (authMethod === 'password' && !password.trim()) {
        Alert.alert('Required', 'Please enter your password');
        setIsLoading(false);
        return;
      }

      // Call login with appropriate parameters
      const loginData: {
        phone?: string;
        email?: string;
        password?: string;
        authMethod: 'otp' | 'password';
      } = {
        authMethod,
      };

      if (loginMethod === 'phone') {
        loginData.phone = phoneNumber;
      } else {
        loginData.email = email.trim();
      }

      if (authMethod === 'password') {
        loginData.password = password;
      }

      const result = await login(loginData);

      // If OTP is required, navigate to OTP verify screen
      if (authMethod === 'otp' && result?.requiresOTP) {
        router.push('/auth/otp-verify');
      }
      // If password login is successful, navigation will be handled by AuthContext
    } catch (error: any) {
      // Extract backend error message
      const errorMsg = error.message || error.error || 'Login failed. Please try again.';
      setErrorMessage(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDummy = () => {
    setPhoneNumber(DUMMY_PHONE);
  };

  const isFormValid = () => {
    if (loginMethod === 'phone') {
      if (phoneNumber.length < 10) return false;
    } else {
      if (!email.trim() || !email.includes('@')) return false;
    }
    if (authMethod === 'password' && !password.trim()) return false;
    return true;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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

            {/* Login Method Selection */}
            <View style={styles.methodSection}>
              <Text style={styles.sectionTitle}>Login with</Text>
              <View style={styles.methodContainer}>
                <TouchableOpacity
                  style={[styles.methodButton, loginMethod === 'phone' && styles.methodButtonActive]}
                  onPress={() => setLoginMethod('phone')}
                >
                  <IconSymbol name="phone.fill" size={24} color={loginMethod === 'phone' ? '#007AFF' : '#666'} />
                  <Text style={[styles.methodText, loginMethod === 'phone' && styles.methodTextActive]}>
                    Phone
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodButton, loginMethod === 'email' && styles.methodButtonActive]}
                  onPress={() => setLoginMethod('email')}
                >
                  <IconSymbol name="envelope.fill" size={24} color={loginMethod === 'email' ? '#007AFF' : '#666'} />
                  <Text style={[styles.methodText, loginMethod === 'email' && styles.methodTextActive]}>
                    Email
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Auth Method Selection */}
            <View style={styles.methodSection}>
              <Text style={styles.sectionTitle}>Authenticate with</Text>
              <View style={styles.methodContainer}>
                <TouchableOpacity
                  style={[styles.methodButton, authMethod === 'otp' && styles.methodButtonActive]}
                  onPress={() => setAuthMethod('otp')}
                >
                  <IconSymbol name="message.fill" size={24} color={authMethod === 'otp' ? '#007AFF' : '#666'} />
                  <Text style={[styles.methodText, authMethod === 'otp' && styles.methodTextActive]}>
                    OTP
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodButton, authMethod === 'password' && styles.methodButtonActive]}
                  onPress={() => setAuthMethod('password')}
                >
                  <IconSymbol name="lock.fill" size={24} color={authMethod === 'password' ? '#007AFF' : '#666'} />
                  <Text style={[styles.methodText, authMethod === 'password' && styles.methodTextActive]}>
                    Password
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              {loginMethod === 'phone' ? (
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
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    autoCorrect={false}
                    spellCheck={false}
                    importantForAutofill="yes"
                  />
                </View>
              ) : (
                <View style={styles.emailInputContainer}>
                  <TextInput
                    style={styles.emailInput}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    autoComplete="email"
                    textContentType="emailAddress"
                    autoCorrect={false}
                    spellCheck={false}
                    importantForAutofill="yes"
                  />
                </View>
              )}

              {/* Password Input (if password auth method) */}
              {authMethod === 'password' && (
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoComplete="password"
                    textContentType="password"
                    autoCorrect={false}
                    spellCheck={false}
                    importantForAutofill="yes"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <IconSymbol name={showPassword ? "eye.fill" : "eye.slash.fill"} size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Error Message Display */}
              {errorMessage && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Dummy Number Button (only for phone + OTP) */}
              {loginMethod === 'phone' && authMethod === 'otp' && (
                <TouchableOpacity style={styles.dummyButton} onPress={handleUseDummy}>
                  <Text style={styles.dummyButtonText}>
                    🔓 Use Demo Number: {DUMMY_PHONE}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, (!isFormValid() || isLoading) && styles.buttonDisabled]}
                onPress={handleContinue}
                disabled={!isFormValid() || isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Please wait...' : authMethod === 'otp' ? 'Send OTP' : 'Login'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  methodSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  methodContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  methodButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  methodTextActive: {
    color: '#007AFF',
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
  emailInputContainer: {
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
  emailInput: {
    padding: 18,
    fontSize: 18,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  passwordInput: {
    flex: 1,
    padding: 18,
    fontSize: 18,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  eyeButton: {
    padding: 18,
    paddingLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
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
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  signUpText: {
    fontSize: 14,
    color: '#666',
  },
  signUpLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
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

