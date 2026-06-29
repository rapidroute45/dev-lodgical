import { useQuery } from "@tanstack/react-query";
import { fetchRoutesByDate } from "./routes.api.js";
import { useLocationQueryParams } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";

export function useTodayRoutesQuery(date, enabled = true) {
  const scopeParams = useLocationQueryParams();
  return useQuery({
    queryKey: ["routes", "list", date, scopeParams.city ?? "", scopeParams.state ?? ""],
    queryFn: () => fetchRoutesByDate(date, scopeParams),
    enabled: enabled && Boolean(date),
  });
}
