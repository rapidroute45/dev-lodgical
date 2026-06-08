import { useCallback, useEffect, useState } from "react";
import { useAssignedCityScope } from "@/modules/scheduling/presentation/hooks/useAssignedCityScope.js";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { todayIsoDate, defaultDepartureFromArrival } from "@/shared/utils/time.js";
import {
  useCreateRouteMutation,
  useCreateScheduleMutation,
  useCreateStoreMutation,
  useStoresQuery,
  useTeamsQuery,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import {
  applyStoreDefaultsToRoute,
  draftRoutePayload,
  newDraftRoute,
} from "@/modules/scheduling/utils/routeDraft.js";
import { SchedulePageHeader } from "../components/SchedulePageHeader.jsx";
import { LocationStoreSection } from "../components/LocationStoreSection.jsx";
import { RouteDraftCard } from "../components/RouteDraftCard.jsx";
import { CreateStoreModal } from "../components/CreateStoreModal.jsx";
import { SectionCard } from "../components/SectionCard.jsx";
import { DateNavigator } from "../components/DateNavigator.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";

function Banner({ type, children }) {
  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-dispatch-red"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles}`}>
      {children}
    </div>
  );
}

export function CreateScheduleScreen() {
  const navigate = useNavigate();
  const { assignedCity, isCityLocked } = useAssignedCityScope();
  const [date, setDate] = useState(todayIsoDate());
  const [city, setCity] = useState(assignedCity ?? "");
  const [state, setState] = useState("");
  const [selectedStore, setSelectedStore] = useState(null);
  const [scheduleId, setScheduleId] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [createStoreModal, setCreateStoreModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const { data: teams = [] } = useTeamsQuery();
  const { data: allStores = [], isLoading: storesLoading } = useStoresQuery(true);
  const createSchedule = useCreateScheduleMutation();
  const createRoute = useCreateRouteMutation();
  const createStore = useCreateStoreMutation();

  useEffect(() => {
    if (assignedCity) setCity(assignedCity);
  }, [assignedCity]);

  const updateRoute = useCallback((localId, patch) => {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.localId !== localId) return r;
        const next = { ...r, ...patch };
        if (patch.arrivalTime) {
          next.departureTime = defaultDepartureFromArrival(patch.arrivalTime);
        }
        if (patch.teamId && patch.teamId !== r.teamId) {
          next.driverId = null;
          next.driverName = "";
        }
        return next;
      })
    );
  }, []);

  async function ensureSchedule(status) {
    if (scheduleId) return scheduleId;
    const scheduleCity = (isCityLocked ? assignedCity : city.trim()) || "";
    if (!scheduleCity || !state.trim()) throw new Error("Enter city and state first.");
    if (!selectedStore) throw new Error("Select or create a store.");
    const schedule = await createSchedule.mutateAsync({
      date,
      city: scheduleCity,
      state: state.trim().toUpperCase(),
      storeId: selectedStore.id,
      status,
    });
    setScheduleId(schedule.id);
    return schedule.id;
  }

  async function publishRoutes(status) {
    setMessage(null);
    setError(null);
    if (routes.length === 0) {
      setError("Add at least one route.");
      return;
    }

    setSaving(true);
    try {
      const sid = await ensureSchedule(status);
      for (const r of routes) {
        if (!r.teamId) throw new Error("Each route needs a team.");
        if (!r.routeName.trim()) throw new Error("Each route needs a name.");
        await createRoute.mutateAsync({
          scheduleId: sid,
          ...draftRoutePayload(r),
        });
      }
      setMessage(
        status === "draft" ? "Draft saved successfully." : "Schedule published successfully."
      );
      navigate("/schedules", { replace: status === "pending" });
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function selectStore(store) {
    if (!store) return;
    setSelectedStore(store);
    setCity(store.city);
    setState(store.state);
    setRoutes((prev) => prev.map((r) => applyStoreDefaultsToRoute(r, store)));
  }

  async function handleCreateStore(payload) {
    try {
      const store = await createStore.mutateAsync(payload);
      selectStore(store);
      setCreateStoreModal(false);
      setMessage("Store created and selected.");
    } catch (err) {
      setError(err.message || "Could not create store");
    }
  }

  const header = (
    <SchedulePageHeader
      title="Create Schedule"
      backTo="/schedules"
      secondaryAction={{
        label: saving ? "Saving…" : "Save Draft",
        onPress: () => publishRoutes("draft"),
        disabled: saving,
      }}
      rightAction={{
        label: saving ? "Publishing…" : "Publish",
        onPress: () => publishRoutes("pending"),
        primary: true,
        disabled: saving,
      }}
    />
  );

  return (
    <DashboardLayout topBar={header}>
      <div className={PAGE_CONTENT}>
        {error ? <Banner type="error">{error}</Banner> : null}
        {message ? <Banner type="success">{message}</Banner> : null}

        <DateNavigator date={date} onDateChange={setDate} />

        <div className="flex gap-2 text-xs font-semibold text-dispatch-muted">
          <Step n={1} label="Location" done={Boolean(selectedStore)} active />
          <Step n={2} label="Routes" done={routes.length > 0} active={Boolean(selectedStore)} />
          <Step n={3} label="Publish" active={routes.length > 0} />
        </div>

        <LocationStoreSection
          stores={allStores}
          isLoadingStores={storesLoading}
          city={city}
          state={state}
          selectedStore={selectedStore}
          onSelectLocation={(c, s) => {
            setCity(c);
            setState(s);
            setSelectedStore(null);
          }}
          onSelectStore={selectStore}
          onCreateStore={() => setCreateStoreModal(true)}
        />

        <SectionCard
          title="Route schedule"
          subtitle={
            routes.length === 0
              ? "Add at least one route before saving"
              : `${routes.length} route${routes.length === 1 ? "" : "s"} ready`
          }
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          }
        >
          {routes.map((route, index) => (
            <RouteDraftCard
              key={route.localId}
              index={index + 1}
              route={route}
              teams={teams}
              store={selectedStore}
              scheduleDate={date}
              onChange={(patch) => updateRoute(route.localId, patch)}
              onRemove={() =>
                setRoutes((prev) => prev.filter((r) => r.localId !== route.localId))
              }
            />
          ))}

          <button
            type="button"
            onClick={() =>
              setRoutes((prev) => [...prev, newDraftRoute(null, selectedStore)])
            }
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dispatch-primary/40 bg-dispatch-primary-soft/20 py-4 text-sm font-bold text-dispatch-primary transition hover:border-dispatch-primary hover:bg-dispatch-primary-soft"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-dispatch-primary text-lg text-white">
              +
            </span>
            Add new route
          </button>
        </SectionCard>
      </div>

      <CreateStoreModal
        open={createStoreModal}
        city={city}
        state={state}
        loading={createStore.isPending}
        onClose={() => setCreateStoreModal(false)}
        onCreate={handleCreateStore}
      />
    </DashboardLayout>
  );
}

function Step({ n, label, done, active }) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
        done
          ? "bg-emerald-50 text-emerald-700"
          : active
            ? "bg-dispatch-primary-soft text-dispatch-primary"
            : "bg-dispatch-bg text-dispatch-light"
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-[10px] font-extrabold">
        {done ? "✓" : n}
      </span>
      {label}
    </span>
  );
}
