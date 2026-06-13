# features/farm-game

Módulo da tela do jogo "Happy Farm" (3D farming com `expo-gl` + `expo-three`).
Refatorado a partir do antigo `app/(farm-game)/index.tsx` monolítico (~2000 linhas),
sem mudança de comportamento — só reorganização em fatia vertical (feature module).

## Estrutura

```
app/(farm-game)/index.tsx     # rota fina: re-exporta o default do módulo
features/farm-game/
├── index.ts                  # barrel (export default + tipos)
├── FarmGameScreen.tsx        # orquestrador (ex-FarmGameInner/FarmGame3D)
├── types.ts                  # modelo de domínio (Crop, Tile, GameState, …)
├── constants.ts              # grid, storage, geometria do tile, fmtTime
├── styles.ts                 # StyleSheet `s` + paleta `P` + `FF`
├── data/                     # regras como DADO PURO
│   ├── crops.ts              #   CROPS (1 por nível), CROP_LIST, RARITY_META,
│   │                         #   curva nível→stats, unlockedCrops, assertLevelCurve
│   ├── peculiarities.ts      #   PECULIARITIES (traço por semente) + effectOf
│   ├── structures.ts         #   STRUCTURES (construções compráveis) + structurePos
│   ├── leveling.ts           #   LEVEL_THRESHOLDS, XP_FOR_LEVEL, xpToLevel
│   └── tools.ts              #   TOOLS
├── state/                    # regras como LÓGICA
│   ├── reducer.ts            #   INITIAL_STATE, Action, reducer (inc. BUY_STRUCTURE)
│   ├── rewards.ts            #   computeHarvest / growthMultiplier (puro, testável)
│   ├── persistence.ts        #   toPersistable, loadSave (AsyncStorage)
│   └── useFarmGame.ts        #   reducer + hidratação + autosave + tick
├── three/                    # Three.js 100% desacoplado do React
│   ├── geometry.ts           #   tileWorldPos, GEO, STAR_GEO
│   ├── soil.ts               #   solo PBR procedural (noise → DataTextures)
│   ├── plants.ts             #   buildPlant/plantKey + builder por cultura
│   ├── grass.ts              #   buildGrassField
│   ├── structures.ts         #   buildStructure (casinha+cão, celeiro+vaca, colmeia)
│   └── useFarmScene.ts       #   SceneRefs, loop, picking, toque, PAN da câmera
└── components/               # UI
    ├── Glass.tsx  GoldCounter.tsx  XPBar.tsx  FloatLabel.tsx
    └── ShopModal.tsx  MarketModal.tsx  DayModal.tsx
```

## Regra da loja (refatorada): por NÍVEL, não por sorteio

Não há mais rotação diária aleatória (`appearChance`/`stockPerDay`/`rollDailyStock`/
`dailyStock` foram removidos). A disponibilidade é determinística:

- **1 semente por nível** (1..15). A loja lista todas; o que está acima do seu
  nível aparece bloqueado ("🔒 destrava no nível N").
- **Quanto maior o nível, maior o tempo e maior o ganho.** `growTime`, `price`,
  `seedCost` e `xp` são **derivados do nível** por curvas suaves em `data/crops.ts`
  (uma única fonte da verdade — mexa nas constantes `*_BASE`/`*_RATE` pra rebalancear).
- `assertLevelCurve()` roda em `__DEV__` e estoura se alguém quebrar a
  monotonicidade (tempo/ganho não-crescente) ou a margem de lucro.

## Peculiaridade de cada semente

Toda semente tem um traço em `data/peculiarities.ts` (um `{kind, value}`):
`growth` (cresce mais rápido), `sell` (+% moedas), `xp` (+% XP), `yield`
(chance de colheita dupla), `water` (bônus de rega maior) e `coin` (moedas fixas).
Aplicados de forma pura em `state/rewards.ts` (`computeHarvest`/`growthMultiplier`)
e refletidos na loja, no chip da semente e — pras "vistosas" — num floreio 3D
(`accent`) em `three/plants.ts`.

## Câmera arrastável + construções compráveis

A câmera ortográfica é **fixa** (nunca gira) — ela só faz **pan no plano do chão**.
Arrastar o dedo revela o que está em cada direção (a direção do gesto = a direção
revelada):

- ⬆️ **arrastar pra cima** → a **casinha do cachorro** (com o cãozinho)
- ⬅️ **arrastar pra esquerda** → a **casa do fazendeiro** (chalé com chaminé)
- ➡️ **arrastar pra direita** → o **celeiro** (com a vaquinha)
- ⬇️ **arrastar pra baixo** → a **caixa de abelha** (colmeia + abelhas + pote de mel)

Tudo isso só aparece depois de **comprar na loja**, e são desbloqueios de **nível
alto** (doghouse Lv 7, casa Lv 9, barn Lv 11, beehive Lv 14). Os modelos 3D são low-poly
"realistas" (`MeshStandardMaterial`, com sombra), construídos em `three/structures.ts`
e posicionados nos cantos da grama por `data/structures.ts` (`structurePos`).

Detalhes de implementação (`three/useFarmScene.ts`):
- **Toque × arraste:** um movimento abaixo de `DRAG_THRESHOLD` px é um toque (planta/
  colhe); acima disso vira pan e o realce do tile é cancelado — então nunca planta
  sem querer ao arrastar.
- **Pan suavizado + limites:** o alvo do pan é clampado (`PAN_*_MIN/MAX`) pra você
  alcançar cada construção sem se perder no vazio, e a câmera faz _lerp_ até o alvo
  (`PAN_EASE`). Sensibilidade em `PAN_SENS`.
- **Botão 🎯** recentraliza a câmera na fazenda.
- A sombra direcional foi alargada (±11) pra cobrir as construções nos cantos.

## Como ganhar features depois

- **Nova construção:** novo `StructureId` em `types.ts` + entrada em
  `data/structures.ts` (custo, nível, direção, distância) + um builder em
  `three/structures.ts`. A compra, a posse e o cenário se conectam sozinhos.
- **Nova cultura:** adicione a entrada no `LADDER` em `data/crops.ts` (na posição
  = nível desejado) com seu `CropId`/`PlantVisual` (em `types.ts`) e uma
  `peculiarity` (em `data/peculiarities.ts`); some um builder de mesh em
  `three/plants.ts`. Stats saem do nível automaticamente. Nada de tocar na tela.
- **Nova peculiaridade:** novo `PeculiarityId` em `types.ts` + entrada em
  `data/peculiarities.ts`. Se for um novo `kind`, trate-o em `state/rewards.ts`
  (colheita) ou `state/reducer.ts` (crescimento).
- **Nova ferramenta:** entrada em `data/tools.ts` + um case no `state/reducer.ts`.
- **Regras de jogo:** isoladas e testáveis em `state/reducer.ts` e
  `state/rewards.ts` (funções puras).

## 🦊 Cachorro: modelo 3D animado (substitui o procedural)

O "cachorro" do canil deixou de ser geometria procedural e agora é um **modelo
low-poly animado** (`assets/Fox.glb` — uma raposa, que é canídeo e fica ótima na
fazenda), carregado e animado em `three/dogModel.ts` com `GLTFLoader` +
`THREE.AnimationMixer`. O modelo tem 3 clipes (`Survey`, `Walk`, `Run`); por
padrão toca **`Survey`** (idle, olhando em volta) em loop.

**Como liga na cena:** `buildDoghouse` (em `three/structures.ts`) monta o canil
na hora e chama `createDog()` de forma **assíncrona** — o bicho entra no grupo
quando o GLB termina de carregar. O `mixer` é avançado todo frame pelo
`group.userData.tick(t, dt)` que o loop de render já chama
(`mixer.update(dt)`). Se o carregamento falhar, cai no **cachorro procedural
antigo** (fallback), então o canil nunca fica vazio.

**Dependências:**
- `expo-asset` (quase certo que já está no projeto) — resolve o `.glb` empacotado.
- `GLTFLoader` vem de `three/examples/jsm/...`. Se o **Metro** reclamar
  (`Unable to resolve three/examples/jsm…`), instale `three-stdlib` e troque o
  import em `dogModel.ts` por `import { GLTFLoader } from "three-stdlib";`.

**Metro (OBRIGATÓRIO — sem isso o bundle nem sobe):** registre as extensões
binárias no `metro.config.js` da raiz do projeto:

```js
const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("glb", "gltf", "bin");
module.exports = config;
```

**Botões de ajuste** (topo do `three/dogModel.ts`) — pra acertar no olho, já que
a raposa vem gigante e virada num eixo qualquer:
- `DOG_SCALE` (0.0055) — tamanho no mundo (≈ o cão antigo).
- `DOG_ROT_Y` (0) — se ela aparecer **de costas**, troque pra `Math.PI`.
- `IDLE_CLIP` ("Survey") — clipe tocado parado (`Survey` | `Walk` | `Run`).

**Trocar por outro bicho/cachorro:** ponha o novo `.glb` em `assets/`, mude o
`import MODEL` em `dogModel.ts` e ajuste os 3 botões acima. Nada mais muda. Dica:
pacotes CC0 do **Quaternius** (ex.: "LowPoly Animated Animals", que tem um **pug**)
trazem glTF prontos — baixe pelo site dele e jogue na pasta `assets/`.

### Créditos (OBRIGATÓRIO — a animação é CC BY 4.0)

A malha é CC0, mas o rig/animação e a conversão glTF são **CC BY 4.0**, então
publicar exige creditar. Inclua em algum lugar visível (tela de créditos/README):

> Modelo "Fox" — malha por **PixelMannen** (CC0); rig e animação por
> **tomkranis** (CC BY 4.0); conversão glTF por **@AsoboStudio** e **@scurest**
> (CC BY 4.0). Via KhronosGroup/glTF-Sample-Assets.

## 🐮 Celeiro refeito + vaca 3D malhada + cercado

O celeiro antigo foi refeito (`three/structures.ts`, `buildBarn`). Agora ele tem
fundação de pedra, um **silo** ao lado (cilindro + cúpula + anéis — dá cara de
fazenda na hora) e, na frente, um **cercadinho de madeira** (`buildPaddockFence`:
postes + 2 trilhos, com vão de portão no lado de frente) com uma **vaca** dentro.

A vaca segue o **mesmo esquema da raposa**: é um `.glb` de verdade
(`assets/Cow.glb`) carregado em `three/cowModel.ts` com `GLTFLoader`. É a "Spot",
a vaca clássica de domínio público do **Keenan Crane**, convertida de `.obj` pra
`.glb`. Como você falou, **GLB vem sem cor** — e essa em particular vem sem cor e
sem esqueleto. Então:

- **Pintura branca com pintas pretas:** feita por **cor por vértice**, calculada
  na hora a partir de um ruído 3D (não depende de UV, então funciona em qualquer
  malha). ~30% de cobertura preta, em manchas. O `.obj` também não trazia normais,
  então o loader chama `computeVertexNormals()` pra luz pegar certo.
- **Animação:** como a Spot não tem esqueleto, ela ganha um **idle procedural**
  (respira + muda o peso de leve). Se você trocar por um `.glb` **com** animação
  (ex.: a vaca CC0 do **Quaternius**), o loader detecta o clipe e toca ele no lugar
  do idle — sem mexer em mais nada.

**Botões de ajuste** (topo do `three/cowModel.ts`):

- `COW_SCALE` (padrão `0.5` → ~0,85 de altura) e `COW_ROT_Y` (vire `Math.PI` se ela
  aparecer de costas) — mesmos chutes da raposa, **não testei no device**.
- `BASE_COLOR` / `SPOT_COLOR` (branco / preto das pintas) e
  `SPOT_SCALE` / `SPOT_THRESHOLD` (tamanho e quantidade das manchas).

Não precisa de nada novo no `metro.config.js` além do que a raposa já pediu (as
extensões `glb`/`gltf`/`bin` já cobrem a vaca). Se o `Cow.glb` falhar ao carregar,
o celeiro cai no **fallback** da vaca procedural antiga.

### Créditos da vaca (domínio público)

> Modelo "Spot" — **Keenan Crane** (domínio público). Via
> alecjacobson/common-3d-test-models.

## Observações

- O import do coin store continua **relativo** (`../../hooks/UseCoinStore` a partir
  do screen; `../../../hooks/UseCoinStore` a partir de `components/MarketModal.tsx`).
  Se o projeto usa alias `@/`, dá pra trocar por `@/hooks/UseCoinStore` à vontade.
- Os estilos foram mantidos **compartilhados** em `styles.ts` (um único `s`) para
  não arriscar quebrar as ~600 linhas de estilo na migração. Co-locar estilo por
  componente é uma melhoria possível mais pra frente.
