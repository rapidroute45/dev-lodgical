import { api } from "@/shared/utils/api.js";

export async function createUser(body) {
  const res = await api.post("/users", body);
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
