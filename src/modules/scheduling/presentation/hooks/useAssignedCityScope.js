import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { getUserAssignedCities, roleUsesMultipleCities } from "@/shared/utils/assignedCities.js";

export function useAssignedCityScope() {
  const { user } = useAuth();
  const assignedCities = getUserAssignedCities(user);
  const assignedCity = assignedCities.length === 1 ? assignedCities[0] : null;
  const isCityAssignedRole = roleUsesMultipleCities(user?.role);

  return {
    assignedCities,
    assignedCity,
    listScopedCities: assignedCities,
    // City-assigned roles stay scoped even with zero cities (create/list show empty).
    isCityScoped: isCityAssignedRole || assignedCities.length > 0,
    isCityLocked: assignedCities.length === 1,
    hasMultipleCities: assignedCities.length > 1,
  };
}
