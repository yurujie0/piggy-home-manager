import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Family } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  family: Family | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasFamily: boolean;
  setUser: (user: User | null) => void;
  setFamily: (family: Family | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [family, setFamilyState] = useState<Family | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查是否有已登录用户
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const [currentUser, currentFamily] = await Promise.all([
        authApi.getCurrentUser(),
        authApi.getCurrentFamily(),
      ]);
      setUserState(currentUser);
      setFamilyState(currentFamily);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = (user: User | null) => {
    setUserState(user);
  };

  const setFamily = (family: Family | null) => {
    setFamilyState(family);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUserState(currentUser);
    } catch (error) {
      console.error('Refresh user failed:', error);
    }
  };

  const logout = async () => {
    await authApi.logout();
    setUserState(null);
    setFamilyState(null);
  };

  const value: AuthContextType = {
    user,
    family,
    isLoading,
    isAuthenticated: !!user,
    hasFamily: !!family,
    setUser,
    setFamily,
    refreshUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
