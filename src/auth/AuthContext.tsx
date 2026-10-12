import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { StaffUser } from "../types";
import { loginRequest } from "../api/auth";
import { AUTH_EXPIRED_EVENT, tokenStore } from "../api/client";

const STORAGE_KEY = "hospital-staff-app-user";

interface AuthContextValue {
  user: StaffUser | null;
  login: (staffId: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadStoredUser(): StaffUser | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw || !tokenStore.get()) return null;
  try {
    return JSON.parse(raw) as StaffUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(loadStoredUser);

  async function login(staffId: string, password: string): Promise<boolean> {
    const result = await loginRequest(staffId, password);
    if (result) {
      setUser(result);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      return true;
    }
    return false;
  }

  function logout() {
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
    tokenStore.clear();
  }

  // The backend refused our token (expired or revoked): back to the login page.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      window.localStorage.removeItem(STORAGE_KEY);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
