import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createConversation,
  createInternalConversation,
  fetchChatDrivers,
  fetchChatOpsPeers,
  fetchConversations,
  fetchMessages,
  sendChatMessage,
} from "./chat.api.js";

export const chatKeys = {
  all: ["chat"],
  conversations: () => [...chatKeys.all, "conversations"],
  messages: (id) => [...chatKeys.all, "messages", id],
  drivers: () => [...chatKeys.all, "drivers"],
  opsPeers: () => [...chatKeys.all, "ops-peers"],
};

export function useConversationsQuery(enabled = true) {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: fetchConversations,
    enabled,
  });
}

export function useChatMessagesQuery(conversationId, enabled = true) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: () => fetchMessages(conversationId),
    enabled: enabled && Boolean(conversationId),
    refetchInterval: 5000,
  });
}

export function useChatDriversQuery(enabled = true) {
  return useQuery({
    queryKey: chatKeys.drivers(),
    queryFn: fetchChatDrivers,
    enabled,
  });
}

export function useChatOpsPeersQuery(enabled = true) {
  return useQuery({
    queryKey: chatKeys.opsPeers(),
    queryFn: fetchChatOpsPeers,
    enabled,
  });
}

export function useCreateConversationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

export function useCreateInternalConversationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInternalConversation,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

function mergeSentMessage(qc, message) {
  qc.setQueryData(chatKeys.messages(message.conversationId), (old) => {
    if (!old) return [message];
    if (old.some((m) => m.id === message.id)) return old;
    return [...old, message];
  });
  void qc.invalidateQueries({ queryKey: chatKeys.conversations() });
}

export function useSendChatMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, body }) => sendChatMessage(conversationId, body),
    onSuccess: (message) => mergeSentMessage(qc, message),
  });
}
