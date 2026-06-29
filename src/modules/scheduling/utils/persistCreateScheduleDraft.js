import { createRoute, createSchedule } from "@/modules/scheduling/infrastructure/api/scheduling.api.js";
import {
  draftRoutePayload,
  spreadsheetRowToDraft,
} from "@/modules/scheduling/utils/routeDraft.js";
import { defaultDepartureFromArrival } from "@/shared/utils/time.js";

/**
 * Save in-progress create-schedule work as a draft (schedule shell + savable routes).
 * Used when leaving the page accidentally (back, sidebar, browser back).
 */
export async function persistCreateScheduleDraft(snapshot) {
  const {
    selectedStore,
    city,
    state,
    date,
    rows = [],
    scheduleId,
    teams = [],
    isCityLocked,
    assignedCity,
    onlyUnsaved = true,
    allowFallbackTeam = false,
  } = snapshot;

  if (!selectedStore?.id) {
    return { scheduleId: null, savedRoutes: 0, skipped: true };
  }

  const scheduleCity = (isCityLocked ? assignedCity : city?.trim()) || selectedStore.city?.trim() || "";
  const scheduleState = (state?.trim() || selectedStore.state?.trim() || "").toUpperCase();

  if (!scheduleCity || !scheduleState) {
    throw new Error("City and state are required to save a draft.");
  }

  let sid = scheduleId ?? null;
  if (!sid) {
    const schedule = await createSchedule({
      date,
      city: scheduleCity,
      state: scheduleState,
      storeId: selectedStore.id,
      status: "draft",
    });
    sid = schedule.id;
  }

  let savedRoutes = 0;
  const fallbackTeamId = allowFallbackTeam ? teams[0]?.id : null;

  for (const row of rows) {
    if (onlyUnsaved && row.isNew === false) continue;
    if (!row.routeName?.trim()) continue;

    const teamId = row.teamId || fallbackTeamId;
    if (!teamId) continue;

    const arrival = row.arrivalTime?.trim();
    const departure = row.departureTime?.trim() || defaultDepartureFromArrival(arrival);
    if (arrival && departure && departure <= arrival) continue;

    const draft = spreadsheetRowToDraft(row, selectedStore);
    const team = teams.find((item) => item.id === teamId);
    if (team) draft.teamName = team.name;
    draft.teamId = teamId;

    await createRoute({
      scheduleId: sid,
      ...draftRoutePayload(draft),
    });
    savedRoutes += 1;
  }

  return { scheduleId: sid, savedRoutes, skipped: false };
}
