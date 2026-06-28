# Atividades por história (exercícios gerados por IA, offline)

Gera exercícios de **compreensão / fonética / vocabulário** a partir do texto de
cada história e mostra uma sessão de atividades **ao terminar cada capítulo**.

## Por que offline (e não IA ao vivo no app)

O app está na **Kids Category** da App Store. Rodar um LLM em runtime na frente
da criança = key no binário + conteúdo não-revisado + dados saindo pra terceiros
→ é o mesmo tipo de problema que derrubou o build com o SDK do Facebook.

Como o catálogo de histórias é **finito e conhecido**, geramos os exercícios
**antes** (script Node, fora do app), curamos, e embarcamos como **JSON
estático**. O app só lê esse JSON: nenhuma chamada de rede, nenhuma key, nenhum
dado da criança saindo. 100% contextual à história, 0% risco de compliance.

## Arquitetura

```
features/exercises/
  types.ts                 Tipos PUROS (sem zod). App e script compartilham.
  data.ts                  getChapterExercises() / hasChapterExercises() — o app usa isto.
  content/<STORY>.json      Conteúdo gerado (1 arquivo por história).
  content/registry.ts       Índice GERADO pelo script (id real → JSON). Não edite.
  components/
    ExerciseSession.tsx     A sessão de atividades (overlay no fim do capítulo).

scripts/
  generateExercises.ts      Gerador (Node). Dois providers: OpenRouter + Mock.
  lib/validate.ts           zod (formato) + integridade (confere contra o texto).
```

**zod fica só no `/scripts`.** O app importa apenas `types.ts` (apagado no build)
e os JSON. Nada de runtime de validação entra no bundle.

## Tipos de exercício

| tipo           | o que treina            | a máquina garante o gabarito? |
| -------------- | ----------------------- | ----------------------------- |
| `fill-blank`   | fonética / leitura      | **Sim** — frase e palavra conferidas no texto |
| `sequence`     | ordem dos fatos         | parcial — estrutura sim, ordem revisar |
| `vocabulary`   | significado de palavra  | só que a palavra existe; significado → revisar |
| `comprehension`| entendimento/inferência | não — revisar gabarito |
| `true-false`   | entendimento/inferência | não — revisar gabarito |

Por isso cada exercício carrega duas flags:

- `machineChecked` — o validador conferiu o gabarito contra o texto (hoje só
  `fill-blank`). **Confiável pra publicar sem revisar.**
- `reviewed` — um humano olhou e aprovou. Começa `false`.

Em **produção**, peça só os confiáveis:

```ts
getChapterExercises(storyId, chapterId, { onlyTrusted: true })
// onlyTrusted = machineChecked || reviewed
```

No demo, deixe `onlyTrusted: false` (default) pra ver todos os tipos.

> Fluxo de curadoria sugerido: rode o gerador → abra o `content/<STORY>.json` →
> leia os itens não-`machineChecked`, corrija o que precisar e marque
> `"reviewed": true`. A partir daí eles passam no `onlyTrusted`.

## Como rodar o gerador

1. Dependências de desenvolvimento (NÃO entram no app):

   ```bash
   npm i -D tsx zod      # ou: bun add -d tsx zod
   ```

2. Key da OpenRouter no ambiente (nunca no código):

   ```bash
   export OPENROUTER_API_KEY=sk-or-...      # o script também aceita VITE_OPENROUTER_API_KEY
   ```

3. Gerar:

   ```bash
   # uma ou mais histórias (id como no STORY_CHAPTERS do app)
   npx tsx scripts/generateExercises.ts ROCKETADVENTURE MAGICFOREST

   # todas as cadastradas no STORY_SOURCES do script (as 54 do app)
   npx tsx scripts/generateExercises.ts --all

   # sem key / sem rede → modo mock (gera a partir do próprio texto)
   npx tsx scripts/generateExercises.ts ROCKETADVENTURE --provider mock

   # trocar o modelo free
   npx tsx scripts/generateExercises.ts ROCKETADVENTURE --model openrouter/free
   ```

**Modelo free:** o default é `meta-llama/llama-3.3-70b-instruct:free`
(multilíngue, 131K de contexto). O catálogo free da OpenRouter rotaciona —
se o modelo sair, use `--model openrouter/free` (roteador que escolhe um free
disponível) ou outro `:free` da vez. Limites do free hoje: ~20 req/min e 50/dia
(1000/dia com US$10 em créditos) — de sobra pra gerar um catálogo finito aos poucos.

> **`--all` com OpenRouter:** 54 histórias × 1–2 capítulos desbloqueados ≈ 100+
> chamadas (1 por capítulo) — passa do teto de 50/dia do free. Pro catálogo
> inteiro: gere **em lotes por dia** (passe ids específicos), carregue US$10
> (vira 1000/dia), ou use `--provider mock` no resto. O `registry.ts` é
> reescrito varrendo a pasta `content/`, então gerar em lotes vai **acumulando**
> — não apaga o que já foi gerado.

**O modo mock** já vem rodado: o conteúdo em `content/` foi gerado por ele,
validado, **0 descartes**, com 2 `fill-blank` verificados por capítulo. Trocando
pro provider OpenRouter você ganha as perguntas mais ricas (inferência,
compreensão, vocabulário com significado) — que aí passam pela curadoria.

### Cadastrar uma história nova

As **54 histórias** do app já estão no `STORY_SOURCES` do script (espelha o
`STORY_CHAPTERS` da `ReadStoryScreen`). Pra uma história **nova**, só importe os
capítulos no `scripts/generateExercises.ts` e adicione a linha no `STORY_SOURCES`
(chave = id normalizado, igual ao `STORY_CHAPTERS`). O `content/registry.ts` e o
`data.ts` se viram sozinhos — o registry é reescrito a cada `generate`.

## Integração no app (ReadStoryScreen)

Arquivo: `app/(details)/index.tsx`. Três inserções pequenas — não muda nada do
que já existe.

**1) Imports** (junto dos outros imports do topo):

```tsx
import ExerciseSession from "../../features/exercises/components/ExerciseSession";
import { hasChapterExercises } from "../../features/exercises/data";
```

**2) Estado** (dentro de `ReadStoryScreen`, perto dos outros `useState`):

```tsx
const [showExercises, setShowExercises] = useState(false);
const exercisesDoneRef = useRef<Set<string>>(new Set()); // 1× por capítulo/sessão
```

**3) Disparo** — no `useEffect` de fim de capítulo (onde já chama
`markChapterCompleted`, ~linha 1096), logo após o `.then(...)`:

```tsx
if (currentPage === ch.pages.length - 1) {
  markChapterCompleted(id, ch.id, chapters.length).then((p) => {
    setReadChapters(p.chaptersRead[id] ?? []);
    // ...tracking existente...
  });

  // ▼▼▼ NOVO: oferece as atividades do capítulo (uma vez por capítulo) ▼▼▼
  const chKey = String(ch.id);
  if (
    !exercisesDoneRef.current.has(chKey) &&
    hasChapterExercises(id, ch.id /*, { onlyTrusted: true } em produção */)
  ) {
    exercisesDoneRef.current.add(chKey);
    setShowExercises(true);
  }
  // ▲▲▲ FIM DO NOVO ▲▲▲
}
```

**4) Render do overlay** — no fim do JSX retornado (onde `chapter` está em
escopo, perto de `const pages = chapter.pages`), como último filho do container:

```tsx
{showExercises && (
  <ExerciseSession
    storyId={id}
    chapterId={String(chapter.id)}
    chapterTitle={chapter.title}
    theme={{
      accent: theme.accent,
      accentSoft: theme.accentSoft,
      bg: theme.bg,
      cardBg: theme.cardBg,
    }}
    // onlyTrusted   // ← ligue em produção
    onClose={() => setShowExercises(false)}
    onComplete={({ correct, total }) => {
      // opcional: trackAchievementUnlocked / estrelas
    }}
  />
)}
```

O `ExerciseSession` é `position: absolute` cobrindo a tela (`zIndex: 50`), então
fica por cima da leitura. `onClose` volta pra história. Se o capítulo não tiver
exercícios, nada aparece (o `hasChapterExercises` barra antes).

## Notas

- A sessão usa **só** dependências já no `package.json` (reanimated, expo-haptics,
  expo-speech, FredokaOne). Lê o enunciado em voz alta (bom pra pré-leitores) e
  respeita "reduzir movimento".
- O `package.json` **não** foi alterado: adicione `tsx` e `zod` em
  `devDependencies` você mesmo (são só pro script).
- Os ids batem com a mesma normalização do app (`resolveStoryId`): maiúsculas +
  remove espaços/hífen/underscore.
