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
    ├── GameOverModal.tsx    modal de fim (pontos ganhos + ±MMR no ranked)
    ├── RankButton.tsx       pílula: patente+pontos (solo) ou divisão+MMR (ranked)
    └── RankingModal.tsx     painel do ranking (patente, divisão ranked, leaderboard)
```

## 🏆 Ranking & acúmulos

Ao fim de cada partida o motor (`usePongGame` no solo, `useNetPong` no
multiplayer) emite o resultado via `onMatchEnd`. O shell passa esse gancho para
`useRanking.recordMatch`, que **registra a partida** e persiste tudo em
`AsyncStorage`.

Existem **duas trilhas de progressão independentes**, ambas no mesmo perfil
salvo (uma chave só):

1. **Pontos vitalícios (patente)** — alimentados por **solo E ranked**. É a
   `tierForPoints` de sempre (Rookie → … → Neon Master). Partidas ranked rendem
   pontos com multiplicador fixo (`RANKED_MULT = 2`).
2. **MMR / Elo (divisão)** — **só do ranked**. Cada jogador começa em
   `DEFAULT_MMR = 1000` e troca rating partida a partida pela fórmula de Elo
   (`MMR_K = 32`). As divisões (`RANKED_TIERS`: Wood → … → Champion) saem do MMR.

A lógica de acúmulo vive em `storage/ranking.ts` (funções puras, testáveis):

- **`scoreMatch(m)`** → pontos da partida:
  `(base + saldo·5 + bestRally·3) × multiplicador`
  (`base` = 100 vitória / 20 derrota; mult.: solo easy 1 · normal 1.5 · hard 2,
  ranked fixo 2; piso em 0).
- **`applyElo(self, opp, won)`** → variação de MMR (ganhar de quem é mais forte
  rende mais; perder pra quem é mais fraco custa mais). Piso do rating em 0.
- **`accumulate(profile, record, newMMR)`** → reduz a partida no perfil: totais
  (solo+ranked), placar somado, **sequências** (geral e ranked), recorde de
  rally, tabela por dificuldade (**só solo**), MMR/pico/W-L ranked (**só ranked**)
  e **leaderboard** (top 10 por pontos, com solo e ranked juntos).
- **`tierForPoints(total)`** → patente vitalícia + progresso.
- **`rankedDivisionForMMR(mmr)`** → divisão competitiva + progresso.

Chave do storage: `@neon_pong/ranking_v1` (mantida — a migração é
retrocompatível: perfis e partidas antigas viram `mode: "solo"` ao carregar).

## 🌐 Multiplayer online (saguão + partida automática)

O jogo agora abre num **hub** (`PongHub`, novo `export default`) com dois modos:

- **Multiplayer** → entra no **saguão** (`Lobby`), recebe um **apelido fofo
  aleatório** (emoji + nick, ex.: `🍓 HungryPanda`) e fica esperando. Assim que
  **outro jogador** entra na fila, a partida **começa sozinha**.
- **Solo vs CPU** → o jogo original de sempre, intacto.

### Como funciona (host-autoritativo + espelhamento)

Não há física no servidor — ele é só **saguão + matchmaking + relay**. Quando
dois jogadores casam, o **primeiro vira HOST**: ele roda toda a física e
transmite o estado ~30x/s; o **GUEST** só manda o toque da raquete e desenha o
que recebe. Cada um se vê sempre na **raquete de baixo (ciano)** — o guest
espelha o frame do host invertendo X e Z. Simples e simétrico.

```
net/
├── protocol.ts        Tipos de mensagem + convenção "frame do host"
├── config.ts          SERVER_URL (env EXPO_PUBLIC_PONG_SERVER) + tick
├── nicknames.ts       Gerador local de apelido (fallback)
├── useLobbySocket.ts  WebSocket: saguão, identidade, match, canal de jogo
└── index.ts           barrel

hooks/useNetPong.ts    Motor em rede (reusa scene/ + física do solo)
components/Lobby.tsx    Sala de espera (apelido, status, "procurando…")
components/ModeSelect.tsx  Menu inicial (Multiplayer / Solo)
MultiplayerPongGame.tsx    Shell da partida online (placar com os 2 nicks)
PongHub.tsx                Roteia menu ↔ solo ↔ multiplayer
```

### 🥇 Ranked no multiplayer (MMR/Elo + pontos)

Toda partida online é **ranked** — conta para a patente (pontos) **e** para o
MMR (Elo). O detalhe: o Elo precisa do rating dos **dois** jogadores, mas o
servidor é só um relay e **não guarda nada**. A solução é uma troca direta de
MMR entre os clientes, por cima do mesmo relay:

- Ao montar a partida (e a cada revanche), cada lado dispara um evento novo
  **`{ kind: "hello", mmr }`** anunciando o próprio rating. O outro guarda esse
  valor e responde uma vez (a troca fecha nos dois sentidos, independente de
  quem chega primeiro).
- Quando a partida termina (`phase === "over"`), **cada cliente registra o
  próprio resultado localmente**: calcula seu Elo contra o MMR recebido, soma os
  pontos da patente e salva no AsyncStorage. Host e guest gravam cada um o seu —
  é persistência local, então isso é o esperado.
- O servidor **não muda**: ele já repassa qualquer `event` ao oponente sem
  validar, então o `hello` viaja sem nenhuma alteração no back-end.

> **Partidas incompletas não contam.** Se o oponente cai no meio (a tela vira
> "OPPONENT LEFT", não "over"), nada é registrado — de propósito, pra não
> distribuir/queimar MMR por desconexão.


### Rodando o servidor (saguão)

```bash
cd server
npm install
npm start          # sobe o WebSocket na porta 8080 (env PORT p/ trocar)
```

### Apontando o app pro servidor

O cliente lê `EXPO_PUBLIC_PONG_SERVER` (padrão `ws://localhost:8080`):

```bash
# celular físico (mesma rede Wi-Fi): use o IP da sua máquina
EXPO_PUBLIC_PONG_SERVER="ws://192.168.0.10:8080" npx expo start

# emulador Android
EXPO_PUBLIC_PONG_SERVER="ws://10.0.2.2:8080" npx expo start

# simulador iOS / web no mesmo PC
EXPO_PUBLIC_PONG_SERVER="ws://localhost:8080" npx expo start
```

> Para testar **sozinho**: rode o servidor, abra o app em **dois dispositivos**
> (ou duas abas web), entre no Multiplayer nos dois — eles casam na hora.

Detalhes do servidor em [`server/README.md`](server/README.md).

## 🧩 Por onde mexer

- **Regras / física / IA** → `hooks/usePongGame.ts` e `constants.ts`
  (ajuste `DIFFS` para velocidade da CPU e da bola, `WIN_SCORE`, tamanhos).
- **Pontuação / acúmulos / tiers** → `storage/ranking.ts`
  (fórmula em `scoreMatch`, faixas em `TIERS`, top N em `MAX_RANKING`).
- **Ranked / MMR / divisões** → `storage/ranking.ts`
  (`DEFAULT_MMR` rating inicial, `MMR_K` quanto cada partida move o rating,
  `RANKED_MULT` multiplicador de pontos do ranked, `RANKED_TIERS` divisões).
- **Visual do mundo 3D** → `scene/*` e as cores em `theme.ts` (`C3D`).
- **Aparência da HUD** → `components/*` e a paleta `NEON` em `theme.ts`.

Nada de lógica vive nos componentes e nada de JSX vive no hook — dá pra
trocar a UI inteira sem tocar no motor, e vice-versa.
