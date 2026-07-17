import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { authService } from "./authService.js";
import { clearWebPushTokenFromBackend } from "@/modules/notifications/infrastructure/push/firebaseWebPush.js";
import { clearInboxStorage } from "@/modules/notifications/application/pushNotificationInbox.js";
import { isAccountLoginAllowed } from "@/modules/auth/utils/accountAccess.js";

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
        if (!isAccountLoginAllowed(me)) {
          authService.logout();
          setUser(null);
          setStatus("guest");
          return;
        }
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

  const requestRegisterOtp = useCallback(
    async ({ email, password, fullName, phone }) => {
      setError(null);
      return authService.requestRegisterOtp({ email, password, fullName, phone });
    },
    []
  );

  const verifyRegisterOtp = useCallback(async ({ email, code }) => {
    setError(null);
    return authService.verifyRegisterOtp({ email, code });
  }, []);

  const logout = useCallback(() => {
    if (user?.id) clearInboxStorage(user.id);
    void clearWebPushTokenFromBackend();
    authService.logout();
    setUser(null);
    setStatus("guest");
  }, [user?.id]);

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      login,
      register,
      requestRegisterOtp,
      verifyRegisterOtp,
      logout,
    }),
    [user, status, error, login, register, requestRegisterOtp, verifyRegisterOtp, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
