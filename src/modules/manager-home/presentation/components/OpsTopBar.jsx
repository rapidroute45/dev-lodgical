import { useTranslation } from "react-i18next";
import { formatDisplayDate, todayIsoDate, addDaysToIsoDate } from "@/shared/utils/time.js";
import { OpsHeaderNav } from "@/modules/manager-home/presentation/components/OpsHeaderNav.jsx";
import { LocationScopeControls } from "@/modules/manager-home/presentation/components/LocationScopeControls.jsx";
import { useOpsTheme } from "@/modules/manager-home/presentation/context/OpsThemeContext.jsx";
import { useFullscreen } from "@/shared/hooks/useFullscreen.js";
import { DatePickerPopover } from "@/modules/scheduling/presentation/components/DatePickerPopover.jsx";
import { NotificationBellDropdown } from "@/modules/notifications/presentation/components/NotificationBellDropdown.jsx";

function ThemeToggle() {
  const { theme, setTheme } = useOpsTheme();

  return (
    <div className="ops-themeseg flex items-center" role="group" aria-label="Theme">
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`ops-themeseg__btn ${theme === "dark" ? "ops-themeseg__btn--active" : ""}`}
        aria-pressed={theme === "dark"}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        Dark
      </button>
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`ops-themeseg__btn ${theme === "light" ? "ops-themeseg__btn--active" : ""}`}
        aria-pressed={theme === "light"}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        Light
      </button>
    </div>
  );
}

function FullscreenToggle() {
  const { t } = useTranslation();
  const { isFullscreen, toggle } = useFullscreen();

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      className="ops-btn p-2"
      aria-label={isFullscreen ? t("common.exitFullscreen") : t("common.enterFullscreen")}
      title={
        isFullscreen
          ? `${t("common.exitFullscreen")} (F)`
          : `${t("common.enterFullscreen")} (F)`
      }
    >
      {isFullscreen ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      )}
    </button>
  );
}

function resolveNextDate(current, nextOrFn) {
  if (typeof nextOrFn === "function") return nextOrFn(current);
  return nextOrFn;
}

export function OpsTopBar({
  date = todayIsoDate(),
  setDate,
  onRefresh,
  refreshing,
  showDate = true,
}) {
  const navDate = date ?? todayIsoDate();
  const isToday = navDate >= todayIsoDate();
  const canChangeDate = showDate && typeof setDate === "function";

  function applyDate(nextOrFn) {
    if (!canChangeDate) return;
    setDate(resolveNextDate(navDate, nextOrFn));
  }

  return (
    <header className="ops-topbar">
      <OpsHeaderNav date={navDate} />

      <div className="ops-topbar__end">
        <LocationScopeControls />

        <div className="ops-topbar__tools">
        {canChangeDate && !isToday ? (
          <button type="button" onClick={() => applyDate(todayIsoDate())} className="ops-btn ops-btn--accent px-3 py-2">
            Today
          </button>
        ) : null}

        {canChangeDate ? (
          <div className="ops-dateseg flex items-center">
            <button
              type="button"
              onClick={() => applyDate((d) => addDaysToIsoDate(d, -1))}
              className="ops-dateseg__nav"
              aria-label="Previous day"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <DatePickerPopover
              value={navDate}
              onChange={applyDate}
              maxDate={todayIsoDate()}
              buttonLabel={formatDisplayDate(navDate)}
              buttonClassName="ops-dateseg__label flex items-center gap-2 px-3 text-sm font-semibold"
            />

            <button
              type="button"
              onClick={() => applyDate((d) => addDaysToIsoDate(d, 1))}
              disabled={isToday}
              className="ops-dateseg__nav"
              aria-label="Next day"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : null}

        <NotificationBellDropdown />

        <ThemeToggle />

        <FullscreenToggle />

        {onRefresh ? (
          <button type="button" onClick={onRefresh} className="ops-btn p-2" aria-label="Refresh">
            <svg
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0A8.003 8.003 0 015.64 15m13.78 0H15" />
            </svg>
          </button>
        ) : null}
        </div>
      </div>
    </header>
  );
}
