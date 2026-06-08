import { Navigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { OPS_ROLES, UserRole } from "@/shared/utils/constants.js";

const NOTIFICATION_ROLES = [...OPS_ROLES, UserRole.ACCOUNTANT];

export function NotificationsRoute({ children }) {
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-dispatch-bg text-dispatch-muted">
        Loading…
      </div>
    );
  }

  if (!user?.role || !NOTIFICATION_ROLES.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
