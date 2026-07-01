# 🌍 Sistema de i18n — Pedagogy Kids Books

Tradução do app para os **6 idiomas mais falados do mundo** + **português**.

## Idiomas incluídos (7)

| Código | Idioma | Nativo | Direção |
|--------|--------|--------|---------|
| `pt` | Português | Português | LTR |
| `en` | Inglês | English | LTR |
| `es` | Espanhol | Español | LTR |
| `fr` | Francês | Français | LTR |
| `zh` | Mandarim | 中文 | LTR |
| `hi` | Hindi | हिन्दी | LTR |
| `ar` | Árabe | العربية | **RTL** |

> **Por que 7 e não 6?** As 6 línguas mais faladas do mundo (por total de falantes)
> são inglês, mandarim, hindi, espanhol, francês e árabe. Adicionei **português**
> porque o app é BR e roda campanhas de Meta Ads no mercado brasileiro — sem ele,
> o público principal ficaria de fora. Se quiser só as 6, é só remover o bloco `pt`
> de `lib/i18n/languages.ts` e apagar `lib/i18n/locales/pt.json`.

---

## 1. Instalação

Como isto se sobrepõe ao projeto existente, primeiro **extraia o zip na raiz do projeto**
(ele preserva a estrutura de pastas). Depois instale as dependências:

```bash
# expo-localization é módulo NATIVO — deixe o Expo escolher a versão da sua SDK
npx expo install expo-localization

# i18next + react-i18next são JS puro
bun add i18next react-i18next
```

As versões já estão fixadas no `package.json`:
`i18next ^26.3.4`, `react-i18next ^17.0.8`, `expo-localization ~17.0.9` (build da SDK 54).

### Rebuild nativo (obrigatório por causa do expo-localization)

```bash
npx expo prebuild --clean
npx expo run:ios      # ou run:android
```

> **Importante:** `expo-localization` tem código nativo. O `index.ts` já protege o
> `require` num try/catch, então o app **não quebra** se você rodar só o bundle JS
> antes do rebuild — ele apenas cai no idioma padrão até o próximo build nativo.

---

## 2. O que já está traduzido (nos 7 idiomas)

**Funil de conversão completo + perfil** — o caminho de maior valor para expansão internacional:

- **Onboarding** inteiro (3 slides: badges, títulos, descrições, botões)
- **Paywall** inteiro — hero, features, planos (rótulos e períodos), teste grátis,
  selos de confiança, CTA, restaurar compras, letra miúda com links de Termos/Privacidade,
  e **todos os alerts** (compra ativa, erro, restauração, etc.)
- **Tabs** (Home / Library)
- **Tela de Perfil inteira** — título, nome, nível, stats, badges
- **Linha de seleção de idioma** no perfil (abre o bottom-sheet)
- **Card "Esta semana"** — título, dias da semana e tempo de leitura

O idioma escolhido é **salvo no AsyncStorage** e reaplicado no boot. Na primeira
abertura, o app tenta detectar o idioma do aparelho (`pt-BR` → português, etc.);
se não bater com nenhum suportado, usa o padrão.

**Cluster da Home (2ª leva — feito)** — a aba Home inteira + tudo que os links
"Ver tudo" dela alcançam:

- **Home** (`app/(tabs)/index.tsx`) — saudação, banner, ícones de navegação, chips,
  seções Favoritos / Learning Path / Games e estados vazios. As armadilhas foram
  tratadas: `CHIPS` virou objeto com **chave de filtro estável** (`cat`) separada do
  rótulo; `INTERESTS`, `LEARNING_PATHS` e `GAMES` ganharam `i18nKey`/`tagKey` **só de
  exibição** — `title` (slug + storage via `resolveStoryId`), `category` (rota) e
  `gameName` (analytics) continuam estáveis em inglês.
- **games-all** (`app/(games-all)/index.tsx`) — namespace compartilhado `games.*`.
- **learning-all** (`app/(learning-all)/index.tsx`) — namespace compartilhado `paths.*`;
  filtros por índice (rótulo traduzido não afeta a lógica).
- **stories** (`app/(stories)/index.tsx`) — header, hero, chip "All" e rótulos
  `chapters`/`Ages` (as tags dinâmicas vêm dos mocks e **não** são traduzidas).

Namespaces novos: `home`, `games` (compart.), `paths` (compart.), `learningAll`,
`stories`, `common.seeAll`. Injetados por
`scripts/i18n-add-home-games-learning-stories.mjs` (idempotente, mesmo padrão).

**Cluster de leitura + jogos arcade (3ª leva — feito)** — via
`scripts/i18n-add-library-details-games.mjs` (idempotente):

- **Library** (`app/(tabs)/library.tsx`) — saudação, bolha/CTA do banner, os 3
  headers de seção e os rótulos de categoria (Nature/Fantasy/Science/Fruit; o
  `type` é a chave estável de rota). Cards de POPULAR_BOOKS/READING_LIST e os
  nomes "Noyse Roise"/"Burt Cross" ficaram em inglês (conteúdo — vários viram
  `storyId` via `title.toLowerCase()`).
- **Category** (`app/(category)/index.tsx`) — `defaultLabel` + "{{count}} activities".
  Os títulos dos cards são conteúdo atrelado a `storyId` (mantidos). O `label`
  vindo da Home/Library já chega traduzido.
- **Details** (`app/(details)/index.tsx`) — casca do leitor: botões Back/Next/"Próx.
  cap." e os labels estruturais dos widgets de conteúdo (Riddle, Reveal answer,
  Match Report, Word, Ingredients, Instructions, Classification, Size, Habitat,
  Diet, Notes). O texto das histórias/enigmas vem dos mocks e fica em inglês.
- **ExerciseSession** (`features/exercises/.../ExerciseSession.tsx`) — resultado
  (Amazing/Great/Nice/Practice + placar), True/False, feedback, Check/Next/"See
  your stars" e os selos de skill (SOUNDS/WORDS/ORDER/THINK/READING). Enunciados
  dos exercícios ficam em inglês (conteúdo gerado).
- **Jogos arcade** — HUD do `app/(gravity)` e `app/(pixel-run)` via namespace
  **compartilhado `gameHud`** (Game Over, Score, Best, Try again, Play, música,
  "press to start", pontuação) + `gravity.*` (subtítulo e instruções). Os nomes
  dos jogos (GRAVITY FLIP, PIXEL RUN) ficaram como marca, sem tradução.

### Ainda em inglês (mesmo padrão pra migrar — ver seção 3)

Reaproveite qualquer um dos três scripts de injeção como modelo. Faltam só os dois
jogos "grandes" (não são HUD simples — têm telas/modais próprios):

- **Ping-Pong** (`features/ping-pong/`) — multiplayer com Lobby, ModeSelect,
  GameOverModal, RankingModal, StartOverlay, ControlBar (~10 componentes + 3 telas
  em `PongHub`/`PingPongGame`/`MultiplayerPongGame`). Merece um namespace `pingPong`.
- **Farm-Game** (`features/farm-game/`) — sim de economia com ShopModal, MarketModal,
  DayModal, XPBar, GoldCounter (`FarmGameScreen.tsx`, ~562 linhas). Merece um
  namespace `farmGame`. O HUD puro (ouro/XP) é rápido; os modais de loja/mercado é
  que têm volume.

> **Conteúdo das histórias (`mocks/`): NÃO traduzir automaticamente.** São 50 histórias
> de *phonics* em inglês ("A is for Ava" → som "Ahhh"). A pedagogia é intrínseca ao
> inglês e não sobrevive à tradução — precisa ser **reescrita** por idioma (trabalho
> editorial). A arquitetura de i18n não bloqueia isso: quando houver conteúdo localizado,
> basta servir o mock por idioma (ex.: `historyMock.pt.ts`) escolhido via `getCurrentLanguage()`.

### Idioma padrão

Em `lib/i18n/languages.ts`:

```ts
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";
```

A UI-fonte do app está em inglês, então deixei `"en"` como padrão coerente (e é
também o `fallbackLng`). **Para forçar português como padrão**, troque para `"pt"`.

---

## 3. Como traduzir as OUTRAS telas (padrão de 2 linhas)

As demais telas (home, biblioteca, onboarding, paywall, jogos) continuam em inglês
hardcoded. Migrar cada uma segue sempre o mesmo padrão:

**Passo 1** — adicione as strings nos 7 arquivos de `lib/i18n/locales/*.json`.
Use `en.json` como referência (é a fonte canônica). Exemplo, adicionando uma tela `home`:

```jsonc
// en.json
"home": {
  "greeting": "Hi, explorer!",
  "continueReading": "Continue reading"
}
```
(repita a mesma chave, traduzida, em pt/es/fr/zh/hi/ar)

**Passo 2** — na tela, importe o hook e troque as strings:

```tsx
import { useTranslation } from "react-i18next";

export default function HomeScreen() {
  const { t } = useTranslation();          // ← linha 1
  // ...
  return <Text>{t("home.greeting")}</Text>; // ← troca "Hi, explorer!" por t("home.greeting")
}
```

É só isso. O TypeScript **valida as chaves** (autocomplete + erro de compilação se
a chave não existir), graças a `lib/i18n/i18next.d.ts`.

### Interpolação (valores dinâmicos)

```jsonc
"welcome": "Olá, {{name}}!"
```
```tsx
t("welcome", { name: userName })
```

### Chaves dinâmicas (montadas em runtime)

Quando a chave vem de uma variável, faça um cast para a **união literal** dos valores
possíveis (senão o TS reclama, porque `string` não é uma chave garantida):

```tsx
type BadgeId = "explorer" | "artist" | "scientist";
t(`profile.badges.${badge.id as BadgeId}`)
```

---

## 4. Trocar de idioma programaticamente

```tsx
import { changeAppLanguage } from "@/lib/i18n";

await changeAppLanguage("es");        // troca e salva no AsyncStorage
await changeAppLanguage("es", { persist: false }); // só troca, não salva
```

O app inteiro re-renderiza automaticamente (via react-i18next).

---

## 5. Árabe / RTL

O árabe é escrito da direita para a esquerda. **Não forcei o espelhamento total do
layout** (`I18nManager.forceRTL`) de propósito: isso exige recarregar o app e pode
quebrar telas desenhadas em LTR. O texto árabe já renderiza corretamente da direita
para a esquerda **dentro de cada `<Text>`**, que resolve 95% dos casos.

Se quiser o espelhamento completo do layout no futuro, há um trecho comentado e
documentado em `lib/i18n/index.ts` (função `changeAppLanguage`).

---

## 6. Arquivos deste pacote

**Novos:**
```
lib/i18n/
├── languages.ts          # registro dos 7 idiomas (fonte única de verdade)
├── index.ts              # init do i18next + API (change/bootstrap/format)
├── i18next.d.ts          # tipagem das chaves (autocomplete + validação)
└── locales/
    ├── en.json  (canônico / fallback)
    ├── pt.json  es.json  fr.json  zh.json  hi.json  ar.json
components/LanguageSheet.tsx   # bottom-sheet de seleção de idioma
```

**Modificados:**
```
app/_layout.tsx                   # bootstrap do idioma antes de mostrar a UI
app/(tabs)/_layout.tsx            # labels das tabs traduzidos
app/(onboarding)/index.tsx        # onboarding traduzido (slides via slug)
app/(paywall)/index.tsx           # paywall traduzido (planos, CTA, alerts, links)
app/(profile)/index.tsx           # perfil traduzido + linha de idioma
components/WeeklyReadingCard.tsx   # card "Esta semana" traduzido
package.json                      # +i18next +react-i18next +expo-localization
scripts/i18n-add-onboarding-paywall.mjs  # script que injetou as traduções (modelo p/ reuso)
```

---

## Notas técnicas

- **`react-i18next 17` + `i18next 26` + React 19**: combinação verificada e compatível
  (react-i18next 17 exige `i18next >= 26.2.0` e `react >= 16.8.0`).
- **Sem plurais com sufixo** (`_one`/`_other`) → não dependemos de `Intl.PluralRules`.
  Se um dia usar plurais e der problema no Hermes, adicione o polyfill `intl-pluralrules`.
- A tipagem de chaves foi validada com `tsc` em modo `strict`.
- **Conteúdo das histórias** (pasta `mocks/`) **não** foi traduzido — isso é conteúdo,
  não interface, e é um problema à parte (tradução/localização de conteúdo editorial).
