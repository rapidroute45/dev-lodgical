import { Link } from "react-router-dom";
import { addDaysToIsoDate, formatDisplayDate, todayIsoDate } from "@/shared/utils/time.js";
import { DatePickerPopover } from "./DatePickerPopover.jsx";

export function SchedulePageHeader({
  title,
  backTo = "/schedules",
  date,
  onDateChange,
  secondaryAction,
  rightAction,
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 px-4 py-4 backdrop-blur-md sm:px-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to={backTo}
            className="rounded-lg border border-dispatch-border p-2 text-dispatch-muted hover:bg-dispatch-bg"
            aria-label="Back"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="truncate text-lg font-bold text-dispatch-text">{title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {date && onDateChange ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onDateChange(addDaysToIsoDate(date, -1))}
                className="rounded-lg border border-dispatch-border p-2 hover:bg-dispatch-bg"
                aria-label="Previous day"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-[120px] rounded-lg border border-dispatch-border px-3 py-1.5 text-center">
                <p className="text-[10px] text-dispatch-muted">Date</p>
                <p className="text-xs font-semibold text-dispatch-text">
                  {formatDisplayDate(date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDateChange(addDaysToIsoDate(date, 1))}
                disabled={date >= todayIsoDate()}
                className="rounded-lg border border-dispatch-border p-2 hover:bg-dispatch-bg disabled:opacity-40"
                aria-label="Next day"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <DatePickerPopover
                value={date}
                onChange={onDateChange}
                maxDate={todayIsoDate()}
                buttonLabel="Pick date"
                buttonClassName="rounded-lg border border-dispatch-primary/30 bg-dispatch-primary-soft px-2.5 py-1.5 text-[10px] font-bold text-dispatch-primary hover:bg-dispatch-primary/10"
              />
            </div>
          ) : null}

          {secondaryAction ? (
            <button
              type="button"
              onClick={secondaryAction.onPress}
              disabled={secondaryAction.disabled}
              className="rounded-xl border border-dispatch-border px-3 py-2 text-sm font-semibold text-dispatch-muted hover:bg-dispatch-bg disabled:opacity-50"
            >
              {secondaryAction.label}
            </button>
          ) : null}

          {rightAction ? (
            <button
              type="button"
              onClick={rightAction.onPress}
              disabled={rightAction.disabled}
              className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                rightAction.primary
                  ? "bg-dispatch-indigo hover:bg-dispatch-indigo-pressed"
                  : "border border-dispatch-border bg-dispatch-surface text-dispatch-text"
              }`}
            >
              {rightAction.label}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
