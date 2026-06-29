import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  compareIsoDates,
  formatDisplayDate,
  isoDateFromParts,
  parseIsoDate,
  todayIsoDate,
} from "@/shared/utils/time.js";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const POPOVER_GAP = 8;
const POPOVER_MAX_WIDTH = 320;
const VIEWPORT_PAD = 16;

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function isDisabled(iso, minIso, maxIso) {
  if (minIso && compareIsoDates(iso, minIso) < 0) return true;
  if (maxIso && compareIsoDates(iso, maxIso) > 0) return true;
  return false;
}

function popoverWidth() {
  return Math.min(window.innerWidth - VIEWPORT_PAD * 2, POPOVER_MAX_WIDTH);
}

function computeFixedPosition(anchorEl, align, panelHeight) {
  const rect = anchorEl.getBoundingClientRect();
  const width = popoverWidth();
  let left =
    align === "end"
      ? rect.right - width
      : align === "center"
        ? rect.left + rect.width / 2 - width / 2
        : rect.left;
  left = Math.max(
    VIEWPORT_PAD,
    Math.min(left, window.innerWidth - width - VIEWPORT_PAD)
  );

  let top = rect.bottom + POPOVER_GAP;
  const fitsBelow = top + panelHeight <= window.innerHeight - VIEWPORT_PAD;
  if (!fitsBelow && rect.top - POPOVER_GAP - panelHeight >= VIEWPORT_PAD) {
    top = rect.top - panelHeight - POPOVER_GAP;
  }

  return { top, left, width };
}

export function DatePickerPopover({
  value,
  onChange,
  minDate,
  maxDate,
  buttonLabel = "Pick date",
  buttonClassName = "",
  open: openProp,
  onOpenChange,
  hideTrigger = false,
  align = "end",
  boundaryRef,
}) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const anchorRef = boundaryRef ?? rootRef;
  const boundary = boundaryRef ?? rootRef;
  const [fixedStyle, setFixedStyle] = useState(null);
  const parsed = parseIsoDate(value);
  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);

  const minIso = minDate ?? null;
  const maxIso = maxDate ?? null;

  useEffect(() => {
    if (!open) return;
    const p = parseIsoDate(value);
    setViewYear(p.year);
    setViewMonth(p.month);
  }, [open, value]);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setFixedStyle(null);
      return;
    }

    function updatePosition() {
      if (!anchorRef.current) return;
      const panelHeight = panelRef.current?.offsetHeight ?? 380;
      setFixedStyle(computeFixedPosition(anchorRef.current, align, panelHeight));
    }

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, align, viewYear, viewMonth, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      const target = e.target;
      if (boundary.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, boundary, setOpen]);

  const cells = useMemo(() => {
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const total = daysInMonth(viewYear, viewMonth);
    const rows = [];
    let day = 1;
    for (let week = 0; week < 6; week++) {
      const row = [];
      for (let dow = 0; dow < 7; dow++) {
        if (week === 0 && dow < firstDow) {
          row.push(null);
        } else if (day > total) {
          row.push(null);
        } else {
          row.push(day);
          day += 1;
        }
      }
      rows.push(row);
      if (day > total) break;
    }
    return rows;
  }, [viewYear, viewMonth]);

  function selectDay(d) {
    const iso = isoDateFromParts(viewYear, viewMonth, d);
    if (isDisabled(iso, minIso, maxIso)) return;
    onChange(iso);
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const today = todayIsoDate();

  const position =
    fixedStyle ??
    (open && anchorRef.current
      ? computeFixedPosition(anchorRef.current, align, 380)
      : null);

  const panel =
    open && position ? (
      <div className="ops-shell" style={{ position: "static", minHeight: 0, background: "transparent" }}>
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Choose date"
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            width: position.width,
            zIndex: 100,
            background: "var(--bg-card-solid)",
            border: "1px solid var(--border-strong)",
          }}
          className="ops-popover rounded-2xl p-4 shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className="ops-btn flex h-8 w-8 items-center justify-center"
              aria-label="Previous month"
            >
              ‹
            </button>
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
              {MONTHS[viewMonth]} {viewYear}
            </p>
            <button
              type="button"
              onClick={nextMonth}
              className="ops-btn flex h-8 w-8 items-center justify-center"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((d) => (
              <span
                key={d}
                className="py-1 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: "var(--text-dim)" }}
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.flat().map((d, i) => {
              if (d == null) {
                return <span key={`empty-${i}`} className="h-9" />;
              }
              const iso = isoDateFromParts(viewYear, viewMonth, d);
              const disabled = isDisabled(iso, minIso, maxIso);
              const selected = iso === value;
              const isToday = iso === today;

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(d)}
                  className="flex h-9 w-full items-center justify-center rounded-lg text-sm font-semibold transition"
                  style={
                    disabled
                      ? { color: "var(--text-dim)", opacity: 0.5, cursor: "not-allowed" }
                      : selected
                        ? { background: "var(--accent)", color: "#041018", boxShadow: "var(--glow)" }
                        : isToday
                          ? { background: "rgba(34, 211, 238, 0.12)", color: "var(--accent)" }
                          : { color: "var(--text)" }
                  }
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div
            className="mt-3 flex items-center justify-between gap-2 pt-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDisplayDate(value)}</p>
            <button
              type="button"
              onClick={() => {
                onChange(today);
                setOpen(false);
              }}
              disabled={isDisabled(today, minIso, maxIso)}
              className="ops-btn ops-btn--accent px-2.5 py-1 text-xs font-bold disabled:opacity-40"
            >
              Today
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <div ref={rootRef} className={hideTrigger ? "contents" : "relative"}>
        {!hideTrigger ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={
              buttonClassName ||
              "ops-btn inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
            }
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {buttonLabel}
          </button>
        ) : null}
      </div>
      {typeof document !== "undefined" && panel
        ? createPortal(panel, document.body)
        : null}
    </>
  );
}
