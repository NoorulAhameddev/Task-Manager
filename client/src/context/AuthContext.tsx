import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { setAccessToken, setOnTokenRefreshed } from '../api/client';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateToken = useCallback((token: string | null) => {
    setAccessToken(token);
    setAccessTokenState(token);
  }, []);

  useEffect(() => {
    setOnTokenRefreshed((token) => {
      if (token) {
        setAccessToken(token);
        setAccessTokenState(token);
        authApi.getMe().then((res) => setUser(res.user)).catch(() => {
          setUser(null);
          updateToken(null);
        });
      } else {
        setUser(null);
        updateToken(null);
      }
    });

    return () => {
      setOnTokenRefreshed(null);
    };
  }, [updateToken]);

  useEffect(() => {
    authApi.refresh()
      .then(async (res) => {
        updateToken(res.accessToken);
        const me = await authApi.getMe();
        setUser(me.user);
      })
      .catch(() => {
        setUser(null);
        updateToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [updateToken]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    updateToken(res.accessToken);
    setUser(res.user);
  }, [updateToken]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await authApi.register(name, email, password);
    updateToken(res.accessToken);
    setUser(res.user);
  }, [updateToken]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    setUser(null);
    updateToken(null);
  }, [updateToken]);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, isAuthenticated: !!user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
