/**
 * ─── PAYWALL · PROVA SOCIAL ──────────────────────────────────────────────────
 *
 * Numa compra em que quem PAGA não é quem USA, o pai precisa de um sinal
 * externo de que outros pais aprovaram. É o elemento que mais falta na tela
 * hoje — e também o mais fácil de fazer errado.
 *
 * ⚠️ REGRA INEGOCIÁVEL: aqui só entra número REAL, verificável na página do app
 * na App Store (id6776011454). Depoimento inventado, "+10 mil famílias" sem
 * lastro ou nota arredondada para cima são conteúdo enganoso — App Review
 * Guideline 2.3 — e motivo de rejeição/remoção.
 *
 * Enquanto `APP_STORE_RATING` for `null`, o bloco simplesmente NÃO renderiza:
 * a tela continua íntegra, sem buraco visual. Assim que você tiver avaliações
 * de verdade, preencha os dois campos abaixo e o componente aparece sozinho.
 *
 * Sugestão de manutenção: revise este arquivo a cada release, porque nota e
 * contagem mudam — número desatualizado também é número errado.
 */

export interface AppStoreRating {
  /** Nota exibida na App Store (ex.: 4.8). Máx. 1 casa decimal. */
  rating: number;
  /** Quantidade de avaliações. Use o número exato, não arredonde para cima. */
  count: number;
}

/** Preencha com o dado REAL da App Store. Deixe `null` para não exibir nada. */
// export const APP_STORE_RATING: AppStoreRating | null = null;

export const APP_STORE_RATING: AppStoreRating | null = {
  rating: 5.0,
  count: 1,
};

/** Converte a nota em 5 glifos (arredonda para o inteiro mais próximo, para
 *  cima ou para baixo — nunca "sempre para cima"). */
export function ratingStars(rating: number): string {
  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.round(clamped);
  return "★".repeat(full) + "☆".repeat(5 - full);
}
