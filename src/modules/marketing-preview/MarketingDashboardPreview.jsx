import { Link } from "react-router-dom";
import { MarketingPreviewLayout } from "./MarketingPreviewLayout.jsx";
import {
  OpsStatCard,
  OpsLifecycleStrip,
  OpsPanel,
  OpsStatusBadge,
} from "@/modules/manager-home/presentation/components/OpsWidgets.jsx";
import { AvailableDriverRow } from "@/modules/manager-home/presentation/components/AvailableDriverRow.jsx";
import { formatStatusLabel } from "@/modules/manager-home/utils/routeStatus.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { PREVIEW_DRIVERS, PREVIEW_PERFORMANCE, PREVIEW_ROUTES } from "./fixtures.js";

const LIFECYCLE = [
  { key: "pending", label: "Pending", value: 12, color: "var(--amber)" },
  { key: "in_progress", label: "In progress", value: 18, color: "var(--blue)" },
  { key: "completed", label: "Completed", value: 34, color: "var(--green)" },
  { key: "other", label: "Other", value: 2, color: "var(--text-dim)" },
];

export function MarketingDashboardPreview() {
  return (
    <MarketingPreviewLayout activeNav="Dashboard">
      <div className={`${PAGE_CONTENT} space-y-5 overflow-y-auto py-6`}>
        <div className="ops-fade">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
            Good morning, Jordan
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Dispatch overview · Monday, July 7, 2026
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <OpsStatCard icon="routes" label="Total routes" value={64} sublabel="today" percent={72} delay={0} />
          <OpsStatCard icon="check" label="Completed" value={34} sublabel="verified" percent={53} barColor="var(--green)" delay={80} />
          <OpsStatCard icon="active" label="In progress" value={18} sublabel="active now" percent={28} barColor="var(--blue)" delay={160} />
          <OpsStatCard icon="payroll" label="Payroll pending" value="$4,280" sublabel="unbilled" barColor="var(--accent-2)" delay={240} />
        </section>

        <section className="ops-fade space-y-3">
          <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
            Route lifecycle
          </h2>
          <OpsLifecycleStrip stages={LIFECYCLE} />
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <OpsPanel title="Available drivers" subtitle="6 drivers with no route today">
            <ul>
              {PREVIEW_DRIVERS.map((driver) => (
                <AvailableDriverRow
                  key={driver.id}
                  driver={driver}
                  performance={PREVIEW_PERFORMANCE[driver.id]}
                  showTeam
                  variant="panel"
                />
              ))}
            </ul>
          </OpsPanel>

          <OpsPanel title="Today's routes" subtitle="64 route(s) today">
            <table className="w-full min-w-[460px] text-left text-sm">
              <thead
                className="sticky top-0 text-xs font-semibold uppercase tracking-wide"
                style={{ background: "rgba(7,11,18,0.9)", color: "var(--text-dim)" }}
              >
                <tr>
                  <th className="px-5 py-3">Route</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {PREVIEW_ROUTES.map((route) => (
                  <tr key={route.id} className="ops-row border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-5 py-3">
                      <p className="font-medium" style={{ color: "var(--text)" }}>
                        {route.routeName}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                        {route.location} · {route.arrivalTime}–{route.departureTime}
                      </p>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                      {route.driverName || "Unassigned"}
                    </td>
                    <td className="px-4 py-3">
                      <OpsStatusBadge status={route.status} label={formatStatusLabel(route.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </OpsPanel>
        </div>

        <div className="hidden">
          <Link to="/dashboard">hidden</Link>
        </div>
      </div>
    </MarketingPreviewLayout>
  );
}
