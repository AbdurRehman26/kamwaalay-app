import React, { useState, useEffect } from 'react';
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

export default function SignupScreen() {
  const { register, user } = useAuth();
  const [signupMethod, setSignupMethod] = useState<'email' | 'phone'>('email');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'user' | 'helper' | 'business'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEmailEditable, setIsEmailEditable] = useState(true);
  const router = useRouter();

  // Prefill email if it exists in user context and make it uneditable
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      setSignupMethod('email');
      setIsEmailEditable(false);
    }
  }, [user]);

  const handleSignup = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    if (signupMethod === 'email' && !email.trim()) {
      Alert.alert('Required', 'Please enter your email address');
      return;
    }

    if (signupMethod === 'phone' && !phoneNumber.trim()) {
      Alert.alert('Required', 'Please enter your phone number');
      return;
    }

    if (signupMethod === 'phone' && phoneNumber.length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Required', 'Please enter a password');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Invalid Password', 'Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    // Clear any previous error and success messages
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await register({
        name: name.trim(),
        phone: signupMethod === 'phone' ? phoneNumber.trim() : undefined,
        email: signupMethod === 'email' ? email.trim() : undefined,
        password,
        password_confirmation: confirmPassword,
        role,
      });
      
      // Show success message if provided by backend
      if (result?.message) {
        setSuccessMessage(result.message);
        // Show success notification
        Alert.alert('Success', result.message);
      } else {
        // Show default success message
        setSuccessMessage('Account created successfully! Please verify your OTP.');
        Alert.alert('Success', 'Account created successfully! Please verify your OTP.');
      }
      
      // Wait a moment to show the success message, then navigate
      setTimeout(() => {
        router.push('/auth/otp-verify');
      }, 1500);
    } catch (error: any) {
      console.log('Signup error caught:', error);
      console.log('Error type:', typeof error);
      console.log('Error instanceof Error:', error instanceof Error);
      
      // Extract backend error message
      let extractedErrorMessage = 'Failed to create account. Please try again.';
      
      if (error instanceof Error) {
        extractedErrorMessage = error.message;
        console.log('Extracted error message from Error:', extractedErrorMessage);
      } else if (typeof error === 'string') {
        extractedErrorMessage = error;
        console.log('Error is string:', extractedErrorMessage);
      } else if (error && typeof error === 'object') {
        extractedErrorMessage = error.message || error.error || JSON.stringify(error);
        console.log('Extracted error message from object:', extractedErrorMessage);
      }
      
      console.log('Setting error message:', extractedErrorMessage);
      
      // Set error message to display inline
      setErrorMessage(extractedErrorMessage);
      
      // Also show Alert as fallback
      Alert.alert('Signup Failed', extractedErrorMessage);
    }
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
          <View style={styles.card}>
            {/* Sign up with section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sign up with</Text>
              <View style={styles.methodContainer}>
                <TouchableOpacity
                  style={[styles.methodButton, signupMethod === 'email' && styles.methodButtonActive, !isEmailEditable && styles.methodButtonDisabled]}
                  onPress={() => {
                    if (isEmailEditable) {
                      setSignupMethod('email');
                    }
                  }}
                  disabled={!isEmailEditable}
                >
                  <IconSymbol name="envelope.fill" size={24} color={signupMethod === 'email' ? '#007AFF' : '#666'} />
                  <Text style={[styles.methodText, signupMethod === 'email' && styles.methodTextActive]}>
                    Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodButton, signupMethod === 'phone' && styles.methodButtonActive, !isEmailEditable && styles.methodButtonDisabled]}
                  onPress={() => {
                    if (isEmailEditable) {
                      setSignupMethod('phone');
                    }
                  }}
                  disabled={!isEmailEditable}
                >
                  <IconSymbol name="phone.fill" size={24} color={signupMethod === 'phone' ? '#007AFF' : '#666'} />
                  <Text style={[styles.methodText, signupMethod === 'phone' && styles.methodTextActive]}>
                    Phone
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* I am a section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>I am a</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[styles.roleCard, role === 'user' && styles.roleCardActive]}
                  onPress={() => setRole('user')}
                >
                  <IconSymbol name="person.fill" size={32} color={role === 'user' ? '#007AFF' : '#666'} />
                  <Text style={[styles.roleTitle, role === 'user' && styles.roleTitleActive]}>
                    User
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleCard, role === 'helper' && styles.roleCardActive]}
                  onPress={() => setRole('helper')}
                >
                  <IconSymbol name="briefcase.fill" size={32} color={role === 'helper' ? '#007AFF' : '#8B4513'} />
                  <Text style={[styles.roleTitle, role === 'helper' && styles.roleTitleActive]}>
                    Worker
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleCard, role === 'business' && styles.roleCardActive]}
                  onPress={() => setRole('business')}
                >
                  <IconSymbol name="building.2.fill" size={32} color={role === 'business' ? '#007AFF' : '#666'} />
                  <Text style={[styles.roleTitle, role === 'business' && styles.roleTitleActive]}>
                    Business
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                  textContentType="name"
                  autoCorrect={false}
                  spellCheck={false}
                  importantForAutofill="yes"
                />
              </View>

              {signupMethod === 'email' ? (
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={[styles.input, !isEmailEditable && styles.inputDisabled]}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={isEmailEditable}
                    autoComplete="email"
                    textContentType="emailAddress"
                    autoCorrect={false}
                    spellCheck={false}
                    importantForAutofill="yes"
                  />
                </View>
              ) : (
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Phone Number</Text>
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
                </View>
              )}

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your address (optional)"
                  placeholderTextColor="#999"
                  value={address}
                  onChangeText={setAddress}
                  autoComplete="street-address"
                  textContentType="fullStreetAddress"
                  autoCorrect={false}
                  spellCheck={false}
                  importantForAutofill="yes"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoComplete="password-new"
                    textContentType="newPassword"
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
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm your password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoComplete="password-new"
                    textContentType="newPassword"
                    autoCorrect={false}
                    spellCheck={false}
                    importantForAutofill="yes"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <IconSymbol name={showConfirmPassword ? "eye.fill" : "eye.slash.fill"} size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Success Message Display */}
            {successMessage && (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {/* Error Message Display */}
            {errorMessage && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, (!name.trim() || !password.trim() || password.length < 8) && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={!name.trim() || !password.trim() || password.length < 8}
            >
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By registering, you agree to our{' '}
              <Text style={styles.linkText}>Terms</Text> and{' '}
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
    padding: 20,
    paddingTop: 40,
  },
  gradientBackground: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  methodContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
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
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  roleCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 100,
  },
  roleCardActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  roleTitleActive: {
    color: '#007AFF',
  },
  roleSubtitle: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  roleSubtitleActive: {
    color: '#007AFF',
  },
  formSection: {
    marginTop: 8,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  inputContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    gap: 6,
  },
  flag: {
    fontSize: 18,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#666',
  },
  methodButtonDisabled: {
    opacity: 0.6,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  eyeButton: {
    padding: 14,
    paddingLeft: 8,
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    lineHeight: 18,
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

