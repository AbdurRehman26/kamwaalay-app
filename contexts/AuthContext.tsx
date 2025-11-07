import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  verifyOTP: (otp: string) => Promise<boolean>;
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
        setUser(JSON.parse(userData));
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
    // In a real app, this would call your backend API
    // For now, we'll simulate OTP generation
    console.log('Sending OTP to:', phoneNumber);
    // Store phone number temporarily
    const tempUser: User = {
      id: Date.now().toString(),
      phoneNumber: phoneNumber,
      userType: null,
      onboardingStatus: 'not_started',
    };
    await saveUser(tempUser);
  };

  const verifyOTP = async (otp: string): Promise<boolean> => {
    // In a real app, this would verify OTP with your backend
    // For demo purposes, accept any 6-digit code
    if (otp.length === 6 && user) {
      // User already exists from login, just verify
      return true;
    }
    return false;
  };

  const selectUserType = async (userType: UserType) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      userType,
      onboardingStatus: 'in_progress' as OnboardingStatus,
    };
    await saveUser(updatedUser);
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...userData };
    await saveUser(updatedUser);
  };

  const completeOnboarding = async (profileData: HelperProfile | BusinessProfile) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      profileData,
      onboardingStatus: 'completed' as OnboardingStatus,
      name: 'userType' in profileData ? profileData.name : profileData.ownerName,
    };
    await saveUser(updatedUser);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      throw new Error('User not found');
    }

    // In a real app, you would verify the current password with your backend
    // For demo purposes, we'll check if password exists and matches
    if (user.password && user.password !== currentPassword) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    const updatedUser = {
      ...user,
      password: newPassword,
    };
    await saveUser(updatedUser);
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        verifyOTP,
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

