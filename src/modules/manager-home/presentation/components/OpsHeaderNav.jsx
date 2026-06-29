import { useState } from "react";
import { ScheduleNavMenu } from "@/modules/manager-home/presentation/components/ScheduleNavMenu.jsx";
import { StoreNavMenu } from "@/modules/manager-home/presentation/components/StoreNavMenu.jsx";
import { UserNavMenu } from "@/modules/manager-home/presentation/components/UserNavMenu.jsx";
import { PayrollNavMenu } from "@/modules/manager-home/presentation/components/PayrollNavMenu.jsx";
import { useOpsNavScope } from "@/modules/manager-home/presentation/hooks/useOpsNavScope.js";

export function OpsHeaderNav({ date }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const { showPayroll } = useOpsNavScope();

  function toggle(id) {
    setActiveMenu((current) => (current === id ? null : id));
  }

  function closeAll() {
    setActiveMenu(null);
  }

  return (
    <div className="ops-header-nav">
      <div className="ops-console-label flex items-center gap-2 pr-1">
        <span className="ops-dot h-2 w-2 shrink-0 rounded-full" />
        <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          Operations console
        </span>
      </div>

      <ScheduleNavMenu
        date={date}
        open={activeMenu === "schedule"}
        onToggle={() => toggle("schedule")}
        onClose={closeAll}
      />
      <StoreNavMenu
        date={date}
        open={activeMenu === "store"}
        onToggle={() => toggle("store")}
        onClose={closeAll}
      />
      <UserNavMenu
        date={date}
        open={activeMenu === "user"}
        onToggle={() => toggle("user")}
        onClose={closeAll}
      />
      {showPayroll ? (
        <PayrollNavMenu
          open={activeMenu === "payroll"}
          onToggle={() => toggle("payroll")}
          onClose={closeAll}
        />
      ) : null}
    </div>
  );
}
