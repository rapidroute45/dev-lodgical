import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMeRequest, updateProfileRequest } from "./auth.api.js";

export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMeRequest,
    enabled,
  });
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProfileRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
