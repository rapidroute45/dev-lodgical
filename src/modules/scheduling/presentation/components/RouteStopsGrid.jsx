import { useEffect, useMemo, useState } from "react";

import {
  STOP_STATUS_OPTIONS,
  formatStopStatusLabel,
  returnReasonLabel,
  stopStatusClass,
  stopStatusTone,
} from "@/modules/scheduling/utils/stopStatus.js";
import { RETURN_REASON_OPTIONS } from "@/modules/scheduling/constants/returnReasons.js";
import "./stopsCsvImportGrid.css";

function resolveServerStopId(stop) {
  const candidate = stop.serverId ?? stop.id ?? null;
  if (candidate && !String(candidate).startsWith("stop-")) {
    return String(candidate);
  }
  const local = stop.localId;
  if (local && !String(local).startsWith("stop-")) {
    return String(local);
  }
  return null;
}

function toGridRows(stops) {
  return stops.map((stop, index) => ({
    id: stop.localId ?? stop.serverId ?? stop.id ?? `stop-${index}`,
    serverStopId: resolveServerStopId(stop),
    sequence: index + 1,
    name: stop.name ?? "",
    address: stop.address ?? "",
    accessCode: stop.accessCode ?? "",
    status: stop.status ?? "pending",
    completedAt: stop.completedAt ?? null,
    returnReason: stop.returnReason ?? null,
    returnReasonCustom: stop.returnReasonCustom ?? null,
  }));
}

function rowStatusClass(status) {
  if (status === "completed") return "route-stop-row--completed";
  if (status === "returned") return "route-stop-row--returned";
  return undefined;
}

function StopStatusField({
  row,
  statusEditable,
  statusBusyId,
  onStatusChange,
}) {
  const status = row.status ?? "pending";
  const tone = stopStatusTone(status);
  const stopId = row.serverStopId;
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    setDraft(null);
  }, [status, row.id]);

  if (!statusEditable) {
    return (
      <div className="route-stop-status-cell">
        <span className={stopStatusClass(status)}>{formatStopStatusLabel(status)}</span>
        {status === "returned" && row.returnReason ? (
          <span className="route-stop-status-note" title={row.returnReasonCustom ?? undefined}>
            {returnReasonLabel(row.returnReason, RETURN_REASON_OPTIONS)}
            {row.returnReasonCustom ? ` — ${row.returnReasonCustom}` : ""}
          </span>
        ) : null}
      </div>
    );
  }

  const displayed = draft ?? status;
  const busy = statusBusyId === stopId;
  const disabled = busy || !stopId;

  return (
    <div className="route-stop-status-cell route-stop-status-cell--editable">
      <select
        className={`route-stop-status-select route-stop-status-select--${tone}`}
        value={displayed}
        disabled={disabled}
        title={stopId ? "Change stop status" : "Save the route before changing status"}
        aria-label={`Status for ${row.name || "stop"}`}
        onChange={(event) => {
          const next = event.target.value;
          if (next === status || !stopId) return;

          if (next === "returned") {
            onStatusChange?.({
              stopId,
              rowId: row.id,
              stopName: row.name,
              nextStatus: next,
            });
            setDraft(status);
            return;
          }

          onStatusChange?.({
            stopId,
            rowId: row.id,
            stopName: row.name,
            nextStatus: next,
          });
        }}
      >
        {STOP_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {status === "returned" && row.returnReason ? (
        <span className="route-stop-status-note" title={row.returnReasonCustom ?? undefined}>
          {returnReasonLabel(row.returnReason, RETURN_REASON_OPTIONS)}
        </span>
      ) : null}
    </div>
  );
}

export function RouteStopsGrid({
  stops,
  compact = false,
  editable = false,
  showStatus = false,
  statusEditable = false,
  statusBusyId = null,
  onStatusChange,
  onChange,
  onDeleteRow,
}) {
  const rowData = useMemo(() => toGridRows(stops ?? []), [stops]);

  function updateRow(rowId, field, value) {
    if (!editable || !onChange) return;
    onChange(
      rowData.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  }

  if (rowData.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        {editable
          ? "No stops on this route yet. Add a stop below or upload a stops CSV from the spreadsheet."
          : "No stops on this route yet. Upload a stops CSV or assign a driver with matching stops."}
      </p>
    );
  }

  return (
    <div className={`route-stops-table-wrap ${compact ? "route-stops-table-wrap--modal" : ""}`}>
      <table className="route-stops-table">
        <thead>
          <tr>
            <th className="route-stops-table__col-seq">#</th>
            <th>Customer</th>
            <th>Address</th>
            <th className="route-stops-table__col-code">Gate / apt code</th>
            {showStatus ? <th className="route-stops-table__col-status">Status</th> : null}
            {editable ? <th className="route-stops-table__col-actions" aria-label="Actions" /> : null}
          </tr>
        </thead>
        <tbody>
          {rowData.map((row) => (
            <tr key={row.id} className={rowStatusClass(row.status)}>
              <td className="route-stops-table__seq">{row.sequence}</td>
              <td>
                {editable ? (
                  <input
                    type="text"
                    className="route-stops-table__input"
                    value={row.name}
                    placeholder="Customer name"
                    onChange={(event) => updateRow(row.id, "name", event.target.value)}
                  />
                ) : (
                  row.name || "—"
                )}
              </td>
              <td>
                {editable ? (
                  <textarea
                    className="route-stops-table__textarea"
                    value={row.address}
                    placeholder="Street address"
                    rows={2}
                    onChange={(event) => updateRow(row.id, "address", event.target.value)}
                  />
                ) : (
                  row.address || "—"
                )}
              </td>
              <td>
                {editable ? (
                  <input
                    type="text"
                    className="route-stops-table__input route-stops-table__input--code"
                    value={row.accessCode}
                    placeholder="—"
                    onChange={(event) => updateRow(row.id, "accessCode", event.target.value)}
                  />
                ) : (
                  row.accessCode?.trim() || "—"
                )}
              </td>
              {showStatus ? (
                <td>
                  <StopStatusField
                    row={row}
                    statusEditable={statusEditable}
                    statusBusyId={statusBusyId}
                    onStatusChange={onStatusChange}
                  />
                </td>
              ) : null}
              {editable ? (
                <td className="route-stops-table__actions">
                  <button
                    type="button"
                    className="route-stops-delete-btn"
                    title="Delete stop"
                    onClick={() => onDeleteRow?.(row.id)}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      {editable ? (
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          {statusEditable
            ? "Edit stop details below. Change status from the dropdown — Failure asks for a reason."
            : "Edit stop details below. Changes are saved when you press Save stops."}
        </p>
      ) : null}
    </div>
  );
}

/** Convert grid rows back to dropoff stop objects. */
export function gridRowsToDropoffs(rows) {
  return rows.map((row) => ({
    localId: row.id,
    serverId: row.serverStopId ?? (String(row.id).startsWith("stop-") ? undefined : row.id),
    name: row.name ?? "",
    address: row.address ?? "",
    accessCode: row.accessCode ?? "",
    status: row.status ?? "pending",
    completedAt: row.completedAt ?? null,
    returnReason: row.returnReason ?? null,
    returnReasonCustom: row.returnReasonCustom ?? null,
  }));
}

/** Normalize stop list for editing in the modal. */
export function normalizeDropoffsForEdit(stops) {
  return (stops ?? []).map((stop, index) => ({
    localId: stop.localId ?? stop.serverId ?? `stop-${index}-${Date.now()}`,
    serverId: stop.serverId ?? stop.id,
    name: stop.name ?? "",
    address: stop.address ?? "",
    accessCode: stop.accessCode ?? "",
    status: stop.status ?? "pending",
    completedAt: stop.completedAt ?? null,
    returnReason: stop.returnReason ?? null,
    returnReasonCustom: stop.returnReasonCustom ?? null,
    lat: stop.lat,
    lng: stop.lng,
    placeId: stop.placeId,
  }));
}

/** Merge driver completion status from server without overwriting dispatch edits. */
export function mergeStopStatusFromServer(localStops, serverStops) {
  const incoming = normalizeDropoffsForEdit(serverStops);
  if (incoming.length === 0) return localStops;

  const statusByKey = new Map(
    incoming.map((stop) => [
      stop.serverId ?? stop.localId,
      {
        status: stop.status,
        completedAt: stop.completedAt,
        returnReason: stop.returnReason,
        returnReasonCustom: stop.returnReasonCustom,
        serverId: stop.serverId,
        lat: stop.lat,
        lng: stop.lng,
      },
    ])
  );

  return localStops.map((stop) => {
    const key = stop.serverId ?? stop.localId;
    const fresh = statusByKey.get(key);
    if (!fresh) return stop;
    return {
      ...stop,
      serverId: stop.serverId ?? fresh.serverId,
      status: fresh.status,
      completedAt: fresh.completedAt,
      returnReason: fresh.returnReason,
      returnReasonCustom: fresh.returnReasonCustom,
      lat: fresh.lat ?? stop.lat,
      lng: fresh.lng ?? stop.lng,
    };
  });
}

function newDropoffStop() {
  return {
    localId: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    address: "",
    accessCode: "",
    status: "pending",
  };
}

export { newDropoffStop };
