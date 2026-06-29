import { playNotificationSound } from "./playNotificationSound.js";
import { showPushNotificationToast } from "./pushNotificationToast.js";

/** Foreground / in-tab push feedback: sound + banner. */
export function handleIncomingPushFeedback(payload) {
  const title = payload?.notification?.title || payload?.data?.title || "Dispatch";
  const body = payload?.notification?.body || payload?.data?.body || "";

  playNotificationSound();
  showPushNotificationToast(title, body || undefined);
}
