import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  clearAllNotifications,
  fetchNotifications,
  markNotificationRead,
} from "./notifications.api.js";

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

export function useClearAllNotificationsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearAllNotifications,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previous = queryClient.getQueryData(notificationKeys.all);
      queryClient.setQueryData(notificationKeys.all, []);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationKeys.all, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useUnreadNotificationCount(enabled = true, options = {}) {
  const { data = [] } = useNotificationsQuery(enabled, options);
  return data.filter((n) => !n.read).length;
}
