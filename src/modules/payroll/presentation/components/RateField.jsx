export function parseRateInt(raw) {
  return String(raw).replace(/\D/g, "");
}

export function RateField({ label, value, onChange, readOnly }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-[11px] font-semibold text-dispatch-muted">{label}</label>
      <div
        className={`flex items-center rounded-xl border border-dispatch-border px-3 py-2.5 ${
          readOnly ? "bg-dispatch-bg opacity-80" : "bg-[#FAFBFC]"
        }`}
      >
        <span className="mr-2 text-lg font-extrabold text-emerald-600">$</span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(parseRateInt(e.target.value))}
          readOnly={readOnly}
          className="w-full border-0 bg-transparent p-0 text-lg font-extrabold text-dispatch-text outline-none"
          placeholder="0"
        />
      </div>
    </div>
  );
}
