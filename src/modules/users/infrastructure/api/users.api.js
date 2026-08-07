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

export async function uploadUserProfileDocument(userId, kind, file) {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  const res = await api.post(`/users/${userId}/profile-documents`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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

export async function fetchTeams(params = {}) {
  const res = await api.get("/teams", {
    params: {
      ...(params.city?.trim?.() ? { city: params.city.trim() } : {}),
      ...(params.state?.trim?.() ? { state: params.state.trim() } : {}),
    },
  });
  return res.data.data ?? [];
}

export async function fetchTeamDetail(teamId) {
  const res = await api.get(`/teams/${teamId}`);
  return res.data.data;
}

/** @param {string|{name:string,city?:string|null}} input */
export async function createTeam(input) {
  const body =
    typeof input === "string"
      ? { name: input }
      : { name: input.name, city: input.city ?? null };
  const res = await api.post("/teams", body);
  return res.data.data;
}

export async function updateTeam(teamId, body) {
  const res = await api.patch(`/teams/${teamId}`, body);
  return res.data.data;
}

export async function deleteTeam(teamId) {
  const res = await api.delete(`/teams/${teamId}`);
  return res.data;
}
