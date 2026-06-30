import { useCallback, useEffect, useState } from "react";
import { useAssignedCityScope } from "@/modules/scheduling/presentation/hooks/useAssignedCityScope.js";
import { useOpsLocationScope } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";
import { useOpsDateScope } from "@/modules/manager-home/application/OpsDateScopeProvider.jsx";
import { useAutoSaveCreateScheduleDraft } from "@/modules/scheduling/presentation/hooks/useAutoSaveCreateScheduleDraft.js";
import { useResolvedStoreLocation } from "@/modules/scheduling/presentation/hooks/useResolvedStoreLocation.js";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { defaultDepartureFromArrival } from "@/shared/utils/time.js";
import {
  useCreateRouteMutation,
  useCreateScheduleMutation,
  useCreateStoreMutation,
  useStoresQuery,
  useTeamsQuery,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import {
  buildBulkDraftRoutes,
  draftRoutePayload,
  draftToSpreadsheetRow,
  formatStorePickupAddress,
  newDraftRoute,
  spreadsheetRowToDraft,
} from "@/modules/scheduling/utils/routeDraft.js";
import { LocationStoreSection } from "../components/LocationStoreSection.jsx";
import { CreateStoreModal } from "../components/CreateStoreModal.jsx";
import { BulkAddRoutesModal } from "../components/BulkAddRoutesModal.jsx";
import { RoutesSpreadsheetTable } from "../components/RoutesSpreadsheetTable.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { apiErrorMessage } from "@/shared/utils/api.js";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { canManageStores } from "@/shared/utils/constants.js";
import { useDriverStopsCsvUpload } from "../hooks/useDriverStopsCsvUpload.js";

function Banner({ type, children }) {
  return (
    <div className={`ops-banner ${type === "error" ? "ops-banner--error" : "ops-banner--success"}`}>
      {children}
    </div>
  );
}

export function CreateScheduleScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { assignedCity, assignedCities, isCityLocked, isCityScoped } = useAssignedCityScope();
  const { effectiveCity, effectiveState } = useOpsLocationScope();
  const { date, setDate } = useOpsDateScope();
  const allowCreateStore = canManageStores(user?.role);
  const [city, setCity] = useState(assignedCity ?? "");
  const [state, setState] = useState("");
  const [selectedStore, setSelectedStore] = useState(null);
  const [scheduleId, setScheduleId] = useState(null);
  const [rows, setRows] = useState([]);
  const [dirtyIds, setDirtyIds] = useState(() => new Set());
  const [createStoreModal, setCreateStoreModal] = useState(false);
  const [bulkRoutesModal, setBulkRoutesModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const { handleUploadStopsCsv, applyDriverStopsToRow, uploadingStopsCsv } =
    useDriverStopsCsvUpload({
      setRows,
      setDirtyIds,
      setMessage,
      setError,
    });

  const { data: teams = [] } = useTeamsQuery();
  const { data: allStores = [], isLoading: storesLoading } = useStoresQuery(true);
  const createSchedule = useCreateScheduleMutation();
  const createRoute = useCreateRouteMutation();
  const createStore = useCreateStoreMutation();

  const { handleBack, markExitingAfterSave } = useAutoSaveCreateScheduleDraft({
    selectedStore,
    city,
    state,
    date,
    rows,
    scheduleId,
    teams,
    isCityLocked,
    assignedCity,
    saving,
    setSaving,
    setError,
    setScheduleId,
    setRows,
  });

  useEffect(() => {
    if (isCityLocked && assignedCity) {
      setCity(assignedCity);
      return;
    }
    if (effectiveCity) setCity(effectiveCity);
    if (effectiveState) setState(effectiveState);
  }, [assignedCity, isCityLocked, effectiveCity, effectiveState]);

  useResolvedStoreLocation(allStores, city, state, setCity, setState);

  const preselectStoreId = searchParams.get("storeId");
  const preselectDate = searchParams.get("date");
  useEffect(() => {
    if (preselectDate) setDate(preselectDate);
  }, [preselectDate]);

  useEffect(() => {
    if (!preselectStoreId || selectedStore || allStores.length === 0) return;
    const store = allStores.find((item) => item.id === preselectStoreId);
    if (!store) return;
    setSelectedStore(store);
    setCity(store.city);
    setState(store.state);
  }, [preselectStoreId, allStores, selectedStore]);

  const handleChangeRow = useCallback(
    (id, patch) => {
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
    },
    [applyDriverStopsToRow]
  );

  useEffect(() => {
    const patch = location.state?.updatedStopsRow;
    if (!patch?.id) return;

    handleChangeRow(patch.id, { dropoffs: patch.dropoffs, stopCount: patch.stopCount });
    setMessage(
      `Updated ${patch.stopCount} stop${patch.stopCount === 1 ? "" : "s"}. Save the schedule to persist.`
    );
    navigate(location.pathname + location.search, { replace: true, state: {} });
  }, [location.pathname, location.search, location.state, navigate, handleChangeRow]);

  async function ensureSchedule(status) {
    if (scheduleId) return scheduleId;
    const scheduleCity = (isCityLocked ? assignedCity : city.trim()) || selectedStore?.city?.trim() || "";
    const scheduleState = (state.trim() || selectedStore?.state?.trim() || "").toUpperCase();
    if (!scheduleCity || !scheduleState) throw new Error("Enter city and state first.");
    if (!selectedStore) throw new Error("Select or create a store.");
    const schedule = await createSchedule.mutateAsync({
      date,
      city: scheduleCity,
      state: scheduleState,
      storeId: selectedStore.id,
      status,
    });
    setScheduleId(schedule.id);
    return schedule.id;
  }

  function validateRowsBeforeSave() {
    for (const row of rows) {
      if (!row.teamId) return "Each route needs a team.";
      if (!row.routeName.trim()) return "Each route needs a name.";
      const arrival = row.arrivalTime?.trim();
      const departure = row.departureTime?.trim() || defaultDepartureFromArrival(arrival);
      if (arrival && departure && departure <= arrival) {
        return `Route "${row.routeName}": departure must be after arrival.`;
      }
    }
    return null;
  }

  function existingRoutesForNaming() {
    return rows.map((row) => ({ routeName: row.routeName }));
  }

  function appendDraftRows(drafts) {
    if (drafts.length === 0) return;
    const newRows = drafts.map((draft) => draftToSpreadsheetRow(draft, scheduleId ?? ""));
    setRows((prev) => [...prev, ...newRows]);
    setDirtyIds((prev) => {
      const next = new Set(prev);
      for (const row of newRows) next.add(row.id);
      return next;
    });
    setMessage(null);
    setError(null);
  }

  function requireStore() {
    if (selectedStore) return true;
    setError("Select a store before adding routes.");
    return false;
  }

  function addSingleRoute() {
    if (!requireStore()) return;
    const [draft] = buildBulkDraftRoutes({
      store: selectedStore,
      counts: { SMALL: 1, MEDIUM: 0, FULL: 0 },
      existingRoutes: existingRoutesForNaming(),
    });
    if (!draft) {
      appendDraftRows([newDraftRoute(null, selectedStore)]);
      return;
    }
    appendDraftRows([draft]);
  }

  function addBulkRoutes(counts) {
    if (!requireStore()) return;
    const drafts = buildBulkDraftRoutes({
      store: selectedStore,
      counts,
      existingRoutes: existingRoutesForNaming(),
    });
    appendDraftRows(drafts);
    setBulkRoutesModal(false);
    setMessage(
      `Added ${drafts.length} route${drafts.length === 1 ? "" : "s"}. Assign a team on each row before publishing.`
    );
  }

  async function publishRoutes(status) {
    setMessage(null);
    setError(null);
    if (rows.length === 0) {
      setError("Add at least one route.");
      return;
    }

    const validationError = validateRowsBeforeSave();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const sid = await ensureSchedule(status);
      let savedCount = 0;

      for (const row of rows) {
        if (row.isNew === false) continue;
        const draft = spreadsheetRowToDraft(row, selectedStore);
        const team = teams.find((t) => t.id === row.teamId);
        if (team) draft.teamName = team.name;
        await createRoute.mutateAsync({
          scheduleId: sid,
          ...draftRoutePayload(draft),
        });
        savedCount += 1;
      }

      if (savedCount === 0 && rows.some((row) => row.isNew !== false)) {
        throw new Error("No routes could be saved.");
      }

      setRows((prev) =>
        prev.map((row) => (row.isNew === false ? row : { ...row, isNew: false }))
      );
      setDirtyIds(new Set());
      setMessage(
        status === "draft" ? "Draft saved successfully." : "Schedule published successfully."
      );
      if (status === "pending") {
        markExitingAfterSave();
        navigate("/schedules", { replace: true });
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  function selectStore(store) {
    if (!store) return;
    setSelectedStore(store);
    setCity(store.city);
    setState(store.state);
    const location = formatStorePickupAddress(store);
    setRows((prev) => prev.map((row) => ({ ...row, location })));
  }

  async function handleCreateStore(payload) {
    try {
      const store = await createStore.mutateAsync(payload);
      selectStore(store);
      setCreateStoreModal(false);
      setMessage("Store created and selected.");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create store"));
    }
  }

  const topBar = (
    <OpsTopBar onRefresh={() => {}} refreshing={false} />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={handleBack} className="ops-btn p-2" aria-label="Back">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                Create Schedule
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                Set location, add routes, then publish
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => publishRoutes("draft")}
              disabled={saving}
              className="ops-btn px-4 py-2 font-semibold disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={() => publishRoutes("pending")}
              disabled={saving}
              className="ops-btn ops-btn--accent px-5 py-2 font-bold disabled:opacity-50"
            >
              {saving ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>

        {error ? <Banner type="error">{error}</Banner> : null}
        {message ? <Banner type="success">{message}</Banner> : null}

        <div className="ops-stepper ops-fade flex flex-wrap items-center gap-2">
          <Step n={1} label="Location" done={Boolean(selectedStore)} active />
          <StepConnector done={Boolean(selectedStore)} />
          <Step n={2} label="Routes" done={rows.length > 0} active={Boolean(selectedStore)} />
          <StepConnector done={rows.length > 0} />
          <Step n={3} label="Publish" active={rows.length > 0} />
        </div>

        <LocationStoreSection
          stores={allStores}
          isLoadingStores={storesLoading}
          city={city}
          state={state}
          selectedStore={selectedStore}
          cityLocked={isCityLocked}
          allowedCities={isCityScoped ? assignedCities : null}
          onSelectLocation={(c, s) => {
            setCity(c);
            setState(s);
            if (!isCityLocked) setSelectedStore(null);
          }}
          onSelectStore={selectStore}
          onCreateStore={allowCreateStore ? () => setCreateStoreModal(true) : undefined}
        />

        {selectedStore ? (
          <RoutesSpreadsheetTable
            rows={rows}
            teams={teams}
            scheduleId="draft"
            scheduleDate={date}
            scheduleStore={selectedStore}
            dirtyIds={dirtyIds}
            onChangeRow={handleChangeRow}
            onAddRoute={addSingleRoute}
            onBulkAdd={() => setBulkRoutesModal(true)}
            onUploadStopsCsv={handleUploadStopsCsv}
            uploadingStopsCsv={uploadingStopsCsv}
            showTrack={false}
          />
        ) : (
          <div className="ops-panel ops-fade px-8 py-16 text-center">
            <div className="ops-stat__icon mx-auto mb-4 flex h-14 w-14 items-center justify-center">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-base font-bold" style={{ color: "var(--text)" }}>
              Select a store to open the route spreadsheet
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
              Choose a city and store above, then add routes one at a time or in bulk.
            </p>
          </div>
        )}
      </div>

      {allowCreateStore ? (
        <CreateStoreModal
          open={createStoreModal}
          city={city}
          state={state}
          loading={createStore.isPending}
          onClose={() => setCreateStoreModal(false)}
          onCreate={handleCreateStore}
        />
      ) : null}

      <BulkAddRoutesModal
        open={bulkRoutesModal}
        storeName={selectedStore?.storeName}
        onClose={() => setBulkRoutesModal(false)}
        onAdd={addBulkRoutes}
      />
    </DashboardLayout>
  );
}

function Step({ n, label, done, active }) {
  const cls = done ? "ops-step ops-step--done" : active ? "ops-step ops-step--active" : "ops-step";
  return (
    <span className={cls}>
      <span className="ops-step__num">{done ? "✓" : n}</span>
      {label}
    </span>
  );
}

function StepConnector({ done }) {
  return (
    <span
      className="ops-step__line hidden sm:block"
      style={{ background: done ? "var(--accent)" : "var(--border)" }}
    />
  );
}
