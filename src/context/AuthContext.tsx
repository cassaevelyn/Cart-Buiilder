import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, storeTokens, storeUser, getStoredTokens, getStoredUser, clearTokens, clearUser } from '../utils/api';
import type { User, AuthTokens, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  registerSeller: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

interface RegisterData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  phone?: string;
  address?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load stored auth data on mount
    const storedTokens = getStoredTokens();
    const storedUser = getStoredUser();

    if (storedTokens && storedUser) {
      setTokens(storedTokens);
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login/', {
        email,
        password,
      });

      const { user: userData, tokens: tokenData } = response.data;

      setUser(userData);
      setTokens(tokenData);
      storeUser(userData);
      storeTokens(tokenData);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register/', userData);

      const { user: newUser, tokens: tokenData } = response.data;

      setUser(newUser);
      setTokens(tokenData);
      storeUser(newUser);
      storeTokens(tokenData);
    } catch (error: any) {
      throw new Error(error.response?.data?.email?.[0] || error.response?.data?.password?.[0] || 'Registration failed');
    }
  };

  const registerSeller = async (userData: RegisterData) => {
    try {
      const response = await api.post<AuthResponse>('/auth/seller/register/', userData);

      const { user: newUser, tokens: tokenData } = response.data;

      setUser(newUser);
      setTokens(tokenData);
      storeUser(newUser);
      storeTokens(tokenData);
    } catch (error: any) {
      throw new Error(error.response?.data?.email?.[0] || error.response?.data?.password?.[0] || 'Seller registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    clearUser();
    clearTokens();
  };

  const value = {
    user,
    tokens,
    login,
    register,
    registerSeller,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};