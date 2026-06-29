import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "./users.api.js";
import { useLocationQueryParams } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";

export const usersKeys = {
  all: ["users"],
  list: (params) => ["users", "all", params ?? {}],
  pending: ["users", "pending"],
  detail: (userId) => ["users", userId],
  teams: ["teams"],
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
  return useQuery({
    queryKey: usersKeys.teams,
    queryFn: usersApi.fetchTeams,
    enabled,
  });
}

export function useCreateTeamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.createTeam,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: usersKeys.teams });
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
