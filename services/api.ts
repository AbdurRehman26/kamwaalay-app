/**
 * API Service
 * Centralized API client for making HTTP requests
 */

import { API_BASE_URL, buildApiUrl } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Get authentication token from storage
   * Checks both the separate authToken key and the user object
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      // First, check for token stored separately
      const authToken = await AsyncStorage.getItem('authToken');
      if (authToken) {
        return authToken;
      }

      // Fallback: check user object
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const token = user.token || null;
          if (token) {
            // Save token to separate key for future use
            const existing = await AsyncStorage.getItem('authToken');
            if (!existing) {
              await AsyncStorage.setItem('authToken', token);
            }
            return token;
          }
        } catch (parseError) {
          // Error parsing user data
        }
      }

      return null;
    } catch (error) {
      // Error getting auth token
      return null;
    }
  }

  /**
   * Build headers for API requests
   */
  private async buildHeaders(includeAuth: boolean = true, isFormData: boolean = false): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (includeAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let data: any = {};

    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = { message: text };
          }
        }
      }
    } catch (error) {
      // Error parsing response
      data = {};
    }

    if (!response.ok) {
      // Handle different error response formats
      const errorMessage =
        data.message ||
        data.error ||
        data.error?.message ||
        (Array.isArray(data.errors)
          ? data.errors.join(', ')
          : (typeof data.errors === 'object' && data.errors !== null)
            ? Object.values(data.errors).flat().join(', ')
            : null) ||
        `HTTP ${response.status}: ${response.statusText}`;

      return {
        success: false,
        error: errorMessage,
        message: data.message,
        data: data.data || data,
      };
    }

    // Handle different success response formats
    // Common formats: { data: {...} }, { data: [...] }, { ... }, [...]
    let responseData = data;
    if (data.data !== undefined) {
      responseData = data.data;
    } else if (data.result !== undefined) {
      responseData = data.result;
    } else if (data.response !== undefined) {
      responseData = data.response;
    }

    return {
      success: true,
      data: responseData,
      message: data.message || data.msg,
    };
  }

  /**
   * Make GET request
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, string>,
    queryParams?: Record<string, string | number | boolean>,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      let url = buildApiUrl(endpoint, params);

      // Add query parameters
      if (queryParams) {
        const queryString = Object.entries(queryParams)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          .join('&');
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const headers = await this.buildHeaders(includeAuth);

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      // GET request error
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  /**
   * Make POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    params?: Record<string, string>,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const url = buildApiUrl(endpoint, params);
      const isFormData = body instanceof FormData;
      const headers = await this.buildHeaders(includeAuth, isFormData);

      console.log('[API] POST request', {
        url,
        endpoint,
        isFormData,
        hasBody: !!body,
        bodyKeys: body && !isFormData ? Object.keys(body) : (isFormData ? 'FormData' : []),
        includeAuth,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
      });

      console.log('[API] POST response received', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      const result = await this.handleResponse<T>(response);
      console.log('[API] POST response processed', {
        url,
        success: result.success,
        hasData: !!result.data,
        hasError: !!result.error,
        message: result.message,
      });

      return result;
    } catch (error: any) {
      // POST request error - provide more specific error messages
      let errorMessage = 'Network error occurred';
      if (error.message) {
        if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      console.error('[API] POST request error', {
        endpoint,
        url: buildApiUrl(endpoint, params),
        error: errorMessage,
        originalError: error,
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Make PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    params?: Record<string, string>,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const url = buildApiUrl(endpoint, params);
      const isFormData = body instanceof FormData;

      // Laravel/PHP workaround: multipart/form-data doesn't work with PUT/PATCH methods directly
      // So we use POST and add _method spoofing field
      if (isFormData) {
        (body as FormData).append('_method', 'PUT');
      }

      const headers = await this.buildHeaders(includeAuth, isFormData);

      const response = await fetch(url, {
        method: isFormData ? 'POST' : 'PUT',
        headers,
        body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      // PUT request error
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  /**
   * Make PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    body?: any,
    params?: Record<string, string>,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const url = buildApiUrl(endpoint, params);
      const isFormData = body instanceof FormData;

      // Laravel/PHP workaround: multipart/form-data doesn't work with PUT/PATCH methods directly
      // So we use POST and add _method spoofing field
      if (isFormData) {
        (body as FormData).append('_method', 'PATCH');
      }

      const headers = await this.buildHeaders(includeAuth, isFormData);

      const response = await fetch(url, {
        method: isFormData ? 'POST' : 'PATCH',
        headers,
        body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      // PATCH request error
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  /**
   * Make DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    params?: Record<string, string>,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const url = buildApiUrl(endpoint, params);
      const headers = await this.buildHeaders(includeAuth);

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      // DELETE request error
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export class for testing
export default ApiService;

