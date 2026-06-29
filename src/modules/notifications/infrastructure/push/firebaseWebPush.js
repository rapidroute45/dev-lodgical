import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

import { AppStorage } from "@/shared/utils/storage.js";

import {
  getFirebaseVapidKey,
  getFirebaseWebConfig,
  isFirebaseWebConfigured,
} from "./firebaseWebConfig.js";
import { registerDeviceToken, unregisterDeviceToken } from "./pushNotifications.api.js";
import {
  logFirebaseWebClientStatus,
  previewFcmToken,
} from "./firebaseWebPushStatus.js";

export const FCM_TOKEN_STORAGE_KEY = "dispatch_web_fcm_token";

let messagingInstance = null;

function getOrInitApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(getFirebaseWebConfig());
}

function logStatus(partial) {
  const config = getFirebaseWebConfig();
  logFirebaseWebClientStatus({
    configured: isFirebaseWebConfigured(),
    supported: partial.supported ?? false,
    permissionGranted: partial.permissionGranted ?? false,
    hasFcmToken: partial.hasFcmToken ?? false,
    registeredWithBackend: partial.registeredWithBackend ?? false,
    connected: partial.connected ?? false,
    message: partial.message,
    projectId: config.projectId,
    appId: config.appId,
    tokenPreview: partial.tokenPreview,
  });
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export async function registerFirebaseServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  await navigator.serviceWorker.ready;
  return registration;
}

export async function syncWebPushTokenWithBackend() {
  if (!isFirebaseWebConfigured()) {
    logStatus({
      connected: false,
      message:
        "Web push not configured — set VITE_FIREBASE_* and VITE_FIREBASE_VAPID_KEY in .env.development",
    });
    return { ok: false, reason: "not_configured" };
  }

  const supported = await isSupported();
  if (!supported) {
    logStatus({
      supported: false,
      message: "Firebase Messaging is not supported in this browser.",
    });
    return { ok: false, reason: "unsupported" };
  }

  const permissionGranted = await requestNotificationPermission();
  if (!permissionGranted) {
    logStatus({
      supported: true,
      permissionGranted: false,
      message: "Notification permission denied or blocked — allow notifications for this site.",
    });
    return { ok: false, reason: "denied" };
  }

  const swRegistration = await registerFirebaseServiceWorker();
  if (!swRegistration) {
    logStatus({
      supported: true,
      permissionGranted: true,
      message: "Service worker registration failed.",
    });
    return { ok: false, reason: "no_service_worker" };
  }

  const app = getOrInitApp();
  messagingInstance = getMessaging(app, { serviceWorkerRegistration: swRegistration });

  let token;
  try {
    token = await getToken(messagingInstance, {
      vapidKey: getFirebaseVapidKey(),
    });
  } catch (error) {
    logStatus({
      supported: true,
      permissionGranted: true,
      message: `FCM token request failed: ${error instanceof Error ? error.message : String(error)}`,
    });
    return { ok: false, reason: "token_error" };
  }

  if (!token) {
    logStatus({
      supported: true,
      permissionGranted: true,
      message: "FCM returned no token — check VAPID key and service worker config.",
    });
    return { ok: false, reason: "no_token" };
  }

  const previous = AppStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  let registeredWithBackend = previous === token;

  if (previous !== token) {
    await registerDeviceToken(token);
    AppStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    registeredWithBackend = true;
  }

  logStatus({
    connected: true,
    supported: true,
    permissionGranted: true,
    hasFcmToken: true,
    registeredWithBackend,
    message: registeredWithBackend
      ? "Firebase connected on web and FCM token registered with backend."
      : "Firebase connected on web.",
    tokenPreview: previewFcmToken(token),
  });

  return { ok: true, token };
}

export function listenForForegroundMessages(handler) {
  if (!messagingInstance) return () => {};
  return onMessage(messagingInstance, handler);
}

export async function clearWebPushTokenFromBackend() {
  const token = AppStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  if (!token) return;

  try {
    await unregisterDeviceToken(token);
    console.log("[Firebase] Web push token removed from backend on logout.");
  } catch (error) {
    console.warn("[Firebase] Failed to unregister web push token", error);
  }
  AppStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
}
