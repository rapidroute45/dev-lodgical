import { useMemo } from "react";
import { useOpsLocationScope } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";
import { useAllUsersQuery } from "@/modules/users/infrastructure/api/users.queries.js";

export function useScopedUserIdSet() {
  const { isScoped } = useOpsLocationScope();
  const { data: users = [] } = useAllUsersQuery(undefined, isScoped);
  return useMemo(() => {
    if (!isScoped) return null;
    return new Set(users.map((user) => user.id).filter(Boolean));
  }, [isScoped, users]);
}

export function filterPeopleByScope(people, scopedIds, currentUserId) {
  if (!scopedIds) return people;
  return people.filter((person) => person.id === currentUserId || scopedIds.has(person.id));
}

export function conversationInScope(conversation, scopedIds, currentUserId) {
  if (!scopedIds) return true;

  if (conversation.isGroup) {
    const memberIds = (conversation.members ?? []).map((member) => member.id).filter(Boolean);
    return memberIds.some(
      (id) => id !== currentUserId && scopedIds.has(id)
    );
  }

  const otherId = conversation.otherUserId;
  return otherId ? scopedIds.has(otherId) : true;
}

export function filterConversationsByScope(conversations, scopedIds, currentUserId) {
  if (!scopedIds) return conversations;
  return conversations.filter((item) => conversationInScope(item, scopedIds, currentUserId));
}
