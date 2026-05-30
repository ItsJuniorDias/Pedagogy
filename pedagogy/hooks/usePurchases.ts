/**
 * usePurchases.ts
 * Hook central para gerenciar assinaturas com RevenueCat.
 *
 * Fornece:
 *  - Estado de loading, erro e status do entitlement
 *  - Lista de packages disponíveis
 *  - Funções: purchase, restore, refresh
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Purchases, {
  CustomerInfo,
  PurchasesPackage as Package,
} from "react-native-purchases";

import {
  getAvailablePackages,
  getCustomerInfo,
  isEntitlementActive,
  purchasePackage,
  restorePurchases,
} from "../service/purchasesService";

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type PurchaseState =
  | "idle"
  | "loading"
  | "purchasing"
  | "restoring"
  | "success"
  | "cancelled"
  | "error";

export interface UsePurchasesReturn {
  /** Packages disponíveis para compra */
  packages: Package[];
  /** Status do fluxo de compra */
  state: PurchaseState;
  /** Mensagem de erro (quando state === 'error') */
  error: string | null;
  /** Se o usuário possui entitlement ativo */
  isSubscribed: boolean;
  /** CustomerInfo completo do RevenueCat */
  customerInfo: CustomerInfo | null;
  /** Inicia compra de um package */
  purchase: (pkg: Package) => Promise<boolean>;
  /** Restaura compras anteriores */
  restore: () => Promise<boolean>;
  /** Recarrega packages e status */
  refresh: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePurchases(): UsePurchasesReturn {
  const [packages, setPackages] = useState<Package[]>([]);
  const [state, setState] = useState<PurchaseState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  // Listener de atualizações em tempo real (webhook / background renewal)
  const listenerRef = useRef<((info: CustomerInfo) => void) | null>(null);

  // ── Atualiza estado a partir de CustomerInfo ───────────────────────────────
  const applyCustomerInfo = useCallback((info: CustomerInfo) => {
    setCustomerInfo(info);
    setIsSubscribed(isEntitlementActive(info));
  }, []);

  // ── Carregamento inicial ───────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setState("loading");
    setError(null);

    try {
      const [pkgs, info] = await Promise.all([
        getAvailablePackages(),
        getCustomerInfo(),
      ]);

      setPackages(pkgs);
      applyCustomerInfo(info);
      setState("idle");
    } catch (err: any) {
      setError(err?.message ?? "Failed to load subscription data.");
      setState("error");
    }
  }, [applyCustomerInfo]);

  useEffect(() => {
    refresh();

    // Registra listener para renovações em background
    listenerRef.current = (info: CustomerInfo) => {
      applyCustomerInfo(info);
    };
    Purchases.addCustomerInfoUpdateListener(listenerRef.current);

    return () => {
      if (listenerRef.current) {
        Purchases.removeCustomerInfoUpdateListener(listenerRef.current);
      }
    };
  }, [refresh, applyCustomerInfo]);

  // ── Compra ─────────────────────────────────────────────────────────────────

  /**
   * Executa a compra de um package.
   * @returns `true` se bem-sucedido, `false` se cancelado ou erro.
   */
  const purchase = useCallback(
    async (pkg: Package): Promise<boolean> => {
      setState("purchasing");
      setError(null);

      try {
        const result = await purchasePackage(pkg);
        applyCustomerInfo(result.customerInfo);

        const success = isEntitlementActive(result.customerInfo);
        setState(success ? "success" : "error");
        return success;
      } catch (err: any) {
        // Usuário cancelou: não é erro — não mostra mensagem de erro
        if (err?.userCancelled) {
          setState("cancelled");
          return false;
        }

        const message = err?.message ?? "Purchase failed. Please try again.";
        setError(message);
        setState("error");
        return false;
      }
    },
    [applyCustomerInfo],
  );

  // ── Restore ────────────────────────────────────────────────────────────────

  /**
   * Restaura compras anteriores.
   * @returns `true` se encontrou entitlement ativo.
   */
  const restore = useCallback(async (): Promise<boolean> => {
    setState("restoring");
    setError(null);

    try {
      const info = await restorePurchases();
      applyCustomerInfo(info);

      const found = isEntitlementActive(info);
      setState(found ? "success" : "idle");
      return found;
    } catch (err: any) {
      setError(err?.message ?? "Restore failed. Please try again.");
      setState("error");
      return false;
    }
  }, [applyCustomerInfo]);

  return {
    packages,
    state,
    error,
    isSubscribed,
    customerInfo,
    purchase,
    restore,
    refresh,
  };
}
