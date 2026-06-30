import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSchedules } from "@/modules/scheduling/infrastructure/api/scheduling.api.js";
import { useOpsDateScope } from "@/modules/manager-home/application/OpsDateScopeProvider.jsx";

/**
 * Navigate to the same store's schedule (or routes spreadsheet) when the top-bar date changes.
 */
export function useScheduleDateNavigation({
  storeId,
  currentDate,
  target = "schedule",
  city,
  state,
  beforeNavigate,
  onMissingSchedule,
}) {
  const navigate = useNavigate();
  const { setDate: setGlobalDate } = useOpsDateScope();

  return useCallback(
    async (newDateOrFn) => {
      const newDate =
        typeof newDateOrFn === "function"
          ? newDateOrFn(currentDate ?? "")
          : newDateOrFn;

      if (!newDate || newDate === currentDate) return;

      setGlobalDate(newDate);

      if (beforeNavigate) {
        const proceed = await beforeNavigate(newDate);
        if (!proceed) return;
      }

      if (onMissingSchedule) {
        await onMissingSchedule(newDate);
        return;
      }

      if (!storeId) {
        navigate(`/schedules?date=${encodeURIComponent(newDate)}`);
        return;
      }

      try {
        const data = await fetchSchedules({
          date: newDate,
          storeId,
          city,
          state,
          limit: 10,
        });
        const next = data?.items?.[0];
        if (next?.id) {
          const path =
            target === "routes"
              ? `/schedules/${next.id}/routes`
              : `/schedules/${next.id}`;
          navigate(path, { replace: true });
          return;
        }
        navigate(`/schedules?date=${encodeURIComponent(newDate)}`);
      } catch {
        navigate(`/schedules?date=${encodeURIComponent(newDate)}`);
      }
    },
    [
      storeId,
      currentDate,
      target,
      city,
      state,
      beforeNavigate,
      onMissingSchedule,
      navigate,
      setGlobalDate,
    ]
  );
}
