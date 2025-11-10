import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

export type UserType = 'user' | 'helper' | 'business' | null;
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

export interface User {
  id: string;
  phoneNumber: string;
  userType: UserType;
  name?: string;
  email?: string;
  profileImage?: string;
  password?: string; // Optional password for account security
  onboardingStatus: OnboardingStatus;
  profileData?: HelperProfile | BusinessProfile;
  isVerified?: boolean; // OTP verification status
}

export interface HelperProfile {
  name: string;
  email?: string;
  bio?: string;
  experience?: string;
  profileImage?: string;
  serviceOfferings: ServiceOffering[];
  locations: string[];
  rating?: number;
  reviews?: number;
}

export interface BusinessProfile {
  businessName: string;
  ownerName: string;
  email?: string;
  phone?: string;
  bio?: string;
  businessAddress?: string;
  profileImage?: string;
  serviceOfferings: ServiceOffering[];
  locations: string[];
  rating?: number;
  reviews?: number;
}

export interface ServiceOffering {
  id: string;
  serviceName: string;
  description?: string;
  price?: number;
  priceUnit?: 'hour' | 'day' | 'month';
  locations: string[];
  category: string;
}

export interface ServiceRequest {
  id: string;
  userId: string;
  userName: string;
  serviceName: string;
  description: string;
  location: string;
  budget?: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  applicants: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phoneNumber: string) => Promise<void>;
  register: (data: { name: string; phone?: string; email?: string; password: string; password_confirmation: string; role: 'user' | 'helper' | 'business' }) => Promise<{ success: boolean; message?: string }>;
  verifyOTP: (otp: string) => Promise<boolean>;
  resendOTP: () => Promise<void>;
  selectUserType: (userType: UserType) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  completeOnboarding: (profileData: HelperProfile | BusinessProfile) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        // Ensure isVerified is set (default to false for existing users without this field)
        if (parsed.isVerified === undefined) {
          parsed.isVerified = false;
        }
        setUser(parsed);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const login = async (data: {
    phone?: string;
    email?: string;
    password?: string;
    authMethod: 'otp' | 'password';
  }): Promise<{ requiresOTP?: boolean } | void> => {
    try {
      // Build request body based on login method and auth method
      const requestBody: any = {};

      // Add identifier (phone or email)
      if (data.phone) {
        requestBody.phone = data.phone;
      } else if (data.email) {
        requestBody.email = data.email;
      } else {
        throw new Error('Please provide either phone number or email');
      }

      // Add password if using password authentication
      if (data.authMethod === 'password') {
        if (!data.password) {
          throw new Error('Password is required for password authentication');
        }
        requestBody.password = data.password;
      }

      // Call API to initiate login/OTP flow
      const response = await apiService.post(
        API_ENDPOINTS.AUTH.LOGIN,
        requestBody,
        undefined,
        false // No auth required for login
      );

      // API returns 202 for OTP required, 200 for successful login
      if (response.success && response.data) {
        const responseData = response.data;
        console.log('Login API response:', JSON.stringify(responseData, null, 2));
        
        const token = responseData.token || responseData.accessToken || responseData.access_token;
        const userDataFromApi = responseData.user || responseData;
        const userId = responseData.user_id || userDataFromApi.id || responseData.id;

        // Check if OTP verification is required
        // For OTP flow, API might return user_id but no token yet
        if (data.authMethod === 'otp' && (responseData.verification_method || !token)) {
          // OTP required - store identifier and user_id temporarily
          const tempUser: User = {
            id: userId?.toString() || Date.now().toString(),
            phoneNumber: data.phone || userDataFromApi.phone || userDataFromApi.phoneNumber || '',
            email: data.email || userDataFromApi.email,
            userType: userDataFromApi.role || userDataFromApi.userType || null,
            name: userDataFromApi.name,
            onboardingStatus: userDataFromApi.onboarding_status || userDataFromApi.onboardingStatus || 'not_started',
            isVerified: false, // User needs to verify OTP
          };
          
          // If there's a token even in OTP flow, save it (some APIs return a temporary token)
          if (token) {
            await AsyncStorage.setItem('authToken', token);
            (tempUser as any).token = token;
            console.log('Token saved during OTP flow');
          }
          
          await saveUser(tempUser);
          console.log('Temporary user saved for OTP verification');
          return { requiresOTP: true };
        } else if (token) {
          // Direct login successful (password auth or OTP already verified) - save user with token
          const userData: User = {
            id: userId?.toString() || userDataFromApi.id?.toString() || Date.now().toString(),
            phoneNumber: data.phone || userDataFromApi.phone || userDataFromApi.phoneNumber || '',
            email: data.email || userDataFromApi.email,
            isVerified: true, // If token is provided, user is verified
            userType: userDataFromApi.role || userDataFromApi.userType || null,
            name: userDataFromApi.name,
            profileImage: userDataFromApi.profile_image || userDataFromApi.profileImage,
            onboardingStatus: userDataFromApi.onboarding_status || userDataFromApi.onboardingStatus || 'not_started',
          };

          // Save token to AsyncStorage
          try {
            await AsyncStorage.setItem('authToken', token);
            console.log('Token saved to AsyncStorage after login');
          } catch (tokenError) {
            console.error('Error saving token to AsyncStorage:', tokenError);
          }
          
          // Also store token in user object
          (userData as any).token = token;
          
          // Save user data
          await saveUser(userData);
          console.log('User data saved after login:', { id: userData.id, email: userData.email, phone: userData.phoneNumber });
          return;
        } else {
          // No token but successful response - might be OTP flow
          if (data.authMethod === 'otp') {
            // Store user data even without token for OTP verification
            const tempUser: User = {
              id: userId?.toString() || userDataFromApi.id?.toString() || Date.now().toString(),
              phoneNumber: data.phone || userDataFromApi.phone || userDataFromApi.phoneNumber || '',
              email: data.email || userDataFromApi.email,
              userType: userDataFromApi.role || userDataFromApi.userType || null,
              name: userDataFromApi.name,
              onboardingStatus: userDataFromApi.onboarding_status || userDataFromApi.onboardingStatus || 'not_started',
              isVerified: false,
            };
            await saveUser(tempUser);
            console.log('User data saved for OTP verification (no token)');
            return { requiresOTP: true };
          } else {
            // Unexpected response format
            console.error('Unexpected response: no token and not OTP flow', responseData);
            throw new Error('Unexpected response from server');
          }
        }
      } else {
        // Extract backend error message
        const errorMessage = response.error || response.message || 'Login failed';
        console.error('Login failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // If error already has a message, use it; otherwise create a generic one
      const errorMessage = error.message || error.error || 'Login failed. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const register = async (data: { name: string; phone?: string; email?: string; password: string; password_confirmation: string; role: 'user' | 'helper' | 'business' }) => {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.AUTH.REGISTER,
        {
          name: data.name,
          phone: data.phone,
          email: data.email,
          password: data.password,
          password_confirmation: data.password_confirmation,
          role: data.role,
        },
        undefined,
        false // No auth required for registration
      );

      if (response.success && response.data) {
        const responseData = response.data;
        const userDataFromApi = responseData.user || responseData;
        const token = responseData.token || responseData.accessToken || responseData.access_token;
        
        const userData: User = {
          id: userDataFromApi.id?.toString() || Date.now().toString(),
          phoneNumber: data.phone || userDataFromApi.phoneNumber || '',
          email: data.email || userDataFromApi.email,
          name: data.name || userDataFromApi.name,
          userType: data.role || userDataFromApi.role || null,
          onboardingStatus: userDataFromApi.onboarding_status || 'not_started',
          isVerified: false, // User needs to verify OTP after signup
        };

        if (token) {
          await AsyncStorage.setItem('authToken', token);
          (userData as any).token = token;
        }

        await saveUser(userData);
        
        // Return success message from backend if available
        return {
          success: true,
          message: response.message || responseData.message || 'Account created successfully!',
        };
      } else {
        // Extract backend error message - check multiple possible formats
        const errorMessage = 
          response.error || 
          response.message || 
          (response.data && typeof response.data === 'object' && (response.data.message || response.data.error)) ||
          'Registration failed';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Register error caught:', error);
      console.error('Register error type:', typeof error);
      console.error('Register error instanceof Error:', error instanceof Error);
      
      // Extract error message from various possible formats
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Extracted error message from Error:', errorMessage);
      } else if (typeof error === 'string') {
        errorMessage = error;
        console.error('Error is string:', errorMessage);
      } else if (error && typeof error === 'object') {
        errorMessage = error.message || error.error || error.toString();
        console.error('Extracted error message from object:', errorMessage);
      }
      
      console.error('Throwing error with message:', errorMessage);
      
      // Re-throw with the extracted error message
      throw new Error(errorMessage);
    }
  };

  const verifyOTP = async (otp: string): Promise<boolean> => {
    if (!user) {
      throw new Error('No user found. Please login again.');
    }

    try {
      // Use the verification endpoint according to API documentation
      // The endpoint expects: otp, user_id, and identifier (phone or email)
      // Build request body with proper identifier
      let requestBody: { otp: string; user_id: string; phone?: string; email?: string } = {
        otp: otp,
        user_id: user.id,
      };

      // Add phone or email based on what the user has
      if (user.email && (!user.phoneNumber || user.phoneNumber.trim() === '')) {
        requestBody.email = user.email;
      } else if (user.phoneNumber) {
        // Ensure phone number is properly formatted (remove any spaces, dashes, etc.)
        requestBody.phone = user.phoneNumber.replace(/\s+/g, '').replace(/-/g, '');
      } else {
        throw new Error('No phone number or email found. Please login again.');
      }

      const response = await apiService.post(
        API_ENDPOINTS.AUTH.VERIFY,
        requestBody,
        undefined,
        false // No auth required for OTP verification
      );

      if (response.success && response.data) {
        // Handle different response formats
        const responseData = response.data;
        const userDataFromApi = responseData.user || responseData;
        const token = responseData.token || responseData.accessToken || responseData.access_token;
        
        // Save user data with token
        const userData: User = {
          ...user,
          id: userDataFromApi.id?.toString() || user.id,
          phoneNumber: userDataFromApi.phone || userDataFromApi.phoneNumber || user.phoneNumber,
          email: userDataFromApi.email || user.email,
          userType: userDataFromApi.role || userDataFromApi.userType || user.userType,
          name: userDataFromApi.name || user.name,
          profileImage: userDataFromApi.profile_image || userDataFromApi.profileImage,
          onboardingStatus: userDataFromApi.onboarding_status || userDataFromApi.onboardingStatus || user.onboardingStatus,
          isVerified: true, // OTP verified successfully
        };
        
        // Save token first if available
        if (token) {
          try {
            // Store token separately in AsyncStorage
            await AsyncStorage.setItem('authToken', token);
            console.log('Token saved to AsyncStorage after OTP verification');
            // Also store in user object for backward compatibility
            (userData as any).token = token;
          } catch (tokenError) {
            console.error('Error saving token to AsyncStorage:', tokenError);
            // Continue even if token save fails, but log the error
          }
        } else {
          console.warn('No token received in OTP verification response');
        }
        
        // Save user data (this also updates the user state)
        try {
          await saveUser(userData);
          console.log('User saved to AsyncStorage and state updated after OTP verification');
        } catch (userError) {
          console.error('Error saving user after OTP verification:', userError);
          throw new Error('Failed to save user data after verification');
        }
        
        return true;
      } else {
        // Extract backend error message - check multiple possible formats
        const errorMessage = 
          response.error || 
          response.message || 
          (response.data && typeof response.data === 'object' && (response.data.message || response.data.error)) ||
          'OTP verification failed';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      console.error('OTP verification error type:', typeof error);
      console.error('OTP verification error instanceof Error:', error instanceof Error);
      
      // Extract error message from various possible formats
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Extracted error message from Error:', errorMessage);
      } else if (typeof error === 'string') {
        errorMessage = error;
        console.error('Error is string:', errorMessage);
      } else if (error && typeof error === 'object') {
        errorMessage = error.message || error.error || error.toString();
        console.error('Extracted error message from object:', errorMessage);
      }
      
      console.error('Throwing error with message:', errorMessage);
      
      // Re-throw with the extracted error message
      throw new Error(errorMessage);
    }
  };

  const resendOTP = async () => {
    if (!user) {
      throw new Error('No user found. Please login again.');
    }

    try {
      // Resend OTP by calling login endpoint again with resend flag
      // For email users, use email; for phone users, use phone
      const identifier = user.email && (!user.phoneNumber || user.phoneNumber.trim() === '') 
        ? { email: user.email, resend: true }
        : { phone: user.phoneNumber, resend: true };

      const response = await apiService.post(
        API_ENDPOINTS.AUTH.LOGIN,
        identifier,
        undefined,
        false // No auth required for OTP resend
      );

      // For resend, we only expect a success response indicating OTP was sent
      // We should NOT update user state or create a new session
      if (response.success) {
        // Check if response indicates OTP was sent (not a full login)
        if (response.data?.verification_method || response.data?.message) {
          // OTP resent successfully - don't update user state
          return;
        } else if (response.data?.token) {
          // If token is returned, this means user was already verified
          // Don't update state during resend - just return success
          return;
        }
        // OTP resent successfully
        return;
      } else {
        // Extract backend error message
        const errorMessage = response.error || response.message || 'Failed to resend OTP. Please try again.';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      // If error already has a message, throw it; otherwise create a generic one
      const errorMessage = error.message || error.error || 'Failed to resend OTP. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const selectUserType = async (userType: UserType) => {
    if (!user) return;

    try {
      // Update user type via profile endpoint
      // According to API docs, user type is set during registration
      // For existing users, we'll update it via profile
      const response = await apiService.patch(
        API_ENDPOINTS.PROFILE.UPDATE,
        { role: userType }
      );

      if (response.success && response.data) {
        const updatedUser = {
          ...user,
          ...response.data,
          userType,
          onboardingStatus: 'in_progress' as OnboardingStatus,
        };
        await saveUser(updatedUser);
      } else {
        // Fallback to local update
        const updatedUser = {
          ...user,
          userType,
          onboardingStatus: 'in_progress' as OnboardingStatus,
        };
        await saveUser(updatedUser);
      }
    } catch (error) {
      console.error('Select user type error:', error);
      // Fallback to local update
      const updatedUser = {
        ...user,
        userType,
        onboardingStatus: 'in_progress' as OnboardingStatus,
      };
      await saveUser(updatedUser);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;

    try {
      // Ensure token is available before making API call
      let token = await AsyncStorage.getItem('authToken');
      
      // If no token in AsyncStorage, check user object
      if (!token && user) {
        const userToken = (user as any).token;
        if (userToken) {
          // Save token to AsyncStorage for API service to use
          await AsyncStorage.setItem('authToken', userToken);
          token = userToken;
          console.log('Token saved to AsyncStorage from user object before profile update');
        }
      }

      // Check if token exists
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Call API to update user profile (PATCH method according to API docs)
      // The apiService.patch() will automatically include the token in the Authorization header
      console.log('Calling profile update API with data:', userData);
      console.log('Token available:', token ? 'Yes (' + token.substring(0, 20) + '...)' : 'No');
      
      const response = await apiService.patch(
        API_ENDPOINTS.PROFILE.UPDATE,
        userData,
        undefined,
        true // Explicitly include auth token
      );
      
      console.log('Profile update API response:', response);

      if (response.success && response.data) {
        const responseData = response.data;
        const userDataFromApi = responseData.user || responseData;
        const updatedUser = { 
          ...user, 
          ...userDataFromApi,
          // Preserve existing user data that might not be in response
          id: userDataFromApi.id?.toString() || user.id,
          phoneNumber: userDataFromApi.phone || userDataFromApi.phoneNumber || user.phoneNumber,
          email: userDataFromApi.email || user.email || userData.email,
          name: userDataFromApi.name || user.name || userData.name,
          // Preserve onboardingStatus from userData if provided
          onboardingStatus: userData.onboardingStatus || userDataFromApi.onboarding_status || userDataFromApi.onboardingStatus || user.onboardingStatus,
        };
        await saveUser(updatedUser);
        console.log('Profile updated successfully via API');
      } else {
        // Extract error message
        const errorMessage = response.error || response.message || 'Failed to update profile';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Update user error:', error);
      
      // Extract error message
      const errorMessage = error.message || error.error || 'Failed to update profile. Please try again.';
      
      // Re-throw error so calling code can handle it
      throw new Error(errorMessage);
    }
  };

  const completeOnboarding = async (profileData: HelperProfile | BusinessProfile) => {
    if (!user) return;

    try {
      // First, update the user profile with basic info (name, email, etc.)
      const profileUpdateData: Partial<User> = {
        name: 'name' in profileData ? profileData.name : profileData.ownerName,
        email: profileData.email,
      };

      // Update profile via API
      try {
        const profileResponse = await apiService.patch(
          API_ENDPOINTS.PROFILE.UPDATE,
          profileUpdateData
        );

        if (profileResponse.success && profileResponse.data) {
          // Update user with profile response data
          const updatedUserFromProfile = { ...user, ...profileResponse.data };
          await saveUser(updatedUserFromProfile);
          console.log('Profile updated successfully during onboarding');
        } else {
          // Fallback to local update
          const updatedUserFromProfile = { ...user, ...profileUpdateData };
          await saveUser(updatedUserFromProfile);
          console.log('Profile updated locally (API call failed)');
        }
      } catch (profileError) {
        console.error('Profile update error during onboarding:', profileError);
        // Continue with onboarding even if profile update fails
        const updatedUserFromProfile = { ...user, ...profileUpdateData };
        await saveUser(updatedUserFromProfile);
      }

      // Only call API for helper onboarding
      if (user.userType === 'helper') {
        // Then, call API to complete onboarding
        const endpoint = API_ENDPOINTS.ONBOARDING.HELPER;

        // Map profile data to API format
        // Helper onboarding requires: services, nic, nic_number
        // For now, we'll create a basic structure - this needs to be enhanced
        // with actual service selection and NIC upload
        const apiData = {
          services: profileData.serviceOfferings?.map(service => ({
            service_type: service.category || 'maid',
            work_type: 'full_time',
            location_id: 1, // TODO: Get actual location_id
            monthly_rate: service.price,
            description: service.description,
          })) || [],
          nic_number: '', // TODO: Add NIC number field
          bio: 'bio' in profileData ? profileData.bio : undefined,
          experience_years: 'experience' in profileData ? parseInt(profileData.experience) || 0 : undefined,
          skills: undefined,
        };

        const response = await apiService.post(endpoint, apiData);

        if (response.success && response.data) {
          const updatedUser = {
            ...user,
            ...response.data.user,
            profileData,
            onboardingStatus: 'completed' as OnboardingStatus,
            name: 'name' in profileData ? profileData.name : profileData.ownerName,
          };
          await saveUser(updatedUser);
          console.log('Onboarding completed successfully');
        } else {
          // Fallback to local update
          const updatedUser = {
            ...user,
            profileData,
            onboardingStatus: 'completed' as OnboardingStatus,
            name: 'name' in profileData ? profileData.name : profileData.ownerName,
          };
          await saveUser(updatedUser);
          console.log('Onboarding completed locally (API call failed)');
        }
      } else {
        // For non-helper users (business, user), just update locally
        const updatedUser = {
          ...user,
          profileData,
          onboardingStatus: 'completed' as OnboardingStatus,
          name: 'name' in profileData ? profileData.name : profileData.ownerName,
        };
        await saveUser(updatedUser);
        console.log('Onboarding completed locally (non-helper user)');
        return;
      }
    } catch (error) {
      console.error('Complete onboarding error:', error);
      // Fallback to local update
      const updatedUser = {
        ...user,
        profileData,
        onboardingStatus: 'completed' as OnboardingStatus,
        name: 'name' in profileData ? profileData.name : profileData.ownerName,
      };
      await saveUser(updatedUser);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      throw new Error('User not found');
    }

    try {
      // Call API to change password
      const response = await apiService.put(
        API_ENDPOINTS.PASSWORD.UPDATE,
        {
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: newPassword,
        }
      );

      if (response.success) {
        // Update password locally
        const updatedUser = {
          ...user,
          password: newPassword,
        };
        await saveUser(updatedUser);
      } else {
        throw new Error(response.error || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      // Fallback: check local password
      if (user.password && user.password !== currentPassword) {
        throw new Error('Current password is incorrect');
      }
      // Update password locally
      const updatedUser = {
        ...user,
        password: newPassword,
      };
      await saveUser(updatedUser);
    }
  };

  const logout = async () => {
    console.log('Logout function called');
    
    // Capture user ID before clearing state
    const userId = user?.id;
    const isDemoUser = userId && userId.toString().startsWith('demo-');
    
    console.log('User ID:', userId, 'Is Demo:', isDemoUser);
    
    // Clear user state FIRST to trigger navigation to login
    console.log('Clearing user state first...');
    setUser(null);
    console.log('User state cleared');
    
    try {
      // Call API to logout (only if user is authenticated with API)
      // Skip API call for demo users
      if (userId && !isDemoUser) {
        try {
          console.log('Calling logout API...');
          await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
          console.log('Logout API call successful');
        } catch (error) {
          console.error('Logout API error:', error);
          // Continue with logout even if API call fails
        }
      } else {
        console.log('Skipping API call (demo user or no user ID)');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all local storage data
      console.log('Clearing local storage...');
      try {
        await AsyncStorage.multiRemove([
          'user',
          'authToken',
          'serviceRequests',
          'helpers',
        ]);
        console.log('Storage cleared successfully');
      } catch (error) {
        console.error('Error clearing storage:', error);
        // Try individual removals as fallback
        try {
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('serviceRequests');
          await AsyncStorage.removeItem('helpers');
          console.log('Storage cleared with individual removals');
        } catch (e) {
          console.error('Error with individual removals:', e);
        }
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        verifyOTP,
        resendOTP,
        selectUserType,
        updateUser,
        completeOnboarding,
        changePassword,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

