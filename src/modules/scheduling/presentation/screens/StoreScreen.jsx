import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { useOpsElevation } from "@/modules/auth/presentation/context/OpsElevationContext.jsx";
import { canManageStores } from "@/shared/utils/constants.js";
import { EditStoreScreen } from "./EditStoreScreen.jsx";
import { StoreOperationsScreen } from "./StoreOperationsScreen.jsx";

/** Managers edit store settings; dispatch team sees schedules and routes. */
export function StoreScreen() {
  const { user } = useAuth();
  const { dispatchUnlocked } = useOpsElevation();
  return canManageStores(user?.role, dispatchUnlocked) ? (
    <EditStoreScreen />
  ) : (
    <StoreOperationsScreen />
  );
}
