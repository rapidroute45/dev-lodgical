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
    <div className="mt-4 rounded-xl border border-dispatch-border bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-dispatch-muted">
        Ops verification
      </p>
      <p className="mt-1 text-sm font-semibold text-dispatch-text">
        {OPS_LABELS[opsStatus] ?? opsStatus}
      </p>
      {ot > 0 ? (
        <p className="mt-1 text-xs text-amber-700">
          Overtime recorded: <strong>{ot} hr</strong>
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs text-dispatch-red">{error}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {canTeamVerify && isDispatchTeam ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void setOpsStatus("team_verified")}
            className="rounded-lg bg-dispatch-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            Verify & send to manager
          </button>
        ) : null}
        {canManagerVerify ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void setOpsStatus("manager_verified")}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            Manager approve route
          </button>
        ) : null}
        {isManager && opsStatus === "manager_verified" ? (
          <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
            Approved
          </span>
        ) : null}
      </div>
    </div>
  );
}
