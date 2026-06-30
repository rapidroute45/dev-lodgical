import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { todayIsoDate } from "@/shared/utils/time.js";

const STORAGE_KEY = "ops_selected_date";

const OpsDateScopeContext = createContext(null);

function isIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function readStoredDate() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const trimmed = raw.trim();
    return isIsoDate(trimmed) ? trimmed : null;
  } catch {
    return null;
  }
}

function writeStoredDate(date) {
  try {
    sessionStorage.setItem(STORAGE_KEY, date);
  } catch {
    /* ignore */
  }
}

export function OpsDateScopeProvider({ children }) {
  const queryClient = useQueryClient();
  const skipInvalidateRef = useRef(true);
  const [date, setDateRaw] = useState(todayIsoDate);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDateRaw(readStoredDate() ?? todayIsoDate());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || skipInvalidateRef.current) {
      skipInvalidateRef.current = false;
      return;
    }
    queryClient.invalidateQueries();
  }, [date, hydrated, queryClient]);

  const setDate = useCallback((nextOrFn) => {
    setDateRaw((current) => {
      const resolved =
        typeof nextOrFn === "function" ? nextOrFn(current) : nextOrFn;
      const normalized = typeof resolved === "string" ? resolved.trim() : "";
      if (!isIsoDate(normalized) || normalized === current) return current;
      writeStoredDate(normalized);
      return normalized;
    });
  }, []);

  const resetToToday = useCallback(() => {
    setDate(todayIsoDate());
  }, [setDate]);

  const value = useMemo(
    () => ({
      date: hydrated ? date : todayIsoDate(),
      setDate,
      resetToToday,
      hydrated,
    }),
    [date, setDate, resetToToday, hydrated]
  );

  return (
    <OpsDateScopeContext.Provider value={value}>{children}</OpsDateScopeContext.Provider>
  );
}

export function useOpsDateScope() {
  const ctx = useContext(OpsDateScopeContext);
  if (!ctx) {
    throw new Error("useOpsDateScope must be used within OpsDateScopeProvider");
  }
  return ctx;
}

/** For OpsTopBar when provider may be absent (should not happen in ops routes). */
export function useOpsDateScopeOptional() {
  return useContext(OpsDateScopeContext);
}
