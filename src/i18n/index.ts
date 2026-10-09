import { getLocales } from "expo-localization";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import sr from "./locales/sr.json";

// Adding a language: drop a new file in ./locales, add it here and to `languages`.
export const resources = { en: { translation: en }, sr: { translation: sr } } as const;
export const languages = ["en", "sr"] as const;
export type Language = (typeof languages)[number];
export const FALLBACK_LANGUAGE: Language = "en";

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (languages as readonly string[]).includes(value);
}

/** The device's first language the app supports, else English. */
export function deviceLanguage(): Language {
  for (const locale of getLocales()) {
    const code = locale.languageCode?.toLowerCase();
    if (isLanguage(code)) return code;
  }
  return FALLBACK_LANGUAGE;
}

/**
 * The locale for Intl formatting. Serbian is pinned to Latin script, since `sr` alone formats
 * dates and months in Cyrillic.
 */
export function intlLocale(language: string = i18n.language): string {
  return language === "sr" ? "sr-Latn-RS" : "en-GB";
}

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: [...languages],
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
});

export default i18n;
