import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { CONFIG } from "@/shared/utils/constants.js";
import { getStoredApiEnvironment } from "@/shared/utils/apiEnvironment.js";
import { tokenStorage } from "@/shared/utils/storage.js";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { OPS_ROLES } from "@/shared/utils/constants.js";
import { logGps } from "@/modules/tracking/utils/gpsTrackingDebug.js";

const TrackingSocketContext = createContext(null);

function resolveSocketUrl() {
  const socketUrl = CONFIG.SOCKET_URL;
  if (socketUrl) return socketUrl;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function TrackingSocketProvider({ children }) {
  const { user, status } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Set());

  const canTrack = status === "authenticated" && OPS_ROLES.includes(user?.role);

  useEffect(() => {
    if (!canTrack) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const token = tokenStorage.get();
    if (!token) return;

    const dbEnvironment = getStoredApiEnvironment();

    const socket = io(resolveSocketUrl(), {
      auth: { token, dbEnvironment },
      transports: ["polling", "websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("driver:location", (payload) => {
      logGps("web.socket.driverLocation", {
        routeId: payload?.routeId ?? null,
        driverId: payload?.driverId ?? null,
        lat: payload?.lat ?? null,
        lng: payload?.lng ?? null,
        recordedAt: payload?.recordedAt ?? null,
        trailPointCount: payload?.trailPoints?.length ?? 0,
        tracking: payload?.tracking ?? null,
      });
      for (const listener of listenersRef.current) {
        listener(payload);
      }
    });

    socket.on("driver:stationary", (payload) => {
      for (const listener of listenersRef.current) {
        listener({ type: "driver:stationary", ...payload });
      }
    });

    socket.on("driver:break-started", (payload) => {
      for (const listener of listenersRef.current) {
        listener({ type: "driver:break-started", ...payload });
      }
    });

    socket.on("driver:break-movement", (payload) => {
      for (const listener of listenersRef.current) {
        listener({ type: "driver:break-movement", ...payload });
      }
    });

    socket.on("driver:break-ended", (payload) => {
      for (const listener of listenersRef.current) {
        listener({ type: "driver:break-ended", ...payload });
      }
    });

    socket.on("route:updated", (payload) => {
      for (const listener of listenersRef.current) {
        listener({ type: "route:updated", ...payload });
      }
    });

    socket.on("driver:segment-rerouted", (payload) => {
      for (const listener of listenersRef.current) {
        listener({ type: "driver:segment-rerouted", ...payload });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [canTrack, user?.id]);

  const subscribe = useCallback((listener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const value = useMemo(
    () => ({ connected, subscribe, canTrack }),
    [connected, subscribe, canTrack]
  );

  return (
    <TrackingSocketContext.Provider value={value}>
      {children}
    </TrackingSocketContext.Provider>
  );
}

export function useTrackingSocket() {
  return useContext(TrackingSocketContext);
}
