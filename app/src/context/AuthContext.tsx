import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getMe, getStoredToken, logout as doLogout } from "@/services/auth";

interface AuthState {
  token: string | null;
  user: any;
  role: "consumer" | "producer" | "admin" | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const currentToken = await getStoredToken();
      setToken(currentToken);
      if (!currentToken) {
        setUser(null);
        return;
      }
      const profile = await getMe();
      setUser(profile);
    } catch {
      setUser(null);
    }
  }

  async function logout() {
    await doLogout();
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      role: (user?.role as AuthState["role"]) || null,
      loading,
      refreshUser,
      logout,
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
