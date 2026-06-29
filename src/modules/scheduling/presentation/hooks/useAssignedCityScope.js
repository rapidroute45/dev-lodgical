import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { getUserAssignedCities } from "@/shared/utils/assignedCities.js";

export function useAssignedCityScope() {
  const { user } = useAuth();
  const assignedCities = getUserAssignedCities(user);
  const assignedCity = assignedCities.length === 1 ? assignedCities[0] : null;

  return {
    assignedCities,
    assignedCity,
    isCityScoped: assignedCities.length > 0,
    isCityLocked: assignedCities.length === 1,
    hasMultipleCities: assignedCities.length > 1,
  };
}
