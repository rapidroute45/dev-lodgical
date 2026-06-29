import { Navigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { MOBILE_ONLY_ROLES } from "@/shared/utils/constants.js";

/** Drivers and team leads use the mobile app only. */
export function MobileOnlyRoute({ children }) {
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <div className="ops-shell flex min-h-svh items-center justify-center" style={{ color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  if (user?.role && !MOBILE_ONLY_ROLES.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
