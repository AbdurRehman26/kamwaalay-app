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

  // Service Types
  SERVICE_TYPES: {
    LIST: '/service-types',
  },

  // User Profile
  PROFILE: {
    GET: '/profile',
    UPDATE: '/profile',
    PHOTO: '/profile/photo',
  },

  // Password
  PASSWORD: {
    UPDATE: '/password',
  },

  // Onboarding
  ONBOARDING: {
    HELPER: '/onboarding/helper',
    BUSINESS: '/onboarding/business',
  },

  // Jobs (for helpers/businesses to browse)
  JOBS: {
    BROWSE: '/bookings/browse', // Browse available job posts (public access)
  },

  // Job Posts (service requests created by users)
  // Based on: https://www.kamwaalay.com/api/documentation#/JobPosts
  JOB_POSTS: {
    LIST: '/job-posts', // GET - List all job posts
    BROWSE: '/bookings/browse', // Browse available job posts
    MY_POSTS: '/my-job-posts', // User's own job posts
    CREATE_FORM: '/job-posts/create', // Get form data
    CREATE: '/bookings', // Create new job post
    GET: '/job-posts/:id', // Get specific job post
    UPDATE: '/job-posts/:id', // Update job post
    DELETE: '/job-posts/:id', // Delete job post
    // Documentation: https://www.kamwaalay.com/api/documentation#/JobPosts/ba5c4f4528269686e482bf236a91d5d4
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

  // Businesses
  BUSINESSES: {
    LIST: '/businesses', // List verified businesses
    CREATE: '/businesses', // Create business profile
    GET: '/businesses/:id',
    EDIT: '/businesses/:id/edit',
  },

  // Service Listings (services offered by helpers/businesses)
  // Based on: https://www.kamwaalay.com/api/documentation#/Service%20Listings
  SERVICE_LISTINGS: {
    LIST: '/service-listings', // GET - List all service listings
    CREATE: '/service-listings', // POST - Create new service listing
    GET: '/service-listings/:id', // GET - Get specific service listing
    UPDATE: '/service-listings/:id', // PUT/PATCH - Update service listing
    DELETE: '/service-listings/:id', // DELETE - Delete service listing
    MY_LISTINGS: '/service-listings/my-service-listings', // GET - Get authenticated user's service listings
    // Documentation: https://www.kamwaalay.com/api/documentation#/Service%20Listings/8895da6a88c7b82d53897342cc96204f
  },

  // Reviews
  REVIEWS: {
    GET: '/reviews/:id',
    EDIT: '/reviews/:id/edit',
  },

  // Messages
  MESSAGES: {
    CONVERSATIONS: '/conversations',
    CREATE_CONVERSATION: '/conversations',
    GET_MESSAGES: '/conversations/:id/messages',
    DELETE_CONVERSATION: '/conversations/:id',
    SEND: '/messages',
    DELETE: '/messages/:id',
  },

  // Locations
  LOCATIONS: {
    SEARCH: '/locations/search',
    KARACHI_SEARCH: '/karachi-locations/search',
  },

  // Cities
  CITIES: {
    LIST: '/cities',
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
  LANGUAGES: {
    LIST: '/languages',
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


