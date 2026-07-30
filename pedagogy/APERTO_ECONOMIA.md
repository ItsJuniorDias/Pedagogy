# 🌾 Aperto — Economia do Farm Game (30/07/2026)

## Por que apertar

O Farm Game estava com três "torneiras" que somavam demais em campo cheio:

1. **Margem por colheita de 68%** — plantar sempre rendia ~2/3 do preço. Player
   nunca ficava sem grana, então nunca via o Coin Market como necessário.
2. **+20% de moedas por regar (grátis, escondido)** — regar já é útil pra
   acelerar o crescimento; o bônus de moedas era um multiplicador invisível
   que ninguém via na UI mas rendia muito em 25 tiles.
3. **Peculiaridades late-game "torneira"** — Aureate dava +1.500 moedas fixas
   por colheita (campo cheio de golden_wheat = +37.500 grátis por ciclo).
   Stellar dava +40% em cima de 14.800.

Sem escassez o Coin Market vira decoração. O objetivo daqui é criar pressão
real na hora de comprar sementes de tier alto, sem virar "pay-to-not-suffer"
(o erro que fez o MyTamagotchi zerar conversões).

## O que mudou

### 1. `data/crops.ts` — margem 68% → 60%

- `SEED_RATIO`: 0.32 → **0.40** (semente agora custa 40% do preço, não 32%).
- Adicionada trava `MIN_MARGIN = 0.40` em `assertLevelCurve()`: se alguém
  editar depois pra apertar demais, estoura em dev antes de ir pro store.

Antes e depois:

| Nível | Preço | Semente (antes) | Semente (agora) | Margem (antes) | Margem (agora) |
| --- | --- | --- | --- | --- | --- |
| 1 (wheat) | 10 | 4 | **4** | 60% | 60% |
| 5 (corn) | 90 | 30 | **35** | 67% | 61% |
| 10 (melon) | 1.150 | 350 | **460** | 70% | 60% |
| 12 (dragon) | 3.250 | 900 | **1.300** | 72% | 60% |
| 15 (star) | 15.000 | 4.700 | **6.000** | 69% | 60% |

*(alguns arredondaram um pouco por causa do `niceRound` — variação de ±3%.)*

**Player continua lucrando 60% em cada colheita.** Não é loop punitivo. Só
não é mais uma torneira que enche caixa sozinha.

### 2. `state/rewards.ts` — water bonus 20% → 10%

- `WATER_BONUS_DEFAULT`: 0.20 → **0.10**.
- Regar **continua acelerando o crescimento em 30%** (`0.7` multiplier no
  reducer). O motivo real de regar é esse, não o dinheiro.
- Peculiaridades `water` (full_ear, juicy) foram recalibradas em cima do
  novo default — segue como incentivo dessas plantas específicas.

### 3. `data/peculiarities.ts` — nerf nos vetores de dinheiro

Peculiaridades de XP e crescimento (`xp`, `growth`) ficaram intactas — não
são dinheiro, aceleram progressão sadia. As de moeda (`sell`, `yield`,
`coin`, `water`) foram cortadas:

| Peculiaridade | Efeito antes | Efeito agora |
| --- | --- | --- |
| Succulent (tomato) | +12% coins | **+8% coins** |
| Full Ear (corn) | water +35% | **water +25%** |
| Sprouter (potato) | 20% double | **15% double** |
| Giant (pumpkin) | 25% double | **18% double** |
| Juicy (watermelon) | water +40% | **water +30%** |
| Noble (grape) | +18% coins | **+12% coins** |
| Aureate (gold wheat) | **+1.500 coins/colheita** | **+500 coins/colheita** |
| Shimmering (crystal) | 30% double | **20% double** |
| Stellar (star fruit) | +40% coins | **+22% coins** |

Aureate era o nerf mais óbvio: em campo cheio de golden_wheat rendia
+37.500 moedas grátis por ciclo, mais do que o pack de US$ 12,90.

### 4. `data/peculiarities.ts` — nova trava `assertEconomyProfile()`

Mesmo padrão dos outros asserts do módulo (`assertLevelCurve`,
`assertCoinLadder`). Roda em `__DEV__` e estoura se alguém subir uma
peculiaridade acima do teto. Tetos atuais:

```
sell:   1.25   yield: 0.22   water: 0.35
coin:   800    xp:    1.30   growth: 1.30
```

Se quiser afrouxar depois, sobe o cap e deixa comentado por quê. É a trava
pra ninguém inflacionar de volta sem perceber (nem eu daqui a 3 meses).

### 5. `state/reducer.ts` — gold inicial 50 → 35

- 35 = 5 sementes de wheat (6 cada) + folga. Cabe a primeira leva pra
  chegar no nível 2 sem parar, mas não sobra grana ociosa.
- **Só afeta player NOVO.** Save existente hidrata com o gold que já tem —
  a mudança não confisca moeda de ninguém. É o migration correto (o de
  MyTamagotchi que quase deu ruim era exatamente esse).

### 6. `FarmGameScreen.tsx` — copy da dica de água

- Antes: `"Tap crops to water · faster + 20% bonus"`.
- Agora: `"Tap crops to water · grows faster + coin bonus"` (sem número
  hardcoded — se o WATER_BONUS_DEFAULT mudar de novo, a UI não fica
  mentindo).

## Impacto no Coin Market (packs continuam iguais)

Não mexi em `hooks/UseCoinStore.ts`. Os packs ($4.99 / $12.90 / $29.90 /
$64.90) continuam como o fix de segunda deixou. O que muda é o custo real
do que eles compram:

| Pack | Moedas | Cobre da fazenda cheia lvl 15 (antes) | Cobre agora |
| --- | --- | --- | --- |
| coin_small | 3.000 | 26% | **20%** |
| coin_medium | 10.000 | 85% | **67%** |
| coin_large | 35.000 | 300% (excesso) | **233%** (folga sadia) |
| coin_mega | 120.000 | 1.020% (piada) | **800%** (~ 3 fazendas cheias) |

Antes o mega pack era piada — 10x o custo de encher lvl 15. Agora ainda tem
folga, mas já é uma decisão real de compra. E o small/medium têm *função*
como top-up sem serem gastos inúteis.

## O que NÃO fiz de propósito

- **Não gatei ação básica em moedas.** Plantar/colher/regar continuam
  livres. O erro do MyTamagotchi foi fazer o sleep (única regen grátis)
  virar pago — vira "pay-to-not-suffer" e Kids Category dá 1-star review
  em 5 minutos.
- **Não removi crescimento offline.** É o gancho de retenção do jogo:
  jogador abre o app 8h depois, tudo cresceu, é o momento "dopamina de
  volta". Trocar isso por "pague pra pular espera" é o mesmo cavalo de
  troia.
- **Não mexi nos coin packs.** Você acabou de recalibrar 2 dias atrás.
  Duas mudanças de economia na mesma sprint é ruim pra rastrear qual
  moveu a agulha (e a Apple pode achar suspeito num app de Kids).
- **Não mexi no custo das structures.** Doghouse (2.000), farmhouse
  (6.000), barn (14.000), beehive (45.000) — já são âncoras boas
  empurrando o player pra grinding ou compra.
- **Não aumentei o XP requirement.** Já é uma curva íngreme
  (`data/leveling.ts`); apertar de novo travaria player sem convertê-lo.

## Reverter

Trivial. Todas as constantes estão centralizadas:

```
data/crops.ts        → SEED_RATIO
state/rewards.ts     → WATER_BONUS_DEFAULT
data/peculiarities.ts → PECULIARITIES[*].effect.value
state/reducer.ts     → INITIAL_STATE.gold
```

Volta os valores antigos e as assertions passam de novo (contanto que os
CAPS em `assertEconomyProfile` acomodem — reverter também sobe o teto).

Nenhuma migração de storage. Nenhum SKU do App Store. `STORAGE_KEY` continua
`@happyfarm/save/v4`.

## Coisas que achei e sinalizo

1. **A UI mostra alguns preços "10" e "35" pra semente, e "R$ 4,99" no
   pack.** Mescla moeda do jogo com moeda de verdade. Consistência sugere
   sempre "10 coins" / "R$ 4,99" (nunca "10" sozinho na semente e "R$ 4,99"
   na loja). Não mexi porque é fora de escopo dessa mudança, mas se quiser
   tocar depois, é `ShopModal.tsx`.

2. **`FarmGameScreen.tsx` linha 207 abre o Coin Market direto quando sem
   moedas.** Isso é OK do ponto de vista de conversão, MAS num app da Kids
   Category, abrir loja de compra na cara da criança logo depois de uma
   ação frustrada ("não deu grana pra plantar") é o padrão que gera queixa
   parental. O parental gate protege o pagamento em si (Guideline 1.3),
   mas a repetição do trigger pode virar review "app fica pedindo
   dinheiro". Considera trocar por: primeiro tenta comprar semente mais
   barata; se nem essa der, aí sim abre o market. Sinalizo só.

3. **Não tem métrica de sessão nem funil de compra logado.** Se você quer
   validar se o aperto realmente move a agulha, precisa saber:
   - quantas colheitas até o primeiro "sem grana"
   - quantas vezes o Coin Market abriu por sessão
   - taxa de conversão do open → tap em pack → parental gate → compra
   Sem isso, você vai ficar adivinhando se apertou de mais ou de menos.
   MyTamagotchi virou o cenário exato do "não sei" — zero conversões, mas
   sem funil não dá pra saber se é o aperto ou o volume de 25 installs/mês.

4. **Este aperto é reversível em uma linha por arquivo, mas o efeito só
   aparece com volume.** Pedagogy tá com poucos users por dia. Você vai
   precisar de pelo menos umas semanas de dados pra saber se o aperto
   converteu ou só irritou. Não tira conclusão em 3 dias.
