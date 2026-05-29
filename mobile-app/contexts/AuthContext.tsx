import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, setAuthToken, removeAuthToken, getAuthToken } from '../lib/api';

interface User {
  userId: number;
  fullName: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
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
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAuthToken();
      if (token) {
        try {
          // Add a timeout so a down backend won't block the UI indefinitely
          const profilePromise = apiClient.getProfile();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 7000)
          );
          const response = await Promise.race([profilePromise, timeoutPromise]) as any;
          setUser(response.user);
        } catch (error) {
          console.error('Token validation failed:', error);
          await removeAuthToken();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password });

      if (response.token) {
        await setAuthToken(response.token);
        setUser(response.user);
      } else {
        throw new Error('Không nhận được token từ server');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    try {
      const response = await apiClient.register({ fullName, email, password });
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await removeAuthToken();
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};