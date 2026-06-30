import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { fetchSchedules } from "@/modules/scheduling/infrastructure/api/scheduling.api.js";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { OpsStatCard } from "@/modules/manager-home/presentation/components/OpsWidgets.jsx";
import {
  useCreateRouteMutation,
  useDeleteRouteMutation,
  useScheduleGroupQuery,
  useScheduleQuery,
  useSchedulesQuery,
  useTeamsQuery,
  useUpdateRouteMutation,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import {
  buildBulkDraftRoutes,
  draftRoutePayload,
  draftToSpreadsheetRow,
  newDraftRoute,
  spreadsheetRowToDraft,
} from "@/modules/scheduling/utils/routeDraft.js";
import { sortRoutesByCategory } from "@/modules/scheduling/utils/routeSort.js";
import { BulkAddRoutesModal } from "../components/BulkAddRoutesModal.jsx";
import { formatDisplayDate, todayIsoDate } from "@/shared/utils/time.js";
import { useOpsDateScope } from "@/modules/manager-home/application/OpsDateScopeProvider.jsx";
import { apiErrorMessage } from "@/shared/utils/api.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import {
  RoutesSpreadsheetTable,
  routesToSpreadsheetRows,
} from "../components/RoutesSpreadsheetTable.jsx";
import { useDriverStopsCsvUpload } from "../hooks/useDriverStopsCsvUpload.js";

function Banner({ type, children }) {
  return (
    <div className={`ops-banner ${type === "error" ? "ops-banner--error" : "ops-banner--success"}`}>
      {children}
    </div>
  );
}

export function ScheduleRoutesSpreadsheetScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setDate: setGlobalDate } = useOpsDateScope();
  const { id: scheduleId } = useParams();
  const { data: schedule, isLoading: primaryLoading, isError, refetch: refetchSchedule } = useScheduleQuery(
    scheduleId,
    Boolean(scheduleId)
  );
  const { data: teams = [] } = useTeamsQuery();
  const updateRoute = useUpdateRouteMutation();
  const createRoute = useCreateRouteMutation();
  const deleteRoute = useDeleteRouteMutation();

  const { data: siblingList, isLoading: siblingsLoading, refetch: refetchSiblings } = useSchedulesQuery(
    { date: schedule?.date, storeId: schedule?.storeId ?? schedule?.store?.id },
    Boolean(schedule?.date && (schedule?.storeId ?? schedule?.store?.id))
  );

  const siblingIds = useMemo(() => {
    const items = siblingList?.items ?? [];
    if (items.length > 0) {
      return [...new Set(items.map((s) => s.id).filter(Boolean))];
    }
    return scheduleId ? [scheduleId] : [];
  }, [siblingList, scheduleId]);

  const groupQueries = useScheduleGroupQuery(siblingIds, siblingIds.length > 0, {
    refetchInterval: 10_000,
  });

  const mergedSchedule = useMemo(() => {
    const loaded = groupQueries.map((q) => q.data).filter(Boolean);
    if (loaded.length === 0) return schedule ?? null;

    const primary = loaded.find((s) => s.id === scheduleId) ?? loaded[0];
    const allRoutes = sortRoutesByCategory(loaded.flatMap((s) => s.routes ?? []));

    return {
      ...primary,
      routes: allRoutes,
      routeCount: allRoutes.length,
    };
  }, [groupQueries, schedule, scheduleId]);

  const storeId = mergedSchedule?.storeId ?? mergedSchedule?.store?.id ?? schedule?.storeId ?? schedule?.store?.id;
  const scheduleDate = mergedSchedule?.date ?? schedule?.date;
  const browseDate = searchParams.get("date") ?? scheduleDate ?? todayIsoDate();
  const viewingAlternateDate = Boolean(scheduleDate && browseDate !== scheduleDate);

  const isLoading =
    primaryLoading ||
    siblingsLoading ||
    (siblingIds.length > 0 && groupQueries.some((q) => q.isLoading));

  const isRefreshing = groupQueries.some((q) => q.isFetching);

  const [rows, setRows] = useState([]);
  const [dirtyIds, setDirtyIds] = useState(() => new Set());
  const [saving, setSaving] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [serverSyncKey, setServerSyncKey] = useState(0);
  const [deletingRouteId, setDeletingRouteId] = useState(null);

  useEffect(() => {
    const patch = location.state?.updatedStopsRow;
    if (!patch?.id) return;

    setRows((prev) =>
      prev.map((item) =>
        item.id === patch.id
          ? { ...item, dropoffs: patch.dropoffs, stopCount: patch.stopCount }
          : item
      )
    );
    setDirtyIds((prev) => new Set(prev).add(patch.id));
    setMessage(
      `Updated ${patch.stopCount} stop${patch.stopCount === 1 ? "" : "s"}. Save the spreadsheet to persist.`
    );
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const { handleUploadStopsCsv, applyDriverStopsToRow, uploadingStopsCsv } =
    useDriverStopsCsvUpload({
      setRows,
      setDirtyIds,
      setMessage,
      setError,
    });

  const routesKey = mergedSchedule?.routes?.map((r) => r.id).join(",") ?? "";
  const dirtyIdsRef = useRef(dirtyIds);
  dirtyIdsRef.current = dirtyIds;

  useEffect(() => {
    if (!mergedSchedule?.routes || viewingAlternateDate) return;

    setRows((prev) => {
      const dirty = dirtyIdsRef.current;
      const pendingNew = prev.filter((row) => row.isNew);
      const prevById = new Map(prev.map((row) => [row.id, row]));
      const serverRows = routesToSpreadsheetRows(mergedSchedule.routes).map((serverRow) => {
        if (dirty.has(serverRow.id) && prevById.has(serverRow.id)) {
          return prevById.get(serverRow.id);
        }
        return serverRow;
      });
      return [...serverRows, ...pendingNew];
    });
  }, [routesKey, serverSyncKey, viewingAlternateDate]);

  const routeById = useMemo(() => {
    const map = new Map();
    for (const q of groupQueries) {
      if (!q.data) continue;
      for (const route of q.data.routes ?? []) {
        map.set(route.id, {
          route,
          scheduleId: route.scheduleId ?? q.data.id,
        });
      }
    }
    return map;
  }, [groupQueries]);

  const summary = useMemo(() => {
    const unassigned = rows.filter((row) => !row.driverId).length;
    const pending = rows.filter((row) => row.status === "pending" || row.status === "assigned").length;
    return {
      total: rows.length,
      unassigned,
      pending,
      unsaved: dirtyIds.size,
    };
  }, [rows, dirtyIds.size]);

  async function refreshAll() {
    await Promise.all([
      refetchSchedule(),
      refetchSiblings(),
      ...groupQueries.map((q) => q.refetch()),
    ]);
  }

  function handleChangeRow(id, patch) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        let next = { ...row, ...patch };
        if (patch.driverId !== undefined || patch.driverName !== undefined) {
          next = applyDriverStopsToRow(next);
        }
        return next;
      })
    );
    setDirtyIds((prev) => new Set(prev).add(id));
    setMessage(null);
    setError(null);
  }

  function handleRouteCompleted(routeId, patch) {
    setRows((prev) =>
      prev.map((row) => (row.id === routeId ? { ...row, ...patch } : row))
    );
    setMessage("Route marked as completed.");
    setError(null);
  }

  function existingRoutesForNaming() {
    return rows.map((row) => ({ routeName: row.routeName }));
  }

  function appendDraftRows(drafts) {
    if (!scheduleId || drafts.length === 0) return;
    const newRows = drafts.map((draft) => draftToSpreadsheetRow(draft, scheduleId));
    setRows((prev) => [...prev, ...newRows]);
    setDirtyIds((prev) => {
      const next = new Set(prev);
      for (const row of newRows) next.add(row.id);
      return next;
    });
    setMessage(null);
    setError(null);
  }

  function addSingleRoute() {
    if (!mergedSchedule?.store) {
      setError("Store details are missing — cannot add a route.");
      return;
    }
    const [draft] = buildBulkDraftRoutes({
      store: mergedSchedule.store,
      counts: { SMALL: 1, MEDIUM: 0, FULL: 0 },
      existingRoutes: existingRoutesForNaming(),
    });
    if (!draft) {
      const fallback = newDraftRoute(null, mergedSchedule.store);
      appendDraftRows([fallback]);
      return;
    }
    appendDraftRows([draft]);
  }

  function addBulkRoutes(counts) {
    if (!mergedSchedule?.store) {
      setError("Store details are missing — cannot add routes.");
      return;
    }
    const drafts = buildBulkDraftRoutes({
      store: mergedSchedule.store,
      counts,
      existingRoutes: existingRoutesForNaming(),
    });
    appendDraftRows(drafts);
    setBulkModalOpen(false);
  }

  async function handleDeleteRoute(row) {
    const label = row.routeName?.trim() || "this route";
    const confirmed = window.confirm(`Delete "${label}" from this schedule?`);
    if (!confirmed) return;

    setError(null);
    setMessage(null);

    if (row.isNew || String(row.id).startsWith("new-")) {
      setRows((prev) => prev.filter((item) => item.id !== row.id));
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
      setMessage(`Removed ${label}.`);
      return;
    }

    const entry = routeById.get(row.id);
    const targetScheduleId = entry?.scheduleId ?? row.scheduleId ?? scheduleId;

    setDeletingRouteId(row.id);
    try {
      await deleteRoute.mutateAsync({
        routeId: row.id,
        scheduleId: targetScheduleId,
      });
      setRows((prev) => prev.filter((item) => item.id !== row.id));
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
      await Promise.all(groupQueries.map((q) => q.refetch()));
      setServerSyncKey((key) => key + 1);
      setMessage(`Deleted ${label}. Team lead has been notified.`);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not delete route."));
    } finally {
      setDeletingRouteId(null);
    }
  }

  async function saveChanges() {
    if (dirtyIds.size === 0) return true;

    setSaving(true);
    setError(null);
    setMessage(null);

    const count = dirtyIds.size;

    try {
      let created = 0;
      let updated = 0;

      for (const routeId of dirtyIds) {
        const row = rows.find((r) => r.id === routeId);
        if (!row) continue;

        if (!row.teamId) {
          throw new Error(`Route "${row.routeName || routeId}" needs a team.`);
        }
        if (!row.routeName.trim()) throw new Error("Each route needs a name.");

        if (row.isNew) {
          const draft = spreadsheetRowToDraft(row, mergedSchedule?.store);
          const team = teams.find((t) => t.id === row.teamId);
          if (team) draft.teamName = team.name;

          await createRoute.mutateAsync({
            scheduleId: row.scheduleId || scheduleId,
            ...draftRoutePayload(draft),
          });
          created += 1;
          continue;
        }

        const entry = routeById.get(routeId);
        if (!entry) continue;

        const draft = spreadsheetRowToDraft(row, mergedSchedule?.store);
        const team = teams.find((t) => t.id === row.teamId);
        if (team) draft.teamName = team.name;

        await updateRoute.mutateAsync({
          routeId,
          scheduleId: entry.scheduleId,
          body: draftRoutePayload(draft),
        });
        updated += 1;
      }

      await Promise.all(groupQueries.map((q) => q.refetch()));
      setDirtyIds(new Set());
      setServerSyncKey((key) => key + 1);
      const parts = [];
      if (created > 0) parts.push(`created ${created}`);
      if (updated > 0) parts.push(`updated ${updated}`);
      setMessage(
        parts.length > 0
          ? `Saved — ${parts.join(", ")} route${count === 1 ? "" : "s"}.`
          : `Saved ${count} route${count === 1 ? "" : "s"}.`
      );
      return true;
    } catch (err) {
      setError(apiErrorMessage(err, "Save failed"));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleBack() {
    if (saving) return;
    if (dirtyIds.size > 0) {
      const saved = await saveChanges();
      if (!saved) return;
    }
    navigate("/schedules");
  }

  const storeName = mergedSchedule?.store?.storeName ?? "Schedule";
  const dirtyCount = dirtyIds.size;
  const displayDate = browseDate;

  const handleTopBarDateChange = useCallback(
    async (newDateOrFn) => {
      const newDate =
        typeof newDateOrFn === "function" ? newDateOrFn(displayDate) : newDateOrFn;
      if (!newDate || newDate === displayDate) return;

      setGlobalDate(newDate);

      if (dirtyIds.size > 0) {
        const saved = await saveChanges();
        if (!saved) return;
      }

      if (!storeId) return;

      try {
        const data = await fetchSchedules({
          date: newDate,
          storeId,
          city: mergedSchedule?.city ?? schedule?.city,
          state: mergedSchedule?.state ?? schedule?.state,
          limit: 10,
        });
        const target = data?.items?.[0];
        if (target?.id) {
          navigate(`/schedules/${target.id}/routes`, { replace: true });
          return;
        }

        setSearchParams({ date: newDate }, { replace: true });
        setRows([]);
        setDirtyIds(new Set());
        setMessage(null);
        setError(null);
      } catch (err) {
        setError(apiErrorMessage(err, "Could not load schedule for that date."));
      }
    },
    [
      displayDate,
      dirtyIds.size,
      storeId,
      mergedSchedule?.city,
      mergedSchedule?.state,
      schedule?.city,
      schedule?.state,
      navigate,
      setSearchParams,
      setGlobalDate,
    ]
  );

  const topBar = (
    <OpsTopBar
      date={displayDate}
      setDate={handleTopBarDateChange}
      onRefresh={refreshAll}
      refreshing={isRefreshing}
    />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => void handleBack()}
              className="ops-btn p-2.5"
              aria-label="Back"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                {storeName}
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                Route spreadsheet
                {displayDate ? ` · ${formatDisplayDate(displayDate)}` : ""}
                {mergedSchedule?.city ? ` · ${mergedSchedule.city}, ${mergedSchedule.state}` : ""}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link to={`/schedules/${scheduleId}`} className="ops-btn px-4 py-2 text-sm font-semibold">
              Card view
            </Link>
            <button
              type="button"
              disabled={saving || dirtyCount === 0}
              onClick={() => void saveChanges()}
              className="ops-btn ops-btn--accent px-5 py-2 font-bold disabled:opacity-50"
            >
              {saving ? "Saving…" : dirtyCount > 0 ? `Save ${dirtyCount} change${dirtyCount === 1 ? "" : "s"}` : "No changes"}
            </button>
          </div>
        </div>

        {!isLoading && mergedSchedule ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <OpsStatCard icon="routes" label="Total routes" value={summary.total} delay={0} />
            <OpsStatCard
              icon="clock"
              label="Pending / awaiting"
              value={summary.pending}
              barColor="var(--amber)"
              delay={60}
            />
            <OpsStatCard
              icon="drivers"
              label="Unassigned"
              value={summary.unassigned}
              barColor="var(--rose)"
              percent={summary.total ? (summary.unassigned / summary.total) * 100 : 0}
              delay={120}
            />
            <OpsStatCard
              icon="active"
              label="Unsaved changes"
              value={summary.unsaved}
              barColor="var(--accent)"
              delay={180}
            />
          </div>
        ) : null}

        {error ? <Banner type="error">{error}</Banner> : null}
        {message ? <Banner type="success">{message}</Banner> : null}

        {isLoading ? (
          <div className="space-y-4">
            <div className="ops-skel h-16 rounded-2xl" />
            <div className="ops-skel h-64 rounded-2xl" />
          </div>
        ) : isError || !mergedSchedule ? (
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>Schedule not found</p>
            <Link to="/schedules" className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold">
              Back to schedules
            </Link>
          </div>
        ) : viewingAlternateDate ? (
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
              No schedule for {formatDisplayDate(displayDate)}
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              {storeName} has no routes on this date.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {storeId ? (
                <Link
                  to={`/schedules/create?storeId=${encodeURIComponent(storeId)}&date=${encodeURIComponent(displayDate)}`}
                  className="ops-btn ops-btn--accent px-6 py-2.5 font-bold"
                >
                  Create schedule
                </Link>
              ) : null}
              {scheduleDate ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchParams({}, { replace: true });
                    setRows([]);
                    setDirtyIds(new Set());
                  }}
                  className="ops-btn px-6 py-2.5 font-semibold"
                >
                  Back to {formatDisplayDate(scheduleDate)}
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <RoutesSpreadsheetTable
              rows={rows}
              teams={teams}
              scheduleId={scheduleId}
              scheduleDate={mergedSchedule.date}
              scheduleStore={mergedSchedule.store}
              dirtyIds={dirtyIds}
              onChangeRow={handleChangeRow}
              onAddRoute={addSingleRoute}
              onBulkAdd={() => setBulkModalOpen(true)}
              onUploadStopsCsv={handleUploadStopsCsv}
              uploadingStopsCsv={uploadingStopsCsv}
              onDeleteRoute={handleDeleteRoute}
              deletingRouteId={deletingRouteId}
              onRouteCompleted={handleRouteCompleted}
            />
            <BulkAddRoutesModal
              open={bulkModalOpen}
              storeName={mergedSchedule.store?.storeName}
              onClose={() => setBulkModalOpen(false)}
              onAdd={addBulkRoutes}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
