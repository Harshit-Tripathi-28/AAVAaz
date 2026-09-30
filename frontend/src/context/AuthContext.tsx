import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  AuthenticatedUser,
  TenantInfo,
  AuthResponseData,
} from "../types/api.js";
import {
  api,
  setInMemoryAccessToken,
} from "../services/apiClient.js";

interface AuthContextType {
  user: AuthenticatedUser | null;
  tenant: TenantInfo | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (institutionId: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Silent session restore on app mount using HTTP-only refresh cookie
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const response = await api.post<AuthResponseData>(
          "/auth/refresh",
          undefined,
          { skipAuthRefresh: true }
        );

        if (isMounted && response.data) {
          setInMemoryAccessToken(response.data.accessToken);
          setUser(response.data.user);
          setTenant(response.data.institution);
          setRoles(response.data.roles);
          setPermissions(response.data.permissions);
          setIsAuthenticated(true);
        }
      } catch {
        if (isMounted) {
          setInMemoryAccessToken(null);
          setUser(null);
          setTenant(null);
          setRoles([]);
          setPermissions([]);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (institutionId: string, email: string, password: string): Promise<void> => {
    const response = await api.post<AuthResponseData>("/auth/login", {
      institutionId,
      email,
      password,
    });

    const data = response.data;
    // Store access token in runtime memory only
    setInMemoryAccessToken(data.accessToken);
    setUser(data.user);
    setTenant(data.institution);
    setRoles(data.roles);
    setPermissions(data.permissions);
    setIsAuthenticated(true);
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } finally {
      setInMemoryAccessToken(null);
      setUser(null);
      setTenant(null);
      setRoles([]);
      setPermissions([]);
      setIsAuthenticated(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        roles,
        permissions,
        isAuthenticated,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
