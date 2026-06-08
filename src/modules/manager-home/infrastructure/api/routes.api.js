import { api } from "@/shared/utils/api.js";

/** GET /routes?date= — schedule viewer (manager/admin) */
export async function fetchRoutesByDate(date) {
  const res = await api.get("/routes", {
    params: { date, limit: 100 },
  });
  const body = res.data;
  return {
    items: body.data ?? [],
    total: body.total ?? body.data?.length ?? 0,
  };
}
