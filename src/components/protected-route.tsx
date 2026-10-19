import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { canAccessRole, getDefaultRedirect, type PortalRole } from "../lib/auth";
import { useAuth } from "../lib/auth-context";
import { LoadingScreen } from "./loading-screen";

type ProtectedRouteProps = PropsWithChildren<{
  role?: PortalRole;
}>;

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const location = useLocation();
  const { loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && !canAccessRole(user, role)) {
    return <Navigate to={getDefaultRedirect(user.activeRole)} replace />;
  }

  return children;
}
