import { API_ENDPOINTS } from '@/constants/api';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Job, useAuth } from './AuthContext';

interface AppContextType {
  jobs: Job[];
  helpers: any[];
  serviceTypes: any[];
  addJob: (request: Omit<Job, 'id' | 'createdAt' | 'status' | 'applicants'>) => Promise<void>;
  applyToJob: (requestId: string, applicantId: string) => Promise<void>;
  getJobs: () => Job[];
  getHelpers: () => any[];
  refreshJobs: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [helpers, setHelpers] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const isRefreshingJobs = useRef(false);
  const { user } = useAuth(); // Get user from AuthContext

  useEffect(() => {
    loadData();
  }, [user, user?.userType]); // Re-load when user is available or user type changes


  const loadData = async () => {
    try {
      // Load service types (available for all users)
      try {
        const serviceTypesResponse = await apiService.get(
          API_ENDPOINTS.SERVICE_TYPES.LIST,
          undefined,
          undefined,
          false // Public endpoint
        );

        if (serviceTypesResponse.success && serviceTypesResponse.data) {
          const types = Array.isArray(serviceTypesResponse.data)
            ? serviceTypesResponse.data
            : (serviceTypesResponse.data.data || []);
          setServiceTypes(types);
          await AsyncStorage.setItem('serviceTypes', JSON.stringify(types));
        } else {
          // Fallback to local storage
          const storedTypes = await AsyncStorage.getItem('serviceTypes');
          if (storedTypes) setServiceTypes(JSON.parse(storedTypes));
        }
      } catch (error) {
        console.error('Error fetching service types:', error);
        // Fallback to local storage
        const storedTypes = await AsyncStorage.getItem('serviceTypes');
        if (storedTypes) setServiceTypes(JSON.parse(storedTypes));
      }

      // Only load jobs from API if user is not a business or helper
      // Service requests are only for regular users (customers)
      const isHelperOrBusiness = user?.userType === 'helper' || user?.userType === 'business';

      // Load service listings from API - ONLY for regular users (customers)
      // Helpers and businesses should NOT see service listings in the explore tab
      if (!isHelperOrBusiness) {
        const listingsResponse = await apiService.get(
          API_ENDPOINTS.SERVICE_LISTINGS.LIST,
          undefined,
          undefined,
          false
        );

        if (listingsResponse.success && listingsResponse.data) {
          let listings = [];

          // Handle different response formats - API returns under listings.data
          if (listingsResponse.data.listings) {
            // Check if it's paginated (listings.data)
            if (listingsResponse.data.listings.data) {
              listings = Array.isArray(listingsResponse.data.listings.data)
                ? listingsResponse.data.listings.data
                : [];
            } else {
              // Direct array under listings
              listings = Array.isArray(listingsResponse.data.listings)
                ? listingsResponse.data.listings
                : [];
            }
          } else if (listingsResponse.data.service_listings) {
            // Fallback: check service_listings key
            listings = Array.isArray(listingsResponse.data.service_listings.data)
              ? listingsResponse.data.service_listings.data
              : (Array.isArray(listingsResponse.data.service_listings) ? listingsResponse.data.service_listings : []);
          } else if (Array.isArray(listingsResponse.data)) {
            // Direct array
            listings = listingsResponse.data;
          } else if (listingsResponse.data.data) {
            // Generic data key
            listings = Array.isArray(listingsResponse.data.data) ? listingsResponse.data.data : [];
          }

          const helpers = listings
            .filter((listing: any) => listing.user) // Only include listings with user data
            .map((listing: any) => {
              const user = listing.user;

              // Parse experience if it's a string like "5 years"
              let experience = 0;
              const expRaw = user.profileData?.experience || user.experience;
              if (typeof expRaw === 'number') {
                experience = expRaw;
              } else if (typeof expRaw === 'string') {
                const match = expRaw.match(/(\d+)/);
                if (match) experience = parseInt(match[1], 10);
              }

              return {
                id: listing.id, // Use listing ID instead of user ID
                name: user.name,
                user: user,
                bio: user.profileData?.bio || user.bio || listing.description || '',
                experience_years: experience,
                // Handle both single service_type and array of service_types
                services: (() => {
                  const servicesList = [];

                  // Check if service_types is an array
                  if (listing.service_types && Array.isArray(listing.service_types)) {
                    listing.service_types.forEach((serviceType: string) => {
                      servicesList.push({
                        id: listing.id,
                        service_type: serviceType,
                        monthly_rate: listing.monthly_rate,
                        location_id: listing.location_id,
                        location: listing.location,
                        area: listing.area,
                        description: listing.description
                      });
                    });
                  } else if (listing.service_type) {
                    // Single service_type
                    servicesList.push({
                      id: listing.id,
                      service_type: listing.service_type,
                      monthly_rate: listing.monthly_rate,
                      location_id: listing.location_id,
                      location: listing.location,
                      area: listing.area,
                      description: listing.description
                    });
                  }

                  return servicesList.length > 0 ? servicesList : [{
                    id: listing.id,
                    service_type: 'Service',
                    monthly_rate: listing.monthly_rate,
                    location_id: listing.location_id,
                    location: listing.location,
                    area: listing.area,
                    description: listing.description
                  }];
                })(),
                area: listing.area || listing.location?.name || '',
                rating: user.rating || 0,
                reviews_count: user.reviews_count || 0,
                profile_image: user.profile_image,
                role: user.user_type || user.role || 'helper',
                // Handle multiple locations - prioritize location_details
                location_details: listing.location_details && Array.isArray(listing.location_details)
                  ? listing.location_details
                  : undefined,
                // Handle multiple locations (fallback)
                locations: (() => {
                  const locationsList = [];

                  // First check location_details
                  if (listing.location_details && Array.isArray(listing.location_details)) {
                    listing.location_details.forEach((loc: any) => {
                      const locationName = loc.name || loc.location_name || '';
                      const area = loc.area || loc.area_name || '';
                      if (locationName && area) {
                        locationsList.push(`${locationName}, ${area}`);
                      } else if (locationName) {
                        locationsList.push(locationName);
                      } else if (area) {
                        locationsList.push(area);
                      }
                    });
                  }

                  // Check if locations is an array
                  if (listing.locations && Array.isArray(listing.locations)) {
                    listing.locations.forEach((loc: any) => {
                      if (typeof loc === 'string') {
                        locationsList.push(loc);
                      } else if (loc.name) {
                        locationsList.push(loc.name);
                      } else if (loc.area) {
                        locationsList.push(loc.area);
                      }
                    });
                  }

                  // Add individual location fields
                  if (listing.area) locationsList.push(listing.area);
                  if (listing.location?.name) locationsList.push(listing.location.name);
                  if (listing.location_name) locationsList.push(listing.location_name);

                  // Remove duplicates and filter out empty values
                  return [...new Set(locationsList.filter(Boolean))];
                })(),

                // Demo graphics mapping
                religion: user.profileData?.religion || user.religion,
                gender: user.profileData?.gender || user.gender,
                age: user.profileData?.age || user.age,
                languages: (() => {
                  const langs = user.profileData?.languages || user.languages;
                  if (Array.isArray(langs)) return langs;
                  if (typeof langs === 'string') return [langs];
                  return [];
                })()
              };
            });

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
      } // End of if (!isHelperOrBusiness) - service listings only for customers

    } catch (error) {
      // Error loading app data
      // Fallback to local storage
      try {
        const requests = await AsyncStorage.getItem('jobs');
        const helpersData = await AsyncStorage.getItem('helpers');

        if (requests) {
          try {
            const parsed = JSON.parse(requests);
            setJobs(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            setJobs([]);
          }
        } else {
          setJobs([]);
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

  const addJob = async (requestData: Omit<Job, 'id' | 'createdAt' | 'status' | 'applicants'>) => {
    try {
      // Fallback to local creation
      const newRequest: Job = {
        ...requestData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'open',
        applicants: [],
      };
      const updated = [...jobs, newRequest];
      setJobs(updated);
      await AsyncStorage.setItem('jobs', JSON.stringify(updated));

    } catch (error) {
      // Add job error
      // Fallback to local creation
      const newRequest: Job = {
        ...requestData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'open',
        applicants: [],
      };
      const updated = [...jobs, newRequest];
      setJobs(updated);
      await AsyncStorage.setItem('jobs', JSON.stringify(updated));
    }
  };

  const applyToJob = async (requestId: string, applicantId: string) => {
    try {
      const updated = jobs.map((req) =>
          req.id === requestId
              ? { ...req, applicants: [...req.applicants, applicantId] }
              : req
      );
      setJobs(updated);
      await AsyncStorage.setItem('jobs', JSON.stringify(updated));
    } catch (error) {
      // Apply to job error
      // Fallback to local update
      const updated = jobs.map((req) =>
        req.id === requestId
          ? { ...req, applicants: [...req.applicants, applicantId] }
          : req
      );
      setJobs(updated);
      await AsyncStorage.setItem('jobs', JSON.stringify(updated));
    }
  };

  return (
    <AppContext.Provider
      value={{
        jobs,
        helpers,
        serviceTypes,
        addJob,
        applyToJob,
        getJobs: () => Array.isArray(jobs) ? jobs : [],
        getHelpers: () => Array.isArray(helpers) ? helpers : [],
        refreshJobs: loadData,
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
      jobs: [],
      helpers: [],
      serviceTypes: [],
      addJob: async () => { },
      applyToJob: async () => { },
      getJobs: () => [],
      getHelpers: () => [],
      refreshJobs: async () => { },
    } as AppContextType;
  }
  return context;
}

