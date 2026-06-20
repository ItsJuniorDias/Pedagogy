# 📊 Tracking de eventos com o Facebook / Meta SDK

Este projeto foi integrado ao **`react-native-fbsdk-next`** (o SDK oficial da
Meta para React Native, com config plugin do Expo) para rastrear instalações,
visualizações de conteúdo, conclusões, compras e mais.

---

## 1. O que foi adicionado

**Dependências (`package.json`)**

- `react-native-fbsdk-next` — SDK de App Events da Meta
- `expo-tracking-transparency` — pedido de ATT no iOS (necessário para
  atribuição no iOS 14.5+)

**Config plugins (`app.json`)**

- `react-native-fbsdk-next` — injeta App ID/Client Token, ativa auto-init e
  o auto-log de app events, e configura a permissão de tracking no iOS
- `expo-tracking-transparency` — mensagem do prompt de ATT

**Código novo**

- `lib/analytics.ts` — **camada única de tracking**. Encapsula o SDK e expõe
  funções tipadas e seguras (no-op automático na web e no Expo Go). É a única
  coisa que o resto do app importa.

**Pontos instrumentados**

| Evento | Onde dispara | Função |
| --- | --- | --- |
| Instalação + abertura do app | automático (SDK) | — |
| App Tracking Transparency (iOS) | `app/_layout.tsx` | `initAnalytics()` |
| **View** de história | `app/(details)/index.tsx` (ao abrir o leitor) | `trackContentView` |
| História aberta pela home | `app/(tabs)/index.tsx` | `trackContentOpen` |
| Capítulo concluído | `app/(details)/index.tsx` | `trackChapterCompleted` |
| História 100% concluída | `app/(details)/index.tsx` | `trackStoryCompleted` |
| Abertura de jogo | `app/(tabs)/index.tsx` | `trackGameOpen` |
| Paywall exibido | `app/(paywall)/index.tsx` | `trackPaywallView` |
| Checkout iniciado | `app/(paywall)/index.tsx` | `trackCheckoutInitiated` |
| **Compra/assinatura concluída** | `hooks/usePurchases.ts` | `trackSubscriptionStarted` |
| Onboarding concluído | `app/(onboarding)/index.tsx` | `trackOnboardingCompleted` |

> ℹ️ **Sobre "downloads":** o app não baixa arquivos hoje. As **instalações**
> do app já são contadas automaticamente pela Meta (auto-log de app events).
> Se um dia você adicionar "salvar/baixar para offline", já existe a função
> pronta `trackContentDownload(...)` em `lib/analytics.ts` — é só chamá-la no
> handler de download.

---

## 2. Configuração obrigatória (faça antes de buildar)

### 2.1. Crie um App no Facebook for Developers

1. Acesse <https://developers.facebook.com/apps> e crie um app.
2. Anote o **App ID** (número) e o **Client Token**
   (em *Settings → Advanced → Security → Client Token*).
3. Em *Settings → Basic*, adicione a plataforma **iOS** (Bundle ID:
   `com.alexandre-junior.pedagogy`) e **Android** (Package:
   `com.alexandrejunior.pedagogy`). Para Android, gere e cadastre os
   **key hashes** das suas keystores (debug e release).

### 2.2. Preencha as credenciais em `app.json`

No bloco do plugin `react-native-fbsdk-next`, substitua os placeholders:

```jsonc
[
  "react-native-fbsdk-next",
  {
    "appID": "SEU_APP_ID",                 // ← troque
    "clientToken": "SEU_CLIENT_TOKEN",     // ← troque
    "displayName": "Pedagogy",
    "scheme": "fbSEU_APP_ID",              // ← "fb" + App ID, ex.: "fb1234567890"
    "isAutoInitEnabled": true,
    "autoLogAppEventsEnabled": true,
    "advertiserIDCollectionEnabled": true,
    "iosUserTrackingPermission": "Usamos seus dados para medir a performance dos anúncios e melhorar a experiência no Pedagogy."
  }
]
```

> Os IDs ficam **só** no `app.json`. Com `isAutoInitEnabled: true`, o SDK lê
> esses valores da config nativa e se inicializa sozinho — você não precisa
> colar App ID/Client Token em nenhum lugar do código.

---

## 3. Como buildar e testar

⚠️ **O SDK do Facebook usa código nativo — NÃO funciona no Expo Go.** No Expo
Go (e na web) o `lib/analytics.ts` simplesmente não envia nada (vira no-op), e
o app continua funcionando normalmente. Para enviar eventos de verdade você
precisa de um **development build** ou **build de produção**.

```bash
# 1) Instale as dependências
npm install        # ou: bun install

# 2) Gere as pastas nativas a partir dos plugins
npx expo prebuild --clean

# 3) Rode num device/simulador (build nativo local)
npx expo run:ios
# ou
npx expo run:android
```

Ou, com **EAS Build**, use um perfil `development`/`production`.

### Ver os eventos chegando

- **Meta Events Manager → Test Events**: cole o *Advertiser ID* do device de
  teste para ver os eventos em tempo real.
- O painel normal (Events Manager) pode levar de minutos a algumas horas para
  consolidar.
- Em **dev**, o `lib/analytics.ts` também imprime no console
  (`[analytics:noop] ...`) quando está sem SDK nativo — útil para confirmar
  que os eventos estão sendo disparados nos lugares certos.

---

## 4. Usando o tracking em telas novas

Importe direto da camada única e chame a função do evento:

```ts
import { trackContentView, trackEvent } from "@/lib/analytics";

// Evento pronto:
trackContentView({ contentId: "dinosaurs", contentName: "Dinosaurs", contentType: "story" });

// Evento customizado (escotilha de escape):
trackEvent("share_tapped", { content_id: "dinosaurs", channel: "whatsapp" });
```

Funções disponíveis em `lib/analytics.ts`: `initAnalytics`, `trackContentView`,
`trackContentOpen`, `trackChapterCompleted`, `trackStoryCompleted`,
`trackGameOpen`, `trackPaywallView`, `trackCheckoutInitiated`,
`trackSubscriptionStarted`, `trackPurchase`, `trackOnboardingCompleted`,
`trackSearch`, `trackAchievementUnlocked`, `trackContentDownload`,
`trackEvent`, `setAnalyticsUserId`, `flushAnalytics`, `isAnalyticsActive`.

---

## 5. Privacidade

- No **iOS**, o `initAnalytics()` dispara o prompt de **App Tracking
  Transparency**. Só se o usuário aceitar é que o IDFA é usado para
  atribuição (`Settings.setAdvertiserTrackingEnabled(true)`).
- Como o app é da categoria **Kids**, revise as políticas de dados da Apple e
  da Meta antes de publicar. Se necessário, você pode desligar a coleta de
  advertiser ID (`advertiserIDCollectionEnabled: false`) e/ou não pedir ATT —
  o tracking de eventos de produto continua funcionando, apenas sem o IDFA.
- Lembre de declarar a coleta de dados no **App Privacy** da App Store e na
  Data Safety do Google Play.
