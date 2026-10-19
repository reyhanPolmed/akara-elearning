import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useNavigate } from "react-router-dom";

import { getPortalSession, signInPortal, signOutPortal } from "./api-client";
import { getDefaultRedirect, type PortalRole, type PortalSessionUser } from "./auth";

type AuthContextValue = {
  loading: boolean;
  user: PortalSessionUser | null;
  signIn: (payload: { email: string; password: string }) => Promise<PortalSessionUser>;
  signOut: () => Promise<void>;
  setActiveRole: (role: PortalRole) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function withActiveRole(user: PortalSessionUser, activeRole: PortalRole) {
  return {
    ...user,
    activeRole,
    redirectTo: getDefaultRedirect(activeRole),
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<PortalSessionUser | null>(null);

  useEffect(() => {
    let mounted = true;

    void getPortalSession()
      .then((session) => {
        if (mounted) {
          setUser(session);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      user,
      signIn: async (payload) => {
        const session = await signInPortal(payload);

        if (!session) {
          throw new Error("Login berhasil, tetapi session tidak ditemukan.");
        }

        setUser(session);
        return session;
      },
      signOut: async () => {
        await signOutPortal();
        setUser(null);
        navigate("/login", { replace: true });
      },
      clearSession: () => {
        setUser(null);
      },
      setActiveRole: (role) => {
        setUser((current) => {
          if (!current || !current.roles.includes(role)) {
            return current;
          }

          return withActiveRole(current, role);
        });
      },
    }),
    [loading, navigate, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider.");
  }

  return context;
}
