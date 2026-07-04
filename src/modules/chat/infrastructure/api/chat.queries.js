import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
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
import {
  filterConversationsByScope,
  filterPeopleByScope,
  useScopedUserIdSet,
} from "@/modules/chat/utils/chatLocationScope.js";
import { useOpsLocationScope } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";

export const chatKeys = {
  all: ["chat"],
  conversations: () => [...chatKeys.all, "conversations"],
  messages: (id) => [...chatKeys.all, "messages", id],
  drivers: () => [...chatKeys.all, "drivers"],
  opsPeers: () => [...chatKeys.all, "ops-peers"],
  groupCandidates: () => [...chatKeys.all, "group-candidates"],
};

export function useConversationsQuery(enabled = true) {
  const { user } = useAuth();
  const { isScoped, city, state } = useOpsLocationScope();
  const scopedIds = useScopedUserIdSet();
  const query = useQuery({
    queryKey: [...chatKeys.conversations(), city ?? "", state ?? ""],
    queryFn: fetchConversations,
    enabled,
  });
  const data = useMemo(
    () => (isScoped ? filterConversationsByScope(query.data ?? [], scopedIds, user?.id) : query.data ?? []),
    [query.data, scopedIds, user?.id, isScoped]
  );
  return { ...query, data };
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
  const { user } = useAuth();
  const scopedIds = useScopedUserIdSet();
  const query = useQuery({
    queryKey: chatKeys.drivers(),
    queryFn: fetchChatDrivers,
    enabled,
  });
  const data = useMemo(
    () => filterPeopleByScope(query.data ?? [], scopedIds, user?.id),
    [query.data, scopedIds, user?.id]
  );
  return { ...query, data };
}

export function useChatOpsPeersQuery(enabled = true) {
  const { user } = useAuth();
  const scopedIds = useScopedUserIdSet();
  const query = useQuery({
    queryKey: chatKeys.opsPeers(),
    queryFn: fetchChatOpsPeers,
    enabled,
  });
  const data = useMemo(
    () => filterPeopleByScope(query.data ?? [], scopedIds, user?.id),
    [query.data, scopedIds, user?.id]
  );
  return { ...query, data };
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
  const { user } = useAuth();
  const scopedIds = useScopedUserIdSet();
  const query = useQuery({
    queryKey: chatKeys.groupCandidates(),
    queryFn: fetchGroupCandidates,
    enabled,
  });
  const data = useMemo(
    () => filterPeopleByScope(query.data ?? [], scopedIds, user?.id),
    [query.data, scopedIds, user?.id]
  );
  return { ...query, data };
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
