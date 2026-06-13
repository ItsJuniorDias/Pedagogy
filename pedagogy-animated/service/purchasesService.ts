/**
 * purchasesService.ts
 * Camada de serviço para o RevenueCat (react-native-purchases).
 *
 * Responsabilidades:
 *  - Inicializar o SDK com as chaves de API (iOS / Android)
 *  - Buscar offerings e packages disponíveis
 *  - Executar compra de um package
 *  - Restaurar compras
 *  - Verificar status de entitlement do usuário
 *  - Identificar / resetar o usuário (login/logout)
 */

import { Platform } from "react-native";

import Purchases, {
  CustomerInfo,
  MakePurchaseResult,
  PurchasesPackage as Package,
  PurchasesOffering,
} from "react-native-purchases";

// ─── Constantes ────────────────────────────────────────────────────────────────

/**
 * Substitua pelos seus API Keys do dashboard RevenueCat.
 * https://app.revenuecat.com → Project → API Keys
 */
const API_KEYS = {
  ios: "appl_mtQxhkHThWIqgHmfZtKwaGnhVqM",
};

/**
 * Identificador do entitlement configurado no RevenueCat.
 * Ex.: "pro", "premium", "all_access"
 */
export const ENTITLEMENT_ID = "premium";

// ─── Inicialização ─────────────────────────────────────────────────────────────

/**
 * Deve ser chamado 1× ao iniciar o app, antes de qualquer outra chamada.
 * Coloque em _layout.tsx (root) ou App.tsx.
 *
 * @param userId  ID do usuário autenticado (opcional).
 *                Passe `undefined` para usuário anônimo.
 */
export function initializePurchases(userId?: string): void {
  const apiKey = Platform.OS === "ios" ? API_KEYS.ios : "";

  if (userId) {
    Purchases.configure({ apiKey, appUserID: userId });
  } else {
    Purchases.configure({ apiKey });
  }
}

// ─── Offerings ────────────────────────────────────────────────────────────────

/**
 * Busca o Offering atual configurado no dashboard RevenueCat.
 * Retorna `null` se não houver offering disponível.
 */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

/**
 * Retorna todos os packages do offering atual.
 * Útil para montar a UI de planos dinamicamente.
 */
export async function getAvailablePackages(): Promise<Package[]> {
  const offering = await getCurrentOffering();
  return offering?.availablePackages ?? [];
}

// ─── Compra ───────────────────────────────────────────────────────────────────

/**
 * Executa a compra de um Package e retorna o CustomerInfo atualizado.
 *
 * @throws  Lança erro com `.userCancelled = true` se o usuário cancelou.
 *          Trate separadamente para não exibir mensagem de erro.
 */
export async function purchasePackage(
  pkg: Package,
): Promise<MakePurchaseResult> {
  return Purchases.purchasePackage(pkg);
}

// ─── Restore ─────────────────────────────────────────────────────────────────

/**
 * Restaura compras anteriores do usuário (obrigatório nas guidelines da Apple).
 * Retorna CustomerInfo com os entitlements restaurados.
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

// ─── Verificação de status ────────────────────────────────────────────────────

/**
 * Retorna true se o usuário tiver o entitlement ativo.
 */
export async function isSubscriptionActive(): Promise<boolean> {
  const customerInfo = await Purchases.getCustomerInfo();
  return isEntitlementActive(customerInfo);
}

/**
 * Helper puro: extrai status do entitlement a partir de um CustomerInfo já obtido.
 */
export function isEntitlementActive(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

/**
 * Retorna o CustomerInfo completo do usuário atual.
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}
