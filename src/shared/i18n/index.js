import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import es from "./locales/es.json";

export const LANGUAGE_STORAGE_KEY = "app.language";

export const SUPPORTED_LANGUAGES = [
  { code: "en", labelKey: "language.english" },
  { code: "es", labelKey: "language.spanish" },
];

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "es") return stored;
  } catch {
    /* ignore */
  }
  const browser = navigator.language?.slice(0, 2);
  return browser === "es" ? "es" : "en";
}

const initialLanguage = readStoredLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

if (typeof document !== "undefined") {
  document.documentElement.lang = initialLanguage;
}

export function setAppLanguage(code) {
  if (code !== "en" && code !== "es") return;
  void i18n.changeLanguage(code);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = code;
  }
}

export { i18n };
