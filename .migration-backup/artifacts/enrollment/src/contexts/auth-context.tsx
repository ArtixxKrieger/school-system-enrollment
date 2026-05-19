import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useGetMe, useLogin, useLogout } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface Permission {
  module: string;
  action: string;
}

interface CurrentUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  profilePhoto?: string | null;
  role: string;
  roleId?: number | null;
  isActive: boolean;
  lastLogin?: string | null;
  permissions?: Record<string, string[]>;
}

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (module: string, action: string) => boolean;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<CurrentUser | null>(null);

  const { data: meData, isLoading, refetch } = useGetMe({
    query: {
      queryKey: ["me"],
      retry: false,
      staleTime: 60_000,
    },
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (meData) {
      setUser(meData as unknown as CurrentUser);
    }
  }, [meData]);

  async function login(identifier: string, password: string) {
    const result = await loginMutation.mutateAsync({ data: { identifier, password } });
    if (result?.user) {
      setUser(result.user as unknown as CurrentUser);
    }
    await refetch();
  }

  async function logout() {
    await logoutMutation.mutateAsync(undefined as any);
    setUser(null);
    setLocation("/login");
  }

  function hasPermission(module: string, action: string): boolean {
    if (!user) return false;
    if (user.role === "superadmin") return true;
    if (!user.permissions) return false;
    return user.permissions[module]?.includes(action) ?? false;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, hasPermission, refetchUser: refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
