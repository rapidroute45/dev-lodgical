import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, markNotificationRead } from "./notifications.api.js";

export const notificationKeys = {
  all: ["notifications"],
};

const OPS_POLL_MS = 12_000;
const DEFAULT_POLL_MS = 30_000;

export function useNotificationsQuery(enabled = true, options = {}) {
  const pollMs = options.opsFastPoll ? OPS_POLL_MS : DEFAULT_POLL_MS;

  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: fetchNotifications,
    enabled,
    staleTime: 5_000,
    refetchInterval: pollMs,
    refetchIntervalInBackground: false,
    refetchOnMount: "always",
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (_data, notificationId) => {
      queryClient.setQueryData(notificationKeys.all, (current) => {
        if (!Array.isArray(current)) return current;
        return current.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        );
      });
    },
  });
}

export function useUnreadNotificationCount(enabled = true, options = {}) {
  const { data = [] } = useNotificationsQuery(enabled, options);
  return data.filter((n) => !n.read).length;
}
