export function parseRateInt(raw) {
  return String(raw).replace(/\D/g, "");
}

export function RateField({ label, value, onChange, readOnly }) {
  return (
    <div className="mb-3">
      <label
        className="mb-1 block text-xs font-bold uppercase tracking-wide"
        style={{ color: "var(--text-dim)" }}
      >
        {label}
      </label>
      <div
        className="flex items-center rounded-xl px-3 py-2.5"
        style={{
          border: "1px solid var(--border)",
          background: "rgba(255, 255, 255, 0.03)",
          opacity: readOnly ? 0.7 : 1,
        }}
      >
        <span className="mr-2 text-lg font-extrabold" style={{ color: "var(--green)" }}>$</span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(parseRateInt(e.target.value))}
          readOnly={readOnly}
          className="w-full border-0 bg-transparent p-0 text-lg font-extrabold outline-none"
          style={{ color: "var(--text)" }}
          placeholder="0"
        />
      </div>
    </div>
  );
}
