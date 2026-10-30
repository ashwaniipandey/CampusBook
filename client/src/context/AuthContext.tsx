'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    universityId: string;
    department?: string;
    yearOfStudy?: number;
    studentId?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  verifyOtp: (otp: string, email?: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  resendOtp: (email?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string; user?: User }>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  redirectByRole: (userToRoute?: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Helper to redirect based on user role
  const redirectByRole = (userToRoute?: User | null) => {
    const targetUser = userToRoute || user;
    if (!targetUser) {
      router.push('/login');
      return;
    }
    if (targetUser.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  // Fetch current user on initial mount
  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Login handler
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.user) {
        setUser(res.user);
        redirectByRole(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Login failed: no user data returned' };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (data: {
    name: string;
    email: string;
    password: string;
    universityId: string;
    department?: string;
    yearOfStudy?: number;
    studentId?: string;
    phone?: string;
  }) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      if (res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Registration failed: no user data returned' };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP handler
  const verifyOtp = async (otp: string, email?: string) => {
    try {
      const res = await api.verifyOtp({ otp, email: email || user?.email });
      if (res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: res.message || 'OTP verification failed' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Resend OTP handler
  const resendOtp = async (email?: string) => {
    try {
      const res = await api.resendOtp({ email: email || user?.email });
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  // Update profile handler
  const updateProfile = async (data: Partial<User>) => {
    try {
      const res = await api.updateProfile(data);
      if (res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Failed to update profile' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Change password handler
  const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    try {
      const res = await api.changePassword(data);
      if (res.user) {
        setUser(res.user);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
        redirectByRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

