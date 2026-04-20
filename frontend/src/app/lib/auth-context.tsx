import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getMe, logout as logoutRequest } from "./api/auth";
import {
  clearStoredAuthSession,
  readStoredAuthSession,
  saveStoredAuthSession,
  updateStoredUser,
  type AuthUser,
  type StoredAuthSession,
} from "./auth-storage";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (session: StoredAuthSession) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    return readStoredAuthSession()?.user ?? null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const stored = readStoredAuthSession();
      if (!stored?.access_token && !stored?.refresh_token) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const me = await getMe();
        updateStoredUser(me);
        if (mounted) {
          setUser(me);
        }
      } catch {
        clearStoredAuthSession();
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const handleAuthCleared = () => {
      setUser(null);
      setIsLoading(false);
    };

    bootstrap();
    window.addEventListener("auth:session-cleared", handleAuthCleared as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener("auth:session-cleared", handleAuthCleared as EventListener);
    };
  }, []);

  const setSession = useCallback((session: StoredAuthSession) => {
    saveStoredAuthSession(session);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // bỏ qua lỗi logout phía server, vẫn clear local session
    } finally {
      clearStoredAuthSession();
      setUser(null);
      window.dispatchEvent(new CustomEvent("auth:session-cleared"));
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      setSession,
      logout,
    }),
    [user, isLoading, setSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}