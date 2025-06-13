import axios from 'axios';
import type { AuthTokens } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const tokens = getStoredTokens();
    if (tokens?.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = getStoredTokens();
        if (tokens?.refresh) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: tokens.refresh,
          });

          const newTokens = {
            access: response.data.access,
            refresh: tokens.refresh,
          };

          storeTokens(newTokens);
          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const storeTokens = (tokens: AuthTokens) => {
  localStorage.setItem('cart_builder_tokens', JSON.stringify(tokens));
};

export const getStoredTokens = (): AuthTokens | null => {
  const stored = localStorage.getItem('cart_builder_tokens');
  return stored ? JSON.parse(stored) : null;
};

export const clearTokens = () => {
  localStorage.removeItem('cart_builder_tokens');
};

export const storeUser = (user: any) => {
  localStorage.setItem('cart_builder_user', JSON.stringify(user));
};

export const getStoredUser = () => {
  const stored = localStorage.getItem('cart_builder_user');
  return stored ? JSON.parse(stored) : null;
};

export const clearUser = () => {
  localStorage.removeItem('cart_builder_user');
};