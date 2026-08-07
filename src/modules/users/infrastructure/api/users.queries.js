import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "./users.api.js";
import { useLocationQueryParams } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";

export const usersKeys = {
  all: ["users"],
  list: (params) => ["users", "all", params ?? {}],
  pending: ["users", "pending"],
  detail: (userId) => ["users", userId],
  teams: ["teams"],
  teamsList: (scope) => ["teams", "list", scope?.city ?? "", scope?.state ?? ""],
  teamDetail: (teamId) => ["teams", "detail", teamId],
  cities: ["cities"],
  rolesRequiringTeam: ["users", "roles-requiring-team"],
  rolesRequiringCity: ["users", "roles-requiring-city"],
};

function invalidateUsers(qc) {
  void qc.invalidateQueries({ queryKey: usersKeys.all });
}

export function useAllUsersQuery(params, enabled = true) {
  const scopeParams = useLocationQueryParams(params);
  const merged = { ...params, ...scopeParams };
  return useQuery({
    queryKey: usersKeys.list(merged),
    queryFn: () => usersApi.fetchAllUsers(merged),
    enabled,
  });
}

export function usePendingUsersQuery(enabled = true) {
  return useQuery({
    queryKey: usersKeys.pending,
    queryFn: usersApi.fetchPendingUsers,
    enabled,
  });
}

export function useUserQuery(userId, enabled = true) {
  return useQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: () => usersApi.fetchUser(userId),
    enabled: enabled && Boolean(userId),
  });
}

export function useCreateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      invalidateUsers(qc);
      void qc.invalidateQueries({ queryKey: usersKeys.teams });
      void qc.invalidateQueries({ queryKey: usersKeys.cities });
    },
  });
}

export function useUpdateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }) => usersApi.updateUser(userId, payload),
    onSuccess: (_data, variables) => {
      invalidateUsers(qc);
      void qc.invalidateQueries({ queryKey: usersKeys.detail(variables.userId) });
      void qc.invalidateQueries({ queryKey: usersKeys.teams });
      void qc.invalidateQueries({ queryKey: usersKeys.cities });
    },
  });
}

export function useDeleteUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      invalidateUsers(qc);
      void qc.invalidateQueries({ queryKey: usersKeys.teams });
    },
  });
}

export function useTeamsQuery(enabled = true) {
  const scopeParams = useLocationQueryParams();
  return useQuery({
    queryKey: usersKeys.teamsList(scopeParams),
    queryFn: () => usersApi.fetchTeams(scopeParams),
    enabled,
  });
}

export function useTeamDetailQuery(teamId, enabled = true) {
  return useQuery({
    queryKey: usersKeys.teamDetail(teamId),
    queryFn: () => usersApi.fetchTeamDetail(teamId),
    enabled: Boolean(teamId) && enabled,
  });
}

export function useCreateTeamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.createTeam,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: usersKeys.teams });
      void qc.invalidateQueries({ queryKey: ["dashboard", "team-performance"] });
      invalidateUsers(qc);
    },
  });
}

export function useUpdateTeamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, body }) => usersApi.updateTeam(teamId, body),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: usersKeys.teams });
      void qc.invalidateQueries({ queryKey: usersKeys.teamDetail(variables.teamId) });
      void qc.invalidateQueries({ queryKey: ["dashboard", "team-performance"] });
      invalidateUsers(qc);
    },
  });
}

export function useCitiesQuery(enabled = true) {
  return useQuery({
    queryKey: usersKeys.cities,
    queryFn: usersApi.fetchCities,
    enabled,
  });
}
