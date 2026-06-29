import { useRef, useState } from "react";
import {
  addDaysToIsoDate,
  formatDisplayDate,
  todayIsoDate,
} from "@/shared/utils/time.js";
import { DatePickerPopover } from "./DatePickerPopover.jsx";

export function DateNavigator({
  date,
  onDateChange,
  className = "",
  minDate,
  maxDate,
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const wrapRef = useRef(null);
  const isToday = date === todayIsoDate();
  const maxIso = maxDate ?? todayIsoDate();

  return (
    <div
      ref={wrapRef}
      className={`ops-datepill relative flex flex-wrap items-center gap-2 p-2 ${className}`}
    >
      <button
        type="button"
        onClick={() => onDateChange(addDaysToIsoDate(date, -1))}
        className="ops-btn flex h-10 w-10 items-center justify-center"
        aria-label="Previous day"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => setCalendarOpen(true)}
        className="min-w-[160px] flex-1 rounded-xl px-4 py-2 text-center transition"
        style={{ background: "rgba(34, 211, 238, 0.08)" }}
        title="Open calendar"
      >
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          Operations date
        </p>
        <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{formatDisplayDate(date)}</p>
      </button>

      <button
        type="button"
        onClick={() => onDateChange(addDaysToIsoDate(date, 1))}
        disabled={isToday || (maxIso && date >= maxIso)}
        className="ops-btn flex h-10 w-10 items-center justify-center disabled:opacity-35"
        aria-label="Next day"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => onDateChange(todayIsoDate())}
        disabled={isToday}
        className="ops-btn ops-btn--accent px-3 py-2 text-xs font-bold disabled:opacity-50"
      >
        Today
      </button>

      <button
        type="button"
        onClick={() => setCalendarOpen(true)}
        className="ops-btn inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Pick date
      </button>

      <DatePickerPopover
        value={date}
        onChange={onDateChange}
        minDate={minDate}
        maxDate={maxIso}
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        hideTrigger
        align="center"
        boundaryRef={wrapRef}
      />
    </div>
  );
}
