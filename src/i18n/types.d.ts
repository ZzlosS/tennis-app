import "i18next";

import type en from "./locales/en.json";

// Typed keys: t("auth.signin") with a typo fails the typecheck.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof en };
  }
}
