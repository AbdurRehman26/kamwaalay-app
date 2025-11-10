import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceRequest } from './AuthContext';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

interface AppContextType {
  serviceRequests: ServiceRequest[];
  helpers: any[];
  addServiceRequest: (request: Omit<ServiceRequest, 'id' | 'createdAt' | 'status' | 'applicants'>) => Promise<void>;
  applyToServiceRequest: (requestId: string, applicantId: string) => Promise<void>;
  getServiceRequests: () => ServiceRequest[];
  getHelpers: () => any[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [helpers, setHelpers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load service requests from API (available bookings for helpers/businesses)
      const requestsResponse = await apiService.get(
        API_ENDPOINTS.SERVICE_REQUESTS.LIST,
        undefined,
        undefined, // queryParams - can add filters like service_type, location_id, etc.
        false // Public endpoint - no auth required
      );
      if (requestsResponse.success && requestsResponse.data) {
        // API returns paginated data with 'bookings' key
        // Ensure data is an array
        let rawRequests = [];
        if (requestsResponse.data.bookings) {
          // Handle paginated response
          rawRequests = Array.isArray(requestsResponse.data.bookings.data) 
            ? requestsResponse.data.bookings.data 
            : (Array.isArray(requestsResponse.data.bookings) ? requestsResponse.data.bookings : []);
        } else {
          rawRequests = Array.isArray(requestsResponse.data) 
            ? requestsResponse.data 
            : (requestsResponse.data.requests || requestsResponse.data.data || []);
        }
        
        // Map API booking format to app ServiceRequest format
        const requests = rawRequests.map((booking: any) => ({
          id: booking.id?.toString() || booking.booking_id?.toString() || Date.now().toString(),
          userId: booking.user_id?.toString() || booking.user?.id?.toString() || '',
          userName: booking.user?.name || booking.name || 'Unknown',
          serviceName: booking.service_type 
            ? booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1).replace('_', ' ')
            : booking.service_name || 'Service',
          description: booking.special_requirements || booking.description || '',
          location: booking.area || booking.location || '',
          budget: booking.monthly_rate || booking.budget || booking.price,
          status: (booking.status === 'pending' ? 'open' : booking.status) || 'open',
          createdAt: booking.created_at || booking.createdAt || new Date().toISOString(),
          applicants: booking.job_applications?.map((app: any) => app.user_id?.toString() || app.applicant_id?.toString()) || 
                     booking.applicants || 
                     [],
          // Keep original data for reference
          _original: booking,
        }));
        
        setServiceRequests(requests);
        await AsyncStorage.setItem('serviceRequests', JSON.stringify(requests));
      } else {
        // Fallback to local storage
        const requests = await AsyncStorage.getItem('serviceRequests');
        if (requests) {
          try {
            const parsed = JSON.parse(requests);
            setServiceRequests(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            setServiceRequests([]);
          }
        } else {
          setServiceRequests([]);
        }
      }

      // Load helpers from API
      const helpersResponse = await apiService.get(
        API_ENDPOINTS.HELPERS.LIST,
        undefined,
        undefined, // queryParams - can add filters like user_type, service_type, location_id, etc.
        false // Public endpoint - no auth required
      );
      if (helpersResponse.success && helpersResponse.data) {
        // API returns paginated data with 'helpers' key
        // Ensure data is an array
        let helpers = [];
        if (helpersResponse.data.helpers) {
          // Handle paginated response
          helpers = Array.isArray(helpersResponse.data.helpers.data) 
            ? helpersResponse.data.helpers.data 
            : (Array.isArray(helpersResponse.data.helpers) ? helpersResponse.data.helpers : []);
        } else {
          helpers = Array.isArray(helpersResponse.data) 
            ? helpersResponse.data 
            : (helpersResponse.data.data || []);
        }
        setHelpers(helpers);
        await AsyncStorage.setItem('helpers', JSON.stringify(helpers));
      } else {
        // Fallback to local storage
        const helpersData = await AsyncStorage.getItem('helpers');
        if (helpersData) {
          try {
            const parsed = JSON.parse(helpersData);
            setHelpers(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            setHelpers([]);
          }
        } else {
          setHelpers([]);
        }
      }

    } catch (error) {
      // Error loading app data
      // Fallback to local storage
      try {
        const requests = await AsyncStorage.getItem('serviceRequests');
        const helpersData = await AsyncStorage.getItem('helpers');

        if (requests) {
          try {
            const parsed = JSON.parse(requests);
            setServiceRequests(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            setServiceRequests([]);
          }
        } else {
          setServiceRequests([]);
        }
        if (helpersData) {
          try {
            const parsed = JSON.parse(helpersData);
            setHelpers(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            setHelpers([]);
          }
        } else {
          setHelpers([]);
        }
      } catch (localError) {
        // Error loading from local storage
      }
    }
  };

  const addServiceRequest = async (requestData: Omit<ServiceRequest, 'id' | 'createdAt' | 'status' | 'applicants'>) => {
    try {
      // Call API to create booking (service request)
      // According to API docs, bookings are created via /api/bookings (POST)
      // Map our request data to API format
      const apiData = {
        service_type: requestData.serviceName?.toLowerCase() || 'maid',
        work_type: requestData.workType || 'full_time',
        area: requestData.location,
        name: requestData.userName,
        phone: requestData.phone || '',
        email: requestData.email || '',
        address: requestData.address,
        special_requirements: requestData.description,
        start_date: requestData.startDate,
        start_time: requestData.startTime,
      };
      
      const response = await apiService.post(
        API_ENDPOINTS.BOOKINGS.CREATE,
        apiData
      );

      if (response.success && response.data) {
        // Map API booking response to app ServiceRequest format
        const booking = response.data.booking || response.data;
        const newRequest: ServiceRequest = {
          id: booking.id?.toString() || Date.now().toString(),
          userId: booking.user_id?.toString() || booking.user?.id?.toString() || '',
          userName: booking.user?.name || booking.name || 'Unknown',
          serviceName: booking.service_type 
            ? booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1).replace('_', ' ')
            : 'Service',
          description: booking.special_requirements || booking.description || '',
          location: booking.area || booking.location || '',
          budget: booking.monthly_rate || booking.budget || booking.price,
          status: (booking.status === 'pending' ? 'open' : booking.status) || 'open',
          createdAt: booking.created_at || booking.createdAt || new Date().toISOString(),
          applicants: booking.job_applications?.map((app: any) => app.user_id?.toString()) || 
                     booking.applicants || 
                     [],
        };
        const updated = [...serviceRequests, newRequest];
        setServiceRequests(updated);
        await AsyncStorage.setItem('serviceRequests', JSON.stringify(updated));
      } else {
        // Fallback to local creation
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
      }
    } catch (error) {
      // Add service request error
      // Fallback to local creation
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
    }
  };

  const applyToServiceRequest = async (requestId: string, applicantId: string) => {
    try {
      // According to API docs, applications are made via /api/bookings/{id}/apply
      const response = await apiService.post(
        API_ENDPOINTS.BOOKINGS.APPLY.replace(':id', requestId),
        { applicantId }
      );

      if (response.success && response.data) {
        // Update local state with API response
        const updated = serviceRequests.map((req) =>
          req.id === requestId ? response.data : req
        );
        setServiceRequests(updated);
        await AsyncStorage.setItem('serviceRequests', JSON.stringify(updated));
      } else {
        // Fallback to local update
        const updated = serviceRequests.map((req) =>
          req.id === requestId
            ? { ...req, applicants: [...req.applicants, applicantId] }
            : req
        );
        setServiceRequests(updated);
        await AsyncStorage.setItem('serviceRequests', JSON.stringify(updated));
      }
    } catch (error) {
      // Apply to service request error
      // Fallback to local update
      const updated = serviceRequests.map((req) =>
        req.id === requestId
          ? { ...req, applicants: [...req.applicants, applicantId] }
          : req
      );
      setServiceRequests(updated);
      await AsyncStorage.setItem('serviceRequests', JSON.stringify(updated));
    }
  };

  return (
    <AppContext.Provider
      value={{
        serviceRequests,
        helpers,
        addServiceRequest,
        applyToServiceRequest,
        getServiceRequests: () => Array.isArray(serviceRequests) ? serviceRequests : [],
        getHelpers: () => Array.isArray(helpers) ? helpers : [],
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    // Return a default context instead of throwing to prevent crashes during hot reload
    return {
      serviceRequests: [],
      helpers: [],
      addServiceRequest: async () => {},
      applyToServiceRequest: async () => {},
      getServiceRequests: () => [],
      getHelpers: () => [],
    } as AppContextType;
  }
  return context;
}

