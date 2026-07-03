import { useMemo, useState } from "react";
import { useScheduleDateNavigation } from "@/modules/manager-home/presentation/hooks/useScheduleDateNavigation.js";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { RouteStopsEditor } from "../components/RouteStopsEditor.jsx";
import { routesToSpreadsheetRows } from "../components/RoutesSpreadsheetTable.jsx";
import {
  useRouteQuery,
  useScheduleQuery,
  useUpdateRouteMutation,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import {
  draftRoutePayload,
  spreadsheetRowToDraft,
} from "@/modules/scheduling/utils/routeDraft.js";
import { formatDisplayDate, todayIsoDate } from "@/shared/utils/time.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";

function isDraftRouteId(routeId) {
  return String(routeId ?? "").startsWith("new-");
}

export function RouteStopsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: scheduleId, routeId } = useParams();
  const isDraft = isDraftRouteId(routeId);
  const draftRow = location.state?.draftRow ?? null;
  const returnTo = location.state?.returnTo ?? null;
  const stateScheduleStore = location.state?.scheduleStore ?? null;

  const { data: schedule, isLoading: scheduleLoading } = useScheduleQuery(
    scheduleId,
    Boolean(scheduleId) && scheduleId !== "draft"
  );
  const {
    data: routeFromApi,
    isLoading: routeLoading,
    isError: routeError,
    refetch,
    isFetching,
  } = useRouteQuery(routeId, Boolean(routeId) && !isDraft);

  const updateRoute = useUpdateRouteMutation();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const routeRow = useMemo(() => {
    if (isDraft) return draftRow;
    if (!routeFromApi) return null;
    return routesToSpreadsheetRows([routeFromApi])[0];
  }, [draftRow, isDraft, routeFromApi]);

  const backUrl = returnTo ?? `/schedules/${scheduleId}/routes`;
  const displayDate =
    schedule?.date ?? routeFromApi?.scheduleDate ?? routeFromApi?.schedule?.date ?? todayIsoDate();
  const scheduleStore = schedule?.store ?? stateScheduleStore;
  const storeId = schedule?.storeId ?? scheduleStore?.id ?? routeFromApi?.storeId;
  const handleTopBarDateChange = useScheduleDateNavigation({
    storeId,
    currentDate: displayDate,
    target: "routes",
    city: schedule?.city ?? scheduleStore?.city,
    state: schedule?.state ?? scheduleStore?.state,
  });

  const topBar = (
    <OpsTopBar
      date={displayDate}
      setDate={handleTopBarDateChange}
      onRefresh={refetch}
      refreshing={isFetching}
    />
  );

  async function handleSave(dropoffs) {
    if (!routeRow) return;

    const stopCount = dropoffs.length;

    if (isDraft) {
      navigate(backUrl, {
        state: {
          updatedStopsRow: {
            id: routeRow.id,
            dropoffs,
            stopCount,
          },
        },
      });
      return;
    }

    const draft = spreadsheetRowToDraft({ ...routeRow, dropoffs, stopCount }, scheduleStore);
    const payload = draftRoutePayload(draft);
    const targetScheduleId = routeRow.scheduleId ?? scheduleId;

    setSaving(true);
    setMessage("");
    try {
      await updateRoute.mutateAsync({
        routeId: routeRow.id,
        scheduleId: targetScheduleId,
        body: {
          stopDetails: payload.stopDetails,
          stops: payload.stops,
        },
      });
      setMessage(`Saved ${stopCount} stop${stopCount === 1 ? "" : "s"}.`);
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    navigate(backUrl);
  }

  const isLoading = scheduleLoading || (!isDraft && routeLoading);
  const notFound = isDraft ? !draftRow : routeError || (!routeLoading && !routeFromApi);

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {isLoading ? (
          <div className="space-y-4">
            <div className="ops-skel h-16 rounded-2xl" />
            <div className="ops-skel h-72 rounded-2xl" />
          </div>
        ) : notFound ? (
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
              Route not found
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Open stops from the schedule spreadsheet, or the route may have been removed.
            </p>
            <Link to={backUrl} className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold">
              Back to spreadsheet
            </Link>
          </div>
        ) : (
          <>
            {displayDate ? (
              <p className="ops-fade mb-1 text-sm" style={{ color: "var(--text-muted)" }}>
                {formatDisplayDate(displayDate)}
              </p>
            ) : null}
            {message ? (
              <div className="ops-banner ops-banner--success ops-fade mb-4">{message}</div>
            ) : null}
            <RouteStopsEditor
              route={routeRow}
              scheduleStore={scheduleStore}
              stops={routeRow.dropoffs ?? []}
              pickup={routeRow.pickup}
              saving={saving}
              onSave={handleSave}
              onBack={handleBack}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
