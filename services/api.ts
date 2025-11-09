/**
 * API Service
 * Centralized API client for making HTTP requests
 */

import { API_BASE_URL, buildApiUrl } from '@/constants/api';

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
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const { getItem } = await import('@react-native-async-storage/async-storage');
      const userData = await getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.token || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Build headers for API requests
   */
  private async buildHeaders(includeAuth: boolean = true): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

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
      console.error('Error parsing response:', error);
      data = {};
    }

    if (!response.ok) {
      // Handle different error response formats
      const errorMessage = 
        data.message || 
        data.error || 
        data.error?.message ||
        (Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
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
      console.error('GET request error:', error);
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
      const headers = await this.buildHeaders(includeAuth);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      console.error('POST request error:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
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
      const headers = await this.buildHeaders(includeAuth);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      console.error('PUT request error:', error);
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
      const headers = await this.buildHeaders(includeAuth);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      console.error('PATCH request error:', error);
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
      console.error('DELETE request error:', error);
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

