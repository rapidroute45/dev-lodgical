import { api } from "@/shared/utils/api.js";

export async function fetchOpsStoreReturns(params = {}) {
  const res = await api.get("/store-returns", { params });
  return res.data.data ?? [];
}

export async function fetchStoreReturn(id) {
  const res = await api.get(`/store-returns/${id}`);
  return res.data.data;
}
