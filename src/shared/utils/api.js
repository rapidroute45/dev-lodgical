import axios from "axios";
import { CONFIG } from "./constants.js";
import { tokenStorage } from "./storage.js";

export const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      tokenStorage.clear();
    }
    return Promise.reject(error);
  }
);
