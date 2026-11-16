'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { User } from '@/types/api';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  message?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  register: (payload: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch<User | { user: User }>('/auth/me');
      const resolvedUser = 'user' in res ? res.user : res;
      setUser(resolvedUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      try {
        const res = await apiFetch<User | { user: User }>('/auth/me');
        const resolvedUser = 'user' in res ? res.user : res;
        if (active) setUser(resolvedUser);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void initAuth();

    return () => {
      active = false;
    };
  }, []);

  const login = async (credentials: LoginInput) => {
    const res = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    setUser(res.user);
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get('callbackUrl');
    const destination =
      callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
        ? callbackUrl
        : '/dashboard';
    router.push(destination);
    router.refresh();
  };

  const register = async (payload: RegisterInput) => {
    const res = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload,
    });
    setUser(res.user);
    router.push('/dashboard');
    router.refresh();
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
