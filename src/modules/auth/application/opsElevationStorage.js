/** Session-scoped ops elevation tokens (dispatch / payroll PIN unlock). */

const STORAGE_KEY = "ops_elevation";

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dispatch: null, payroll: null };
    const parsed = JSON.parse(raw);
    return {
      dispatch: typeof parsed?.dispatch === "string" ? parsed.dispatch : null,
      payroll: typeof parsed?.payroll === "string" ? parsed.payroll : null,
    };
  } catch {
    return { dispatch: null, payroll: null };
  }
}

function writeRaw(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export const opsElevationStorage = {
  get(scope) {
    return readRaw()[scope] ?? null;
  },

  set(scope, token) {
    const current = readRaw();
    current[scope] = token;
    writeRaw(current);
  },

  clear(scope) {
    try {
      if (scope) {
        const current = readRaw();
        current[scope] = null;
        writeRaw(current);
        return;
      }
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },

  snapshot() {
    const raw = readRaw();
    return {
      dispatchUnlocked: !!raw.dispatch,
      payrollUnlocked: !!raw.payroll,
    };
  },
};

const MUTATION_METHODS = new Set(["post", "put", "patch", "delete"]);

export function pickElevationTokenForRequest(method, url) {
  if (!method || !url) return null;
  const m = method.toLowerCase();
  if (!MUTATION_METHODS.has(m)) return null;

  const path = url.split("?")[0] ?? url;
  if (path.includes("/payroll")) {
    return opsElevationStorage.get("payroll");
  }
  if (
    path.includes("/stores") ||
    path.includes("/teams") ||
    path.includes("/schedules") ||
    path.includes("/routes") ||
    path.includes("/users")
  ) {
    return opsElevationStorage.get("dispatch");
  }
  return null;
}
