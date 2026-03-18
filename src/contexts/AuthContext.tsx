import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { api, ApiError } from "@/lib/api";

export type Role = "ADMIN" | "FACILITIES_MANAGER" | "EMPLOYEE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isFM: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>("/api/auth/me", {
        skipAuthRedirect: true,
      });
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ user: User }>("/api/auth/login", {
      email,
      password,
    });
    setUser(data.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const data = await api.post<{ user: User }>("/api/auth/signup", {
      name,
      email,
      password,
    });
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore logout errors
    } finally {
      setUser(null);
    }
  };

  const isAdmin = user?.role === "ADMIN";
  const isFM = user?.role === "FACILITIES_MANAGER";
  const isEmployee = user?.role === "EMPLOYEE";

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, isAdmin, isFM, isEmployee }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
