import { api } from "@/shared/utils/api.js";

const HIDDEN_TYPES = new Set(["driver_dwelling", "stop_auto_completed"]);

export async function fetchNotifications() {
  const res = await api.get("/notifications");
  const list = Array.isArray(res.data?.data) ? res.data.data : [];
  return list.filter((n) => !HIDDEN_TYPES.has(n.type));
}
