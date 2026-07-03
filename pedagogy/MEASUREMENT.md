# 📊 Medição de conversão — Pedagogy

Guia prático do que olhar para **medir e melhorar a conversão**, sem quebrar a
categoria Kids (nada de SDK de analytics de terceiro, nada de IDFA).

Há duas metades no funil. Uma o RevenueCat já mede sozinho; a outra depende de
um passo opt-in.

---

## 1. Funil de assinatura → **RevenueCat (já ligado, zero código)**

Toda compra passa por `Purchases.purchasePackage(...)` (em `usePurchases.ts`),
então o RevenueCat **já registra** todo o ciclo de assinatura no dashboard dele.
Não precisa implementar nada — só abrir e olhar.

👉 https://app.revenuecat.com → seu projeto → **Charts** / **Overview**

O que acompanhar:

| Métrica | Onde | Por que importa |
|---|---|---|
| **Trial Start → Paid Conversion** | Charts → *Trial Conversion* | O número mais importante do trial. Abaixo de ~30–40% é sinal de fricção. |
| **Active Trials / Active Subscriptions** | Overview | Quantos estão no período grátis vs. pagando. |
| **MRR / Revenue** | Overview | Receita recorrente e tendência. |
| **Churn / Renewal Rate** | Charts → *Churn* | Se renova mal, o problema é retenção de conteúdo, não o paywall. |
| **Conversion by Product** | Charts (filtro por produto) | Anual vs. mensal — valida se a âncora de preço/mês está funcionando. |
| **Refunds** | Charts → *Refunds* | Pico de reembolso costuma indicar bug de entitlement (ver nota abaixo). |

> ⚠️ **Nota de integridade:** o app hoje libera premium lendo a flag
> `@subscription_status` do AsyncStorage, não o entitlement do RevenueCat. Isso
> distorce parte dessas métricas (assinatura expirada continua com acesso; quem
> paga em outro device fica trancado → reembolso). Trocar o gating para
> `customerInfo.entitlements.active` é o próximo passo de maior impacto.

---

## 2. Funil **pré-compra** → primeira-parte (opt-in)

O RevenueCat **não enxerga** o que acontece *antes* da compra:

```
paywall visto  →  checkout iniciado  →  [ compra ]
     ▲                    ▲                  ▲
  só você mede        só você mede       RevenueCat mede
```

Sem isso você não sabe se o problema é **ninguém chega no paywall**, **chega e
não toca em assinar**, ou **toca e desiste no checkout da Apple**. Cada um pede
uma correção diferente.

### Como ligar (compatível com Kids)

O app já dispara os eventos certos — eles só não saem do aparelho ainda. Em
`lib/analytics.ts`:

```ts
const ANALYTICS_ENDPOINT = ""; // ← coloque a URL do SEU backend aqui
```

Aponte para uma rota **sua** (first-party — ex.: um endpoint no seu backend). A
partir daí os eventos são enviados via `POST` para você. Enquanto ficar vazio, é
100% no-op e nada muda.

**Regras Kids (não negociáveis):** envie só nome do evento + parâmetros
não-pessoais (productId, preço, moeda, `source`). **Nunca** IDFA, nem
identificador de device/usuário. É primeira-parte, sem SDK de terceiro.

### Eventos já instrumentados

| Evento | Onde dispara | Serve para |
|---|---|---|
| `paywall_view` | abertura de `app/(paywall)` | topo do funil pré-compra |
| `checkout_initiated` | toque em "Assinar" | intenção de compra |
| `subscribe` / `start_trial` | compra concluída | fecha o funil (bate com o RevenueCat) |
| `tutorial_completed` | fim do onboarding | onde caem antes do paywall |
| `content_open`, `chapter_completed`, `story_completed` | leitura | engajamento → prediz retenção |

### Payload de exemplo que seu backend receberia

```json
{ "event": "checkout_initiated",
  "params": { "content_id": "annual_xyz", "value": 99.9, "currency": "BRL" },
  "ts": 1719950000000 }
```

---

## 3. As três taxas para vigiar toda semana

1. **onboarding → paywall_view** — quantos chegam a ver a oferta.
2. **paywall_view → checkout_initiated** — força do paywall (copy, preço, âncora).
   *É exatamente o trecho que as mudanças de preço/mês + desconto atacam.*
3. **checkout_initiated → subscribe** (trial conversion, do RevenueCat) — se cai
   aqui, é preço/plano ou fricção no checkout da Apple.

Otimize sempre a etapa com **maior queda**, não a que for mais fácil de mexer.
