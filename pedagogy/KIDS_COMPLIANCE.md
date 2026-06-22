# ✅ Conformidade com a categoria Kids — remoção do SDK do Facebook/Meta

Este projeto **estava sendo rejeitado** pela App Store com a **Guideline 1.3 –
Safety – Kids Category**, porque continha SDK de analytics/publicidade de
terceiros com capacidade de coletar/transmitir informação de dispositivo
(incluindo o IDFA) para terceiros. Apps da categoria infantil não podem fazer
isso — basta a *capacidade* existir no binário para a revisão reprovar.

## O que foi removido

| Item | Onde | Por quê |
| --- | --- | --- |
| `react-native-fbsdk-next` | `package.json` (dependência) | SDK de App Events da Meta — analytics/ads de terceiros, referencia `ASIdentifierManager`/IDFA |
| Plugin `react-native-fbsdk-next` | `app.json` (`plugins`) | Injetava o pod nativo do Facebook, o esquema de URL `fb<appID>`, App ID/Client Token e a coleta de advertiser ID no build |
| `expo-tracking-transparency` | `package.json` + `app.json` | Prompt de ATT/IDFA — a Apple **rejeita explicitamente** ATT em apps Kids |
| Credenciais do FB | `app.json` | App ID `933286406435568`, Client Token, `iosUserTrackingPermission` |
| Código do SDK | `lib/analytics.ts` | `AppEventsLogger`, `Settings.setAdvertiserTrackingEnabled`, `setAdvertiserIDCollectionEnabled`, require do fbsdk e do tracking-transparency |
| `FACEBOOK_TRACKING.md` | raiz | Documentação da integração removida |

## O que foi PRESERVADO (app continua funcionando igual)

`lib/analytics.ts` mantém **exatamente a mesma API pública** (mesmos nomes e
assinaturas de função). Todas as funções viraram **no-ops locais**: não enviam
nada para fora do app (em modo dev, imprimem `[analytics:noop] ...` no console).
Por isso **nenhuma tela precisou ser alterada** — `_layout.tsx`,
`(details)`, `(tabs)`, `(paywall)`, `(onboarding)` e `hooks/usePurchases.ts`
seguem importando e chamando as mesmas funções normalmente.

Funções mantidas: `initAnalytics`, `isAnalyticsActive`, `trackEvent`,
`trackPurchase`, `setAnalyticsUserId`, `flushAnalytics`, `trackContentView`,
`trackContentOpen`, `trackChapterCompleted`, `trackStoryCompleted`,
`trackGameOpen`, `trackPaywallView`, `trackCheckoutInitiated`,
`trackSubscriptionStarted`, `trackOnboardingCompleted`, `trackSearch`,
`trackAchievementUnlocked`, `trackContentDownload`, `AnalyticsEvent`.

## ⚠️ Passos OBRIGATÓRIOS antes de reenviar para revisão

O código nativo do Facebook só é injetado durante o `expo prebuild`. Se você já
tem uma pasta `ios/` (ou `android/`) gerada do build rejeitado, **ela ainda tem
o pod do Facebook**. Regenere do zero:

```bash
# 1) Reinstale as dependências (lockfile re-sincroniza sem o fbsdk)
bun install            # ou: npm install

# 2) APAGUE as pastas nativas antigas e regenere a partir do app.json limpo
rm -rf ios android
npx expo prebuild --clean

# 3) (iOS) Confirme que NÃO sobrou nada do Facebook no projeto nativo:
grep -ri "ASIdentifierManager\|AdSupport\|FBSDK\|fbsdk\|facebook" ios || echo "OK: limpo"

# 4) Build de produção (EAS) ou local
npx expo run:ios       # teste local
# eas build -p ios --profile production
```

No App Store Connect, responda ao revisor algo como: *"Removemos o SDK de
terceiros (Meta/Facebook) e o App Tracking Transparency. O app não coleta,
transmite nem tem a capacidade de compartilhar informação pessoal ou de
dispositivo (incluindo IDFA) com terceiros."*

## Observações

- **RevenueCat (`react-native-purchases`)**: por padrão **não** coleta IDFA.
  Apenas garanta que você **não** chama `Purchases.collectDeviceIdentifiers()`
  nem habilita coleta de advertiser ID. (Não há nenhuma chamada dessas no
  projeto.)
- **App Privacy / Data Safety**: revise as declarações de coleta de dados nas
  lojas, já que não há mais envio de dados a terceiros.
- Se um dia quiser métricas, use uma solução de **primeira parte** (seu próprio
  backend) ou analytics **self-hosted** que comprovadamente não colete IDFA nem
  info de dispositivo — sem reintroduzir SDKs de terceiros.
