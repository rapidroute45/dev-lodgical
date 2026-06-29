import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { verifyOpsElevationRequest } from "@/modules/auth/infrastructure/api/auth.api.js";
import { opsElevationStorage } from "@/modules/auth/application/opsElevationStorage.js";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import {
  adminNeedsDispatchElevation,
  isDispatchManager,
  isDispatchTeam,
  roleNeedsPayrollElevation,
  UserRole,
} from "@/shared/utils/constants.js";

export const OpsElevationContext = createContext(null);

export function OpsElevationProvider({ children }) {
  const { status } = useAuth();
  const [dispatchUnlocked, setDispatchUnlocked] = useState(
    () => opsElevationStorage.snapshot().dispatchUnlocked
  );
  const [payrollUnlocked, setPayrollUnlocked] = useState(
    () => opsElevationStorage.snapshot().payrollUnlocked
  );

  const clearElevation = useCallback(() => {
    opsElevationStorage.clear();
    setDispatchUnlocked(false);
    setPayrollUnlocked(false);
  }, []);

  useEffect(() => {
    if (status === "guest") {
      clearElevation();
    }
  }, [status, clearElevation]);

  const verifyPin = useCallback(async (scope, pin) => {
    const { token } = await verifyOpsElevationRequest({ scope, pin });
    opsElevationStorage.set(scope, token);
    if (scope === "dispatch") setDispatchUnlocked(true);
    if (scope === "payroll") setPayrollUnlocked(true);
    return true;
  }, []);

  const canMutateOps = useCallback(
    (role) => {
      if (isDispatchManager(role) || isDispatchTeam(role)) return true;
      if (adminNeedsDispatchElevation(role)) return dispatchUnlocked;
      return false;
    },
    [dispatchUnlocked]
  );

  const canAccessPayroll = useCallback(
    (role) => {
      if (role === UserRole.ACCOUNTANT || role === UserRole.TEAM_LEAD) return true;
      if (roleNeedsPayrollElevation(role)) return payrollUnlocked;
      return false;
    },
    [payrollUnlocked]
  );

  const value = useMemo(
    () => ({
      dispatchUnlocked,
      payrollUnlocked,
      verifyPin,
      clearElevation,
      canMutateOps,
      canAccessPayroll,
    }),
    [dispatchUnlocked, payrollUnlocked, verifyPin, clearElevation, canMutateOps, canAccessPayroll]
  );

  return (
    <OpsElevationContext.Provider value={value}>{children}</OpsElevationContext.Provider>
  );
}

export function useOpsElevation() {
  const ctx = useContext(OpsElevationContext);
  if (!ctx) {
    throw new Error("useOpsElevation must be used within OpsElevationProvider");
  }
  return ctx;
}
