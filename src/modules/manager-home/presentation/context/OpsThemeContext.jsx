import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AppStorage } from "@/shared/utils/storage.js";

const STORAGE_KEY = "dispatch.opsTheme";

const OpsThemeContext = createContext(null);

function readStoredTheme() {
  const stored = AppStorage.getItem(STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

export function OpsThemeProvider({ children, defaultTheme }) {
  const [theme, setThemeState] = useState(() => {
    if (defaultTheme === "light" || defaultTheme === "dark") return defaultTheme;
    return readStoredTheme();
  });

  const setTheme = useCallback((next) => {
    const value = next === "light" ? "light" : "dark";
    setThemeState(value);
    AppStorage.setItem(STORAGE_KEY, value);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    }),
    [theme, setTheme]
  );

  return <OpsThemeContext.Provider value={value}>{children}</OpsThemeContext.Provider>;
}

export function useOpsTheme() {
  const ctx = useContext(OpsThemeContext);
  if (!ctx) {
    throw new Error("useOpsTheme must be used within OpsThemeProvider");
  }
  return ctx;
}
