/**
 * API Configuration
 * Base URL for all API endpoints
 * Based on: https://www.kamwaalay.com/api/documentation
 */

export const API_BASE_URL = 'https://www.kamwaalay.com/api';

/**
 * API Endpoints
 * Based on the official API documentation at https://www.kamwaalay.com/api/documentation
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY: '/verify-otp', // OTP verification endpoint
    LOGOUT: '/logout',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    RESET_PASSWORD_WITH_TOKEN: '/reset-password/:token',
  },

  // User Profile
  PROFILE: {
    GET: '/profile',
    UPDATE: '/profile',
  },

  // Password
  PASSWORD: {
    UPDATE: '/password',
  },

  // Onboarding
  ONBOARDING: {
    HELPER: '/onboarding/helper',
  },

  // Service Requests (for helpers/businesses to browse)
  SERVICE_REQUESTS: {
    LIST: '/service-requests', // Browse available service requests
  },

  // Bookings (service requests created by users)
  BOOKINGS: {
    LIST: '/bookings', // User's own bookings
    CREATE_FORM: '/bookings/create', // Get form data
    CREATE: '/bookings', // Create new booking
    GET: '/bookings/:id',
    UPDATE: '/bookings/:id',
    DELETE: '/bookings/:id',
    APPLY: '/bookings/:id/apply', // Apply to a booking
    REVIEW: '/bookings/:id/review',
    CREATE_REVIEW: '/bookings/:id/review/create',
  },

  // Job Applications
  JOB_APPLICATIONS: {
    LIST: '/job-applications',
    GET: '/job-applications/:id',
    ACCEPT: '/job-applications/:id/accept',
    REJECT: '/job-applications/:id/reject',
    WITHDRAW: '/job-applications/:id/withdraw',
    MY_APPLICATIONS: '/my-applications',
    MY_REQUEST_APPLICATIONS: '/my-request-applications',
  },

  // Helpers
  HELPERS: {
    LIST: '/helpers', // List verified helpers
    CREATE: '/helpers', // Create helper profile
    GET: '/helpers/:id',
    EDIT: '/helpers/:id/edit',
  },

  // Service Listings (services offered by helpers/businesses)
  SERVICE_LISTINGS: {
    LIST: '/service-listings',
    CREATE: '/service-listings/create',
    GET: '/service-listings/:id',
    EDIT: '/service-listings/:id/edit',
    MY_LISTINGS: '/my-service-listings',
  },

  // Reviews
  REVIEWS: {
    GET: '/reviews/:id',
    EDIT: '/reviews/:id/edit',
  },

  // Messages
  MESSAGES: {
    CONVERSATIONS: '/conversations',
    GET_MESSAGES: '/conversations/:id/messages',
    SEND: '/messages',
  },

  // Locations
  LOCATIONS: {
    SEARCH: '/locations/search',
    KARACHI_SEARCH: '/karachi-locations/search',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all',
  },

  // Home
  HOME: {
    GET: '/home',
  },

  // Support
  SUPPORT: {
    CONTACT: '/contact',
    FAQ: '/faq',
  },

  // Legal
  LEGAL: {
    TERMS: '/terms',
    PRIVACY: '/privacy',
    ABOUT: '/about',
  },

  // Locale
  LOCALE: {
    SET: '/locale/:locale',
    TRANSLATIONS: '/translations/:locale?',
  },
};

/**
 * Helper function to build full API URL
 */
export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = `${API_BASE_URL}${endpoint}`;

  // Replace path parameters
  if (params) {
    Object.keys(params).forEach((key) => {
      url = url.replace(`:${key}`, params[key]);
    });
  }

  return url;
};


