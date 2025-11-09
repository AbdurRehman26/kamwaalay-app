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

  const login = async (phoneNumber: string) => {
    try {
      // Call API to initiate login/OTP flow
      // According to API docs, login accepts phone/email and password
      // For phone-only flow, we'll use phone as identifier
      // The API will return 202 if OTP is required, or 200 with token if verified
      const response = await apiService.post(
        API_ENDPOINTS.AUTH.LOGIN,
        { 
          phone: phoneNumber,
          // Note: API may require password for existing users, but for new users
          // it should trigger OTP flow. We'll handle this in the response.
        },
        undefined,
        false // No auth required for login
      );

      // API returns 202 for OTP required, 200 for successful login
      if (response.success && response.data) {
        // Check if OTP verification is required (202 response)
        if (response.data.verification_method) {
          // OTP required - store phone number temporarily
          const tempUser: User = {
            id: response.data.user_id?.toString() || Date.now().toString(),
            phoneNumber: phoneNumber,
            userType: null,
            onboardingStatus: 'not_started',
            isVerified: false, // User needs to verify OTP
          };
          await saveUser(tempUser);
        } else if (response.data.token) {
          // Direct login successful - save user with token
          const userData: User = {
            id: response.data.user?.id?.toString() || Date.now().toString(),
            phoneNumber: phoneNumber,
            isVerified: true, // If token is provided, user is verified
            userType: response.data.user?.role || null,
            name: response.data.user?.name,
            email: response.data.user?.email,
            onboardingStatus: response.data.user?.onboarding_status || 'not_started',
          };
          if (response.data.token) {
            await AsyncStorage.setItem('authToken', response.data.token);
            (userData as any).token = response.data.token;
          }
          await saveUser(userData);
        }
      } else {
        // Extract backend error message
        const errorMessage = response.error || response.message || 'Login failed';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // If error already has a message, use it; otherwise create a generic one
      const errorMessage = error.message || error.error || 'Failed to send OTP. Please try again.';
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
    if (!user) return false;

    try {
      // According to API docs, OTP verification is part of login flow
      // We'll use the login endpoint with OTP
      // Note: The actual API may have a separate OTP verification endpoint
      // For now, we'll try login with phone and OTP
      const response = await apiService.post(
        API_ENDPOINTS.AUTH.LOGIN,
        {
          phone: user.phoneNumber,
          otp: otp,
          // Some APIs use 'code' instead of 'otp'
        },
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
          id: userDataFromApi.id || user.id,
          phoneNumber: userDataFromApi.phoneNumber || user.phoneNumber,
          userType: userDataFromApi.userType || user.userType,
          name: userDataFromApi.name,
          email: userDataFromApi.email,
          profileImage: userDataFromApi.profileImage,
          onboardingStatus: userDataFromApi.onboardingStatus || user.onboardingStatus,
          isVerified: true, // OTP verified successfully
        };
        
        if (token) {
          // Store token separately
          await AsyncStorage.setItem('authToken', token);
          // Also store in user object for backward compatibility
          (userData as any).token = token;
        }
        
        await saveUser(userData);
        return true;
      } else {
        // Extract backend error message
        const errorMessage = response.error || response.message || 'OTP verification failed';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      // If error already has a message, throw it; otherwise fallback for demo
      if (error.message) {
        throw error;
      }
      // Fallback: accept any 6-digit code for demo
      if (otp.length === 6) {
        return true;
      }
      throw new Error('Invalid OTP. Please try again.');
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
      // Call API to update user profile (PATCH method according to API docs)
      const response = await apiService.patch(
        API_ENDPOINTS.PROFILE.UPDATE,
        userData
      );

      if (response.success && response.data) {
        const updatedUser = { ...user, ...response.data };
        await saveUser(updatedUser);
      } else {
        // Fallback to local update
        const updatedUser = { ...user, ...userData };
        await saveUser(updatedUser);
      }
    } catch (error) {
      console.error('Update user error:', error);
      // Fallback to local update
      const updatedUser = { ...user, ...userData };
      await saveUser(updatedUser);
    }
  };

  const completeOnboarding = async (profileData: HelperProfile | BusinessProfile) => {
    if (!user) return;

    try {
      // Call API to complete onboarding
      const endpoint = user.userType === 'helper' 
        ? API_ENDPOINTS.ONBOARDING.HELPER 
        : API_ENDPOINTS.ONBOARDING.BUSINESS;

      // Map profile data to API format
      let apiData: any;
      
      if (user.userType === 'helper') {
        // Helper onboarding requires: services, nic, nic_number
        // For now, we'll create a basic structure - this needs to be enhanced
        // with actual service selection and NIC upload
        apiData = {
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
      } else {
        // Business onboarding
        apiData = {
          business_name: 'businessName' in profileData ? profileData.businessName : undefined,
          business_address: 'businessAddress' in profileData ? profileData.businessAddress : undefined,
          business_description: 'bio' in profileData ? profileData.bio : undefined,
        };
      }

      const response = await apiService.post(endpoint, apiData);

      if (response.success && response.data) {
        const updatedUser = {
          ...user,
          ...response.data.user,
          profileData,
          onboardingStatus: 'completed' as OnboardingStatus,
          name: 'userType' in profileData ? profileData.name : profileData.ownerName,
        };
        await saveUser(updatedUser);
      } else {
        // Fallback to local update
        const updatedUser = {
          ...user,
          profileData,
          onboardingStatus: 'completed' as OnboardingStatus,
          name: 'userType' in profileData ? profileData.name : profileData.ownerName,
        };
        await saveUser(updatedUser);
      }
    } catch (error) {
      console.error('Complete onboarding error:', error);
      // Fallback to local update
      const updatedUser = {
        ...user,
        profileData,
        onboardingStatus: 'completed' as OnboardingStatus,
        name: 'userType' in profileData ? profileData.name : profileData.ownerName,
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
          'businesses',
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
          await AsyncStorage.removeItem('businesses');
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

