import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  RouteStopsGrid,
  gridRowsToDropoffs,
  mergeStopStatusFromServer,
  normalizeDropoffsForEdit,
  newDropoffStop,
} from "./RouteStopsGrid.jsx";
import { ReturnReasonModal } from "./ReturnReasonModal.jsx";
import { formatRouteStatus, routeStatusClass } from "@/modules/scheduling/utils/scheduleStatus.js";
import { pickupFromStore, formatStorePickupAddress } from "@/modules/scheduling/utils/routeDraft.js";
import { RoutePlanningMap } from "./RoutePlanningMap.jsx";
import { useUpdateRouteStopStatusOpsMutation, useCompleteRouteOpsMutation } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";

function isRouteCompleted(status) {
  return status === "completed" || status === "not_verified";
}

function countFinishedStops(dropoffs) {
  return dropoffs.filter(
    (stop) => stop.status === "completed" || stop.status === "returned"
  ).length;
}

function countPendingStops(dropoffs) {
  return dropoffs.filter((stop) => stop.status === "pending" || !stop.status).length;
}

function canCompleteRouteFromWeb(status) {
  return status === "active" || status === "in_progress";
}

export function RouteStopsEditor({
  route,
  scheduleStore,
  stops,
  pickup,
  saving = false,
  onSave,
  onBack,
}) {
  const updateStopStatusOps = useUpdateRouteStopStatusOpsMutation();
  const completeRouteOps = useCompleteRouteOpsMutation();
  const [localDropoffs, setLocalDropoffs] = useState([]);
  const [error, setError] = useState("");
  const [statusBusyId, setStatusBusyId] = useState(null);
  const [failureTarget, setFailureTarget] = useState(null);

  const resolvedRouteName = route?.routeName ?? "Unnamed route";
  const resolvedDriverName = route?.driverName ?? "";
  const routeStatus = route?.status ?? "pending";
  const routeCompleted = isRouteCompleted(routeStatus);
  const isNewRoute = Boolean(route?.isNew || String(route?.id ?? "").startsWith("new-"));
  const routeId = route?.id;
  const statusEditable = Boolean(!isNewRoute && routeId);

  useEffect(() => {
    setLocalDropoffs(normalizeDropoffsForEdit(stops));
    setError("");
  }, [route?.id]);

  useEffect(() => {
    if (isNewRoute) return;
    setLocalDropoffs((prev) => mergeStopStatusFromServer(prev, stops));
  }, [isNewRoute, stops, routeStatus]);

  const finishedCount = useMemo(
    () => countFinishedStops(localDropoffs),
    [localDropoffs]
  );
  const pendingCount = useMemo(
    () => countPendingStops(localDropoffs),
    [localDropoffs]
  );
  const stopCount = localDropoffs.length;
  const canCompleteRoute =
    statusEditable &&
    !routeCompleted &&
    canCompleteRouteFromWeb(routeStatus) &&
    stopCount > 0 &&
    Boolean(route?.driverId ?? route?.driverName);
  const completingRoute = completeRouteOps.isPending;

  const driverTrail = useMemo(() => {
    const path = route?.driverRoutePath ?? [];
    return path.length >= 2 ? path : [];
  }, [route?.driverRoutePath]);

  const mapPickup = useMemo(() => {
    if (pickup?.address?.trim()) {
      return {
        name: pickup.name ?? scheduleStore?.storeName ?? "Pickup",
        address: pickup.address,
        lat: pickup.lat ?? pickup.destinationLat ?? null,
        lng: pickup.lng ?? pickup.destinationLng ?? null,
      };
    }
    if (scheduleStore) {
      const fromStore = pickupFromStore(scheduleStore);
      return {
        name: fromStore.name,
        address: fromStore.address || formatStorePickupAddress(scheduleStore),
        lat: pickup?.lat ?? null,
        lng: pickup?.lng ?? null,
      };
    }
    if (route?.location?.trim()) {
      return {
        name: scheduleStore?.storeName ?? "Pickup",
        address: route.location,
        lat: null,
        lng: null,
      };
    }
    return null;
  }, [pickup, scheduleStore, route?.location]);

  function applyStopUpdate(stopId, patch) {
    setLocalDropoffs((prev) =>
      prev.map((stop) =>
        (stop.serverId ?? stop.localId) === stopId ? { ...stop, ...patch } : stop
      )
    );
  }

  async function handleStatusChange({ stopId, nextStatus, stopName }) {
    if (!routeId || !stopId) return;

    if (nextStatus === "returned") {
      setFailureTarget({ stopId, stopName });
      return;
    }

    if (nextStatus === "pending" || nextStatus === "completed") {
      setStatusBusyId(stopId);
      setError("");
      try {
        const result = await updateStopStatusOps.mutateAsync({
          routeId,
          stopId,
          status: nextStatus,
        });
        const updated = result?.data?.stop;
        applyStopUpdate(stopId, {
          status: updated?.status ?? nextStatus,
          completedAt: updated?.completedAt ?? (nextStatus === "pending" ? null : new Date().toISOString()),
          returnReason: updated?.returnReason ?? null,
          returnReasonCustom: updated?.returnReasonCustom ?? null,
        });
      } catch (err) {
        setError(
          err?.response?.data?.message ?? err?.message ?? "Could not update stop status."
        );
      } finally {
        setStatusBusyId(null);
      }
    }
  }

  async function handleConfirmFailure({ reason, customReason }) {
    if (!failureTarget || !routeId) return;

    const { stopId } = failureTarget;
    setStatusBusyId(stopId);
    setError("");
    try {
      const result = await updateStopStatusOps.mutateAsync({
        routeId,
        stopId,
        status: "returned",
        reason,
        customReason,
      });
      const updated = result?.data?.stop;
      applyStopUpdate(stopId, {
        status: updated?.status ?? "returned",
        completedAt: updated?.completedAt ?? new Date().toISOString(),
        returnReason: updated?.returnReason ?? reason,
        returnReasonCustom: updated?.returnReasonCustom ?? customReason ?? null,
      });
      setFailureTarget(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ?? err?.message ?? "Could not mark stop as failure."
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  async function handleCompleteRoute() {
    if (!routeId || !canCompleteRoute || completingRoute) return;

    const label = pendingCount > 0
      ? `Mark all ${pendingCount} pending stop${pendingCount === 1 ? "" : "s"} as delivered and complete this route? The driver will not need to use the mobile app.`
      : "Complete this route now? Any remaining pending stops will be marked as delivered.";

    if (!window.confirm(label)) return;

    setError("");
    try {
      const result = await completeRouteOps.mutateAsync({ routeId });
      const completedAt = new Date().toISOString();
      setLocalDropoffs((prev) =>
        prev.map((stop) =>
          stop.status === "pending" || !stop.status
            ? {
                ...stop,
                status: "completed",
                completedAt,
                returnReason: null,
                returnReasonCustom: null,
              }
            : stop
        )
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ?? err?.message ?? "Could not complete route."
      );
    }
  }

  function handleGridChange(rows) {
    setLocalDropoffs(gridRowsToDropoffs(rows));
    setError("");
  }

  function handleDeleteRow(rowId) {
    setLocalDropoffs((prev) =>
      prev.filter((stop) => (stop.localId ?? stop.serverId) !== rowId)
    );
    setError("");
  }

  function handleAddStop() {
    setLocalDropoffs((prev) => [...prev, newDropoffStop()]);
    setError("");
  }

  function validateStops(dropoffs) {
    for (let index = 0; index < dropoffs.length; index += 1) {
      const stop = dropoffs[index];
      const hasName = Boolean(stop.name?.trim());
      const hasAddress = Boolean(stop.address?.trim());
      if (hasName !== hasAddress) {
        return `Stop ${index + 1} needs both customer name and address.`;
      }
    }

    const complete = dropoffs.filter(
      (stop) => stop.name?.trim() && stop.address?.trim()
    );
    if (complete.length === 0 && dropoffs.length > 0) {
      return "Add at least one stop with customer name and address.";
    }
    return null;
  }

  async function handleSave() {
    const validationError = validateStops(localDropoffs);
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = localDropoffs
      .filter((stop) => stop.name?.trim() && stop.address?.trim())
      .map((stop) => ({
        ...stop,
        name: stop.name.trim(),
        address: stop.address.trim(),
        accessCode: stop.accessCode?.trim() ?? "",
      }));

    try {
      await onSave?.(payload);
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Could not save stops."
      );
    }
  }

  return (
    <>
      <div className="ops-fade flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <button type="button" onClick={onBack} className="ops-btn p-2.5" aria-label="Back to spreadsheet">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Route stops
            </h1>
            <p className="mt-1 truncate text-sm" style={{ color: "var(--text-muted)" }}>
              {resolvedRouteName}
              {resolvedDriverName ? ` · ${resolvedDriverName}` : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="ops-btn px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="ops-btn ops-btn--accent px-5 py-2.5 font-bold disabled:opacity-50"
          >
            {saving ? "Saving…" : isNewRoute ? "Apply changes" : "Save stops"}
          </button>
        </div>
      </div>

      <div
        className="ops-panel ops-fade mt-5 flex flex-wrap items-center gap-3 px-4 py-3"
        style={{ animationDelay: "60ms" }}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          {finishedCount > 0
            ? `${finishedCount} / ${stopCount} stop${stopCount === 1 ? "" : "s"} completed`
            : `${stopCount} stop${stopCount === 1 ? "" : "s"}`}
        </span>
        <button
          type="button"
          onClick={handleAddStop}
          className="ops-btn ops-btn--accent px-3 py-1.5 text-xs font-semibold"
        >
          + Add stop
        </button>
        {isNewRoute ? (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Save the route spreadsheet to persist new routes.
          </span>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {statusEditable
              ? "Use Complete route above, or change each stop from the status dropdown."
              : "Stop completion updates automatically when the driver finishes deliveries."}
          </span>
        )}
      </div>

      {!isNewRoute ? (
        <div
          className="ops-panel ops-fade mt-4 px-4 py-3"
          style={{ animationDelay: "120ms" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
            Route status
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={routeStatusClass(routeStatus)}>
              {formatRouteStatus(routeStatus)}
            </span>
            {routeCompleted ? (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>All deliveries finished.</span>
            ) : finishedCount > 0 ? (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Driver progress syncs here every few seconds.
              </span>
            ) : (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Waiting for driver to complete stops.
              </span>
            )}
            {canCompleteRoute ? (
              <button
                type="button"
                onClick={() => void handleCompleteRoute()}
                disabled={completingRoute || saving || statusBusyId != null}
                className="ops-btn ops-btn--accent px-3 py-1.5 text-xs font-bold disabled:opacity-50"
              >
                {completingRoute ? "Completing…" : "Complete route"}
              </button>
            ) : null}
          </div>
          {canCompleteRoute ? (
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Marks every pending stop as delivered and finishes the route from the web — no mobile app needed.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="ops-banner ops-banner--error ops-fade mt-4">{error}</div>
      ) : null}

      <div className="ops-panel ops-fade mt-4 overflow-hidden p-4" style={{ animationDelay: "180ms" }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
              {routeCompleted ? "Driver track" : "Route map"}
            </p>
            {routeCompleted && driverTrail.length >= 2 ? (
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                {driverTrail.length} GPS points recorded for this route
              </p>
            ) : null}
          </div>
          {routeCompleted && driverTrail.length >= 2 && routeId ? (
            <Link
              to={`/routes/tracking/${routeId}`}
              className="ops-btn px-3 py-1.5 text-xs font-semibold"
            >
              Open full track
            </Link>
          ) : null}
        </div>
        <RoutePlanningMap
          pickup={mapPickup}
          dropoffs={localDropoffs}
          driverTrail={driverTrail}
        />
      </div>

      <div className="ops-panel ops-fade mt-4 overflow-hidden p-4" style={{ animationDelay: "240ms" }}>
        <RouteStopsGrid
          stops={localDropoffs}
          compact
          editable
          showStatus
          statusEditable={statusEditable}
          statusBusyId={statusBusyId}
          onStatusChange={handleStatusChange}
          onChange={handleGridChange}
          onDeleteRow={handleDeleteRow}
        />
      </div>

      <ReturnReasonModal
        open={failureTarget != null}
        stopName={failureTarget?.stopName}
        busy={updateStopStatusOps.isPending}
        onCancel={() => setFailureTarget(null)}
        onConfirm={handleConfirmFailure}
      />
    </>
  );
}
