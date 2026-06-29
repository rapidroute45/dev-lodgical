import { useTranslation } from "react-i18next";

import { SUPPORTED_LANGUAGES, setAppLanguage } from "./index.js";

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const active = i18n.language?.startsWith("es") ? "es" : "en";

  return (
    <section className="ops-panel ops-fade overflow-hidden">
      <div className="ops-panel__head px-5 py-4">
        <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
          {t("language.title")}
        </h3>
        <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
          {t("language.description")}
        </p>
      </div>
      <div className="flex gap-2 p-5">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const selected = active === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setAppLanguage(lang.code)}
              className={`ops-btn flex-1 px-4 py-2.5 text-sm font-semibold ${
                selected ? "ops-btn--accent" : ""
              }`}
            >
              {t(lang.labelKey)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
