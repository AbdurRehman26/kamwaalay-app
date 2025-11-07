import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceRequest } from './AuthContext';

interface AppContextType {
  serviceRequests: ServiceRequest[];
  helpers: any[];
  businesses: any[];
  addServiceRequest: (request: Omit<ServiceRequest, 'id' | 'createdAt' | 'status' | 'applicants'>) => Promise<void>;
  applyToServiceRequest: (requestId: string, applicantId: string) => Promise<void>;
  getServiceRequests: () => ServiceRequest[];
  getHelpers: () => any[];
  getBusinesses: () => any[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [helpers, setHelpers] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const requests = await AsyncStorage.getItem('serviceRequests');
      const helpersData = await AsyncStorage.getItem('helpers');
      const businessesData = await AsyncStorage.getItem('businesses');

      if (requests) setServiceRequests(JSON.parse(requests));
      if (helpersData) setHelpers(JSON.parse(helpersData));
      if (businessesData) setBusinesses(JSON.parse(businessesData));
    } catch (error) {
      console.error('Error loading app data:', error);
    }
  };

  const addServiceRequest = async (requestData: Omit<ServiceRequest, 'id' | 'createdAt' | 'status' | 'applicants'>) => {
    const newRequest: ServiceRequest = {
      ...requestData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'open',
      applicants: [],
    };

    const updated = [...serviceRequests, newRequest];
    setServiceRequests(updated);
    await AsyncStorage.setItem('serviceRequests', JSON.stringify(updated));
  };

  const applyToServiceRequest = async (requestId: string, applicantId: string) => {
    const updated = serviceRequests.map((req) =>
      req.id === requestId
        ? { ...req, applicants: [...req.applicants, applicantId] }
        : req
    );
    setServiceRequests(updated);
    await AsyncStorage.setItem('serviceRequests', JSON.stringify(updated));
  };

  return (
    <AppContext.Provider
      value={{
        serviceRequests,
        helpers,
        businesses,
        addServiceRequest,
        applyToServiceRequest,
        getServiceRequests: () => serviceRequests,
        getHelpers: () => helpers,
        getBusinesses: () => businesses,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

