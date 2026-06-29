import { api } from "@/shared/utils/api.js";

export async function registerDeviceToken(token) {
  const response = await api.post("/notifications/device-tokens", {
    token,
    platform: "web",
  });
  return response.data;
}

export async function unregisterDeviceToken(token) {
  if (token) {
    await api.delete("/notifications/device-tokens", { data: { token } });
  } else {
    await api.delete("/notifications/device-tokens");
  }
}
