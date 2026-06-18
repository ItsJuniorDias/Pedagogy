# 🎵 Áudio do Happy Farm (React Native + expo-audio) — `audio/`

Trilha sonora + efeitos para a fazenda usando **`expo-audio`** (parte do SDK do
Expo). Os sons são **procedurais**, mas pré-renderizados para arquivos `.wav`
em tempo de build (não há síntese ao vivo no app).

## Por que assim

`expo-audio` toca **arquivos** — não sintetiza áudio ao vivo (isso exigiria a
`react-native-audio-api`, que tem módulo nativo e **não roda no Expo Go**).
Então "assamos" (bake) a mesma síntese procedural para `.wav` com um renderizador
offline. Resultado: **mesmos sons**, e **roda no Expo Go** (o farm já usa só
`expo-gl`, que é do SDK). Sem dev build, sem módulo nativo de terceiros.

## 1. Instalar

```bash
npx expo install expo-audio @react-native-async-storage/async-storage
```

Adicione o plugin no `app.json` (permissão de microfone não é necessária — só
tocamos áudio):

```jsonc
{ "expo": { "plugins": ["expo-audio"] } }
```

Pronto. Como `expo-audio` é do SDK, **funciona no Expo Go** — basta `npx expo start`.
(Se você já roda um dev build por causa de outras libs, também funciona lá.)

## 2. Já está conectado

O `FarmGameScreen.tsx` não mudou desde a versão anterior — a API pública é a
mesma:

```tsx
import { SoundButton, sfx, useGameAudio } from "./audio";

const { muted, toggle } = useGameAudio("farm"); // trilha em loop enquanto montado
sfx.harvest();                                   // toca um efeito
<SoundButton muted={muted} onToggle={toggle} />  // botão 🔊/🔇
```

A trilha "farm" entra em loop ao abrir a tela; efeitos tocam em arar, plantar,
regar, colher, moedas, comprar estrutura, subir de nível, virar o dia, trocar de
ferramenta e nos bloqueios. O mudo é salvo no `AsyncStorage`.

## Arquivos

| Arquivo                 | Papel                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| `engine.ts`             | toca os arquivos via expo-audio: loop da trilha, pool de efeitos, mudo |
| `sources.ts`            | mapa estático dos `.wav` (imports que o Metro empacota)          |
| `sfx.ts`                | `sfx.till()`, `sfx.harvest()`, … → tocam o arquivo correspondente |
| `music.ts`              | liga/desliga a trilha em loop                                    |
| `useGameAudio.ts`       | hook React: trilha + estado de mudo                              |
| `SoundButton.tsx`       | botão 🔊/🔇 (primitivos React Native)                           |
| `tools/render-audio.mjs`| renderizador offline que gera os `.wav` (a "síntese")           |
| `../assets/audio/*.wav` | os sons pré-renderizados (~844 KB no total)                      |

## Regerar / ajustar os sons

Toda a síntese procedural (osciladores, envelopes, ruído filtrado, sequenciador
da trilha) está em `tools/render-audio.mjs`. Para mudar uma melodia ou um efeito,
edite lá e rode:

```bash
node audio/tools/render-audio.mjs
```

Isso reescreve os `.wav` em `assets/audio/`. É Node puro, sem dependências.

## iOS: tocar no silencioso

O engine chama `setAudioModeAsync({ playsInSilentMode: true })`, então a trilha
toca mesmo com a chave de silêncio ligada (comportamento de jogo). Para respeitar
o silencioso, troque para `false` em `engine.ts` (`ensureMode`).

## Trazer o Neon Pong

Renderize uma `pong-theme.wav` (o renderizador já tem a lógica das duas faixas;
basta adicionar a chamada da faixa pong e salvar) e inclua em `MUSIC_SOURCES`
(`sources.ts`). Depois, na tela do Pong, `useGameAudio("pong")`.
