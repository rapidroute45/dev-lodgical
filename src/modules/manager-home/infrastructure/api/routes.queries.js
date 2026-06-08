import { useQuery } from "@tanstack/react-query";
import { fetchRoutesByDate } from "./routes.api.js";

export function useTodayRoutesQuery(date, enabled = true) {
  return useQuery({
    queryKey: ["routes", "list", date],
    queryFn: () => fetchRoutesByDate(date),
    enabled: enabled && Boolean(date),
  });
}
