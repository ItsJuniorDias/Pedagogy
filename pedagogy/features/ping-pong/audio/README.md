# 🏓 Áudio do NEON PONG (React Native + expo-audio) — `audio/`

Trilha synthwave + efeitos usando **`expo-audio`** (parte do SDK do Expo). Os
sons são **procedurais**, porém pré-renderizados para `.wav` em tempo de build.

## Por que assim

`expo-audio` toca **arquivos** — não sintetiza ao vivo (isso exigiria a
`react-native-audio-api`, com módulo nativo, que **não roda no Expo Go**).
Então "assamos" (bake) a mesma síntese para `.wav`. Resultado: **mesmos sons** e
**roda no Expo Go** (o pong já usa só `expo-gl`, do SDK). Sem dev build, sem
módulo nativo de terceiros.

## 1. Instalar

```bash
npx expo install expo-audio @react-native-async-storage/async-storage
```

`app.json`:

```jsonc
{ "expo": { "plugins": ["expo-audio"] } }
```

Como `expo-audio` é do SDK, **funciona no Expo Go** (`npx expo start`).

## 2. Já está conectado

- `PongHub.tsx`: trilha "pong" em loop enquanto o hub viver + botão 🔊/🔇
  (canto superior direito), persistindo por menu / solo / multiplayer.
- `hooks/usePongGame.ts` (solo): saque, rebatida (timbre por quem bate + corte),
  parede, efeito (whoosh), ponto e vitória/derrota.
- `hooks/useNetPong.ts` (multiplayer): mesmos sons no host e no guest (via eventos
  de rede).

A API pública é a mesma da versão web, então a fiação ficou só de adições:
`sfx.serve()`, `sfx.paddle(isPlayer, spin)`, `sfx.wall()`, `sfx.spin()`,
`sfx.scorePlayer()`, `sfx.scoreCpu()`, `sfx.win()`, `sfx.lose()`.

## Arquivos

| Arquivo                  | Papel                                                           |
| ------------------------ | --------------------------------------------------------------- |
| `engine.ts`              | toca os arquivos via expo-audio: loop da trilha, pool de efeitos, mudo |
| `sources.ts`             | mapa estático dos `.wav`                                         |
| `sfx.ts`                 | `sfx.serve()`, `sfx.paddle(isPlayer, spin)`, … → tocam o arquivo |
| `music.ts`               | liga/desliga a trilha em loop                                    |
| `useGameAudio.ts`        | hook React: trilha + estado de mudo                             |
| `SoundButton.tsx`        | botão 🔊/🔇                                                     |
| `tools/render-audio.mjs` | renderizador offline (a "síntese") que gera os `.wav`           |
| `../assets/audio/*.wav`  | sons pré-renderizados (~648 KB)                                  |

### Sobre a rebatida (`sfx.paddle`)

Como arquivo não muda de altura em tempo real, pré-rendi **4 variações**:
jogador/CPU × normal/corte-forte. `sfx.paddle(isPlayer, spin)` escolhe a variante
(corte forte quando `spin ≥ 0.5`), preservando o "mais agudo p/ você, mais
brilhante no corte".

## Regerar / ajustar

```bash
node audio/tools/render-audio.mjs
```

Edite as melodias/efeitos no `tools/render-audio.mjs` (osciladores, envelopes,
ruído filtrado, sequenciador). É Node puro, sem dependências.

## iOS no silencioso

`setAudioModeAsync({ playsInSilentMode: true })` no engine → toca mesmo com a
chave de silêncio. Troque para `false` em `engine.ts` (`ensureMode`) p/ respeitar.
