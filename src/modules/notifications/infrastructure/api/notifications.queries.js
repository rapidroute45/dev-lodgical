import { useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "./notifications.api.js";

export const notificationKeys = {
  all: ["notifications"],
};

export function useNotificationsQuery(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: fetchNotifications,
    enabled,
    refetchInterval: 30_000,
  });
}
