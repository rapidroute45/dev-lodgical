import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { authService } from "./authService.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(
    authService.hasToken() ? "loading" : "guest"
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authService.hasToken()) {
      setStatus("guest");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await authService.fetchCurrentUser();
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        authService.logout();
        setUser(null);
        setStatus("guest");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setError(null);
    setStatus("loading");
    try {
      const { user: loggedIn } = await authService.login({ email, password });
      setUser(loggedIn);
      setStatus("authenticated");
      return loggedIn;
    } catch (err) {
      setStatus("guest");
      setError(err);
      throw err;
    }
  }, []);

  const register = useCallback(async ({ email, password, fullName, phone }) => {
    setError(null);
    return authService.register({ email, password, fullName, phone });
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo(
    () => ({ user, status, error, login, register, logout }),
    [user, status, error, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
