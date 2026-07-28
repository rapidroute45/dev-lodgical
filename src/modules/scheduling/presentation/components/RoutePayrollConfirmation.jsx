import { useState } from "react";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import {
  OPS_ROLES,
  canConfirmRoutes,
} from "@/shared/utils/constants.js";
import { useConfirmRouteMutation } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";

/** Payroll confirmation gate — distinct from ops verification. */
export function RoutePayrollConfirmation({ route, scheduleId }) {
  const { user } = useAuth();
  const confirmRoute = useConfirmRouteMutation();
  const [error, setError] = useState(null);

  const role = user?.role;
  if (!role || !OPS_ROLES.includes(role)) return null;

  const status = route.confirmationStatus ?? "pending";
  const canConfirm = canConfirmRoutes(role) && status !== "confirmed";

  async function handleConfirm() {
    setError(null);
    try {
      await confirmRoute.mutateAsync({ routeId: route.id, scheduleId });
    } catch (err) {
      setError(err.message || "Confirmation failed");
    }
  }

  return (
    <div className="ops-panel mt-3 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
        Payroll confirmation
      </p>
      <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
        {status === "confirmed" ? "Confirmed for payroll" : "Pending confirmation"}
      </p>
      {status === "confirmed" && route.confirmedAt ? (
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Confirmed {new Date(route.confirmedAt).toLocaleString()}
        </p>
      ) : (
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Not eligible for payroll until an onsite manager confirms this route.
        </p>
      )}

      {error ? (
        <p className="mt-2 text-xs" style={{ color: "var(--danger, #b91c1c)" }}>
          {error}
        </p>
      ) : null}

      {canConfirm ? (
        <button
          type="button"
          className="ops-btn ops-btn--accent mt-3 px-4 py-2 text-sm font-bold"
          disabled={confirmRoute.isPending}
          onClick={handleConfirm}
        >
          {confirmRoute.isPending ? "Confirming…" : "Confirm for payroll"}
        </button>
      ) : null}
    </div>
  );
}

export function RouteConfirmationBadge({ confirmationStatus }) {
  const status = confirmationStatus ?? "pending";
  if (status === "confirmed") {
    return (
      <span className="ops-badge ops-badge--muted" title="Eligible for payroll">
        Confirmed
      </span>
    );
  }
  return (
    <span
      className="ops-badge"
      style={{
        background: "color-mix(in srgb, var(--amber) 18%, transparent)",
        color: "var(--amber)",
      }}
    >
      Pending confirmation
    </span>
  );
}
