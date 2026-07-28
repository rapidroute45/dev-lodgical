import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { formatDisplayDate } from "@/shared/utils/time.js";
import { mediaUrl } from "@/shared/utils/mediaUrl.js";
import { useStoreReturnQuery } from "../../infrastructure/api/storeReturns.queries.js";

export function StoreReturnDetailScreen() {
  const { id } = useParams();
  const { data, isLoading, isError } = useStoreReturnQuery(id, true);
  const topBar = <OpsTopBar showDate={false} />;

  if (isLoading) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          <div className="ops-skel h-40 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !data) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>Return not found</p>
            <Link to="/store-returns" className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold">
              Back
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pending = data.status === "pending_store_return";

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex items-start gap-3">
          <Link to="/store-returns" className="ops-btn p-2.5" aria-label="Back">
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              {data.returnNumber}
            </h1>
            <p className="mt-1 text-sm font-semibold" style={{ color: pending ? "var(--rose)" : "var(--blue)" }}>
              {pending ? "Pending store return" : "Returned to store"}
            </p>
          </div>
        </div>

        <div className="ops-panel ops-fade mt-4 grid gap-3 p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Stop</p>
            <p className="mt-1 font-semibold" style={{ color: "var(--text)" }}>
              #{data.stopSequence} · {data.stopName}
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{data.stopAddress || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Route</p>
            <p className="mt-1 font-semibold" style={{ color: "var(--text)" }}>{data.routeName || "—"}</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {data.scheduleDate ? formatDisplayDate(data.scheduleDate) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Store</p>
            <p className="mt-1 font-semibold" style={{ color: "var(--text)" }}>{data.storeName || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Driver</p>
            <p
              className="mt-1 font-semibold"
              style={{ color: data.isDefaulter ? "var(--rose)" : "var(--text)" }}
            >
              {(data.driverMemberNumber ? `${data.driverMemberNumber} · ` : "") + (data.driverName || "—")}
              {data.isDefaulter ? " · Defaulter" : ""}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Return reason</p>
            <p className="mt-1 font-semibold" style={{ color: "var(--text)" }}>
              {data.returnReasonCustom?.trim() || data.returnReason?.replaceAll?.("_", " ") || data.returnReason || "—"}
            </p>
          </div>
        </div>

        <div className="ops-panel ops-fade mt-4 p-5">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
            Photos uploaded by driver
          </p>
          {data.photoUrls?.length ? (
            <div className="mt-3 flex flex-wrap gap-3">
              {data.photoUrls.map((url) => {
                const full = mediaUrl(url, { width: 1600, quality: 80 });
                const thumb = mediaUrl(url, { width: 224, quality: 65 });
                return (
                  <a key={url} href={full ?? "#"} target="_blank" rel="noreferrer">
                    <img
                      src={thumb ?? undefined}
                      alt="Store return"
                      className="h-28 w-28 rounded-xl object-cover"
                      style={{ border: "1px solid var(--border)" }}
                      loading="lazy"
                      decoding="async"
                    />
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm font-semibold" style={{ color: "var(--rose)" }}>
              Not uploaded
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
