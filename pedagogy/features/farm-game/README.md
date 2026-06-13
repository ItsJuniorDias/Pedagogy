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

## Observações

- O import do coin store continua **relativo** (`../../hooks/UseCoinStore` a partir
  do screen; `../../../hooks/UseCoinStore` a partir de `components/MarketModal.tsx`).
  Se o projeto usa alias `@/`, dá pra trocar por `@/hooks/UseCoinStore` à vontade.
- Os estilos foram mantidos **compartilhados** em `styles.ts` (um único `s`) para
  não arriscar quebrar as ~600 linhas de estilo na migração. Co-locar estilo por
  componente é uma melhoria possível mais pra frente.
