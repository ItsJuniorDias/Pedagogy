/**
 * ─── PAYWALL · PRICING ───────────────────────────────────────────────────────
 * Helpers PUROS de preço e teste grátis. Nenhum deles inventa número: tudo sai
 * do `product` que o RevenueCat devolve (StoreKit). Quando o dado não existe,
 * a função retorna `null` e a UI simplesmente não renderiza aquele elemento —
 * regra que evita conteúdo enganoso (App Review Guideline 2.3) e propaganda
 * comparativa irregular (CDC art. 37 / Diretiva 2005/29/CE na UE).
 */

import {
  PACKAGE_TYPE,
  PurchasesPackage as Package,
} from "react-native-purchases";

// ─── MOEDA ───────────────────────────────────────────────────────────────────

/** Formata um valor na moeda do próprio produto (Intl existe no Hermes do SDK
 *  54; o fallback cobre engines antigas). */
export function formatMoney(value: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currencyCode}`;
  }
}

// ─── PLANOS ──────────────────────────────────────────────────────────────────

export function findAnnual(packages: Package[]): Package | null {
  return packages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ?? null;
}

export function findMonthly(packages: Package[]): Package | null {
  return packages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY) ?? null;
}

export function isHighlightedPackage(pkg: Package): boolean {
  return pkg.packageType === PACKAGE_TYPE.ANNUAL;
}

/**
 * Ordena os planos para que o ANUAL apareça primeiro.
 * O primeiro card é o que recebe mais atenção; deixá-lo com o plano que já vem
 * pré-selecionado elimina a incoerência de "selecionado ≠ primeiro".
 */
export function sortPackagesForDisplay(packages: Package[]): Package[] {
  const weight = (p: Package) => (p.packageType === PACKAGE_TYPE.ANNUAL ? 0 : 1);
  return [...packages].sort((a, b) => weight(a) - weight(b));
}

/** Preço mensal equivalente de um pacote ANUAL. Prefere o valor já formatado
 *  pelo RevenueCat (`pricePerMonthString`); se não vier, divide por 12. */
export function getAnnualPerMonth(pkg: Package): string | null {
  if (pkg.packageType !== PACKAGE_TYPE.ANNUAL) return null;
  const rcPerMonth = (pkg.product as { pricePerMonthString?: string | null })
    .pricePerMonthString;
  if (rcPerMonth) return rcPerMonth;
  if (typeof pkg.product.price === "number" && pkg.product.price > 0) {
    return formatMoney(pkg.product.price / 12, pkg.product.currencyCode);
  }
  return null;
}

/** % de economia do anual vs. o mensal. `null` se algum dos dois não existir
 *  ou se o anual não for de fato mais barato por mês. */
export function getAnnualSavingsPct(packages: Package[]): number | null {
  const annual = findAnnual(packages);
  const monthly = findMonthly(packages);
  if (!annual || !monthly) return null;
  const perMonth = annual.product.price / 12;
  const monthlyPrice = monthly.product.price;
  if (!(monthlyPrice > 0) || perMonth >= monthlyPrice) return null;
  return Math.round((1 - perMonth / monthlyPrice) * 100);
}

/**
 * ÂNCORA DE PREÇO — o custo de 12 meses no plano MENSAL, formatado.
 *
 * É o número que o usuário pagaria comprando mensal por um ano; exibido riscado
 * ao lado do anual, transforma "Economize 44%" (afirmação) em aritmética que o
 * pai confere sozinho (`R$ 718,80` → `R$ 399,90`). Rotule SEMPRE como "12× o
 * mensal" — nunca como "de/por", que sugeriria um preço anterior que não
 * existiu.
 *
 * Retorna `null` se não houver plano mensal, se as moedas divergirem, ou se o
 * anual não for realmente mais barato.
 */
export function getAnnualAnchorPrice(packages: Package[]): string | null {
  const annual = findAnnual(packages);
  const monthly = findMonthly(packages);
  if (!annual || !monthly) return null;
  if (annual.product.currencyCode !== monthly.product.currencyCode) return null;
  const twelveMonths = monthly.product.price * 12;
  if (!(twelveMonths > annual.product.price)) return null;
  return formatMoney(twelveMonths, monthly.product.currencyCode);
}

// ─── TESTE GRÁTIS ────────────────────────────────────────────────────────────

export interface TrialInfo {
  /** Duração normalizada em dias (7, 14, 30…). */
  days: number;
  /** Quantidade crua vinda da loja (ex.: 1). */
  count: number;
  /** Unidade normalizada para as chaves de i18n. */
  unit: "day" | "week" | "month" | "year";
}

/**
 * Só considera teste GRÁTIS (`introPrice.price === 0`).
 *
 * ⚠️ A versão anterior desta tela tratava QUALQUER `introPrice` como "grátis" —
 * um preço promocional de entrada (ex.: primeiro mês por R$ 9,90) apareceria
 * como "1 mês grátis". Isso é cobrança inesperada para o usuário e conteúdo
 * enganoso para a App Review.
 */
export function getTrialInfo(pkg: Package | null): TrialInfo | null {
  const intro = pkg?.product.introPrice;
  if (!intro) return null;
  if (typeof intro.price === "number" && intro.price > 0) return null;

  const raw = String(intro.periodUnit ?? "").toLowerCase();
  const unit = (
    ["day", "week", "month", "year"].includes(raw) ? raw : "day"
  ) as TrialInfo["unit"];

  const count = intro.periodNumberOfUnits ?? 0;
  if (count <= 0) return null;

  const perUnit = { day: 1, week: 7, month: 30, year: 365 } as const;
  return { days: count * perUnit[unit], count, unit };
}

/**
 * Dia em que a timeline avisa que o teste está acabando.
 * Dois dias antes do fim, sempre ≥ 1 (num teste de 1–3 dias vira o dia 1).
 */
export function getTrialReminderDay(days: number): number {
  return Math.max(1, days - 2);
}
