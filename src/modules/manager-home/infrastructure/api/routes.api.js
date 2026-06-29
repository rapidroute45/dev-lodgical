import { api } from "@/shared/utils/api.js";

/** GET /routes?date= — schedule viewer (manager/admin) */
export async function fetchRoutesByDate(date, scope = {}) {
  const res = await api.get("/routes", {
    params: { date, limit: 100, ...scope },
  });
  const body = res.data;
  return {
    items: body.data ?? [],
    total: body.total ?? body.data?.length ?? 0,
  };
}
