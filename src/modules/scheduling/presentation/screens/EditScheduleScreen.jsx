import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { useAssignedCityScope } from "@/modules/scheduling/presentation/hooks/useAssignedCityScope.js";
import { defaultDepartureFromArrival } from "@/shared/utils/time.js";
import {
  useCreateRouteMutation,
  useDeleteRouteMutation,
  useScheduleQuery,
  useStoresQuery,
  useTeamsQuery,
  useUpdateRouteMutation,
  useUpdateScheduleMutation,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import {
  applyStoreDefaultsToRoute,
  draftRoutePayload,
  newDraftRoute,
  routeSummaryToDraft,
  validateDraftRouteStops,
} from "@/modules/scheduling/utils/routeDraft.js";
import { SCHEDULE_STATUSES } from "@/modules/scheduling/constants.js";
import { formatScheduleStatus } from "@/modules/scheduling/utils/scheduleStatus.js";
import { SchedulePageHeader } from "../components/SchedulePageHeader.jsx";
import { LocationStoreSection } from "../components/LocationStoreSection.jsx";
import { RouteDraftCard } from "../components/RouteDraftCard.jsx";
import { SectionCard } from "../components/SectionCard.jsx";
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

export function EditScheduleScreen() {
  const { id: scheduleId } = useParams();
  const navigate = useNavigate();
  const { assignedCity, isCityLocked } = useAssignedCityScope();

  const { data: schedule, isLoading, isError, refetch } = useScheduleQuery(
    scheduleId,
    Boolean(scheduleId)
  );

  const [date, setDate] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [scheduleStatus, setScheduleStatus] = useState("draft");
  const [selectedStore, setSelectedStore] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [removedRouteIds, setRemovedRouteIds] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const { data: teams = [] } = useTeamsQuery();
  const { data: allStores = [], isLoading: storesLoading } = useStoresQuery(true);

  const updateSchedule = useUpdateScheduleMutation();
  const createRoute = useCreateRouteMutation();
  const updateRoute = useUpdateRouteMutation();
  const deleteRoute = useDeleteRouteMutation();

  useEffect(() => {
    if (!schedule || hydrated) return;
    setDate(schedule.date);
    setCity(isCityLocked && assignedCity ? assignedCity : schedule.city);
    setState(schedule.state);
    setScheduleStatus(schedule.status);
    setSelectedStore(schedule.store ?? null);
    setRoutes((schedule.routes ?? []).map(routeSummaryToDraft));
    setHydrated(true);
  }, [schedule, hydrated, isCityLocked, assignedCity]);

  useEffect(() => {
    if (assignedCity && isCityLocked) setCity(assignedCity);
  }, [assignedCity, isCityLocked]);

  const updateRouteLocal = useCallback((localId, patch) => {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.localId !== localId) return r;
        const next = { ...r, ...patch };
        if (patch.arrivalTime && !patch.departureTime) {
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

  function removeRoute(route) {
    if (route.serverId) {
      setRemovedRouteIds((prev) =>
        prev.includes(route.serverId) ? prev : [...prev, route.serverId]
      );
    }
    setRoutes((prev) => prev.filter((r) => r.localId !== route.localId));
  }

  async function save() {
    setMessage(null);
    setError(null);

    const scheduleCity = (isCityLocked ? assignedCity : city.trim()) || "";
    if (!scheduleCity || !state.trim()) {
      setError("Enter city and state.");
      return;
    }
    if (!selectedStore) {
      setError("Select a store.");
      return;
    }
    if (routes.length === 0) {
      setError("Add at least one route.");
      return;
    }

    for (const route of routes) {
      const stopError = validateDraftRouteStops(route);
      if (stopError) {
        setError(stopError);
        return;
      }
    }

    setSaving(true);
    try {
      await updateSchedule.mutateAsync({
        id: scheduleId,
        body: {
          date,
          city: scheduleCity,
          state: state.trim().toUpperCase(),
          storeId: selectedStore.id,
          status: scheduleStatus,
        },
      });

      for (const routeId of removedRouteIds) {
        await deleteRoute.mutateAsync({ routeId, scheduleId });
      }

      for (const route of routes) {
        if (!route.teamId) throw new Error("Each route needs a team.");
        if (!route.routeName.trim()) throw new Error("Each route needs a name.");

        const body = draftRoutePayload(route);

        if (route.serverId) {
          await updateRoute.mutateAsync({
            routeId: route.serverId,
            body,
            scheduleId,
          });
        } else {
          await createRoute.mutateAsync({
            scheduleId,
            ...body,
          });
        }
      }

      await refetch();
      const offered = routes.filter((r) => r.driverId).length;
      setMessage(
        offered > 0
          ? `Schedule saved. ${offered} route offer(s) pending driver acceptance.`
          : "Schedule saved successfully."
      );
      navigate(`/schedules/${scheduleId}`, { replace: true });
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const header = (
    <SchedulePageHeader
      title="Edit Schedule"
      backTo={`/schedules/${scheduleId}`}
      date={date || undefined}
      onDateChange={date ? setDate : undefined}
      rightAction={{
        label: saving ? "Saving…" : "Save",
        onPress: save,
        primary: true,
        disabled: saving || !hydrated,
      }}
    />
  );

  if (isLoading || !hydrated) {
    return (
      <DashboardLayout topBar={header}>
        <div className={PAGE_CONTENT}>
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-2xl bg-dispatch-border/30" />
            <div className="h-48 animate-pulse rounded-2xl bg-dispatch-border/30" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !schedule) {
    return (
      <DashboardLayout topBar={header}>
        <div className={PAGE_CONTENT}>
          <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-12 text-center">
            <p className="text-lg font-bold text-dispatch-text">Schedule not found</p>
            <Link to="/schedules" className="mt-4 inline-block text-sm font-bold text-dispatch-primary">
              Back to schedules
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout topBar={header}>
      <div className={PAGE_CONTENT}>
        {error ? <Banner type="error">{error}</Banner> : null}
        {message ? <Banner type="success">{message}</Banner> : null}

        <LocationStoreSection
          stores={allStores}
          isLoadingStores={storesLoading}
          city={city}
          state={state}
          selectedStore={selectedStore}
          cityLocked={isCityLocked}
          onSelectLocation={(c, s) => {
            if (isCityLocked) return;
            setCity(c);
            setState(s);
            setSelectedStore(null);
          }}
          onSelectStore={(store) => {
            if (!store) return;
            setSelectedStore(store);
            setCity(store.city);
            setState(store.state);
            setRoutes((prev) => prev.map((r) => applyStoreDefaultsToRoute(r, store)));
          }}
        />

        <SectionCard title="Schedule status" subtitle="Current lifecycle state">
          <div className="flex flex-wrap gap-2">
            {SCHEDULE_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setScheduleStatus(status)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  scheduleStatus === status
                    ? "bg-dispatch-indigo text-white shadow-md shadow-dispatch-primary/20"
                    : "bg-dispatch-surface text-dispatch-muted ring-1 ring-dispatch-border hover:bg-dispatch-bg"
                }`}
              >
                {formatScheduleStatus(status)}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={`Routes (${routes.length})`}
          subtitle="Edit teams, drivers, times, and stops"
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
              onChange={(patch) => updateRouteLocal(route.localId, patch)}
              onRemove={() => removeRoute(route)}
            />
          ))}

          <button
            type="button"
            onClick={() => setRoutes((prev) => [...prev, newDraftRoute(null, selectedStore)])}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dispatch-primary/40 bg-dispatch-primary-soft/20 py-4 text-sm font-bold text-dispatch-primary transition hover:border-dispatch-primary hover:bg-dispatch-primary-soft"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-dispatch-primary text-lg text-white">
              +
            </span>
            Add route
          </button>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
