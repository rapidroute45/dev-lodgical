import { UserRole } from "@/shared/utils/constants.js";

export function roleUsesExtendedProfile(role) {
  return role === UserRole.TEAM_LEAD || role === UserRole.ONSITE_MANAGER;
}

const FIELD_CLASS =
  "ops-field w-full text-sm font-semibold";

/**
 * Banking + compliance fields for Team Lead / Onsite Manager.
 * Values are plain strings (empty string cleared on save by the parent).
 */
export function ExtendedProfileFields({ values, onChange, disabled }) {
  function setField(key, value) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
          Banking information
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm" style={{ color: "var(--text-muted)" }}>
            Bank name
            <input
              className={`${FIELD_CLASS} mt-1`}
              value={values.bankName}
              disabled={disabled}
              onChange={(e) => setField("bankName", e.target.value)}
            />
          </label>
          <label className="block text-sm" style={{ color: "var(--text-muted)" }}>
            Account holder name
            <input
              className={`${FIELD_CLASS} mt-1`}
              value={values.accountHolderName}
              disabled={disabled}
              onChange={(e) => setField("accountHolderName", e.target.value)}
            />
          </label>
          <label className="block text-sm" style={{ color: "var(--text-muted)" }}>
            Account number
            <input
              className={`${FIELD_CLASS} mt-1`}
              value={values.accountNumber}
              disabled={disabled}
              onChange={(e) => setField("accountNumber", e.target.value)}
            />
          </label>
          <label className="block text-sm" style={{ color: "var(--text-muted)" }}>
            Routing number
            <input
              className={`${FIELD_CLASS} mt-1`}
              value={values.routingNumber}
              disabled={disabled}
              onChange={(e) => setField("routingNumber", e.target.value)}
            />
          </label>
          <label className="block text-sm sm:col-span-2" style={{ color: "var(--text-muted)" }}>
            ACH information
            <input
              className={`${FIELD_CLASS} mt-1`}
              value={values.achInformation}
              disabled={disabled}
              onChange={(e) => setField("achInformation", e.target.value)}
            />
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
          Documents &amp; business info
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm" style={{ color: "var(--text-muted)" }}>
            Vehicle SSN
            <input
              className={`${FIELD_CLASS} mt-1`}
              value={values.vehicleSsn}
              disabled={disabled}
              onChange={(e) => setField("vehicleSsn", e.target.value)}
            />
          </label>
          <label className="block text-sm" style={{ color: "var(--text-muted)" }}>
            Authority number
            <input
              className={`${FIELD_CLASS} mt-1`}
              value={values.authorityNumber}
              disabled={disabled}
              onChange={(e) => setField("authorityNumber", e.target.value)}
            />
          </label>
          <label className="block text-sm" style={{ color: "var(--text-muted)" }}>
            EIN number
            <input
              className={`${FIELD_CLASS} mt-1`}
              value={values.einNumber}
              disabled={disabled}
              onChange={(e) => setField("einNumber", e.target.value)}
            />
          </label>
          <label className="block text-sm" style={{ color: "var(--text-muted)" }}>
            Insurance certificate URL
            <input
              className={`${FIELD_CLASS} mt-1`}
              value={values.insuranceCertificateUrl}
              disabled={disabled}
              placeholder="Upload below or paste URL"
              onChange={(e) => setField("insuranceCertificateUrl", e.target.value)}
            />
          </label>
          <label className="block text-sm sm:col-span-2" style={{ color: "var(--text-muted)" }}>
            W-9 document URL
            <input
              className={`${FIELD_CLASS} mt-1`}
              value={values.w9DocumentUrl}
              disabled={disabled}
              placeholder="Upload below or paste URL"
              onChange={(e) => setField("w9DocumentUrl", e.target.value)}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export function emptyExtendedProfileValues() {
  return {
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    routingNumber: "",
    achInformation: "",
    vehicleSsn: "",
    insuranceCertificateUrl: "",
    w9DocumentUrl: "",
    authorityNumber: "",
    einNumber: "",
  };
}

export function extendedProfileFromUser(user) {
  const empty = emptyExtendedProfileValues();
  if (!user) return empty;
  return {
    bankName: user.bankName ?? "",
    accountHolderName: user.accountHolderName ?? "",
    accountNumber: user.accountNumber ?? "",
    routingNumber: user.routingNumber ?? "",
    achInformation: user.achInformation ?? "",
    vehicleSsn: user.vehicleSsn ?? "",
    insuranceCertificateUrl: user.insuranceCertificateUrl ?? "",
    w9DocumentUrl: user.w9DocumentUrl ?? "",
    authorityNumber: user.authorityNumber ?? "",
    einNumber: user.einNumber ?? "",
  };
}

/** Convert form strings to API nullable strings. */
export function extendedProfileToPayload(values) {
  const out = {};
  for (const [key, value] of Object.entries(values)) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    out[key] = trimmed.length > 0 ? trimmed : null;
  }
  return out;
}
