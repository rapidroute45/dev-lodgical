import { api } from "@/shared/utils/api.js";

export async function fetchConversations() {
  const res = await api.get("/chat/conversations");
  return res.data.data ?? [];
}

export async function fetchChatDrivers() {
  const res = await api.get("/chat/drivers");
  return res.data.data ?? [];
}

export async function fetchChatOpsPeers() {
  const res = await api.get("/chat/ops-peers");
  return res.data.data ?? [];
}

export async function createConversation(driverId) {
  const res = await api.post("/chat/conversations", { driverId });
  return res.data.data;
}

export async function createInternalConversation(peerId) {
  const res = await api.post("/chat/conversations/internal", { peerId });
  return res.data.data;
}

export async function fetchMessages(conversationId) {
  const res = await api.get(`/chat/conversations/${conversationId}/messages`);
  return res.data.data ?? [];
}

export async function sendChatMessage(conversationId, body) {
  const res = await api.post(`/chat/conversations/${conversationId}/messages`, { body });
  return res.data.data;
}

export async function sendVoiceMessage(conversationId, blob, durationMs) {
  const form = new FormData();
  const ext = (blob.type && blob.type.split("/")[1]) || "webm";
  form.append("audio", blob, `voice-${Date.now()}.${ext}`);
  form.append("durationMs", String(Math.round(durationMs ?? 0)));
  const res = await api.post(`/chat/conversations/${conversationId}/voice`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function sendDocument(conversationId, file) {
  const form = new FormData();
  form.append("file", file, file.name);
  const res = await api.post(`/chat/conversations/${conversationId}/attachment`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function fetchGroupCandidates() {
  const res = await api.get("/chat/group-candidates");
  return res.data.data ?? [];
}

export async function createGroup({ title, memberIds }) {
  const res = await api.post("/chat/groups", { title, memberIds });
  return res.data.data;
}

export async function updateGroup(conversationId, payload) {
  const res = await api.patch(`/chat/groups/${conversationId}`, payload);
  return res.data.data;
}

export async function leaveGroup(conversationId) {
  const res = await api.post(`/chat/groups/${conversationId}/leave`);
  return res.data.data;
}
