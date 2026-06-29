import { useState } from "react";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import {
  MANAGER_ROLES,
  OPS_ROLES,
  UserRole,
} from "@/shared/utils/constants.js";
import { useUpdateRouteMutation } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";

const OPS_LABELS = {
  pending: "Awaiting dispatch team review",
  team_verified: "Sent to dispatch manager",
  manager_verified: "Manager approved",
  rejected: "Rejected",
};

export function RouteOpsVerification({ route, scheduleId }) {
  const { user } = useAuth();
  const updateRoute = useUpdateRouteMutation();
  const [error, setError] = useState(null);

  if (route.status !== "completed") return null;

  const role = user?.role;
  const isManager = role != null && MANAGER_ROLES.includes(role);
  const isDispatchTeam = role === UserRole.DISPATCH_TEAM;
  const isOps = role != null && OPS_ROLES.includes(role);
  if (!isOps) return null;

  const opsStatus = route.opsVerificationStatus ?? "pending";

  const canTeamVerify =
    (isDispatchTeam || isManager) &&
    (opsStatus === "pending" || opsStatus === "rejected");
  const canManagerVerify =
    isManager &&
    opsStatus !== "manager_verified" &&
    (opsStatus === "pending" || opsStatus === "team_verified");

  async function setOpsStatus(next) {
    setError(null);
    try {
      await updateRoute.mutateAsync({
        routeId: route.id,
        scheduleId,
        body: { opsVerificationStatus: next },
      });
    } catch (err) {
      setError(err.message || "Update failed");
    }
  }

  const busy = updateRoute.isPending;
  const ot = route.overtimeHours ?? 0;

  return (
    <div className="ops-panel p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
        Ops verification
      </p>
      <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
        {OPS_LABELS[opsStatus] ?? opsStatus}
      </p>
      {ot > 0 ? (
        <p className="mt-1 text-xs" style={{ color: "var(--amber)" }}>
          Overtime recorded: <strong>{ot} hr</strong>
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs" style={{ color: "var(--rose)" }}>{error}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {canTeamVerify && isDispatchTeam ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void setOpsStatus("team_verified")}
            className="ops-btn ops-btn--accent px-3 py-2 text-xs font-bold disabled:opacity-60"
          >
            Verify & send to manager
          </button>
        ) : null}
        {canManagerVerify ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void setOpsStatus("manager_verified")}
            className="ops-btn px-3 py-2 text-xs font-bold disabled:opacity-60"
            style={{ boxShadow: "inset 0 0 0 1px rgba(52, 211, 153, 0.4)", color: "var(--green)" }}
          >
            Manager approve route
          </button>
        ) : null}
        {isManager && opsStatus === "manager_verified" ? (
          <span className="ops-badge ops-badge--done">Approved</span>
        ) : null}
      </div>
    </div>
  );
}
