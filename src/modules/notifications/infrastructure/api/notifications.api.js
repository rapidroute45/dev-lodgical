import { api } from "@/shared/utils/api.js";

export async function fetchNotifications() {
  const res = await api.get("/notifications");
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function markNotificationRead(notificationId) {
  const res = await api.patch(`/notifications/${notificationId}/read`);
  return res.data?.data;
}
