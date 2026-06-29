import { useTranslation } from "react-i18next";
import {
  getStoredApiEnvironment,
  listApiEnvironments,
} from "@/shared/utils/apiEnvironment.js";
import { applyApiEnvironment } from "@/shared/utils/api.js";

export function ApiEnvironmentSelect({ value, onChange, tone = "dark" }) {
  const { t } = useTranslation();
  const isDark = tone === "dark";
  const environments = listApiEnvironments();
  const selected = value ?? getStoredApiEnvironment();

  function handleChange(next) {
    if (next !== "test" && next !== "prod") return;
    applyApiEnvironment(next);
    onChange?.(next);
  }

  return (
    <div>
      <label
        htmlFor="api-environment"
        className={`mb-1.5 block text-sm font-medium ${isDark ? "text-[#e8eef7]" : "text-dispatch-text"}`}
      >
        {t("auth.databaseEnvironment")}
      </label>
      <select
        id="api-environment"
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition ${
          isDark
            ? "border-[#334155] bg-[#0f1623] text-[#e8eef7] focus:border-[#22d3ee]"
            : "border-dispatch-light bg-white text-dispatch-text focus:border-dispatch-primary"
        }`}
      >
        {environments.map((env) => (
          <option key={env.key} value={env.key}>
            {env.label} — {env.hint}
          </option>
        ))}
      </select>
      <p className={`mt-1.5 text-xs ${isDark ? "text-[#64748b]" : "text-dispatch-muted"}`}>
        {t("auth.databaseEnvironmentHint")}
      </p>
    </div>
  );
}
