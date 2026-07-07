import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ROUTE_CATEGORIES,
  ROUTE_CATEGORY_LABELS,
  VEHICLE_TYPES,
} from "@/modules/scheduling/constants.js";
import {
  normalizeRouteCategory,
  sortRoutesByCategory,
} from "@/modules/scheduling/utils/routeSort.js";
import { fetchAvailableDrivers } from "@/modules/scheduling/infrastructure/api/scheduling.api.js";
import { useCompleteRouteOpsMutation, useMarkRouteNotVerifiedMutation, useVerifyRouteDeliveryMutation } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { routeNameWithCategory } from "@/modules/scheduling/utils/routeDraft.js";
import { defaultDepartureFromArrival, formatRouteDurationHours } from "@/shared/utils/time.js";
import {
  canEditSpreadsheetStatus,
  formatSpreadsheetStatus,
  getSpreadsheetStatusKey,
  getSpreadsheetStatusOptions,
  isLiveSpreadsheetRoute,
  SPREADSHEET_STATUS,
} from "@/modules/scheduling/utils/routeSpreadsheetStatus.js";
import {
  canTrackRoute,
  isLiveRouteTracking,
  routeTrackingLabel,
  routeTrackingTitle,
} from "@/modules/tracking/utils/routeTrackingAccess.js";
import "./routesSpreadsheetGrid.css";

const HEADERS = [
  { key: "routeName", label: "Route name", width: 200, pinned: true },
  { key: "routeCategory", label: "Category", width: 110 },
  { key: "teamId", label: "Team", width: 130 },
  { key: "driverId", label: "Driver", width: 150 },
  { key: "stops", label: "Stops", width: 88 },
  { key: "arrivalTime", label: "Arrival", width: 110 },
  { key: "departureTime", label: "Departure", width: 120 },
  { key: "hoursSpent", label: "Hours", width: 88 },
  { key: "vehicleType", label: "Vehicle", width: 110 },
  { key: "mileage", label: "Miles", width: 80 },
  { key: "location", label: "Location", width: 160 },
  { key: "notes", label: "Notes", width: 140 },
  { key: "status", label: "Status", width: 120 },
  { key: "track", label: "Track", width: 76, pinned: "right-track" },
  { key: "actions", label: "", width: 52, pinned: "right" },
];

function routeToRow(route) {
  const dropoffs = (route.dropoffs ?? []).map((stop) => ({
    localId: stop.id ?? `stop-${stop.sequence ?? 0}`,
    serverId: stop.id,
    name: stop.name ?? "",
    address: stop.address ?? "",
    accessCode: stop.accessCode ?? "",
    status: stop.status ?? "pending",
    completedAt: stop.completedAt ?? null,
    returnReason: stop.returnReason ?? null,
    returnReasonCustom: stop.returnReasonCustom ?? null,
    lat: stop.lat ?? stop.destinationLat ?? null,
    lng: stop.lng ?? stop.destinationLng ?? null,
  }));

  const pickup = route.pickup
    ? {
        name: route.pickup.name ?? "",
        address: route.pickup.address ?? "",
        lat: route.pickup.lat ?? route.pickup.destinationLat ?? null,
        lng: route.pickup.lng ?? route.pickup.destinationLng ?? null,
      }
    : null;

  const progress = route.progress ?? null;
  const completedStopCount =
    progress?.completedDropoffs != null && progress?.returnedDropoffs != null
      ? progress.completedDropoffs + progress.returnedDropoffs
      : dropoffs.filter(
          (stop) => stop.status === "completed" || stop.status === "returned"
        ).length;

  return {
    id: route.id,
    scheduleId: route.scheduleId ?? "",
    routeName: route.routeName ?? "",
    routeCategory: normalizeRouteCategory(route.routeCategory),
    teamId: route.teamId ?? "",
    driverId: route.driverId ?? "",
    driverName: route.driverName ?? "",
    arrivalTime: route.arrivalTime ?? "09:00",
    departureTime: route.departureTime ?? "11:00",
    startedAt: route.startedAt ?? null,
    completedAt: route.completedAt ?? null,
    vehicleType: route.vehicleType ?? "Van",
    mileage: route.mileage != null && route.mileage !== "" ? String(route.mileage) : "",
    location: route.location ?? "",
    notes: route.notes ?? "",
    status: route.status ?? "pending",
    deliveryVerification: route.deliveryVerification ?? null,
    pickup,
    dropoffs,
    stopCount: dropoffs.length || route.stops || 0,
    completedStopCount,
    progress,
  };
}

export function routesToSpreadsheetRows(routes) {
  return sortRoutesByCategory(routes).map(routeToRow);
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function isPersistedRoute(row) {
  return !row.isNew && !String(row.id ?? "").startsWith("new-");
}

function canTrackDriver(row) {
  return isPersistedRoute(row) && canTrackRoute(row);
}

function buildCompletedStopsPatch(row) {
  const stopCount = row.stopCount ?? row.dropoffs?.length ?? 0;
  const now = new Date().toISOString();
  return {
    status: "completed",
    deliveryVerification: "pending",
    completedAt: now,
    completedStopCount: stopCount,
    dropoffs: (row.dropoffs ?? []).map((stop) =>
      stop.status === "pending" || !stop.status
        ? { ...stop, status: "completed", completedAt: now }
        : stop
    ),
  };
}

function statusConfirmMessage(row, nextKey) {
  const stopCount = row.stopCount ?? row.dropoffs?.length ?? 0;
  const pendingCount =
    row.dropoffs?.filter((stop) => stop.status === "pending" || !stop.status).length ?? stopCount;
  const name = row.routeName || "this route";

  if (nextKey === SPREADSHEET_STATUS.COMPLETED) {
    return pendingCount > 0
      ? `Mark "${name}" as completed? ${pendingCount} pending stop${pendingCount === 1 ? "" : "s"} will be marked as delivered.`
      : `Mark "${name}" as completed?`;
  }
  if (nextKey === SPREADSHEET_STATUS.VERIFIED) {
    return isLiveSpreadsheetRoute(row)
      ? pendingCount > 0
        ? `Mark "${name}" as verified? Pending stops will be completed first, then the route will be verified.`
        : `Mark "${name}" as verified? The route will be completed and verified.`
      : `Mark "${name}" as verified?`;
  }
  if (nextKey === SPREADSHEET_STATUS.NOT_VERIFIED) {
    return isLiveSpreadsheetRoute(row)
      ? pendingCount > 0
        ? `Mark "${name}" as not verified? Pending stops will be completed first, then the route will be marked not verified.`
        : `Mark "${name}" as not verified? The route will be completed and marked not verified.`
      : `Mark "${name}" as not verified?`;
  }
  return null;
}

export function RoutesSpreadsheetTable({
  rows,
  teams,
  scheduleId,
  scheduleDate,
  scheduleStore,
  dirtyIds,
  onChangeRow,
  onAddRoute,
  onBulkAdd,
  onUploadStopsCsv,
  uploadingStopsCsv = false,
  onDeleteRoute,
  deletingRouteId = null,
  onRouteStatusUpdated,
  showTrack = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const stopsCsvInputRef = useRef(null);
  const completeRouteOps = useCompleteRouteOpsMutation();
  const verifyRouteDelivery = useVerifyRouteDeliveryMutation();
  const markRouteNotVerified = useMarkRouteNotVerifiedMutation();
  const [quickFilter, setQuickFilter] = useState("");
  const [driversCache, setDriversCache] = useState({});
  const [loadingDriverRow, setLoadingDriverRow] = useState(null);
  const [statusUpdatingRouteId, setStatusUpdatingRouteId] = useState(null);

  const sortedRows = useMemo(() => sortRoutesByCategory(rows), [rows]);

  function openRouteStops(row) {
    if (!scheduleId || !row?.id) return;
    const isDraft = row.isNew || String(row.id).startsWith("new-");
    const stopsPath = `/schedules/${scheduleId}/routes/${row.id}/stops`;
    navigate(stopsPath, {
      state: {
        ...(isDraft ? { draftRow: row } : {}),
        ...(scheduleId === "draft"
          ? { returnTo: location.pathname, scheduleStore }
          : {}),
      },
    });
  }

  const visibleHeaders = useMemo(
    () =>
      HEADERS.filter((col) => {
        if (col.key === "track" && !showTrack) return false;
        if (col.key === "actions" && !onDeleteRoute) return false;
        return true;
      }),
    [showTrack, onDeleteRoute]
  );

  const unassignedCount = useMemo(
    () => sortedRows.filter((row) => !row.driverId).length,
    [sortedRows]
  );

  const filteredRows = useMemo(() => {
    const query = quickFilter.trim().toLowerCase();
    if (!query) return sortedRows;

    return sortedRows.filter((row) => {
      const teamName = teams.find((team) => team.id === row.teamId)?.name ?? "";
      const haystack = [
        row.routeName,
        ROUTE_CATEGORY_LABELS[row.routeCategory],
        teamName,
        row.driverName,
        row.vehicleType,
        row.location,
        row.notes,
        formatSpreadsheetStatus(row),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [quickFilter, sortedRows, teams]);

  const loadDrivers = useCallback(
    async (teamId, arrivalTime, departureTime, routeId) => {
      if (!teamId || !scheduleDate) return [];
      const key = `${teamId}|${arrivalTime}|${departureTime}|${routeId ?? ""}`;
      if (driversCache[key]) return driversCache[key];

      const list = await fetchAvailableDrivers(teamId, {
        date: scheduleDate,
        arrivalTime,
        departureTime,
        excludeRouteId: String(routeId).startsWith("new-") ? undefined : routeId,
      });
      setDriversCache((prev) => ({ ...prev, [key]: list }));
      return list;
    },
    [driversCache, scheduleDate]
  );

  function patchRow(id, patch) {
    onChangeRow(id, patch);
  }

  function handleCategoryChange(row, routeCategory) {
    const nextCategory = normalizeRouteCategory(routeCategory);
    if (nextCategory === row.routeCategory) return;

    patchRow(row.id, {
      routeCategory: nextCategory,
      routeName: routeNameWithCategory(row.routeName, nextCategory, {
        existingRoutes: rows,
        excludeRouteKey: row.id,
      }),
    });
  }

  function handleTeamChange(row, teamId) {
    const team = teams.find((item) => item.id === teamId);
    patchRow(row.id, {
      teamId,
      teamName: team?.name ?? "",
      driverId: "",
      driverName: "",
    });
  }

  function handleArrivalChange(row, arrivalTime) {
    patchRow(row.id, {
      arrivalTime,
      departureTime: defaultDepartureFromArrival(arrivalTime),
      driverId: "",
      driverName: "",
    });
  }

  function handleDepartureChange(row, departureTime) {
    patchRow(row.id, {
      departureTime,
      driverId: "",
      driverName: "",
    });
  }

  function handleDriverChange(row, driverId, drivers) {
    const driver = drivers.find((item) => item.id === driverId);
    patchRow(row.id, {
      driverId: driverId || "",
      driverName: driver?.fullName ?? driver?.email ?? "",
    });
  }

  async function handleDriverFocus(row) {
    if (!row.teamId) return;
    setLoadingDriverRow(row.id);
    try {
      await loadDrivers(row.teamId, row.arrivalTime, row.departureTime, row.id);
    } finally {
      setLoadingDriverRow(null);
    }
  }

  async function handleRouteStatusChange(row, nextKey) {
    const currentKey = getSpreadsheetStatusKey(row);
    if (nextKey === currentKey || !canEditSpreadsheetStatus(row)) return;

    const confirmMessage = statusConfirmMessage(row, nextKey);
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setStatusUpdatingRouteId(row.id);
    try {
      let patch = null;

      if (nextKey === SPREADSHEET_STATUS.COMPLETED) {
        if (isLiveSpreadsheetRoute(row)) {
          await completeRouteOps.mutateAsync({ routeId: row.id });
        }
        patch = buildCompletedStopsPatch(row);
      } else if (nextKey === SPREADSHEET_STATUS.VERIFIED) {
        if (isLiveSpreadsheetRoute(row)) {
          await completeRouteOps.mutateAsync({ routeId: row.id });
        }
        await verifyRouteDelivery.mutateAsync({
          routeId: row.id,
          scheduleId: row.scheduleId || scheduleId,
        });
        patch = {
          ...buildCompletedStopsPatch(row),
          deliveryVerification: "verified",
        };
      } else if (nextKey === SPREADSHEET_STATUS.NOT_VERIFIED) {
        if (isLiveSpreadsheetRoute(row)) {
          await completeRouteOps.mutateAsync({ routeId: row.id });
        }
        await markRouteNotVerified.mutateAsync({
          routeId: row.id,
          scheduleId: row.scheduleId || scheduleId,
        });
        patch = {
          ...buildCompletedStopsPatch(row),
          status: "not_verified",
          deliveryVerification: "rejected",
        };
      }

      if (patch) {
        onRouteStatusUpdated?.(row.id, patch, nextKey);
      }
    } catch (err) {
      window.alert(
        err?.response?.data?.message ?? err?.message ?? "Could not update route status."
      );
    } finally {
      setStatusUpdatingRouteId(null);
    }
  }

  function exportCsv() {
    const header = HEADERS.filter((col) => col.key !== "track" && col.key !== "actions")
      .map((col) => col.label)
      .join(",");
    const lines = filteredRows.map((row) => {
      const teamName = teams.find((team) => team.id === row.teamId)?.name ?? "";
      return [
        row.routeName,
        ROUTE_CATEGORY_LABELS[row.routeCategory] ?? row.routeCategory,
        teamName,
        row.driverName || "Unassigned",
        String(row.stopCount ?? row.dropoffs?.length ?? 0),
        row.arrivalTime,
        row.departureTime,
        formatRouteDurationHours(row.startedAt, row.completedAt, row.dropoffs),
        row.vehicleType,
        row.mileage,
        row.location,
        row.notes,
        formatSpreadsheetStatus(row),
      ]
        .map(escapeCsv)
        .join(",");
    });

    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "route-spreadsheet.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleStopsCsvChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onUploadStopsCsv) return;
    onUploadStopsCsv(file);
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="ops-menu__search min-w-[260px] flex-1">
          <svg className="h-4 w-4 shrink-0" style={{ color: "var(--text-dim)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={quickFilter}
            onChange={(e) => setQuickFilter(e.target.value)}
            placeholder="Search routes, teams, drivers…"
          />
        </div>

        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {rows.length} routes
          {unassignedCount > 0 ? ` · ${unassignedCount} unassigned` : ""}
          {dirtyIds.size > 0 ? ` · ${dirtyIds.size} unsaved` : ""}
          <span className="sm:hidden"> · swipe for more columns</span>
        </span>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {onAddRoute ? (
            <button type="button" onClick={onAddRoute} className="ops-btn ops-btn--accent px-4 py-2 text-sm font-semibold">
              + Add route
            </button>
          ) : null}
          {onBulkAdd ? (
            <button type="button" onClick={onBulkAdd} className="ops-btn px-4 py-2 text-sm font-semibold">
              Bulk add
            </button>
          ) : null}
          {onUploadStopsCsv ? (
            <>
              <input
                ref={stopsCsvInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleStopsCsvChange}
              />
              <button
                type="button"
                disabled={uploadingStopsCsv}
                onClick={() => stopsCsvInputRef.current?.click()}
                className="ops-btn px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {uploadingStopsCsv ? "Importing…" : "Upload stops CSV"}
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="ops-btn px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>
  );

  if (rows.length === 0) {
    return (
      <div className="ops-panel ops-fade overflow-hidden">
        {toolbar}
        <p className="px-6 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No routes yet. Add a route or use bulk add to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="ops-panel ops-fade overflow-hidden">
      {toolbar}

      <div className="px-2 py-3 sm:px-3">
        <div className="route-grid-wrap">
          <div className="route-grid-scroll">
            <table className={`route-grid-table${showTrack ? "" : " route-grid-table--no-track"}`}>
              <colgroup>
                {visibleHeaders.map((col) => (
                  <col key={col.key} style={{ width: col.width }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {visibleHeaders.map((col) => (
                    <th
                      key={col.key}
                      className={
                        col.pinned === "right"
                          ? "col-actions"
                          : col.pinned === "right-track"
                            ? "col-track"
                            : col.pinned
                              ? "col-pinned"
                              : undefined
                      }
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const isDirty = dirtyIds.has(row.id) || row.isNew;
                  const driverKey = `${row.teamId}|${row.arrivalTime}|${row.departureTime}|${row.id}`;
                  const drivers = driversCache[driverKey] ?? [];
                  const stopCount = row.stopCount ?? row.dropoffs?.length ?? 0;
                  const completedStopCount = row.completedStopCount ?? 0;
                  const stopsLabel =
                    completedStopCount > 0 ? `${completedStopCount}/${stopCount}` : String(stopCount);

                  return (
                    <tr key={row.id} className={isDirty ? "route-row-dirty" : undefined}>
                      <td className="col-pinned">
                        <input
                          className="route-grid-input route-grid-input--text"
                          value={row.routeName}
                          onChange={(e) =>
                            patchRow(row.id, { routeName: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="route-grid-input route-grid-input--select"
                          value={row.routeCategory}
                          onChange={(e) =>
                            handleCategoryChange(row, e.target.value)
                          }
                        >
                          {ROUTE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {ROUTE_CATEGORY_LABELS[cat]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="route-grid-input route-grid-input--select"
                          value={row.teamId}
                          onChange={(e) => handleTeamChange(row, e.target.value)}
                        >
                          <option value="">Select team</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="route-grid-input route-grid-input--select"
                          value={row.driverId || ""}
                          disabled={!row.teamId}
                          onFocus={() => void handleDriverFocus(row)}
                          onChange={(e) =>
                            handleDriverChange(row, e.target.value, drivers)
                          }
                        >
                          <option value="">
                            {loadingDriverRow === row.id ? "Loading…" : "Unassigned"}
                          </option>
                          {row.driverId &&
                          !drivers.some((driver) => driver.id === row.driverId) &&
                          row.driverName ? (
                            <option value={row.driverId}>{row.driverName}</option>
                          ) : null}
                          {drivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.fullName || driver.email}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={
                            stopCount > 0 ? "route-grid-stops-btn" : "route-grid-stops-empty"
                          }
                          title={
                            stopCount > 0
                              ? completedStopCount > 0
                                ? `${completedStopCount} of ${stopCount} stops completed — view stops`
                                : "View stops"
                              : "No stops yet"
                          }
                          onClick={() => openRouteStops(row)}
                        >
                          {stopsLabel}
                        </button>
                      </td>
                      <td>
                        <input
                          type="time"
                          className="route-grid-input route-grid-input--time"
                          value={row.arrivalTime}
                          onChange={(e) => handleArrivalChange(row, e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          className="route-grid-input route-grid-input--time"
                          value={row.departureTime}
                          onChange={(e) => handleDepartureChange(row, e.target.value)}
                        />
                      </td>
                      <td>
                        <span
                          className="route-grid-static"
                          title={
                            formatRouteDurationHours(row.startedAt, row.completedAt, row.dropoffs) !== "—"
                              ? row.startedAt && row.completedAt
                                ? `Started ${row.startedAt} · Completed ${row.completedAt}`
                                : "Based on first and last stop completion times"
                              : "Complete all stops (driver start optional) to calculate hours"
                          }
                        >
                          {formatRouteDurationHours(row.startedAt, row.completedAt, row.dropoffs)}
                        </span>
                      </td>
                      <td>
                        <select
                          className="route-grid-input route-grid-input--select"
                          value={row.vehicleType}
                          onChange={(e) =>
                            patchRow(row.id, { vehicleType: e.target.value })
                          }
                        >
                          {VEHICLE_TYPES.map((vehicle) => (
                            <option key={vehicle} value={vehicle}>
                              {vehicle}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          className="route-grid-input route-grid-input--number"
                          value={row.mileage}
                          placeholder="—"
                          onChange={(e) => patchRow(row.id, { mileage: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="route-grid-input"
                          value={row.location}
                          placeholder="—"
                          onChange={(e) => patchRow(row.id, { location: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="route-grid-input"
                          value={row.notes}
                          placeholder="—"
                          onChange={(e) => patchRow(row.id, { notes: e.target.value })}
                        />
                      </td>
                      <td>
                        {row.isNew ? (
                          <span className="route-grid-static">New</span>
                        ) : canEditSpreadsheetStatus(row) ? (
                          <select
                            className="route-grid-input route-grid-input--select"
                            value={getSpreadsheetStatusKey(row)}
                            disabled={statusUpdatingRouteId === row.id}
                            title="Change route status"
                            onChange={(e) => void handleRouteStatusChange(row, e.target.value)}
                          >
                            {getSpreadsheetStatusOptions(row).map((option) => (
                              <option key={option.value} value={option.value}>
                                {statusUpdatingRouteId === row.id && option.value === getSpreadsheetStatusKey(row)
                                  ? "Updating…"
                                  : option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="route-grid-static">
                            {formatSpreadsheetStatus(row)}
                          </span>
                        )}
                      </td>
                      {showTrack ? (
                      <td className="col-track">
                        {canTrackDriver(row) ? (
                          <Link
                            to={`/routes/tracking/${row.id}`}
                            className={
                              isLiveRouteTracking(row.status)
                                ? "route-grid-track-btn route-grid-track-btn--live"
                                : "route-grid-track-btn"
                            }
                            title={routeTrackingTitle(row.status)}
                          >
                            {routeTrackingLabel(row.status)}
                          </Link>
                        ) : (
                          <span className="route-grid-track-empty" title="Assign a driver to enable tracking">
                            —
                          </span>
                        )}
                      </td>
                      ) : null}
                      {onDeleteRoute ? (
                      <td className="col-actions">
                        {onDeleteRoute ? (
                          <button
                            type="button"
                            className="route-grid-delete-btn"
                            title="Delete route"
                            disabled={deletingRouteId === row.id}
                            onClick={() => onDeleteRoute(row)}
                          >
                            {deletingRouteId === row.id ? (
                              <span className="route-grid-delete-spinner" aria-hidden />
                            ) : (
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                                aria-hidden
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
                        ) : null}
                      </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
