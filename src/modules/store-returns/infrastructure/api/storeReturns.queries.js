import { useQuery } from "@tanstack/react-query";
import { fetchOpsStoreReturns, fetchStoreReturn } from "./storeReturns.api.js";

export const storeReturnKeys = {
  all: ["store-returns"],
  ops: (params = {}) => [
    ...storeReturnKeys.all,
    "ops",
    params.date ?? "all",
    params.status ?? "all",
  ],
  detail: (id) => [...storeReturnKeys.all, "detail", id],
};

/** @param {boolean} enabled
 *  @param {{ date?: string, status?: string } | string} [paramsOrStatus] */
export function useOpsStoreReturnsQuery(enabled = true, paramsOrStatus) {
  const params =
    typeof paramsOrStatus === "string"
      ? { status: paramsOrStatus }
      : paramsOrStatus ?? {};

  return useQuery({
    queryKey: storeReturnKeys.ops(params),
    queryFn: () => fetchOpsStoreReturns(params),
    enabled,
  });
}

export function useStoreReturnQuery(id, enabled = true) {
  return useQuery({
    queryKey: storeReturnKeys.detail(id),
    queryFn: () => fetchStoreReturn(id),
    enabled: enabled && Boolean(id),
  });
}
