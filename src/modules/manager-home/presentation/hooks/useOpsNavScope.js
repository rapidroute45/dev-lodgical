import { useMemo } from "react";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { useOpsLocationScope } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";
import { getOpsNavScope } from "@/modules/manager-home/utils/opsNavScope.js";

export function useOpsNavScope() {
  const { user } = useAuth();
  const { city, state } = useOpsLocationScope();
  return useMemo(() => getOpsNavScope(user, { city, state }), [user, city, state]);
}
