import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { canManageStores } from "@/shared/utils/constants.js";
import { EditStoreScreen } from "./EditStoreScreen.jsx";
import { StoreOperationsScreen } from "./StoreOperationsScreen.jsx";

/** Managers edit store settings; dispatch team sees schedules and routes. */
export function StoreScreen() {
  const { user } = useAuth();
  return canManageStores(user?.role) ? <EditStoreScreen /> : <StoreOperationsScreen />;
}
