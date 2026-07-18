# Design System — Pedagogy

Fonte única de verdade: `constants/theme.ts`. Nenhuma tela deve hardcodar hex — importe `Theme` (tokens semânticos), `Palette` (matéria-prima, só para cores decorativas de conteúdo), `Shadow`, `fredoka()`, `MIN_TOUCH` e `HIT_SLOP`.

## Cores semânticas (`Theme.colors`)

| Token | Valor | Uso |
| --- | --- | --- |
| `bg` | `#FFF9F0` | Fundo de todas as telas (creme) |
| `surface` | `#FFFFFF` | Cards, sheets, botões neutros |
| `ink` | `#2D2D2D` | Títulos e texto principal |
| `textMuted` | `#6E6E78` | Texto secundário — AA (≈4.9:1) em corpo pequeno |
| `textFaint` | `#8E8E99` | **Só** rótulos grandes/bold (≥13 e peso ≥700) |
| `onAccent` | `#FFFFFF` | Texto sobre rosa/roxo |
| `primary` / `primaryDeep` / `primarySoft` / `primaryTint` / `primaryFaint` | rosa `#FF5B8D` e derivados | CTAs, seleção, links, sombras 3D |
| `accent` / `accentDeep` / `accentTint` | roxo `#6C5CE7` | Banners, splash |
| `highlight` / `highlightTint` | amarelo `#FFD93D` | Estrelas, avatar, CTA do banner |
| `success` / `successTint` | verde `#27AE60` | Estados de sucesso |
| `border` | `#ECE8E0` | Bordas neutras quentes |
| `track` | `#F1EEE8` | Trilho de barras de progresso |
| `overlay` | `rgba(20,18,40,0.45)` | Backdrop de modais/sheets |

Regra de contraste: texto corrido nunca abaixo de `textMuted`. Os antigos `#AAA`/`#BBB`/`#CCC` (1.6–2.6:1 sobre creme) foram eliminados.

## Raio, espaçamento, sombra

- `Theme.radius`: xs 8 · sm 12 · md 16 · lg 20 · xl 24 · xxl 28 · pill 999.
- `Theme.space`: grade de 4pt (xs 4 → xxxl 32).
- `Shadow.card` (repouso) · `Shadow.raised` (flutuante) · `Shadow.glowPrimary` (CTA rosa) · `Shadow.glowHighlight` (amarelo). Todas com `elevation` Android equivalente.

## Tipografia

- `fredoka(size, color?)` — Fredoka One, com `lineHeight` proporcional (evita corte de descendentes em pt/es/fr). O helper vivia copiado em 12 arquivos; agora só existe no theme.
- `body(size, color?, weight?)` — texto de sistema com pesos consistentes.

## Toque e acessibilidade

- `MIN_TOUCH = 44` — altura/largura mínima de qualquer alvo (HIG). Chips, botões de voltar e links "ver tudo" já cumprem.
- `HIT_SLOP` — padrão para alvos no limite.
- `PressBounce` (`shared/motion`) repassa `accessibilityRole`, `accessibilityLabel`, `accessibilityState` e `hitSlop`; todo card/botão interativo deve declará-los.

## Componentes compartilhados

- `components/ui/ScreenHeader.tsx` — header das telas empilhadas: safe-area real via `useSafeAreaInsets` (o antigo `StatusBar.currentHeight ?? 44` é Android-only e errava em todo iPhone), voltar 44×44 acessível, título centralizado, slot direito opcional.
- `shared/motion` — kit de animação (entradas, loops, `PressBounce`, `GrowBar`, `DealIn`), todos respeitando "reduzir movimento".

## Convenções

- Cores por card (borda da trilha, fundo do ícone do jogo) são **conteúdo** e ficam nos arrays de dados — podem usar `Palette` ou hex próprios.
- App é light-only: `userInterfaceStyle: "light"` no `app.json` e tema de navegação fixado no claro em `app/_layout.tsx`.
- Toda chip de filtro precisa bater com ≥1 item do dataset que filtra (invariante documentada na Home).
