import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import {
  addItemToInbox,
  clearInboxStorage,
  countUnreadInbox,
  loadInboxFromStorage,
  removeInboxItem,
  saveInboxToStorage,
} from "@/modules/notifications/application/pushNotificationInbox.js";

const PushNotificationInboxContext = createContext(null);

export function PushNotificationInboxProvider({ children }) {
  const { user, status } = useAuth();
  const userId = user?.id ?? null;
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (status !== "authenticated" || !userId) {
      setItems([]);
      return;
    }
    setItems(loadInboxFromStorage(userId));
  }, [status, userId]);

  const persist = useCallback(
    (next) => {
      setItems(next);
      if (userId) saveInboxToStorage(userId, next);
    },
    [userId]
  );

  const addFromPush = useCallback(
    (payload) => {
      if (!userId || status !== "authenticated") return null;
      let added = null;
      setItems((current) => {
        const next = addItemToInbox(current, payload);
        added = next[0] ?? null;
        saveInboxToStorage(userId, next);
        return next;
      });
      return added;
    },
    [status, userId]
  );

  const removeItem = useCallback(
    (id) => {
      if (!id) return;
      setItems((current) => {
        const next = removeInboxItem(current, id);
        if (userId) saveInboxToStorage(userId, next);
        return next;
      });
    },
    [userId]
  );

  const clear = useCallback(() => {
    if (userId) clearInboxStorage(userId);
    setItems([]);
  }, [userId]);

  const unreadCount = useMemo(() => countUnreadInbox(items), [items]);

  const value = useMemo(
    () => ({ items, unreadCount, addFromPush, removeItem, clear }),
    [items, unreadCount, addFromPush, removeItem, clear]
  );

  return (
    <PushNotificationInboxContext.Provider value={value}>
      {children}
    </PushNotificationInboxContext.Provider>
  );
}

export function usePushNotificationInbox() {
  const ctx = useContext(PushNotificationInboxContext);
  if (!ctx) {
    throw new Error("usePushNotificationInbox must be used within PushNotificationInboxProvider");
  }
  return ctx;
}
