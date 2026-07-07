import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOpsLocationScope } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";
import {
  citiesMatch,
  findLocationOption,
} from "@/modules/scheduling/utils/storeLocations.js";
import {
  formatCityClockParts,
  resolveCityTimeZone,
} from "@/modules/manager-home/utils/cityTimezones.js";
import { AppStorage } from "@/shared/utils/storage.js";

const POS_STORAGE_KEY = "ops_city_clock_pos";
const THEME_STORAGE_KEY = "dispatch.opsTheme";
const DEFAULT_POS = { x: 24, y: 96 };

function readStoredPosition() {
  try {
    const raw = localStorage.getItem(POS_STORAGE_KEY);
    if (!raw) return DEFAULT_POS;
    const parsed = JSON.parse(raw);
    if (typeof parsed.x === "number" && typeof parsed.y === "number") {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_POS;
}

function writeStoredPosition(pos) {
  try {
    localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

function readOpsTheme() {
  return AppStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
}

function clampPosition(x, y, width, height) {
  const maxX = Math.max(8, window.innerWidth - width - 8);
  const maxY = Math.max(8, window.innerHeight - height - 8);
  return {
    x: Math.min(Math.max(8, x), maxX),
    y: Math.min(Math.max(8, y), maxY),
  };
}

export function OpsCityClockWidget() {
  const {
    canPickScope,
    effectiveCity,
    effectiveState,
    scopeLabel,
    allowedLocations,
  } = useOpsLocationScope();

  const [now, setNow] = useState(() => new Date());
  const [theme, setTheme] = useState(readOpsTheme);
  const [pos, setPos] = useState(readStoredPosition);
  const [dismissedCity, setDismissedCity] = useState(null);
  const dragRef = useRef(null);
  const widgetRef = useRef(null);

  const resolvedLocation = useMemo(() => {
    if (!effectiveCity) return null;
    if (effectiveState) {
      return findLocationOption(allowedLocations, effectiveCity, effectiveState);
    }
    const matches = allowedLocations.filter((loc) =>
      citiesMatch(loc.city, effectiveCity)
    );
    return matches.length === 1 ? matches[0] : null;
  }, [allowedLocations, effectiveCity, effectiveState]);

  const timeZone = useMemo(() => {
    if (resolvedLocation) {
      return resolveCityTimeZone(resolvedLocation.city, resolvedLocation.state);
    }
    if (effectiveCity && effectiveState) {
      return resolveCityTimeZone(effectiveCity, effectiveState);
    }
    return null;
  }, [resolvedLocation, effectiveCity, effectiveState]);

  const visible =
    canPickScope &&
    Boolean(effectiveCity) &&
    dismissedCity !== effectiveCity;

  useEffect(() => {
    if (!visible) return undefined;
    const id = window.setInterval(() => {
      setNow(new Date());
      setTheme(readOpsTheme());
    }, 1000);
    return () => window.clearInterval(id);
  }, [visible]);

  useEffect(() => {
    if (!effectiveCity) {
      setDismissedCity(null);
    }
  }, [effectiveCity]);

  const onPointerDown = useCallback((event) => {
    if (event.button !== 0) return;
    event.preventDefault();

    const widget = widgetRef.current;
    if (!widget) return;

    const rect = widget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    dragRef.current = { offsetX, offsetY, width: rect.width, height: rect.height };

    const onMove = (moveEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const next = clampPosition(
        moveEvent.clientX - drag.offsetX,
        moveEvent.clientY - drag.offsetY,
        drag.width,
        drag.height
      );
      setPos(next);
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setPos((current) => {
        writeStoredPosition(current);
        return current;
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  if (!visible) return null;

  const label = resolvedLocation?.label ?? scopeLabel;
  const clockParts = timeZone ? formatCityClockParts(now, timeZone) : null;

  return (
    <div
      ref={widgetRef}
      className={`ops-city-clock ops-city-clock--${theme}`}
      style={{ left: pos.x, top: pos.y }}
      role="status"
      aria-live="polite"
      aria-label={`City clock for ${label}`}
    >
      <div className="ops-city-clock__shine" aria-hidden="true" />
      <div className="ops-city-clock__header" onPointerDown={onPointerDown}>
        <span className="ops-city-clock__live" aria-hidden="true" />
        <span className="ops-city-clock__grip" aria-hidden="true">
          ⋮⋮
        </span>
        <span className="ops-city-clock__title">{label}</span>
        <button
          type="button"
          className="ops-city-clock__close"
          aria-label="Hide city clock"
          onClick={() => setDismissedCity(effectiveCity)}
        >
          ×
        </button>
      </div>
      <div className="ops-city-clock__body">
        {clockParts ? (
          <>
            <div className="ops-city-clock__time-row">
              <span className="ops-city-clock__time">{clockParts.time}</span>
              {clockParts.tz ? (
                <span className="ops-city-clock__tz">{clockParts.tz}</span>
              ) : null}
            </div>
            <div className="ops-city-clock__date">{clockParts.date}</div>
          </>
        ) : (
          <div className="ops-city-clock__fallback">Timezone unavailable</div>
        )}
      </div>
    </div>
  );
}
