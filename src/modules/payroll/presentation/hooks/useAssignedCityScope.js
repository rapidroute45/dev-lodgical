import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { UserRole } from "@/shared/utils/constants.js";

export function useAssignedCityScope() {
  const { user } = useAuth();
  const assignedCity =
    user?.role === UserRole.DISPATCH_TEAM && user?.assignedCity?.trim()
      ? user.assignedCity.trim()
      : null;

  return {
    assignedCity,
    isCityLocked: Boolean(assignedCity),
  };
}
