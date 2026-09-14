"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient, AuthUser, SESSION_EVENT } from "@/infrastructure/http/api-client";
import { crmStore } from "@/lib/storage/crm-store";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isStoredUser(value: AuthUser | null): value is AuthUser {
  return !!value
    && typeof value.id === "string"
    && typeof value.username === "string"
    && typeof value.fullName === "string"
    && (value.role === "admin" || value.role === "rep")
    && typeof value.branchId === "string";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      crmStore.clear();
      const currentToken = apiClient.getToken();
      const storedUser = apiClient.getUser();
      const epoch = apiClient.getEpoch();
      if (currentToken && isStoredUser(storedUser)) {
        // Render the data-empty shell immediately. Every record request and this
        // background identity check still has to pass server authorization.
        setUser(storedUser);
        setToken(currentToken);
        setIsLoading(false);
      } else {
        setUser(null);
        setToken(null);
        setIsLoading(!!currentToken);
      }
      try {
        if (currentToken) {
          const currentUser = await apiClient.get<AuthUser>("/auth/me");
          if (active && epoch === apiClient.getEpoch()) {
            setUser(currentUser); setToken(currentToken);
            window.setTimeout(() => {
              if (active && epoch === apiClient.getEpoch()) void crmStore.syncWithBackend().catch(() => false);
            }, 1000);
          }
        }
      } catch { if (active && epoch === apiClient.getEpoch()) apiClient.clearSession(); }
      finally { if (active) setIsLoading(false); }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith("sewtec_crm_")) apiClient.externalSessionChanged();
    };
    void restore();
    window.addEventListener(SESSION_EVENT, restore);
    window.addEventListener("storage", onStorage);
    return () => { active = false; window.removeEventListener(SESSION_EVENT, restore); window.removeEventListener("storage", onStorage); };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await apiClient.post<{
        token: string;
        userId: string;
        username: string;
        fullName: string;
        role: "admin" | "rep";
        branchId: string;
      }>("/auth/login", { username, password });

      const authUser: AuthUser = {
        id: res.userId,
        username: res.username,
        fullName: res.fullName,
        role: res.role,
        branchId: res.branchId,
      };

      apiClient.setSession(res.token, authUser);




      return { success: true };
    } catch (err) {
      return { success: false, error: (err instanceof Error ? err.message : "") || "فشل تسجيل الدخول" };
    }
  };

  const logout = () => {
    crmStore.clear();
    apiClient.clearSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
