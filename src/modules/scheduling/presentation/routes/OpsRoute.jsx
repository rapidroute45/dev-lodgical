import { Navigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { OPS_ROLES } from "@/shared/utils/constants.js";

/** Admin, dispatch manager, and dispatch team scheduling access. */
export function OpsRoute({ children }) {
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <div className="ops-shell flex min-h-svh items-center justify-center" style={{ color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  if (!user?.role || !OPS_ROLES.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
