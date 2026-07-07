import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { useOpsElevation } from "@/modules/auth/presentation/context/OpsElevationContext.jsx";
import { OpsPinModal } from "@/modules/auth/presentation/components/OpsPinModal.jsx";
import { OpsThemeProvider } from "@/modules/manager-home/presentation/context/OpsThemeContext.jsx";
import {
  adminNeedsDispatchElevation,
  roleNeedsPayrollElevation,
} from "@/shared/utils/constants.js";

/**
 * Route guard for PIN-gated areas.
 * scope: "dispatch" — admin ops create/edit; "payroll" — admin + dispatch manager payroll.
 */
export function OpsElevationRoute({ scope, children, fallback = "/dashboard" }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dispatchUnlocked, payrollUnlocked, verifyPin } = useOpsElevation();
  const role = user?.role;
  const [dismissed, setDismissed] = useState(false);

  const needsDispatch =
    scope === "dispatch" && adminNeedsDispatchElevation(role) && !dispatchUnlocked;
  const needsPayroll =
    scope === "payroll" && roleNeedsPayrollElevation(role) && !payrollUnlocked;
  const needsElevation = needsDispatch || needsPayroll;

  if (!needsElevation) {
    return children;
  }

  if (dismissed) {
    return <Navigate to={fallback} replace />;
  }

  return (
    <OpsThemeProvider>
      <OpsPinModal
        open
        scope={scope}
        onClose={() => {
          setDismissed(true);
          navigate(fallback, { replace: true });
        }}
        onVerified={verifyPin}
      />
      <div className="pointer-events-none opacity-40">{children}</div>
    </OpsThemeProvider>
  );
}
