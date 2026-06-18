import axios from 'axios';
import toast from 'react-hot-toast';

// ✅ FIXED: Get API URL from environment with production-ready fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://velora-app-jkk5.onrender.com/api'  // Production fallback
    : 'http://localhost:5001/api');               // Development fallback

// Log the API URL in development for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('🌐 API_URL:', API_URL);
}

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor - Add auth token to every request
api.interceptors.request.use(
  (config) => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('velora_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting token:', error);
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    // Success response - just return it
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loops
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    // Handle Network Errors
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('velora_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { token, refreshToken: newRefreshToken } = response.data;
        
        // Store new tokens
        localStorage.setItem('velora_token', token);
        if (newRefreshToken) {
          localStorage.setItem('velora_refresh_token', newRefreshToken);
        }
        
        // Update Authorization header
        originalRequest.headers.Authorization = `Bearer ${token}`;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem('velora_token');
        localStorage.removeItem('velora_refresh_token');
        localStorage.removeItem('velora_user');
        delete api.defaults.headers.common['Authorization'];
        
        // Redirect to login page (only in browser)
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/' && !currentPath.includes('/auth')) {
            window.location.href = '/';
          }
        }
        
        // Show error message
        toast.error('Session expired. Please login again.');
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
      return Promise.reject(error);
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      // Only show toast for non-GET requests
      if (originalRequest?.method?.toLowerCase() !== 'get') {
        toast.error('Resource not found.');
      }
      return Promise.reject(error);
    }

    // Handle 422 Validation Error
    if (error.response?.status === 422) {
      const message = error.response?.data?.error || 'Validation failed. Please check your input.';
      toast.error(message);
      return Promise.reject(error);
    }

    // Handle 429 Rate Limiting
    if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment.');
      return Promise.reject(error);
    }

    // Handle 500+ Server Errors
    if (error.response?.status && error.response.status >= 500) {
      toast.error('Server error. Please try again later.');
      return Promise.reject(error);
    }

    // Handle other errors with custom message
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected error occurred.';
    
    // Only show toast for non-GET requests that aren't 404
    if (originalRequest?.method?.toLowerCase() !== 'get' || error.response?.status !== 404) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// Helper: Set auth token
export const setAuthToken = (token: string): void => {
  if (token) {
    localStorage.setItem('velora_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Helper: Remove auth token
export const removeAuthToken = (): void => {
  localStorage.removeItem('velora_token');
  localStorage.removeItem('velora_refresh_token');
  localStorage.removeItem('velora_user');
  delete api.defaults.headers.common['Authorization'];
};

// Helper: Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('velora_token');
  return !!token;
};

// Helper: Get current user from localStorage
export const getCurrentUser = (): any => {
  if (typeof window === 'undefined') return null;
  try {
    const user = localStorage.getItem('velora_user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Helper: Set user data
export const setUserData = (user: any): void => {
  if (typeof window !== 'undefined' && user) {
    localStorage.setItem('velora_user', JSON.stringify(user));
  }
};

// Helper: Clear all auth data
export const clearAuthData = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('velora_token');
    localStorage.removeItem('velora_refresh_token');
    localStorage.removeItem('velora_user');
    delete api.defaults.headers.common['Authorization'];
  }
};

// Helper: Logout user
export const logout = async (): Promise<void> => {
  try {
    // Call logout endpoint if needed
    await api.post('/auth/logout');
  } catch (error) {
    // Ignore logout errors
    console.debug('Logout error:', error);
  } finally {
    clearAuthData();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }
};

// Helper: Refresh token manually
export const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('velora_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await axios.post(`${API_URL}/auth/refresh-token`, {
      refreshToken,
    });

    const { token, refreshToken: newRefreshToken } = response.data;
    
    // Store new tokens
    localStorage.setItem('velora_token', token);
    if (newRefreshToken) {
      localStorage.setItem('velora_refresh_token', newRefreshToken);
    }
    
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return token;
  } catch (error) {
    console.error('Refresh token error:', error);
    clearAuthData();
    return null;
  }
};

export default api;