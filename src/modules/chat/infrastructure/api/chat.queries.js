import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createConversation,
  createGroup,
  createInternalConversation,
  deleteChatMessage,
  editChatMessage,
  fetchChatDrivers,
  fetchChatOpsPeers,
  fetchConversations,
  fetchGroupCandidates,
  fetchMessageInfo,
  fetchMessages,
  leaveGroup,
  markConversationDelivered,
  sendChatMessage,
  sendDocument,
  sendVoiceMessage,
  updateGroup,
} from "./chat.api.js";

export const chatKeys = {
  all: ["chat"],
  conversations: () => [...chatKeys.all, "conversations"],
  messages: (id) => [...chatKeys.all, "messages", id],
  drivers: () => [...chatKeys.all, "drivers"],
  opsPeers: () => [...chatKeys.all, "ops-peers"],
  groupCandidates: () => [...chatKeys.all, "group-candidates"],
};

export function useConversationsQuery(enabled = true) {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: fetchConversations,
    enabled,
  });
}

export function useChatMessagesQuery(conversationId, enabled = true) {
  const query = useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: () => fetchMessages(conversationId),
    enabled: enabled && Boolean(conversationId),
    // Socket-driven updates; refetch on focus / invalidation only.
    staleTime: 30_000,
  });
  const data = useMemo(
    () => (query.data ?? []).filter((m) => m.type !== "delivery_photo"),
    [query.data]
  );
  return { ...query, data };
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
    mutationFn: ({ conversationId, body, sendLater, delayHours }) =>
      sendChatMessage(conversationId, body, { sendLater, delayHours }),
    onSuccess: (message) => mergeSentMessage(qc, message),
  });
}

export function useSendVoiceMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, blob, durationMs }) =>
      sendVoiceMessage(conversationId, blob, durationMs),
    onSuccess: (message) => mergeSentMessage(qc, message),
  });
}

export function useSendDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, file }) => sendDocument(conversationId, file),
    onSuccess: (message) => mergeSentMessage(qc, message),
  });
}

export function useGroupCandidatesQuery(enabled = true) {
  return useQuery({
    queryKey: chatKeys.groupCandidates(),
    queryFn: fetchGroupCandidates,
    enabled,
  });
}

export function useCreateGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

export function useUpdateGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, ...payload }) => updateGroup(conversationId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

export function useLeaveGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId }) => leaveGroup(conversationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

export function useEditChatMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, messageId, body }) =>
      editChatMessage(conversationId, messageId, body),
    onSuccess: (message) => {
      qc.setQueryData(chatKeys.messages(message.conversationId), (old) => {
        if (!old) return [message];
        return old.map((m) => (m.id === message.id ? message : m));
      });
    },
  });
}

export function useDeleteChatMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, messageId, scope }) =>
      deleteChatMessage(conversationId, messageId, scope),
    onSuccess: (result, variables) => {
      if (result.scope === "me") {
        qc.setQueryData(chatKeys.messages(variables.conversationId), (old) =>
          old ? old.filter((m) => m.id !== variables.messageId) : old
        );
        return;
      }
      if (result.message) {
        qc.setQueryData(chatKeys.messages(variables.conversationId), (old) => {
          if (!old) return old;
          return old.map((m) => (m.id === result.message.id ? result.message : m));
        });
      }
    },
  });
}

export { markConversationDelivered, fetchMessageInfo };
