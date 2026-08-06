import {
  isAdmin,
  isDispatchManager,
  isDispatchTeam,
  isOnsiteManager,
} from "@/shared/utils/constants.js";
import { addDaysToIsoDate, todayIsoDate } from "@/shared/utils/time.js";

export const SCHEDULE_FUTURE_DAYS = 365;

/** Earliest date allowed when creating a schedule (UTC today − 1 day TZ cushion). */
export function minScheduleCreateDate() {
  return addDaysToIsoDate(todayIsoDate(), -1);
}

/** Latest date for browsing/creating schedules ahead. */
export function maxScheduleBrowseDate() {
  return addDaysToIsoDate(todayIsoDate(), SCHEDULE_FUTURE_DAYS);
}

/** Roles that may pick future dates when creating or browsing schedules. */
export function canPickFutureScheduleDates(role, dispatchUnlocked = false) {
  if (
    isAdmin(role) ||
    isDispatchTeam(role) ||
    isDispatchManager(role) ||
    isOnsiteManager(role)
  ) {
    return true;
  }
  void dispatchUnlocked;
  return false;
}

/** Top-bar / navigator max date: today for viewers, today+365 for schedule creators. */
export function resolveScheduleMaxBrowseDate(role, dispatchUnlocked = false) {
  return canPickFutureScheduleDates(role, dispatchUnlocked)
    ? maxScheduleBrowseDate()
    : todayIsoDate();
}
