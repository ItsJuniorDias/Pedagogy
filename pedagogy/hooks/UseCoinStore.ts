/**
 * useCoinStore.ts — Loja de moedas com IAP real (expo-iap / App Store)
 *
 * Alvo: APENAS iOS / App Store (StoreKit 2).
 *
 * Fluxo:
 *  1. Conecta no StoreKit automaticamente via useIAP.
 *  2. Busca os produtos pelos SKUs → preços localizados vêm da LOJA
 *     (displayPrice já formatado: "R$ 4,99", "$0.99", "¥120"...).
 *  3. buy(sku) abre a sheet nativa de compra.
 *  4. onPurchaseSuccess: credita as moedas e dá finishTransaction
 *     (isConsumable: true → pode comprar de novo).
 *
 * Anti-duplicação: compras não finalizadas são re-entregues pelo
 * StoreKit ao abrir o app (é o comportamento correto — garante entrega).
 * Guardamos os últimos transaction ids processados no AsyncStorage pra
 * não creditar duas vezes.
 *
 * 🔒 PRODUÇÃO: o ideal é validar o recibo no SEU backend antes de
 * creditar (App Store Server API, ou o verifyPurchaseWithProvider do
 * expo-iap). Está marcado no código onde essa validação entra.
 *
 * ⚠️ DEV: IAP NÃO funciona no Expo Go. Em simulador, use um StoreKit
 * Configuration file no Xcode ou teste num iPhone físico com conta
 * sandbox. Quando a loja não retorna os produtos, o hook cai num modo
 * simulado (apenas em __DEV__) usando devPrice, pra você continuar
 * desenvolvendo.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 🐛 HISTÓRICO DE BUG (30/07/2026)
 * Os SKUs locais estavam no PLURAL (`coins_small`, `coins_medium`,
 * `coins_large`, `coins_mega`) mas os produtos aprovados no App Store
 * Connect estão no SINGULAR (`coin_small`, `coin_medium`, `coin_large`,
 * `coin_mega`). Resultado: fetchProducts() voltava vazio, TODOS os packs
 * caíam em `available: false` / displayPrice "—" em produção, e buy()
 * retornava cedo sem abrir a sheet. A loja de moedas estava 100% morta
 * em prod — sem nenhum erro visível na tela.
 *
 * O Product ID no App Store Connect é IMUTÁVEL depois de criado, então a
 * correção é aqui no client. Pra esse bug nunca mais passar silencioso,
 * o hook agora:
 *   • loga em DEV quais SKUs a loja NÃO reconheceu (assertSkusResolved)
 *   • mostra erro real na UI quando conecta mas resolve 0 produtos
 *   • tenta de novo (backoff) se o fetchProducts falhar
 * ─────────────────────────────────────────────────────────────────────
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ErrorCode, useIAP, type Product, type Purchase } from "expo-iap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Catálogo local ───────────────────────────────────────────────────────────
// Os SKUs precisam EXISTIR no App Store Connect com exatamente esses IDs
// (App Store Connect → seu app → In-App Purchases → tipo Consumable).
// O que vem da loja: preço, moeda, título localizado.
// O que fica no client: quantas moedas cada SKU vale.
//
// ⚠️ NÃO renomeie as chaves abaixo sem mudar no App Store Connect também.
//    Product ID no ASC é imutável — se divergir, a loja volta vazia.

export interface CoinPackMeta {
  coins: number;
  bonus: number;
  emoji: string;
  tag?: string;
  /** Preço exibido APENAS no modo simulado de dev. Em produção o preço
   *  real vem da loja (displayPrice). */
  devPrice: string;
  /** Preço de referência em USD — usado só pela trava de dev que garante
   *  que pacote maior = melhor valor por dólar. Não é cobrado nada com
   *  base nisso; o valor real vem sempre da loja. */
  refUsd: number;
}

/**
 * Ordem de exibição no Coin Market (menor → maior).
 * É a fonte da verdade dos SKUs: precisa ser idêntica ao Product ID
 * aprovado no App Store Connect.
 */
export const COIN_SKUS = [
  "coin_small",
  "coin_medium",
  "coin_large",
  "coin_mega",
] as const;

export type CoinSku = (typeof COIN_SKUS)[number];

// ─── Economia ─────────────────────────────────────────────────────────────────
// Os pacotes são calibrados contra a CURVA DE SEMENTES (data/crops.ts).
// O campo é 5×5 = 25 tiles, então "encher a fazenda" custa:
//   lvl 10 → 25 × 370   =   9 250 moedas
//   lvl 12 → 25 × 1 050 =  26 250 moedas
//   lvl 13 → 25 × 1 750 =  43 750 moedas
//   lvl 15 → 25 × 4 800 = 120 000 moedas
//
// Os valores ANTIGOS (400 / 1 320 / 4 200 / 12 000) foram desenhados pro
// early game e ficavam absurdos no late game: o pacote de US$ 4,99 não
// comprava NEM UMA semente de nível 14 (2 900) e o mega de US$ 64,90 dava
// só 2,5 sementes de nível 15. Ninguém paga US$ 64,90 por 2 sementes.
//
// Agora cada pacote tem uma âncora narrativa clara:
//   small  → um top-up (≈ 1 semente lendária)
//   medium → enche a fazenda no nível 10
//   large  → enche a fazenda no nível 12, com folga
//   mega   → enche a fazenda no nível 15 (o teto do jogo)

export const COIN_PRODUCTS: Record<CoinSku, CoinPackMeta> = {
  coin_small: {
    coins: 3_000,
    bonus: 0,
    emoji: "🪙",
    devPrice: "$ 4,99",
    refUsd: 4.99,
  },
  coin_medium: {
    coins: 9_000,
    bonus: 1_000,
    emoji: "💰",
    devPrice: "$ 12,90",
    refUsd: 12.9,
  },
  coin_large: {
    coins: 28_000,
    bonus: 7_000,
    emoji: "🧰",
    tag: "MOST POPULAR",
    devPrice: "$ 29,90",
    refUsd: 29.9,
  },
  coin_mega: {
    coins: 85_000,
    bonus: 35_000,
    emoji: "🏆",
    tag: "BEST VALUE",
    devPrice: "$ 64,90",
    refUsd: 64.9,
  },
};

const SKUS: string[] = [...COIN_SKUS];
const PROCESSED_KEY = "@happyfarm/iap/processed";

/** Quantas vezes tentar o fetchProducts antes de desistir. */
const FETCH_MAX_ATTEMPTS = 3;
/** Backoff entre tentativas (ms). */
const FETCH_BACKOFF_MS = [600, 1_800];

// ─── Invariante da escada de preço (validado em dev) ──────────────────────────
// Mesma ideia do assertLevelCurve() em data/crops.ts: se alguém rebalancear e
// quebrar a regra "pacote maior = mais moedas por dólar", estoura cedo em dev
// em vez de virar uma loja com valor invertido em produção.

export function assertCoinLadder(): void {
  let prevTotal = -1;
  let prevPerUsd = -1;
  for (const sku of COIN_SKUS) {
    const p = COIN_PRODUCTS[sku];
    const total = p.coins + p.bonus;
    const perUsd = total / p.refUsd;
    if (total <= prevTotal) {
      throw new Error(
        `[coins] "${sku}" não cresce em moedas (${total} <= ${prevTotal})`,
      );
    }
    if (perUsd <= prevPerUsd) {
      throw new Error(
        `[coins] "${sku}" tem valor por dólar pior que o pacote anterior ` +
          `(${perUsd.toFixed(0)} <= ${prevPerUsd.toFixed(0)} moedas/US$). ` +
          `Pacote maior tem que ser sempre o melhor negócio.`,
      );
    }
    prevTotal = total;
    prevPerUsd = perUsd;
  }
}

if (typeof __DEV__ !== "undefined" && __DEV__) assertCoinLadder();

// ─── Tipos expostos pra UI ────────────────────────────────────────────────────

export interface StorePack extends CoinPackMeta {
  sku: string;
  /** Preço localizado vindo da loja (ou devPrice no modo simulado). */
  displayPrice: string;
  /** false = produto não encontrado na loja e fora do modo dev. */
  available: boolean;
  /** true = modo simulado (dev sem loja). */
  simulated: boolean;
}

interface UseCoinStoreOptions {
  /** Chamado UMA vez por compra concluída, já dedupada. */
  onCoinsGranted: (coins: number, sku: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Id estável da transação. O expo-iap v4 expõe `id`, mas versões/plataformas
 * variam entre `id` e `transactionId` — cair pra undefined aqui significaria
 * dedupe quebrado (crédito duplo ou nenhum), então tentamos os dois.
 */
function txIdOf(purchase: Purchase): string | null {
  const p = purchase as unknown as Record<string, unknown>;
  const id = p.id ?? p.transactionId ?? p.originalTransactionIdentifierIOS;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/**
 * Grita em DEV quando a loja não reconhece algum SKU. É exatamente o cenário
 * que deixou a loja morta em produção sem nenhum sintoma na tela.
 */
function assertSkusResolved(products: Product[]): void {
  if (typeof __DEV__ === "undefined" || !__DEV__) return;
  if (products.length === 0) return; // ainda carregando / sem loja (Expo Go)

  const returned = new Set(products.map((p) => p.id));
  const missing = SKUS.filter((sku) => !returned.has(sku));
  if (missing.length > 0) {
    console.error(
      "[IAP] ⚠️ A loja NÃO reconheceu estes SKUs: " +
        missing.join(", ") +
        "\n     A loja devolveu: " +
        [...returned].join(", ") +
        "\n     Confira o Product ID exato em App Store Connect → " +
        "In-App Purchases. Product ID é case-sensitive e imutável.",
    );
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCoinStore({ onCoinsGranted }: UseCoinStoreOptions) {
  const [purchasingSku, setPurchasingSku] = useState<string | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);
  /** true depois que a busca de produtos terminou (com ou sem sucesso). */
  const [fetchDone, setFetchDone] = useState(false);
  /** incrementa pra forçar um novo fetch (botão "tentar de novo"). */
  const [reloadKey, setReloadKey] = useState(0);

  // Ref pro callback → listeners do useIAP nunca ficam stale
  const grantedRef = useRef(onCoinsGranted);
  grantedRef.current = onCoinsGranted;

  // ── Dedupe de transações já creditadas ──────────────────────────────────────

  const processedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    AsyncStorage.getItem(PROCESSED_KEY)
      .then((raw) => {
        if (raw) processedRef.current = new Set(JSON.parse(raw) as string[]);
      })
      .catch(() => {});
  }, []);

  const persistProcessed = useCallback(async () => {
    // mantém só os últimos 50 ids pra não crescer pra sempre
    const arr = [...processedRef.current].slice(-50);
    processedRef.current = new Set(arr);
    try {
      await AsyncStorage.setItem(PROCESSED_KEY, JSON.stringify(arr));
    } catch {
      // se não persistir, o pior caso é re-creditar numa reinstalação —
      // preferimos isso a perder a entrega do que o cliente pagou.
    }
  }, []);

  // ── Conexão + listeners (expo-iap) ──────────────────────────────────────────

  const {
    connected,
    products,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      try {
        // iOS pode entregar compras "pending" (ex.: Ask to Buy — criança
        // pede e o responsável aprova depois). NÃO credita nem finaliza —
        // a loja re-entrega quando o estado virar 'purchased'.
        if (purchase.purchaseState === "pending") {
          setStoreError(
            "Compra aguardando aprovação — as moedas chegam assim que for aprovada.",
          );
          return;
        }

        const meta = COIN_PRODUCTS[purchase.productId as CoinSku];
        const txId = txIdOf(purchase);

        if (!meta) {
          // Chegou uma compra de um SKU que o client não conhece. Não credita
          // (não sabe quanto), mas FINALIZA — senão a loja re-entrega pra
          // sempre e no Android viraria reembolso automático.
          console.warn(
            `[IAP] SKU desconhecido no catálogo local: "${purchase.productId}"`,
          );
        } else if (txId && !processedRef.current.has(txId)) {
          // ════════════════════════════════════════════════════════════
          // 🔒 PRODUÇÃO: valide o recibo no seu backend ANTES de creditar.
          //   - Envie purchase.purchaseToken (JWS do StoreKit 2) pro seu
          //     servidor → valide via App Store Server API.
          // Só siga adiante se o backend confirmar a compra.
          // ════════════════════════════════════════════════════════════

          // Marca ANTES de creditar pra fechar a janela de crédito duplo;
          // se o grant estourar, desmarca e deixa a loja re-entregar.
          processedRef.current.add(txId);
          try {
            grantedRef.current(meta.coins + meta.bonus, purchase.productId);
            await persistProcessed();
          } catch (e) {
            processedRef.current.delete(txId);
            throw e;
          }
        }

        // Consumível: finishTransaction "consome" e libera nova compra
        // do mesmo SKU. Sem isso o Android reembolsa em ~3 dias!
        await finishTransaction({ purchase, isConsumable: true });
      } catch (e) {
        console.warn("[IAP] Erro ao concluir compra:", e);
      } finally {
        setPurchasingSku(null);
      }
    },
    onPurchaseError: (error) => {
      setPurchasingSku(null);
      if (error.code === ErrorCode.UserCancelled) return; // usuário desistiu
      setStoreError(error.message ?? "Não foi possível concluir a compra.");
    },
  });

  // ── Busca os produtos quando conecta (com retry) ─────────────────────────────
  // Antes: uma tentativa só. Um soluço de rede na hora de abrir o app deixava
  // a loja vazia pelo resto da sessão, sem nenhuma mensagem pro usuário.

  useEffect(() => {
    if (!connected) return;

    let cancelled = false;

    (async () => {
      setFetchDone(false);
      for (let attempt = 0; attempt < FETCH_MAX_ATTEMPTS; attempt++) {
        if (cancelled) return;
        try {
          await fetchProducts({ skus: SKUS, type: "in-app" });
          if (cancelled) return;
          setStoreError(null);
          setFetchDone(true);
          return;
        } catch (e) {
          console.warn(
            `[IAP] fetchProducts falhou (tentativa ${attempt + 1}/${FETCH_MAX_ATTEMPTS}):`,
            e,
          );
          const backoff = FETCH_BACKOFF_MS[attempt];
          if (backoff != null) await sleep(backoff);
        }
      }
      if (cancelled) return;
      setFetchDone(true);
      setStoreError("Não foi possível carregar a loja. Tente de novo.");
    })();

    return () => {
      cancelled = true;
    };
  }, [connected, fetchProducts, reloadKey]);

  // ── Diagnóstico: SKU que a loja não reconheceu (dev) ────────────────────────

  useEffect(() => {
    assertSkusResolved(products);
  }, [products]);

  // ── Erro real quando conecta mas resolve 0 produtos ─────────────────────────
  // Este é o sintoma que faltava: antes ficava só "—" no preço, sem explicação.

  useEffect(() => {
    if (typeof __DEV__ !== "undefined" && __DEV__) return; // dev cai no simulado
    if (!connected || !fetchDone) return;
    if (products.length > 0) return;
    setStoreError(
      "A loja está indisponível agora. Nenhum pacote pôde ser carregado.",
    );
  }, [connected, fetchDone, products.length]);

  // ── Merge: meta local + dados da loja ───────────────────────────────────────

  const packs: StorePack[] = useMemo(
    () =>
      COIN_SKUS.map((sku) => {
        const meta = COIN_PRODUCTS[sku];
        const product = products.find((p: Product) => p.id === sku);
        if (product) {
          return {
            sku,
            ...meta,
            displayPrice: product.displayPrice, // 💵 preço REAL da loja
            available: true,
            simulated: false,
          };
        }
        // Loja não retornou o produto: em dev simulamos; em prod some.
        return {
          sku,
          ...meta,
          displayPrice: __DEV__ ? meta.devPrice : "—",
          available: __DEV__,
          simulated: true,
        };
      }),
    [products],
  );

  // ── Comprar ─────────────────────────────────────────────────────────────────

  const buy = useCallback(
    (sku: string) => {
      if (purchasingSku) return;
      setStoreError(null);
      const pack = packs.find((p) => p.sku === sku);
      if (!pack || !pack.available) return;

      // Modo simulado (apenas dev / Expo Go)
      if (pack.simulated) {
        if (!__DEV__) return;
        setPurchasingSku(sku);
        setTimeout(() => {
          grantedRef.current(pack.coins + pack.bonus, sku);
          setPurchasingSku(null);
        }, 900);
        return;
      }

      // Fluxo real — abre a sheet nativa do App Store (StoreKit 2).
      // Resultado chega via onPurchaseSuccess / onPurchaseError.
      setPurchasingSku(sku);
      requestPurchase({
        request: {
          apple: { sku },
        },
        type: "in-app",
      }).catch((e) => {
        setPurchasingSku(null);
        console.warn("[IAP] requestPurchase falhou:", e);
      });
    },
    [purchasingSku, packs, requestPurchase],
  );

  /** Tenta buscar os produtos de novo (botão "tentar de novo" no mercado). */
  const reload = useCallback(() => {
    setStoreError(null);
    setReloadKey((k) => k + 1);
  }, []);

  return {
    /** true quando o billing nativo está pronto */
    connected,
    /** pacotes com preço localizado da loja */
    packs,
    /** inicia a compra de um SKU */
    buy,
    /** SKU em compra no momento (null = idle) */
    purchasingSku,
    /** última mensagem de erro amigável (null = sem erro) */
    storeError,
    /** limpa o erro exibido */
    clearError: () => setStoreError(null),
    /** true = a busca de produtos já terminou (com ou sem sucesso) */
    fetchDone,
    /** força uma nova busca de produtos */
    reload,
  };
}
