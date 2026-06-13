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
│   ├── crops.ts              #   CROPS, CROP_LIST, RARITY_META, isLimited
│   ├── leveling.ts           #   LEVEL_THRESHOLDS, XP_FOR_LEVEL, xpToLevel
│   └── tools.ts              #   TOOLS
├── state/                    # regras como LÓGICA
│   ├── reducer.ts            #   INITIAL_STATE, Action, reducer, rollDailyStock
│   ├── persistence.ts        #   toPersistable, loadSave (AsyncStorage)
│   └── useFarmGame.ts        #   reducer + hidratação + autosave + tick
├── three/                    # Three.js 100% desacoplado do React
│   ├── geometry.ts           #   tileWorldPos, GEO, STAR_GEO
│   ├── soil.ts               #   solo PBR procedural (noise → DataTextures)
│   ├── plants.ts             #   buildPlant/plantKey + builder por cultura
│   ├── grass.ts              #   buildGrassField
│   └── useFarmScene.ts       #   SceneRefs, onContextCreate, loop, picking, toque
└── components/               # UI
    ├── Glass.tsx  GoldCounter.tsx  XPBar.tsx  FloatLabel.tsx
    └── ShopModal.tsx  MarketModal.tsx  DayModal.tsx
```

## Como ganhar features depois

- **Nova cultura:** adicione a entrada em `data/crops.ts` (+ o `CropId`/`PlantVisual`
  em `types.ts`) e um builder de mesh em `three/plants.ts`. Nada de tocar na tela.
- **Nova ferramenta:** entrada em `data/tools.ts` + um case no `state/reducer.ts`.
- **Regras de jogo:** tudo isolado e testável em `state/reducer.ts` (função pura).

## Observações

- O import do coin store continua **relativo** (`../../hooks/UseCoinStore` a partir
  do screen; `../../../hooks/UseCoinStore` a partir de `components/MarketModal.tsx`).
  Se o projeto usa alias `@/`, dá pra trocar por `@/hooks/UseCoinStore` à vontade.
- Os estilos foram mantidos **compartilhados** em `styles.ts` (um único `s`) para
  não arriscar quebrar as ~600 linhas de estilo na migração. Co-locar estilo por
  componente é uma melhoria possível mais pra frente.
