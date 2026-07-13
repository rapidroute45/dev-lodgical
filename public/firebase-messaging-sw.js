/* eslint-disable no-undef */
/**
 * Background FCM handler for dev-lodgical.
 * Config is injected at dev/build time into /firebase-sw-config.js (see vite.config.js).
 */
importScripts("/firebase-sw-config.js");
importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js");

firebase.initializeApp(self.FIREBASE_SW_CONFIG);
const messaging = firebase.messaging();

function notifyClientsPushReceived(title, body, data) {
  return self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage({
        dispatchMessageType: "dispatch-push-received",
        title,
        body,
        ...data,
      });
    });
  });
}

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Dispatch";
  const body = payload.notification?.body || "";
  const data = payload.data || {};

  void notifyClientsPushReceived(title, body, data);

  return self.registration.showNotification(title, {
    body,
    icon: "/logo.png",
    silent: false,
    data,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const title = event.notification.title || "Dispatch";
  const body = event.notification.body || "";
  const deepLink = data.deepLink || "/";
  const url = new URL(deepLink, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.postMessage({
            dispatchMessageType: "dispatch-push-navigate",
            title,
            body,
            ...data,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
      return undefined;
    })
  );
});
