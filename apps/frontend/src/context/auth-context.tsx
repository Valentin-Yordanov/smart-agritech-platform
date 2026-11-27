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
import { safeCallbackUrl } from '@/lib/safe-redirect';
import { AuthResponse, User } from '@/types/api';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export function setClientAuthToken(token: string) {
  if (typeof document === 'undefined') return;
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  // 7 days cookie to ensure smooth session persistence across Vercel middleware navigation
  document.cookie = `access_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  try {
    localStorage.setItem('access_token', token);
  } catch {
    // Ignore storage quota or disabled localStorage
  }
}

export function clearClientAuthToken() {
  if (typeof document === 'undefined') return;
  document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
  try {
    localStorage.removeItem('access_token');
  } catch {
    // Ignore
  }
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
      // Re-sync cookie from localStorage if present so middleware is primed
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('access_token');
          if (stored) {
            setClientAuthToken(stored);
          }
        } catch {
          // Ignore
        }
      }

      try {
        const res = await apiFetch<User | { user: User }>('/auth/me');
        const resolvedUser = 'user' in res ? res.user : res;
        if (active) setUser(resolvedUser);
      } catch {
        if (active) {
          setUser(null);
          clearClientAuthToken();
        }
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
    if (res.tokens?.accessToken) {
      setClientAuthToken(res.tokens.accessToken);
    }
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get('callbackUrl');
    const destination = safeCallbackUrl(callbackUrl);
    router.push(destination);
    router.refresh();
  };

  const register = async (payload: RegisterInput) => {
    const res = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload,
    });
    setUser(res.user);
    if (res.tokens?.accessToken) {
      setClientAuthToken(res.tokens.accessToken);
    }
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get('callbackUrl');
    const destination = safeCallbackUrl(callbackUrl);
    router.push(destination);
    router.refresh();
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      clearClientAuthToken();
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
