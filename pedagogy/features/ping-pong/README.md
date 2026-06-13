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
│   └── usePongGame.ts       🧠 estado + refs + loop (física/render) + toque
│
└── components/              UI em dark glass (só apresentação)
    ├── index.ts             barrel
    ├── Glass.tsx            wrapper de blur escuro
    ├── SpeedLine.tsx        barra de velocidade
    ├── FloatLabel.tsx       texto que sobe e some
    ├── Scoreboard.tsx       placar flutuante (topo)
    ├── StartOverlay.tsx     overlay "TAP TO PLAY"
    ├── ControlBar.tsx       ⏸ / dificuldade / ↺
    └── GameOverModal.tsx    modal de fim de partida
```

## 🧩 Por onde mexer

- **Regras / física / IA** → `hooks/usePongGame.ts` e `constants.ts`
  (ajuste `DIFFS` para velocidade da CPU e da bola, `WIN_SCORE`, tamanhos).
- **Visual do mundo 3D** → `scene/*` e as cores em `theme.ts` (`C3D`).
- **Aparência da HUD** → `components/*` e a paleta `NEON` em `theme.ts`.

Nada de lógica vive nos componentes e nada de JSX vive no hook — dá pra
trocar a UI inteira sem tocar no motor, e vice-versa.
