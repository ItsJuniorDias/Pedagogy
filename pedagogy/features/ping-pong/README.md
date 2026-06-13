# 🏓 ping-pong (NEON PONG)

Módulo *feature* do mini-game de ping-pong 3D (Three.js + Expo), refatorado
nos mesmos moldes do `farm-game`: tema/constantes/tipos isolados, camada 3D
separada, **um hook com todo o motor do jogo** e a UI quebrada em componentes
pequenos e burros (apenas apresentação).

## 📦 Instalação

```bash
npx expo install expo-gl expo-three three
npx expo install expo-blur react-native-safe-area-context
npx expo install @expo-google-fonts/fredoka-one expo-font
npx expo install @react-native-async-storage/async-storage
```

## 🚀 Uso

```tsx
import PingPongGame from "@/features/ping-pong";

export default function Screen() {
  return <PingPongGame />;
}
```

> O componente já embrulha tudo em `SafeAreaProvider`. Se o seu app inteiro
> já tiver um `SafeAreaProvider` na raiz, pode importar o `PongGameInner`
> diretamente (ou remover o provider duplicado) — mas usar como está funciona.

## 🗂️ Estrutura

```
ping-pong/
├── index.ts                 API pública (export default + named)
├── PingPongGame.tsx         Shell de apresentação (GLView + HUD)
├── theme.ts                 NEON (UI), C3D (3D) e a fonte (FF)
├── constants.ts             Dimensões, WIN_SCORE e dificuldades
├── types.ts                 Phase, DiffId, Diff, FloatingLabel, SceneRefs
├── styles.ts                Estilos compartilhados (sombra dos painéis)
│
├── scene/                   Camada Three.js (sem React)
│   ├── index.ts             barrel
│   ├── materials.ts         lambert() / neon()
│   ├── arena.ts             buildArena() — piso, grade tron, orbes
│   ├── table.ts             buildTable() — mesa, linhas neon, rede, vidro
│   └── racket.ts            buildRacket() — lâmina + aro neon + cabo
│
├── hooks/
│   ├── usePongGame.ts       🧠 estado + refs + loop (física/render) + toque
│   └── useRanking.ts        🏆 carrega/salva o ranking (AsyncStorage)
│
├── storage/                 Persistência (sem React)
│   ├── index.ts             barrel
│   └── ranking.ts           scoreMatch/accumulate/tiers + I/O AsyncStorage
│
└── components/              UI em dark glass (só apresentação)
    ├── index.ts             barrel
    ├── Glass.tsx            wrapper de blur escuro
    ├── SpeedLine.tsx        barra de velocidade
    ├── FloatLabel.tsx       texto que sobe e some
    ├── Scoreboard.tsx       placar flutuante (topo)
    ├── StartOverlay.tsx     overlay "TAP TO PLAY"
    ├── ControlBar.tsx       ⏸ / dificuldade / ↺
    ├── GameOverModal.tsx    modal de fim de partida (+ pontos ganhos)
    ├── RankButton.tsx       pílula com a patente + pontos (abre o ranking)
    └── RankingModal.tsx     painel do ranking (tiers, stats, leaderboard)
```

## 🏆 Ranking & acúmulos

Ao fim de cada partida o motor (`usePongGame`) emite o resultado via
`onMatchEnd`. O `PingPongGame` passa esse gancho para `useRanking.recordMatch`,
que **registra a partida** e persiste tudo em `AsyncStorage`.

A lógica de acúmulo vive em `storage/ranking.ts` (funções puras, testáveis):

- **`scoreMatch(m)`** → pontos da partida:
  `(base + saldo·5 + bestRally·3) × multiplicador da dificuldade`
  (`base` = 100 vitória / 20 derrota; mult. easy 1 · normal 1.5 · hard 2; piso em 0).
- **`accumulate(profile, record)`** → reduz a partida no perfil: totais,
  placar somado, **sequência de vitórias** (zera ao perder), recorde de rally,
  tabela por dificuldade e **leaderboard** (top 10 por pontos).
- **`tierForPoints(total)`** → patente (Rookie → … → Neon Master) + progresso.

Chave do storage: `@neon_pong/ranking_v1` (suba o sufixo se mudar o formato).

## 🧩 Por onde mexer

- **Regras / física / IA** → `hooks/usePongGame.ts` e `constants.ts`
  (ajuste `DIFFS` para velocidade da CPU e da bola, `WIN_SCORE`, tamanhos).
- **Pontuação / acúmulos / tiers** → `storage/ranking.ts`
  (fórmula em `scoreMatch`, faixas em `TIERS`, top N em `MAX_RANKING`).
- **Visual do mundo 3D** → `scene/*` e as cores em `theme.ts` (`C3D`).
- **Aparência da HUD** → `components/*` e a paleta `NEON` em `theme.ts`.

Nada de lógica vive nos componentes e nada de JSX vive no hook — dá pra
trocar a UI inteira sem tocar no motor, e vice-versa.
