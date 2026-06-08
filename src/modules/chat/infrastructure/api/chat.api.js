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
