import { API_ENDPOINTS } from '@/constants/api';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserType = 'user' | 'helper' | 'business' | null;
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

/**
 * Helper function to extract onboarding status from API response
 * Handles both boolean fields (is_onboarded, onboarded) and status strings (onboarding_status, onboardingStatus)
 */
function extractOnboardingStatus(apiData: any, fallback: OnboardingStatus = 'not_started'): OnboardingStatus {
  // Check for boolean fields first (is_onboarded, onboarded)
  if (apiData?.is_onboarded === true || apiData?.onboarded === true) {
    return 'completed';
  }
  if (apiData?.is_onboarded === false || apiData?.onboarded === false) {
    // If explicitly false, check if there's a status field
    const status = apiData?.onboarding_status || apiData?.onboardingStatus;
    if (status && typeof status === 'string') {
      return status as OnboardingStatus;
    }
    return 'not_started';
  }

  // Check for status string fields (onboarding_status, onboardingStatus)
  const status = apiData?.onboarding_status || apiData?.onboardingStatus;
  if (status && typeof status === 'string') {
    return status as OnboardingStatus;
  }

  return fallback;
}

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
  login: (data: { phone?: string; email?: string; password?: string; authMethod: 'otp' | 'password' }) => Promise<{ requiresOTP?: boolean } | void>;
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
        // Only load user if they are verified, otherwise clear unverified users
        if (parsed.isVerified === true) {
          setUser(parsed);
        } else {
          // Clear unverified user data on app load
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('authToken');
          setUser(null);
        }
      }
    } catch (error) {
      // Error loading user
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      // Error saving user
    }
  };

  const login = async (data: {
    phone?: string;
    email?: string;
    password?: string;
    authMethod: 'otp' | 'password';
  }): Promise<{ requiresOTP?: boolean } | void> => {
    try {
      console.log('[Login] Starting login process', {
        phone: data.phone,
        email: data.email ? `${data.email.substring(0, 3)}***` : undefined,
        authMethod: data.authMethod,
      });

      // Build request body based on login method and auth method
      const requestBody: any = {};

      // Add identifier (phone or email)
      if (data.phone) {
        // Format phone number (remove spaces, dashes, etc.)
        requestBody.phone = data.phone.replace(/\s+/g, '').replace(/-/g, '');
      } else if (data.email) {
        requestBody.email = data.email.trim();
      } else {
        console.error('[Login] No phone or email provided');
        throw new Error('Please provide either phone number or email');
      }

      // Add password if using password authentication
      if (data.authMethod === 'password') {
        if (!data.password) {
          console.error('[Login] Password required but not provided');
          throw new Error('Password is required for password authentication');
        }
        requestBody.password = data.password;
      }

      console.log('[Login] Request body prepared', {
        phone: requestBody.phone,
        email: requestBody.email ? `${requestBody.email.substring(0, 3)}***` : undefined,
        hasPassword: !!requestBody.password,
        authMethod: data.authMethod,
      });

      // Always call API to initiate login/OTP flow (even for demo number)
      console.log('[Login] Calling API:', API_ENDPOINTS.AUTH.LOGIN);
      const response = await apiService.post(
        API_ENDPOINTS.AUTH.LOGIN,
        requestBody,
        undefined,
        false // No auth required for login
      );

      console.log('[Login] API response received', {
        success: response.success,
        hasData: !!response.data,
        hasError: !!response.error,
        message: response.message,
      });

      // API returns 202 for OTP required, 200 for successful login
      // Handle both success and non-success responses for OTP flow
      if (response.success && response.data) {
        const responseData = response.data;

        console.log('[Login] Processing successful response', {
          hasToken: !!(responseData.token || responseData.accessToken || responseData.access_token),
          hasUser: !!(responseData.user || responseData),
          userId: responseData.user_id || responseData.user?.id || responseData.id,
        });

        const token = responseData.token || responseData.accessToken || responseData.access_token;
        const userDataFromApi = responseData.user || responseData;
        const userId = responseData.user_id || userDataFromApi.id || responseData.id;

        // If we have a token, proceed with direct login (user is already authenticated)
        // This takes priority over OTP verification
        if (token) {
          console.log('[Login] Token found - proceeding with direct login', {
            userId,
            hasUserData: !!userDataFromApi,
          });

          // Direct login successful (password auth or OTP already verified) - save user with token
          const userData: User = {
            id: userId?.toString() || userDataFromApi.id?.toString() || Date.now().toString(),
            phoneNumber: data.phone || userDataFromApi.phone || userDataFromApi.phoneNumber || '',
            email: data.email || userDataFromApi.email,
            isVerified: true, // If token is provided, user is verified
            userType: userDataFromApi.role || userDataFromApi.userType || null,
            name: userDataFromApi.name,
            profileImage: userDataFromApi.profile_image || userDataFromApi.profileImage,
            onboardingStatus: extractOnboardingStatus(userDataFromApi, 'not_started'),
          };

          // Save token to AsyncStorage
          try {
            await AsyncStorage.setItem('authToken', token);
            console.log('[Login] Token saved to AsyncStorage');
          } catch (tokenError) {
            console.error('[Login] Error saving token to AsyncStorage:', tokenError);
          }

          // Also store token in user object
          (userData as any).token = token;

          // Save user data
          await saveUser(userData);
          console.log('[Login] User saved successfully - login complete');
          return; // No OTP required - login successful
        }

        // No token - check if OTP verification is required
        // For OTP flow, API might return user_id but no token yet
        if (data.authMethod === 'otp') {
          console.log('[Login] No token found - OTP verification required', {
            userId,
          });

          // OTP required - store identifier and user_id temporarily
          const tempUser: User = {
            id: userId?.toString() || Date.now().toString(),
            phoneNumber: data.phone || userDataFromApi.phone || userDataFromApi.phoneNumber || '',
            email: data.email || userDataFromApi.email,
            userType: userDataFromApi.role || userDataFromApi.userType || null,
            name: userDataFromApi.name,
            onboardingStatus: extractOnboardingStatus(userDataFromApi, 'not_started'),
            isVerified: false, // User needs to verify OTP
          };

          await saveUser(tempUser);
          console.log('[Login] Temporary user saved - OTP required');
          return { requiresOTP: true };
        } else {
          // Password auth but no token - unexpected
          console.error('[Login] Password auth but no token received');
          throw new Error('Unexpected response from server');
        }
      } else {
        // Response was not successful
        console.log('[Login] Response not successful', {
          error: response.error,
          message: response.message,
          hasData: !!response.data,
        });

        // For OTP flow, even if response.success is false, check if OTP was sent
        if (data.authMethod === 'otp' && (response.message || response.data?.message)) {
          console.log('[Login] OTP flow - proceeding despite unsuccessful response');
          // OTP was sent but response format indicates failure - still proceed with OTP flow
          const tempUser: User = {
            id: (response.data?.user_id || response.data?.id || Date.now()).toString(),
            phoneNumber: data.phone || response.data?.phone || '',
            email: data.email || response.data?.email,
            userType: response.data?.role || response.data?.userType || null,
            name: response.data?.name,
            onboardingStatus: extractOnboardingStatus(response.data, 'not_started'),
            isVerified: false,
          };
          await saveUser(tempUser);
          console.log('[Login] Temporary user saved - OTP required (from unsuccessful response)');
          return { requiresOTP: true };
        }

        // Extract backend error message - prioritize error field, then message, then data.message
        const errorMessage = response.error || response.message || response.data?.message || 'Login failed. Please try again.';
        console.error('[Login] Login failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      // If error already has a message, use it; otherwise create a generic one
      const errorMessage = error.message || error.error || 'Login failed. Please try again.';
      console.error('[Login] Error caught:', {
        message: errorMessage,
        error: error,
        stack: error.stack,
      });
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
          onboardingStatus: extractOnboardingStatus(userDataFromApi, 'not_started'),
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

      // Extract error message from various possible formats
      let errorMessage = 'Failed to create account. Please try again.';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = error.message || error.error || error.toString();
      }

      // Re-throw with the extracted error message
      throw new Error(errorMessage);
    }
  };

  const verifyOTP = async (otp: string): Promise<boolean> => {
    if (!user) {
      throw new Error('No user found. Please login again.');
    }

    // Check if this is a demo user by phone number - accept any OTP
    const DEMO_PHONE = '9876543210';
    const formattedPhone = user.phoneNumber ? user.phoneNumber.replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '').replace(/^91/, '') : '';
    const isDemoUser = formattedPhone === DEMO_PHONE;

    if (isDemoUser) {
      // Demo user - accept any OTP and mark as verified
      const verifiedUser: User = {
        ...user,
        isVerified: true,
      };
      await saveUser(verifiedUser);
      return true;
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
          onboardingStatus: extractOnboardingStatus(userDataFromApi, user.onboardingStatus || 'not_started'),
          isVerified: true, // OTP verified successfully
        };

        // Save token first if available
        if (token) {
          try {
            // Store token separately in AsyncStorage
            await AsyncStorage.setItem('authToken', token);
            // Also store in user object for backward compatibility
            (userData as any).token = token;
          } catch (tokenError) {
            // Error saving token
            // Continue even if token save fails, but log the error
          }
        } else {
        }

        // Save user data (this also updates the user state)
        try {
          await saveUser(userData);
        } catch (userError) {
          // Error saving user
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

      // Extract error message from various possible formats
      let errorMessage = 'Invalid OTP. Please try again.';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = error.message || error.error || error.toString();
      }

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
        }
      }

      // Check if token exists
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Call API to update user profile (PATCH method according to API docs)
      // The apiService.patch() will automatically include the token in the Authorization header

      const response = await apiService.patch(
        API_ENDPOINTS.PROFILE.UPDATE,
        userData,
        undefined,
        true // Explicitly include auth token
      );


      if (response.success && response.data) {
        const responseData = response.data;
        const userDataFromApi = responseData.user || responseData;
        // Extract onboarding status from API response, but prefer userData.onboardingStatus if explicitly provided
        const onboardingStatusFromApi = extractOnboardingStatus(userDataFromApi, user.onboardingStatus || 'not_started');
        const updatedUser = {
          ...user,
          ...userDataFromApi,
          // Preserve existing user data that might not be in response
          id: userDataFromApi.id?.toString() || user.id,
          phoneNumber: userDataFromApi.phone || userDataFromApi.phoneNumber || user.phoneNumber,
          email: userDataFromApi.email || user.email || userData.email,
          name: userDataFromApi.name || user.name || userData.name,
          // Use onboardingStatus from userData if explicitly provided, otherwise use API response
          onboardingStatus: userData.onboardingStatus || onboardingStatusFromApi,
        };
        await saveUser(updatedUser);
      } else {
        // Extract error message
        const errorMessage = response.error || response.message || 'Failed to update profile';
        throw new Error(errorMessage);
      }
    } catch (error: any) {

      // Extract error message
      const errorMessage = error.message || error.error || 'Failed to update profile. Please try again.';

      // Re-throw error so calling code can handle it
      throw new Error(errorMessage);
    }
  };

  const completeOnboarding = async (
    profileData: HelperProfile | BusinessProfile,
    additionalData?: {
      verification?: {
        nicFile: any | null;
        nicNumber: string;
        photoFile: any | null;
      };
      serviceOffer?: {
        serviceTypes: string[];
        locations: any[];
        workType: string;
        monthlyRate: string;
        description: string;
      };
    }
  ) => {
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
          const profileResponseData = profileResponse.data.user || profileResponse.data;
          const updatedUserFromProfile = {
            ...user,
            ...profileResponseData,
            // Extract onboarding status from API response
            onboardingStatus: extractOnboardingStatus(profileResponseData, user.onboardingStatus || 'not_started'),
          };
          await saveUser(updatedUserFromProfile);
        } else {
          // Fallback to local update
          const updatedUserFromProfile = { ...user, ...profileUpdateData };
          await saveUser(updatedUserFromProfile);
        }
      } catch (profileError) {
        // Profile update error
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
        const workType = additionalData?.serviceOffer?.workType || 'full_time';
        const monthlyRate = additionalData?.serviceOffer?.monthlyRate
          ? parseFloat(additionalData.serviceOffer.monthlyRate)
          : undefined;
        const nicNumber = additionalData?.verification?.nicNumber || '';

        // Map service types to services array - just the service type strings
        const services: string[] = [];

        if (additionalData?.serviceOffer?.serviceTypes) {
          services.push(...additionalData.serviceOffer.serviceTypes);
        } else if (profileData.serviceOfferings) {
          // Fallback to profileData service offerings
          profileData.serviceOfferings.forEach((service) => {
            if (service.category) {
              services.push(service.category);
            }
          });
        }

        // Map locations to location IDs array
        const locations: number[] = [];
        if (additionalData?.serviceOffer?.locations) {
          additionalData.serviceOffer.locations.forEach((location) => {
            const locationId = typeof location.id === 'number' ? location.id : parseInt(String(location.id));
            if (locationId && !isNaN(locationId)) {
              locations.push(locationId);
            }
          });
        }

        const apiData = {
          services,
          work_type: workType,
          monthly_rate: monthlyRate,
          description: additionalData?.serviceOffer?.description || '',
          locations,
          nic_number: nicNumber,
          bio: 'bio' in profileData ? profileData.bio : undefined,
          experience_years: 'experience' in profileData && profileData.experience ? parseInt(profileData.experience) || 0 : undefined,
          skills: undefined,
        };

        const response = await apiService.post(endpoint, apiData);

        if (response.success && response.data) {
          const responseData = response.data.user || response.data;
          const updatedUser = {
            ...user,
            ...responseData,
            profileData,
            // Extract onboarding status from API response, default to 'completed' for onboarding completion
            onboardingStatus: extractOnboardingStatus(responseData, 'completed'),
            name: 'name' in profileData ? profileData.name : profileData.ownerName,
          };
          await saveUser(updatedUser);
        } else {
          // Fallback to local update
          const updatedUser = {
            ...user,
            profileData,
            onboardingStatus: 'completed' as OnboardingStatus,
            name: 'name' in profileData ? profileData.name : profileData.ownerName,
          };
          await saveUser(updatedUser);
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
        return;
      }
    } catch (error) {
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
    // Capture user ID before clearing state
    const userId = user?.id;
    // Check if this is a demo user by phone number
    const DEMO_PHONE = '9876543210';
    const formattedPhone = user?.phoneNumber ? user.phoneNumber.replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '').replace(/^91/, '') : '';
    const isDemoUser = formattedPhone === DEMO_PHONE;

    // Clear user state FIRST to trigger navigation to login
    setUser(null);

    try {
      // Call API to logout (only if user is authenticated with API)
      // Skip API call for demo users
      if (userId && !isDemoUser) {
        try {
          await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
          // Logout API error
          // Continue with logout even if API call fails
        }
      } else {
      }
    } catch (error) {
    } finally {
      // Clear all local storage data
      try {
        await AsyncStorage.multiRemove([
          'user',
          'authToken',
          'serviceRequests',
          'helpers',
        ]);
      } catch (error) {
        // Try individual removals as fallback
        try {
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('serviceRequests');
          await AsyncStorage.removeItem('helpers');
        } catch (e) {
          // Error clearing storage
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
    // Return a default context instead of throwing to prevent crashes during hot reload
    return {
      user: null,
      isLoading: true,
      login: async () => { },
      register: async () => ({ success: false }),
      verifyOTP: async () => false,
      resendOTP: async () => { },
      selectUserType: async () => { },
      updateUser: async () => { },
      completeOnboarding: async () => { },
      changePassword: async () => { },
      logout: async () => { },
      isAuthenticated: false,
    } as AuthContextType;
  }
  return context;
}

