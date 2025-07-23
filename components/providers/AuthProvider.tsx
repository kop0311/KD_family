'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth';

// AuthService methods are static, no need to create instance
import type { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    role?: 'advisor' | 'parent' | 'member';
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await AuthService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await AuthService.login({ username, password });
      localStorage.setItem('token', response.token);
      // Convert API response to User type with default values
      const user: User = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        fullName: response.user.fullName,
        role: response.user.role as 'advisor' | 'parent' | 'member',
        avatar: response.user.avatarUrl || undefined,
        totalPoints: 0, // Will be fetched separately
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(user);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    role?: 'advisor' | 'parent' | 'member';
  }) => {
    try {
      const response = await AuthService.register(userData);
      localStorage.setItem('token', response.token);
      // Convert API response to User type with default values
      const user: User = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        fullName: response.user.fullName,
        role: response.user.role as 'advisor' | 'parent' | 'member',
        avatar: undefined, // No avatar on registration
        totalPoints: 0, // Will be fetched separately
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(user);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    loading,
    isLoading: loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
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
