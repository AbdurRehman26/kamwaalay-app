import { API_ENDPOINTS } from '@/constants/api';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Job } from './AuthContext';

interface AppContextType {
  jobs: Job[];
  helpers: any[];
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
  const isRefreshingJobs = useRef(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load jobs from API (available bookings for helpers/businesses)
      const requestsResponse = await apiService.get(
        API_ENDPOINTS.JOBS.LIST,
        undefined,
        undefined, // queryParams - can add filters like service_type, location_id, etc.
        false // Public endpoint - no auth required
      );
      if (requestsResponse.success && requestsResponse.data) {
        // API returns data in 'job_posts' or 'bookings' key
        // Ensure data is an array
        let rawRequests = [];
        if (requestsResponse.data.job_posts) {
          // Handle job_posts response (can be paginated or direct array)
          rawRequests = Array.isArray(requestsResponse.data.job_posts.data)
            ? requestsResponse.data.job_posts.data
            : (Array.isArray(requestsResponse.data.job_posts) ? requestsResponse.data.job_posts : []);
        } else if (requestsResponse.data.bookings) {
          // Handle paginated response with bookings key
          rawRequests = Array.isArray(requestsResponse.data.bookings.data)
            ? requestsResponse.data.bookings.data
            : (Array.isArray(requestsResponse.data.bookings) ? requestsResponse.data.bookings : []);
        } else {
          rawRequests = Array.isArray(requestsResponse.data)
            ? requestsResponse.data
            : (requestsResponse.data.requests || requestsResponse.data.data || []);
        }

        // Map API booking format to app Job format
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

        setJobs(requests);
        await AsyncStorage.setItem('jobs', JSON.stringify(requests));
      } else {
        // Fallback to local storage
        const requests = await AsyncStorage.getItem('jobs');
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
      }

      // Load service listings from API (as requested by user)
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

        console.log('📋 Total service listings fetched:', listings.length);

        // Map each listing to a helper format (no grouping)
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
              })()
            };
          });

        console.log('👥 Service listings displayed as cards:', helpers.length);

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
      // Call API to create booking (job)
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
        // Map API booking response to app Job format
        const booking = response.data.booking || response.data;
        const newRequest: Job = {
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
        const updated = [...jobs, newRequest];
        setJobs(updated);
        await AsyncStorage.setItem('jobs', JSON.stringify(updated));
      } else {
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
      // According to API docs, applications are made via /api/bookings/{id}/apply
      const response = await apiService.post(
        API_ENDPOINTS.BOOKINGS.APPLY.replace(':id', requestId),
        { applicantId }
      );

      if (response.success && response.data) {
        // Update local state with API response
        const updated = jobs.map((req) =>
          req.id === requestId ? response.data : req
        );
        setJobs(updated);
        await AsyncStorage.setItem('jobs', JSON.stringify(updated));
      } else {
        // Fallback to local update
        const updated = jobs.map((req) =>
          req.id === requestId
            ? { ...req, applicants: [...req.applicants, applicantId] }
            : req
        );
        setJobs(updated);
        await AsyncStorage.setItem('jobs', JSON.stringify(updated));
      }
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

  const refreshJobs = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isRefreshingJobs.current) {
      console.log('Jobs refresh already in progress, skipping...');
      return;
    }
    
    isRefreshingJobs.current = true;
    try {
      console.log('Refreshing jobs from API...');
      // Load jobs from API
      const requestsResponse = await apiService.get(
        API_ENDPOINTS.JOBS.LIST,
        undefined,
        undefined,
        false
      );
      if (requestsResponse.success && requestsResponse.data) {
        let rawRequests = [];
        if (requestsResponse.data.job_posts) {
          // Handle job_posts response (can be paginated or direct array)
          rawRequests = Array.isArray(requestsResponse.data.job_posts.data)
            ? requestsResponse.data.job_posts.data
            : (Array.isArray(requestsResponse.data.job_posts) ? requestsResponse.data.job_posts : []);
        } else if (requestsResponse.data.bookings) {
          rawRequests = Array.isArray(requestsResponse.data.bookings.data)
            ? requestsResponse.data.bookings.data
            : (Array.isArray(requestsResponse.data.bookings) ? requestsResponse.data.bookings : []);
        } else {
          rawRequests = Array.isArray(requestsResponse.data)
            ? requestsResponse.data
            : (requestsResponse.data.requests || requestsResponse.data.data || []);
        }

        console.log(`Loaded ${rawRequests.length} jobs from API`);

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
          _original: booking,
        }));

        setJobs(requests);
        await AsyncStorage.setItem('jobs', JSON.stringify(requests));
        console.log(`Successfully updated ${requests.length} jobs`);
      } else {
        console.log('No jobs data in API response');
      }
    } catch (error) {
      console.error('Error refreshing jobs:', error);
    } finally {
      isRefreshingJobs.current = false;
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        jobs,
        helpers,
        addJob,
        applyToJob,
        getJobs: () => Array.isArray(jobs) ? jobs : [],
        getHelpers: () => Array.isArray(helpers) ? helpers : [],
        refreshJobs,
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
      addJob: async () => { },
      applyToJob: async () => { },
      getJobs: () => [],
      getHelpers: () => [],
      refreshJobs: async () => { },
    } as AppContextType;
  }
  return context;
}

