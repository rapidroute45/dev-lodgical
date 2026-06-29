import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { MOBILE_ONLY_ROLES } from "@/shared/utils/constants.js";
import { postLoginPath } from "@/shared/utils/postLoginPath.js";

export function ProtectedRoute({ children, allowMobileOnly = false }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="ops-shell flex min-h-svh items-center justify-center" style={{ color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (
    !allowMobileOnly &&
    user?.role &&
    MOBILE_ONLY_ROLES.includes(user.role) &&
    location.pathname !== "/mobile-only"
  ) {
    return <Navigate to="/mobile-only" replace />;
  }

  return children;
}

export function GuestOnlyRoute({ children }) {
  const { status, user } = useAuth();
  if (status === "authenticated") {
    return <Navigate to={postLoginPath(user?.role)} replace />;
  }
  return children;
}
