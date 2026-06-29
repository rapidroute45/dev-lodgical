import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { chatKeys } from "@/modules/chat/infrastructure/api/chat.queries.js";

import { notificationKeys } from "../infrastructure/api/notifications.queries.js";
import {
  listenForForegroundMessages,
  syncWebPushTokenWithBackend,
} from "../infrastructure/push/firebaseWebPush.js";
import {
  extractNotificationData,
  navigateFromNotification,
} from "../infrastructure/push/navigateFromNotification.js";
import { handleIncomingPushFeedback } from "../infrastructure/push/handleIncomingPush.js";
import { playNotificationSound } from "../infrastructure/push/playNotificationSound.js";

function invalidatePushQueries(queryClient, data) {
  queryClient.invalidateQueries({ queryKey: notificationKeys.all });

  if (data.type === "chat_message") {
    queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    if (data.conversationId) {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(data.conversationId),
      });
    }
  }
}

export function PushNotificationBootstrap() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    let unsubscribeForeground = () => {};
    let tokenRefreshTimer = null;

    const onServiceWorkerMessage = (event) => {
      if (event.data?.type !== "dispatch-push-navigate") return;
      const data = extractNotificationData(event.data);
      playNotificationSound();
      invalidatePushQueries(queryClient, data);
      navigateFromNotification(navigate, data);
    };

    const onVisibilitySync = () => {
      if (document.visibilityState === "visible") {
        void syncWebPushTokenWithBackend();
      }
    };

    navigator.serviceWorker?.addEventListener("message", onServiceWorkerMessage);
    document.addEventListener("visibilitychange", onVisibilitySync);

    void (async () => {
      try {
        const result = await syncWebPushTokenWithBackend();
        if (cancelled || !result.ok) return;

        tokenRefreshTimer = window.setInterval(() => {
          void syncWebPushTokenWithBackend();
        }, 30 * 60 * 1000);

        unsubscribeForeground = listenForForegroundMessages((payload) => {
          const data = extractNotificationData(payload.data ?? {});

          handleIncomingPushFeedback(payload);
          invalidatePushQueries(queryClient, data);
        });
      } catch (error) {
        console.warn("[Firebase] Web push setup failed", error);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribeForeground();
      if (tokenRefreshTimer) window.clearInterval(tokenRefreshTimer);
      navigator.serviceWorker?.removeEventListener("message", onServiceWorkerMessage);
      document.removeEventListener("visibilitychange", onVisibilitySync);
    };
  }, [navigate, queryClient, status]);

  return null;
}
