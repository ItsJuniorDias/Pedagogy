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
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ErrorCode, useIAP, type Product, type Purchase } from "expo-iap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Catálogo local ───────────────────────────────────────────────────────────
// Os SKUs precisam EXISTIR no App Store Connect com exatamente esses IDs
// (App Store Connect → seu app → In-App Purchases → tipo Consumable).
// O que vem da loja: preço, moeda, título localizado.
// O que fica no client: quantas moedas cada SKU vale.

export interface CoinPackMeta {
  coins: number;
  bonus: number;
  emoji: string;
  tag?: string;
  /** Preço exibido APENAS no modo simulado de dev. Em produção o preço
   *  real vem da loja (displayPrice). */
  devPrice: string;
}

export const COIN_PRODUCTS: Record<string, CoinPackMeta> = {
  coins_small: { coins: 400, bonus: 0, emoji: "🪙", devPrice: "$ 4,99" },
  coins_medium: { coins: 1200, bonus: 120, emoji: "💰", devPrice: "$ 12,90" },
  coins_large: {
    coins: 3500,
    bonus: 700,
    emoji: "🧰",
    tag: "MOST POPULAR",
    devPrice: "$ 29,90",
  },
  coins_mega: {
    coins: 9000,
    bonus: 3000,
    emoji: "🏆",
    tag: "BEST VALUE",
    devPrice: "$ 64,90",
  },
};

const SKUS = Object.keys(COIN_PRODUCTS);
const PROCESSED_KEY = "@happyfarm/iap/processed";

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCoinStore({ onCoinsGranted }: UseCoinStoreOptions) {
  const [purchasingSku, setPurchasingSku] = useState<string | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);

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

  const markProcessed = useCallback(async (txId: string) => {
    processedRef.current.add(txId);
    // mantém só os últimos 50 ids pra não crescer pra sempre
    const arr = [...processedRef.current].slice(-50);
    processedRef.current = new Set(arr);
    await AsyncStorage.setItem(PROCESSED_KEY, JSON.stringify(arr)).catch(
      () => {},
    );
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

        const meta = COIN_PRODUCTS[purchase.productId];
        const isNew = !processedRef.current.has(purchase.id);

        // ════════════════════════════════════════════════════════════
        // 🔒 PRODUÇÃO: valide o recibo no seu backend ANTES de creditar.
        //   - Envie purchase.purchaseToken (JWS do StoreKit 2) pro seu
        //     servidor → valide via App Store Server API.
        // Só siga adiante se o backend confirmar a compra.
        // ════════════════════════════════════════════════════════════

        if (meta && isNew) {
          // Credita ANTES de finalizar: se o app morrer entre os dois,
          // a loja re-entrega a compra e o dedupe evita crédito duplo.
          await markProcessed(purchase.id);
          grantedRef.current(meta.coins + meta.bonus, purchase.productId);
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

  // ── Busca os produtos quando conecta ────────────────────────────────────────

  useEffect(() => {
    if (!connected) return;

    fetchProducts({ skus: SKUS, type: "in-app" }).catch((e) => {
      console.warn("[IAP] fetchProducts falhou:", e);
      setStoreError("Não foi possível carregar a loja.");
    });
  }, [connected, fetchProducts]);

  // ── Merge: meta local + dados da loja ───────────────────────────────────────

  const packs: StorePack[] = useMemo(
    () =>
      SKUS.map((sku) => {
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
  };
}
