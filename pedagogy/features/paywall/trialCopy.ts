/**
 * ─── PAYWALL · TEXTO DO TESTE GRÁTIS ─────────────────────────────────────────
 *
 * A duração do teste aparece em três lugares (selo do card, botão e linha do
 * tempo) e precisa ser IDÊNTICA nos três — "1 semana grátis" no card com
 * "teste de 7 dias" no botão é o tipo de incoerência que faz o pai reler a tela
 * em vez de tocar no botão. Por isso tudo passa por aqui, sempre em dias.
 *
 * Por que duas chaves (`One` / `Many`) em vez do plural do i18next: as regras de
 * plural variam demais entre os 7 idiomas do app (o árabe tem seis formas) e uma
 * chave sufixada faltando cai em texto cru na tela. Duas chaves explícitas são
 * mais verbosas e 100% previsíveis — e cada idioma resolve a concordância dentro
 * da própria frase (en usa "7-day", pt usa "7 dias").
 */

import type { TFunction } from "i18next";

/** Ex.: "7 dias" (pt) · "7-day" (en) · "7 天" (zh). */
export function formatTrialDuration(days: number, t: TFunction): string {
  return days === 1
    ? t("paywall.trialDurationOne")
    : t("paywall.trialDurationMany", { days });
}
