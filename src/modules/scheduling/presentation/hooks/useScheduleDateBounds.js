import { useMemo } from "react";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { useOpsElevation } from "@/modules/auth/presentation/context/OpsElevationContext.jsx";
import {
  canPickFutureScheduleDates,
  maxScheduleBrowseDate,
  minScheduleCreateDate,
  resolveScheduleMaxBrowseDate,
} from "@/modules/scheduling/utils/scheduleDateBounds.js";
import { todayIsoDate } from "@/shared/utils/time.js";

export function useScheduleDateBounds() {
  const { user } = useAuth();
  const { dispatchUnlocked } = useOpsElevation();
  const role = user?.role;

  return useMemo(() => {
    const allowFuture = canPickFutureScheduleDates(role, dispatchUnlocked);
    return {
      allowFuture,
      minDate: minScheduleCreateDate(),
      maxDate: resolveScheduleMaxBrowseDate(role, dispatchUnlocked),
      createMaxDate: maxScheduleBrowseDate(),
      todayMaxDate: todayIsoDate(),
    };
  }, [role, dispatchUnlocked]);
}
