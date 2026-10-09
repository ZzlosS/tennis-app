import { useTranslation } from "react-i18next";

import { isLanguage, FALLBACK_LANGUAGE, type Language } from "./index";

/** The current language and a way to change it. */
export function useLanguage(): { language: Language; setLanguage: (language: Language) => Promise<void> } {
  const { i18n } = useTranslation();
  const language = isLanguage(i18n.language) ? i18n.language : FALLBACK_LANGUAGE;
  return {
    language,
    setLanguage: async (next) => {
      await i18n.changeLanguage(next);
    },
  };
}
