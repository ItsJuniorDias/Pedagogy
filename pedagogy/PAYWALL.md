# Paywall — refatoração de conversão

Tela: `app/(paywall)/index.tsx`. Peças em `features/paywall/`.

```
features/paywall/
├── pricing.ts                 preço, âncora, desconto, teste grátis (puro, testável)
├── trialCopy.ts               duração do teste em texto, igual nos 3 lugares
├── haptics.ts                 feedback tátil (best-effort)
├── socialProof.ts             ⚠️ nota REAL da App Store — desligado por padrão
└── components/
    ├── PlanCard.tsx           card de plano + âncora riscada + semântica de rádio
    ├── StickyCta.tsx          barra fixa: botão, nota de cobrança, restaurar
    ├── TrialTimeline.tsx      hoje → dia X → dia Y
    ├── SocialProof.tsx        faixa de nota (renderiza null sem dado real)
    └── ValueProps.tsx         lista de features + selos de confiança
```

## O que mudou, e a razão de cada mudança

**CTA fixo no rodapé.** Antes o botão vinha depois de seis features, dos planos e
do aviso do portão parental: a primeira dobra da tela não tinha nenhuma ação. Um
paywall com CTA fora da tela depende de o usuário rolar até o fim para poder
comprar — e boa parte simplesmente não rola. Agora a barra é fixa e a altura real
dela é medida (`onLayout`) para o scroll reservar o padding, sem número mágico que
quebra em iPhone SE.

**O botão vende o teste, não o preço.** A versão anterior estampava
"Depois R$ 399,90/ano" em branco, dentro do botão. O número que mais assusta ficava
no ponto de maior atenção, no exato instante do toque. Agora o botão diz
"Começar teste grátis de 7 dias" e a cobrança desce para uma nota cinza, menor,
fora do botão — continua visível e legível (é exigência da Apple e do consumidor),
só deixa de competir com a ação.

**Âncora de preço.** O anual passa a mostrar riscado o custo de 12 meses no plano
mensal. "Economize 44%" é uma afirmação que o usuário precisa aceitar; `R$ 718,80`
riscado ao lado de `R$ 399,90` é uma conta que ele confere sozinho em dois segundos.
O rótulo é sempre "12× o mensal" — nunca "de/por", que sugeriria um preço anterior
que nunca existiu (propaganda enganosa: CDC art. 37 no Brasil, Diretiva 2005/29/CE
na UE). Se não houver plano mensal no offering, a âncora simplesmente não aparece.

**Linha do tempo do teste.** O medo que trava a assinatura não é o preço: é começar
o teste, esquecer e ser cobrado. Tornar o calendário explícito é o componente que
mais reduz esse atrito. Os dias vêm do `introPrice` real do StoreKit.

**Prova social pronta, desligada.** Numa compra em que quem paga não é quem usa, o
pai precisa de sinal externo. É o que mais falta na tela — e o mais fácil de fazer
errado. Ver a seção "Ligar a prova social" abaixo.

**Aviso do portão parental saiu de cima do botão.** Sinalizar fricção no instante
da decisão custa conversão. A informação continua na tela, junto às letras miúdas.

**Hierarquia mais curta.** Herói compacto (emoji 72 → 56, título 30 → 26), um glifo
por linha na lista de features (o ✅ verde era redundante com o emoji temático e
cada linha carregava dois ícones) e planos ordenados com o anual primeiro, coerente
com a pré-seleção.

## Bugs corrigidos no caminho

**Reativação impossível.** A tela fechava sempre que `@subscription_status` valia
`"active"` no AsyncStorage, e esse flag nunca era apagado. Quem cancelava ou tinha o
teste expirado ficava com o paywall se fechando sozinho, sem nenhuma forma de
assinar de novo. Agora a fonte da verdade é o RevenueCat: o flag é só espelho, e é
removido quando o entitlement não está mais ativo.

**Teste "grátis" que não era grátis.** Qualquer `introPrice` era rotulado como teste
grátis, inclusive preço promocional de entrada. Agora só entra `introPrice.price === 0`.

**Usuário preso após assinar vindo do onboarding.** O onboarding chega aqui com
`router.replace`, então o paywall é a única tela da pilha e `router.back()` vira
no-op. `dismiss()` agora cai em `/(tabs)` quando não há para onde voltar.

**Beco sem saída no erro de carregamento.** Se o offering falhava, a tela mostrava
a mensagem de erro e mais nada — o `refresh()` do hook existia e nunca era usado.
Agora há botão de tentar de novo.

**Acessibilidade.** Os cards de plano eram `TouchableOpacity` mudos; agora têm
`accessibilityRole="radio"` e estado de seleção. Botões novos declaram rótulo.

## Medição

O evento de paywall agora carrega `source`, preenchido nas três entradas:
`onboarding` (fim do onboarding), `narration` (tocou no play sem assinar) e
`locked_chapter` (capítulo bloqueado). Dois eventos novos fecham o meio do funil:
`paywall_plan_selected` e `paywall_dismissed`.

A leitura que isso permite: quem seleciona um plano e não conclui está travando no
preço; quem nem seleciona está travando antes — na proposta de valor ou na tela
inteira. São dois problemas diferentes, com correções diferentes, e hoje eles são
indistinguíveis nos dados.

Vale cruzar `source` com país no backend first-party (`lib/analytics.ts` já envia
para `pedagogy-analytics.onrender.com/events`). Se a maior parte das views vier de
um país e a conversão vier de outro, o problema não está nesta tela — está em para
onde a verba de mídia está indo.

## Ligar a prova social

Em `features/paywall/socialProof.ts`, troque `APP_STORE_RATING` de `null` para os
números reais da página do app:

```ts
export const APP_STORE_RATING: AppStoreRating | null = { rating: 4.8, count: 127 };
```

Só entra número verificável na App Store. Depoimento inventado, "+10 mil famílias"
sem lastro ou nota arredondada para cima é conteúdo enganoso (App Review 2.3) e
motivo de rejeição. Enquanto ficar `null`, o bloco não renderiza e a tela segue
íntegra. Revise a cada release: número desatualizado também é número errado.

## O que ficou de fora, de propósito

**Lembrete de fim do teste.** O passo do meio da linha do tempo NÃO promete
"avisaremos antes de cobrar", porque o app não envia nada — não há
`expo-notifications` no projeto. Prometer um aviso que não existe é cobrança
inesperada para o usuário e conteúdo enganoso para a App Review. Implementar um
lembrete local de verdade (notificação agendada para `dias - 2`) é provavelmente o
maior ganho isolado que sobrou: é exatamente o medo que trava a decisão.

**Links de Termos e Privacidade.** Continuam apontando para `app.notion.com`, que é
a URL do EDITOR e pode exigir login — o revisor da Apple provavelmente não abre.
Troque pelos links publicados (`...notion.site/...`, via Share → Publish) e teste
numa aba anônima antes do próximo envio.

## O que testar antes de considerar concluído

Cheque com uma conta de sandbox: plano anual pré-selecionado ao abrir; selo de
teste, botão e linha do tempo dizendo a mesma duração; âncora riscada aparecendo só
no anual e só quando existe plano mensal; barra fixa visível sem rolar, em iPhone SE
e em Pro Max; compra bem-sucedida saindo da tela tanto pelo fluxo do leitor quanto
pelo do onboarding; cancelamento na Apple fazendo o paywall voltar a abrir
normalmente; e a tela em ar (RTL) e em de/fr, onde os textos são mais longos.

Ordem sugerida de A/B, uma variável por vez: (1) CTA fixo + copy de teste no botão,
que é a maior aposta; (2) âncora riscada; (3) linha do tempo; (4) prova social,
quando houver dado real.
