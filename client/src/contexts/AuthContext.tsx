import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser, ICompany } from '../types/index.js';
import { api } from '../lib/api.js';

interface AuthContextType {
  user: IUser | null;
  company: ICompany | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<IUser>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateCompanyState: (company: ICompany) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [company, setCompany] = useState<ICompany | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fleetflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const currentToken = localStorage.getItem('fleetflow_token');
    if (!currentToken) {
      setUser(null);
      setCompany(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        setUser(res.data.data.user);
        setCompany(res.data.data.company);
      }
    } catch {
      localStorage.removeItem('fleetflow_token');
      setUser(null);
      setCompany(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<IUser> => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success) {
      const { user, company, accessToken } = res.data.data;
      localStorage.setItem('fleetflow_token', accessToken);
      setToken(accessToken);
      setUser(user);
      setCompany(company);
      return user;
    }
    throw new Error(res.data?.error || res.data?.message || 'Authentication failed');
  };

  const register = async (data: any) => {
    const res = await api.post('/auth/register', data);
    if (res.data?.success) {
      const { user, company, accessToken } = res.data.data;
      localStorage.setItem('fleetflow_token', accessToken);
      setToken(accessToken);
      setUser(user);
      setCompany(company);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('fleetflow_token');
      setToken(null);
      setUser(null);
      setCompany(null);
    }
  };

  const updateCompanyState = (updatedCompany: ICompany) => {
    setCompany(updatedCompany);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateCompanyState,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
