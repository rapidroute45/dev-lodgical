import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { chatKeys } from "@/modules/chat/infrastructure/api/chat.queries.js";

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
import { usePushNotificationInbox } from "./context/PushNotificationInboxProvider.jsx";

function invalidatePushQueries(queryClient, data) {
  if (data.type === "chat_message") {
    queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    if (data.conversationId) {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(data.conversationId),
      });
    }
  }
}

function buildPushPayloadFromMessage(eventData) {
  if (!eventData || typeof eventData !== "object") return {};
  const { dispatchMessageType: _swType, title, body, ...rest } = eventData;
  const data = extractNotificationData(rest);
  return {
    title: title ?? data.title ?? "Dispatch",
    body: body ?? data.body ?? "",
    data,
  };
}

export function PushNotificationBootstrap() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addFromPush, removeItem } = usePushNotificationInbox();

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    let unsubscribeForeground = () => {};
    let tokenRefreshTimer = null;

    const onServiceWorkerMessage = (event) => {
      const messageType = event.data?.dispatchMessageType;
      if (!messageType) return;

      if (messageType === "dispatch-push-received") {
        addFromPush(buildPushPayloadFromMessage(event.data));
        return;
      }

      if (messageType !== "dispatch-push-navigate") return;

      const payload = buildPushPayloadFromMessage(event.data);
      const added = addFromPush(payload);
      const data = payload.data ?? extractNotificationData(event.data);
      if (added?.id) removeItem(added.id);
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
          addFromPush(payload);
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
  }, [addFromPush, removeItem, navigate, queryClient, status]);

  return null;
}
