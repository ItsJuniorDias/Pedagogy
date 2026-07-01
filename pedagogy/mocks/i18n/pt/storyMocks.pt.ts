// mocks/i18n/pt/storyMocks.pt.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tradução (pt-BR) das 6 histórias em destaque de mocks/storyMocks.ts.
// id / emoji / locked são idênticos ao inglês (o resolver os re-impõe de qualquer
// forma). Nomes próprios (Leo, Cosmo, Mia, Pip, Finn, Zara, Rex, Ember…) são
// mantidos. Cada `pages` tem o MESMO número de páginas do original.
// ─────────────────────────────────────────────────────────────────────────────

import type { LocalizedChapter } from "../types";

export const ROCKET_ADVENTURE: LocalizedChapter[] = [
  {
    id: "sa-1",
    emoji: "🚀",
    title: "Decolagem!",
    subtitle: "A jornada começa",
    locked: false,
    pages: [
      "A contagem regressiva ecoou pela plataforma de lançamento. Dez… nove… oito… O jovem astronauta Leo agarrou o assento enquanto os motores rugiam ganhando vida embaixo dele.",
      "Sete… seis… cinco… O foguete estremeceu como um gigante acordando de um sono profundo. Leo sentia cada parafuso e cada painel vibrando com energia pura.",
      "Quatro… três… dois… um… IGNIÇÃO! Uma parede de fumaça branca explodiu para fora e o foguete atravessou o céu, deixando a Terra para trás em segundos.",
      "Leo colou o rosto na escotilha. Lá embaixo, as nuvens encolhiam em fiapos de algodão. A curva azul do planeta preencheu todo o seu campo de visão.",
      "O Controle da Missão crepitou no capacete: Leo, você está LIBERADO para a órbita. Ele fez um sinal de positivo para o assento vazio ao lado — reservado para seu melhor amigo, um ursinho de pelúcia chamado Cosmo.",
    ],
  },
  {
    id: "sa-2",
    emoji: "🌕",
    title: "Parada na Lua",
    subtitle: "Poeira e crateras",
    locked: false,
    pages: [
      "A Lua cresceu de uma bolinha de gude a uma montanha enquanto Leo guiava a nave para a órbita lunar. Crateras cinzentas se estendiam em todas as direções, como ondas congeladas.",
      "Ele pousou com um baque suave no Mar da Tranquilidade. A poeira subiu em nuvens lentas e silenciosas ao redor das pernas de pouso.",
      '"Um pequeno passo", Leo sussurrou para Cosmo, e então caiu na gargalhada ao saltar três metros no ar logo na primeira passada.',
      "Ele coletou amostras de rocha, fincou uma bandeirinha feita com o cachecol velho da mãe e almoçou um sanduíche de queijo flutuante.",
      "Antes de voltar, ele escreveu seu nome na poeira com o dedo enluvado. A Lua não tinha vento — sua assinatura ficaria ali para sempre.",
    ],
  },
  {
    id: "sa-3",
    emoji: "🪐",
    title: "Cavaleiro dos Anéis",
    subtitle: "A surpresa de Saturno",
    locked: true,
    pages: [
      "Saturno surgiu como uma pintura — dourado, com anéis e impossivelmente enorme. Leo desligou os motores e simplesmente ficou olhando por um minuto inteiro.",
      "Os anéis eram feitos de blocos de gelo que iam do tamanho de um floco de neve ao tamanho de uma casa. Leo pilotou a nave por entre eles como num circuito de slalom.",
      'Uma pedrinha gelada bateu no casco: CLONC. Cosmo tombou do painel. Leo o pegou no colo. "Estamos bem, amigão."',
      "No fundo dos anéis ele avistou algo extraordinário: uma esfera perfeita de gelo que brilhava num azul suave por dentro. Ele a recolheu num pote de amostras.",
      '"Controle da Missão", ele chamou pelo rádio, mal respirando, "acho que acabei de encontrar algo que ninguém nunca viu antes." Houve um longo silêncio — e então uma comemoração ensurdecedora.',
    ],
  },
];

export const MAGIC_FOREST: LocalizedChapter[] = [
  {
    id: "mf-1",
    emoji: "🌲",
    title: "O Primeiro Passo",
    subtitle: "Rumo ao verde",
    locked: false,
    pages: [
      "Mia morava ao lado da Floresta Mágica a vida inteira, mas nunca tinha se atrevido a entrar. Hoje era diferente. Hoje ela estava com a bússola da avó.",
      "No instante em que cruzou o muro de pedra coberto de musgo, o ar mudou. Cheirava a canela, a chuva e a algo que ela não sabia bem nomear — possibilidades, talvez.",
      "As árvores ali eram antigas, com troncos mais largos que a casa dela. Pequenas luzes flutuavam entre os galhos como vaga-lumes em câmera lenta.",
      'Uma raposa de cauda prateada estava sentada no meio da trilha. Ela olhou para Mia do jeito que as pessoas olham para velhos amigos. "Você demorou", ela disse.',
      "Mia não gritou. Ela sempre acreditou, em segredo, que os animais podiam falar — só não esperava que fossem tão educados sobre isso.",
    ],
  },
  {
    id: "mf-2",
    emoji: "🍄",
    title: "Vila Cogumelo",
    subtitle: "Vizinhos pequeninos",
    locked: false,
    pages: [
      "A raposa prateada — cujo nome era Pip — levou Mia a uma clareira escondida embaixo de um enorme carvalho caído.",
      "Ali, construída nas raízes e na terra, havia toda uma cidade de casas em formato de chapéu de cogumelo. Fumaça saía das chaminés de bolota. Janelinhas brilhavam cor de âmbar.",
      "Os moradores eram ouriços não maiores que o punho de Mia, cada um vestindo um casaco feito de uma única folha caída.",
      'O Prefeito — um ouriço bem gorducho de colete de folha de bordo — fez uma reverência tão baixa que o nariz tocou o chão. "Estávamos esperando a Guardiã da Bússola", ele anunciou.',
      "Mia olhou para a bússola da avó. A agulha, ela percebeu agora, não apontava para o norte. Girava devagar, como se procurasse por algo completamente diferente.",
    ],
  },
  {
    id: "mf-3",
    emoji: "🌟",
    title: "A Estrela Perdida",
    subtitle: "Um mistério no céu",
    locked: true,
    pages: [
      "O prefeito ouriço explicou o problema numa voz grave e esganiçada: uma estrela tinha caído na floresta três noites atrás e estava se apagando aos poucos.",
      "Sem ela, a magia da floresta enfraqueceria. As luzes dos vaga-lumes se apagariam. Os animais falantes esqueceriam suas palavras. A Vila Cogumelo mergulharia no escuro.",
      "A estrela caída era do tamanho de uma melancia e repousava num laguinho no coração da floresta, tremeluzindo como uma vela ao vento.",
      "Mia se ajoelhou ao lado dela. Estava morna e cantarolava bem baixinho — na mesma frequência que a avó costumava cantarolar enquanto cozinhava.",
      'Ela abriu a bússola. A agulha parou de girar e apontou direto para a estrela. A voz da avó pareceu sussurrar: "Você já sabe o que fazer, meu amor."',
    ],
  },
];

export const OCEANFRIENDS: LocalizedChapter[] = [
  {
    id: "ol-1",
    emoji: "🐠",
    title: "Manhã no Recife",
    subtitle: "Cores debaixo d'água",
    locked: false,
    pages: [
      "Ao nascer do sol, o recife de coral já estava acordado. Milhares de peixes cruzavam túneis de coral rosa e laranja como um confete vivo.",
      "Finn, o peixe-palhaço, fazia sua ronda matinal — conferindo se cada anêmona estava em ordem, se cada vizinho estava presente.",
      'Ele passou pela Dona Polvo, que reorganizava sua coleção de pedras pela décima sétima vez naquela semana. "Layout diferente hoje?", perguntou Finn. "Feng shui", ela respondeu, firme.',
      "O recife tinha suas próprias regras, seu próprio trânsito, seus próprios bairros. Finn conhecia cada atalho, cada esconderijo, cada corrente.",
      "Mas hoje, um canto do recife estava quieto. Quieto demais. Os peixes que moravam ali tinham sumido, e o coral tinha ficado de um cinza triste.",
    ],
  },
  {
    id: "ol-2",
    emoji: "🐙",
    title: "Mergulho Profundo",
    subtitle: "Rumo à escuridão",
    locked: false,
    pages: [
      "Finn perguntou à criatura mais velha do recife — a Vovó Tartaruga, que nadava desde antes de qualquer um se lembrar — o que aquele cinza significava.",
      '"A água está quente demais naquele pedaço", disse a Vovó Tartaruga, piscando seus olhos antigos. "O coral está estressado. Ele mandou os peixes embora até se recuperar."',
      "Finn já tinha ouvido falar disso acontecendo bem longe, em recifes que ele nunca tinha visto. Não achava que pudesse acontecer ali.",
      '"O que a gente pode fazer?", ele perguntou. A Vovó Tartaruga sorriu. "Exatamente o que você está fazendo agora — perceber. E depois contar para todo mundo."',
      "Então Finn nadou mais rápido do que jamais tinha nadado, chamando cada peixe, cada caranguejo, cada lesma-do-mar que encontrava. Algo estava errado, e todos precisavam saber.",
    ],
  },
  {
    id: "ol-3",
    emoji: "🌊",
    title: "A Correnteza",
    subtitle: "Trabalhando juntos",
    locked: true,
    pages: [
      "A notícia se espalhou rápido debaixo d'água. À tarde, cada criatura do recife tinha se reunido no pedaço cinza — foi a maior assembleia que o recife já tinha visto.",
      "Os peixes-papagaio se ofereceram para comer as algas que sufocavam o coral estressado. Os ouriços-do-mar se ofereceram para limpar as partes mortas, para o coral novo poder crescer.",
      "Até a Dona Polvo doou três de suas melhores pedras para fazer sombra sobre os pontos mais quentes.",
      "Levou semanas. Finn conferia toda manhã. E então, um dia, o menorzinho pontinho de rosa apareceu no meio do cinza — coral novo, não maior que a nadadeira dele.",
      "No fim da estação, o pedaço cinza tinha sumido, substituído por uma explosão de cores mais vivas que antes. Os peixes voltaram. O recife estava inteiro de novo.",
    ],
  },
];

export const TINY_SCIENTIST: LocalizedChapter[] = [
  {
    id: "sl-1",
    emoji: "🔬",
    title: "Primeiro Dia no Laboratório",
    subtitle: "Misturando e criando",
    locked: false,
    pages: [
      "O quarto de Zara tinha se tornado oficialmente um laboratório. A escrivaninha estava coberta de tubos de ensaio, bicarbonato de sódio, corante alimentício e uma lista de experimentos escrita na sua letra mais caprichada.",
      "Experimento nº 1: Vulcão. Ela despejou vinagre sobre um montinho de bicarbonato. O resultado explodiu por cima de três cadernos e do gato dela, que saiu na hora.",
      'Ela limpou tudo e anotou no diário de bordo: "Observação — usar quantidades menores. Além disso, o gato não é mais um participante voluntário da pesquisa."',
      "Experimento nº 2: Arco-íris num copo. Ela dispôs em camadas mel, detergente, água e óleo num pote alto, colocando um corante diferente em cada um.",
      "As cores se acomodaram em faixas perfeitas. Zara colou o nariz no vidro. A ciência, ela concluiu, era basicamente mágica com anotações melhores.",
    ],
  },
  {
    id: "sl-2",
    emoji: "⚗️",
    title: "A Grande Pergunta",
    subtitle: "Por que funciona?",
    locked: false,
    pages: [
      'O pai de Zara olhou para o pote arco-íris e perguntou: "Mas você sabe POR QUE as camadas ficam separadas?" Ela abriu a boca — e então a fechou.',
      "Ela tinha feito a coisa. Não tinha pensado no porquê. Isso a incomodou mais do que ela esperava.",
      'Ela voltou ao diário de bordo e escreveu no topo de uma página nova: "DENSIDADE". Depois pesquisou, leu por vinte minutos e escreveu três páginas de anotações.',
      "Líquidos mais densos afundavam. Líquidos menos densos flutuavam. O mel era o mais pesado, o óleo o mais leve. As cores eram só passageiras.",
      "Ela fez o pote arco-íris de novo, dessa vez narrando cada camada como uma apresentadora de documentário. O pai filmou. Rendeu quarenta e sete visualizações, quase todas de parentes.",
    ],
  },
  {
    id: "sl-3",
    emoji: "💡",
    title: "Dia da Invenção",
    subtitle: "Algo totalmente novo",
    locked: true,
    pages: [
      "A feira de ciências da escola era dali a duas semanas. Todo mundo ia fazer vulcão. Zara se recusou a fazer vulcão. Ela já tinha feito um vulcão. No gato.",
      'Ela decidiu inventar algo de verdade útil. Depois de uma lista que incluía "cama que se arruma sozinha" (difícil demais) e "robô que faz o dever de casa" (provavelmente ilegal), ela optou por um alarme de rega de plantas.',
      "Usando uma garrafa plástica, um pouco de barbante e um sensor de umidade de um brinquedo velho, ela construiu um aparelho que pingava água na planta só quando a terra estava seca.",
      "Funcionou. Quase sempre. No terceiro teste, encharcou o diário de bordo, mas isso era um problema de calibração, que ela resolveu com um pedaço de fita e determinação.",
      'Na feira de ciências, ninguém mais tinha uma invenção. Zara ganhou o primeiro lugar. Ela escreveu no diário: "Hipótese confirmada: ideias originais ganham dos vulcões todas as vezes."',
    ],
  },
];

export const DRAGON_DIARY: LocalizedChapter[] = [
  {
    id: "dd-1",
    emoji: "🐉",
    title: "Querido Diário",
    subtitle: "Primeiro dia sendo um dragão",
    locked: false,
    pages: [
      "Querido Diário, hoje eu acordei dragão. Não sei bem como isso aconteceu. Ontem eu tinha onze anos e fui dormir normalmente. Agora eu tenho escamas.",
      "As escamas são roxas, que por acaso é a minha cor favorita, então essa parte tá tranquila. Minhas asas, porém, derrubaram a estante, o que é menos tranquilo.",
      "A Mãe veio me acordar e gritou. Depois me abraçou. Depois gritou de novo, mas baixinho, de boca fechada, o que de algum jeito é pior.",
      'O Pai disse que a gente precisava "avaliar a situação". Ele fez uma planilha. Eu comi sem querer. Eu não quis soltar fogo. Simplesmente aconteceu.',
      "A escola vai ser complicada.",
    ],
  },
  {
    id: "dd-2",
    emoji: "🏫",
    title: "Dias de Escola",
    subtitle: "Me encaixando (mais ou menos)",
    locked: false,
    pages: [
      'Querido Diário, a Mãe ligou para a escola para explicar. Houve uma longa pausa. Aí a diretora disse: "Nós temos uma política para isso." Eu não sabia que existia uma política para isso.',
      "Eu tive que usar a porta dupla e sentar no fundo, onde havia mais espaço. Minha melhor amiga Priya guardou o lugar do lado dela mesmo eu estando bem grande agora.",
      'Em ciências, aprendemos sobre animais de sangue frio. Levantei a garra para comentar que tecnicamente agora eu era de sangue quente, mas com tendência a fogo. A professora disse "fascinante" e me deu um adesivo.',
      "No almoço eu derreti meu pudim sem querer, o que melhorou o pudim bastante. Três pessoas me pediram para derreter o delas também. Fiz alguns amigos novos.",
      "Voar para casa foi mais rápido que o ônibus. Existem algumas vantagens nessa situação.",
    ],
  },
  {
    id: "dd-3",
    emoji: "🌙",
    title: "A Outra Dragão",
    subtitle: "Não mais sozinho",
    locked: true,
    pages: [
      'Querido Diário, hoje eu conheci outra dragão. Ela estava sentada no telhado da biblioteca, lendo. Eu pousei do lado dela. "Você é novo", ela disse, sem levantar os olhos.',
      "O nome dela é Ember e ela é dragão há três anos. Tem quatorze e é muito tranquila sobre a coisa toda, o que achei extremamente reconfortante.",
      "Ela me ensinou a dobrar as asas do jeito certo para eu parar de derrubar as coisas. É tipo ajeitar um casaco bem grande. Depois que você pega o truque, é fácil.",
      'Perguntei se ela sabia por que aconteceu. Ela deu de ombros. "Isso importa? Você está aqui agora. Com asas e tudo." Fiquei pensando nisso por um longo tempo.',
      'Ela me emprestou um livro chamado "Sendo Extraordinário num Mundo Comum". Era sobre dragões. A autora era uma dragão. Eu não sabia que dragões escreviam livros. Hoje foi um bom dia.',
    ],
  },
];

export const DINO_WORLD: LocalizedChapter[] = [
  {
    id: "dw-1",
    emoji: "🦖",
    title: "Dia da Eclosão",
    subtitle: "Um novo começo",
    locked: false,
    pages: [
      "O ovo tinha sido do tamanho de uma pedra enorme. Quando finalmente rachou, o vale inteiro tremeu — pelo menos era o que Rex sempre contava para os irmãos mais novos.",
      "Rex era um jovem T-Rex, mas ainda não tinha se dado conta disso. Ele só sabia que o mundo era imenso, cheirava a coisas interessantes e que ele estava com muita, muita fome.",
      "A mãe dele mostrou quais plantas eram macias o bastante para atravessar, quais rios eram rasos o bastante para cruzar e de quais outros dinossauros era melhor manter distância.",
      '"A regra", ela disse, "é simples: respeite o vale. Tudo aqui está conectado. Você puxa um fio e a coisa toda se desfaz."',
      "Rex assentiu com seriedade e, logo em seguida, tropeçou na cauda de um estegossauro. O estegossauro nem percebeu. Rex decidiu começar pelo pequeno.",
    ],
  },
  {
    id: "dw-2",
    emoji: "🌿",
    title: "As Regras do Vale",
    subtitle: "Conhecendo a terra",
    locked: false,
    pages: [
      "O vale tinha mais regras do que Rex esperava. Não beber das poças de lama vermelha. Não cruzar o campo de samambaias durante as grandes chuvas. Não discutir com os tricerátops.",
      "Ele aprendeu cometendo exatamente os erros que tinham mandado ele não cometer. As poças de lama vermelha tinham gosto horrível. O campo de samambaias na chuva era como uma cachoeira na cabeça.",
      "Ele não discutiu com os tricerátops, é preciso reconhecer. Eles tinham três chifres e opiniões bem claras, e Rex prezava seu focinho.",
      "Seu lugar favorito era a beira do penhasco no pôr do sol, onde o vale inteiro se abria lá embaixo em tons de dourado e verde. Ele conseguia ver cada manada, cada rio, cada coluna de vapor das fontes termais.",
      '"Um dia", ele disse a um pterodáctilo que passava, "eu vou conhecer cada pedacinho deste vale." O pterodáctilo lhe lançou um olhar longo e cético e foi embora voando.',
    ],
  },
  {
    id: "dw-3",
    emoji: "🌋",
    title: "O Estrondo",
    subtitle: "Quando o chão fala",
    locked: true,
    pages: [
      "O chão tremeu numa terça-feira. Rex soube que era incomum porque os pássaros silenciaram primeiro — cada criatura do vale parou e escutou.",
      "As fontes termais perto da encosta sul borbulhavam mais que o normal. Os dinossauros mais velhos levaram suas manadas para o norte sem ninguém pedir. Eles se lembravam.",
      "Rex ficou para trás. Ele queria ver. A mãe o encontrou, agarrou pela cauda e seguiu para o norte num ritmo que não deixava espaço para discussão.",
      "A encosta sul roncou mais uma vez e depois se acalmou. Os pássaros voltaram. O vale respirou fundo. Tudo ficou quieto de um jeito que parecia alívio.",
      "Naquela noite, Rex deitou sob as estrelas e pensou em como ele era pequeno, em como o vale era antigo e em como o próprio chão tinha memória. Ele sentiu, pela primeira vez, que de fato pertencia a algo.",
    ],
  },
];
