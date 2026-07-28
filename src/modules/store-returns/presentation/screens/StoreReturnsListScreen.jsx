import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { useOpsDateScope } from "@/modules/manager-home/application/OpsDateScopeProvider.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { formatDisplayDate, todayIsoDate } from "@/shared/utils/time.js";
import { useOpsStoreReturnsQuery } from "../../infrastructure/api/storeReturns.queries.js";

export function StoreReturnsListScreen() {
  const [searchParams] = useSearchParams();
  const { date } = useOpsDateScope();
  const statusFilter = searchParams.get("status") || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const useDateRange = Boolean(from || to || statusFilter === "pending_store_return");

  const queryParams = useMemo(() => {
    if (useDateRange) {
      return {
        ...(statusFilter ? { status: statusFilter } : {}),
      };
    }
    return {
      date,
      ...(statusFilter ? { status: statusFilter } : {}),
    };
  }, [useDateRange, date, statusFilter]);

  const isToday = date === todayIsoDate();
  const { data = [], isLoading, isError, refetch, isFetching } = useOpsStoreReturnsQuery(
    true,
    queryParams
  );

  const filtered = useMemo(() => {
    let rows = data;
    if (from || to) {
      rows = rows.filter((item) => {
        const d = item.scheduleDate;
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }
    // Pending without photos is the payroll warning case; also keep empty-photo returned rows rare.
    if (statusFilter === "pending_store_return") {
      rows = rows.filter(
        (item) => item.status === "pending_store_return" || !item.hasPhotos
      );
    }
    return rows;
  }, [data, from, to, statusFilter]);

  const title = useDateRange
    ? statusFilter === "pending_store_return"
      ? "Pending store returns"
      : "Store returns"
    : isToday
      ? "Store returns"
      : `Store returns · ${formatDisplayDate(date)}`;

  const subtitle = useDateRange
    ? [
        statusFilter === "pending_store_return"
          ? "Showing returns still missing store photos."
          : "Showing store returns.",
        from || to
          ? `Period ${from ? formatDisplayDate(from) : "…"} – ${to ? formatDisplayDate(to) : "…"}.`
          : null,
        "Red = photos not uploaded. Blue = returned to store with photos.",
      ]
        .filter(Boolean)
        .join(" ")
    : `Red = photos not uploaded. Blue = returned to store with photos. Defaulters show in red. Showing returns for ${
        isToday ? "today" : formatDisplayDate(date)
      }.`;

  const topBar = (
    <OpsTopBar
      onRefresh={() => void refetch()}
      refreshing={isFetching}
    />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
            {title}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
          {useDateRange ? (
            <Link
              to="/store-returns"
              className="mt-2 inline-block text-xs font-bold"
              style={{ color: "var(--accent)" }}
            >
              Clear filter · view by ops date
            </Link>
          ) : null}
        </div>

        {isLoading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ops-skel h-20 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="ops-banner ops-banner--error mt-4">Could not load returns.</div>
        ) : filtered.length === 0 ? (
          <div className="ops-panel ops-fade mt-4 px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>No store returns</p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              {useDateRange
                ? "No matching store returns for this filter."
                : `No store returns for ${formatDisplayDate(date)}.`}
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {filtered.map((item) => {
              const pending = item.status === "pending_store_return";
              const mark = item.hasPhotos ? "var(--blue)" : "var(--rose)";
              return (
                <li key={item.id}>
                  <Link
                    to={`/store-returns/${item.id}`}
                    className="ops-panel ops-fade flex items-stretch overflow-hidden transition hover:opacity-95"
                  >
                    <span className="w-1.5 shrink-0" style={{ background: mark }} />
                    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold" style={{ color: "var(--text)" }}>
                          {item.returnNumber}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold" style={{ color: "var(--text)" }}>
                          Stop #{item.stopSequence} · {item.stopName || "Stop"}
                        </p>
                        <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                          {[item.routeName, item.storeName, item.scheduleDate ? formatDisplayDate(item.scheduleDate) : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <p
                          className="mt-1 text-xs font-semibold"
                          style={{ color: item.isDefaulter ? "var(--rose)" : "var(--text-muted)" }}
                        >
                          {(item.driverMemberNumber ? `${item.driverMemberNumber} · ` : "") +
                            (item.driverName || "Driver")}
                          {item.isDefaulter ? " · Defaulter" : ""}
                        </p>
                      </div>
                      <span
                        className="rounded-lg px-2.5 py-1 text-[11px] font-bold"
                        style={{
                          color: pending ? "var(--rose)" : "var(--blue)",
                          background: pending ? "rgba(225, 29, 72, 0.12)" : "rgba(37, 99, 235, 0.12)",
                        }}
                      >
                        {pending ? "Pending store return" : "Returned to store"}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
