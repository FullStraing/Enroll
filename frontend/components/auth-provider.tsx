"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AccountEntitlementsSummary, AccountPlanSummary } from "@/lib/account-plan";
import { clearTokens, getToken, saveTokens } from "@/lib/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthProfile = {
  full_name?: string;
  username?: string;
  email?: string;
  essays_onboarding_seen?: boolean;
  onboarding_completed?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  has_usable_password?: boolean;
  account_plan?: AccountPlanSummary;
  entitlements?: AccountEntitlementsSummary;
};

type AuthContextValue = {
  status: AuthStatus;
  profile: AuthProfile | null;
  setSession: (access: string, refresh?: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(token: string): Promise<AuthProfile> {
  return apiFetch<AuthProfile>("/api/auth/profile/", { method: "GET" }, token);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  const refreshSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setProfile(null);
      setStatus("unauthenticated");
      return;
    }
    try {
      const profileData = await loadProfile(token);
      setProfile(profileData);
      setStatus("authenticated");
    } catch {
      clearTokens();
      setProfile(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const setSession = useCallback(async (access: string, refresh?: string) => {
    saveTokens(access, refresh);
    await refreshSession();
  }, [refreshSession]);

  const logout = useCallback(() => {
    clearTokens();
    setProfile(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    profile,
    setSession,
    refreshSession,
    logout,
  }), [status, profile, setSession, refreshSession, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
