// lib/i18n/i18next.d.ts
// ─────────────────────────────────────────────────────────────────────────────
// Dá type-safety e autocomplete às chaves de tradução: t("profile.title") é
// validado pelo TypeScript, e uma chave inexistente vira erro de compilação.
// A forma das chaves é derivada do locale de referência (en.json).
// ─────────────────────────────────────────────────────────────────────────────

import "i18next";
import type en from "./locales/en.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof en;
    };
    returnNull: false;
  }
}
