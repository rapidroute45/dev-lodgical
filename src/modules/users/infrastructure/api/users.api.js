import { api } from "@/shared/utils/api.js";

export async function createUser(body) {
  const res = await api.post("/users", body);
  if (res.data?.success === false) {
    const message = res.data?.error || res.data?.message || "Failed to create account";
    const err = new Error(message);
    err.response = { data: res.data, status: 400 };
    throw err;
  }
  return res.data;
}

export async function fetchAllUsers(params = {}) {
  const res = await api.get("/users", { params });
  return res.data.data ?? [];
}

export async function fetchPendingUsers() {
  const res = await api.get("/users", { params: { pending: "true" } });
  return res.data.data ?? [];
}

export async function fetchUser(userId) {
  const res = await api.get(`/users/${userId}`);
  return res.data.data;
}

export async function updateUser(userId, body) {
  const res = await api.patch(`/users/${userId}`, body);
  return res.data;
}

export async function deleteUser(userId) {
  const res = await api.delete(`/users/${userId}`);
  return res.data;
}

export async function fetchRolesRequiringTeam() {
  const res = await api.get("/users/roles-requiring-team");
  return res.data.data ?? [];
}

export async function fetchRolesRequiringCity() {
  const res = await api.get("/users/roles-requiring-city");
  return res.data.data ?? [];
}

export async function fetchCities() {
  const res = await api.get("/cities");
  return res.data.data?.cities ?? [];
}

export async function fetchTeams() {
  const res = await api.get("/teams");
  return res.data.data ?? [];
}

export async function createTeam(name) {
  const res = await api.post("/teams", { name });
  return res.data.data;
}
