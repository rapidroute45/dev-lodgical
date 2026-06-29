import { Navigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { UserRole, MANAGER_ROLES } from "@/shared/utils/constants.js";
import { ManagerDashboardScreen } from "@/modules/manager-home/presentation/screens/ManagerDashboardScreen.jsx";
import { DispatchTeamDashboardScreen } from "@/modules/dispatch-team/presentation/screens/DispatchTeamDashboardScreen.jsx";

/** Role-aware operations dashboard entry point. */
export function DashboardScreen() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === UserRole.ACCOUNTANT) {
    return <Navigate to="/payroll" replace />;
  }

  if (role === UserRole.DISPATCH_TEAM) {
    return <DispatchTeamDashboardScreen />;
  }

  if (role && MANAGER_ROLES.includes(role)) {
    return <ManagerDashboardScreen />;
  }

  return (
    <div className="ops-shell flex min-h-svh items-center justify-center p-6">
      <div className="ops-panel max-w-md p-6 text-center">
        <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Dashboard not available</p>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          This dashboard is for dispatch managers and dispatch team members. Your role:{" "}
          <span className="font-medium capitalize" style={{ color: "var(--text)" }}>{role ?? "unknown"}</span>.
        </p>
      </div>
    </div>
  );
}
