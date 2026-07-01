// mocks/i18n/es/storyMocks.es.ts
// ─────────────────────────────────────────────────────────────────────────────
// Traducción (es) de las 6 historias destacadas de mocks/storyMocks.ts.
// id / emoji / locked idénticos al inglés. Nombres propios conservados.
// ─────────────────────────────────────────────────────────────────────────────

import type { LocalizedChapter } from "../types";

export const ROCKET_ADVENTURE: LocalizedChapter[] = [
  {
    id: "sa-1",
    emoji: "🚀",
    title: "¡Despegue!",
    subtitle: "Comienza el viaje",
    locked: false,
    pages: [
      "La cuenta regresiva resonó por la plataforma de lanzamiento. Diez… nueve… ocho… El joven astronauta Leo se aferró a su asiento mientras los motores rugían cobrando vida debajo de él.",
      "Siete… seis… cinco… El cohete se estremeció como un gigante despertando de un sueño profundo. Leo sentía cada tornillo y cada panel vibrando con energía pura.",
      "Cuatro… tres… dos… uno… ¡IGNICIÓN! Una pared de humo blanco estalló hacia afuera y el cohete atravesó el cielo, dejando la Tierra atrás en segundos.",
      "Leo pegó la cara a la escotilla. Abajo, las nubes se encogían hasta volverse hilachas de algodón. La curva azul del planeta llenó todo su campo de visión.",
      "El Control de la Misión crepitó en su casco: Leo, tienes LUZ VERDE para la órbita. Levantó el pulgar hacia el asiento vacío a su lado, reservado para su mejor amigo, un osito de peluche llamado Cosmo.",
    ],
  },
  {
    id: "sa-2",
    emoji: "🌕",
    title: "Parada en la Luna",
    subtitle: "Polvo y cráteres",
    locked: false,
    pages: [
      "La Luna creció de una canica a una montaña mientras Leo guiaba la nave hacia la órbita lunar. Cráteres grises se extendían en todas direcciones, como ondas congeladas.",
      "Aterrizó con un golpe suave en el Mar de la Tranquilidad. El polvo se levantó en nubes lentas y silenciosas alrededor de las patas de aterrizaje.",
      '"Un pequeño paso", le susurró Leo a Cosmo, y luego soltó una carcajada al dar un salto de tres metros en su primerísima zancada.',
      "Recogió muestras de roca, clavó una banderita hecha con la vieja bufanda de su mamá y almorzó un sándwich de queso flotante.",
      "Antes de volver, escribió su nombre en el polvo con un dedo enguantado. La Luna no tenía viento: su firma quedaría allí para siempre.",
    ],
  },
  {
    id: "sa-3",
    emoji: "🪐",
    title: "Jinete de Anillos",
    subtitle: "La sorpresa de Saturno",
    locked: true,
    pages: [
      "Saturno apareció como una pintura: dorado, con anillos e imposiblemente enorme. Leo apagó los motores y simplemente se quedó mirando durante un minuto entero.",
      "Los anillos estaban hechos de trozos de hielo que iban del tamaño de un copo de nieve al de una casa. Leo voló la nave entre ellos como en un circuito de slalom.",
      'Una piedrita helada golpeó el casco: ¡CLONC! Cosmo se cayó del tablero. Leo lo recogió. "Estamos bien, amigo."',
      "En lo profundo de los anillos vio algo extraordinario: una esfera perfecta de hielo que brillaba con un azul tenue por dentro. La recogió en un frasco de muestras.",
      '"Control de la Misión", dijo por radio, casi sin respirar, "creo que acabo de encontrar algo que nadie ha visto jamás." Hubo un largo silencio, y luego un vitoreo ensordecedor.',
    ],
  },
];

export const MAGIC_FOREST: LocalizedChapter[] = [
  {
    id: "mf-1",
    emoji: "🌲",
    title: "El Primer Paso",
    subtitle: "Hacia el verde",
    locked: false,
    pages: [
      "Mia vivió junto al Bosque Mágico toda su vida, pero nunca se había atrevido a entrar. Hoy era diferente. Hoy llevaba la brújula de su abuela.",
      "En el instante en que cruzó el muro de piedra cubierto de musgo, el aire cambió. Olía a canela, a lluvia y a algo que no sabía nombrar del todo: posibilidades, quizás.",
      "Los árboles allí eran antiguos, con troncos más anchos que su casa. Pequeñas luces flotaban entre las ramas como luciérnagas en cámara lenta.",
      'Un zorro de cola plateada estaba sentado en medio del sendero. Miró a Mia como la gente mira a los viejos amigos. "Te tomaste tu tiempo", dijo.',
      "Mia no gritó. Siempre había creído en secreto que los animales podían hablar; solo que no esperaba que fueran tan educados al respecto.",
    ],
  },
  {
    id: "mf-2",
    emoji: "🍄",
    title: "Pueblo Hongo",
    subtitle: "Vecinos diminutos",
    locked: false,
    pages: [
      "El zorro plateado, cuyo nombre era Pip, llevó a Mia a un claro escondido bajo un enorme roble caído.",
      "Allí, construido en las raíces y en la tierra, había todo un pueblo de casas con forma de sombrero de hongo. El humo salía de chimeneas de bellota. Ventanitas brillaban de color ámbar.",
      "Los habitantes eran erizos no más grandes que el puño de Mia, cada uno con un abrigo hecho de una sola hoja caída.",
      'El Alcalde, un erizo muy regordete con chaleco de hoja de arce, hizo una reverencia tan profunda que su nariz tocó el suelo. "Estábamos esperando a la Guardiana de la Brújula", anunció.',
      "Mia miró la brújula de su abuela. La aguja, se dio cuenta ahora, no apuntaba al norte. Giraba despacio, como si buscara algo completamente distinto.",
    ],
  },
  {
    id: "mf-3",
    emoji: "🌟",
    title: "La Estrella Perdida",
    subtitle: "Un misterio en el cielo",
    locked: true,
    pages: [
      "El alcalde erizo explicó el problema con una voz grave y chillona: una estrella había caído en el bosque tres noches atrás y se estaba apagando poco a poco.",
      "Sin ella, la magia del bosque se debilitaría. Las luces de las luciérnagas se apagarían. Los animales parlantes olvidarían sus palabras. Pueblo Hongo quedaría a oscuras.",
      "La estrella caída era del tamaño de una sandía y descansaba en un estanque en el corazón del bosque, titilando como una vela al viento.",
      "Mia se arrodilló junto a ella. Estaba tibia y zumbaba muy suavemente, en la misma frecuencia que su abuela solía tararear mientras cocinaba.",
      'Abrió la brújula. La aguja dejó de girar y apuntó directo a la estrella. La voz de su abuela pareció susurrar: "Ya sabes qué hacer, mi amor."',
    ],
  },
];

export const OCEANFRIENDS: LocalizedChapter[] = [
  {
    id: "ol-1",
    emoji: "🐠",
    title: "Mañana en el Arrecife",
    subtitle: "Colores bajo el agua",
    locked: false,
    pages: [
      "Al amanecer, el arrecife de coral ya estaba despierto. Miles de peces cruzaban túneles de coral rosa y naranja como confeti viviente.",
      "Finn, el pez payaso, hacía su ronda matutina, comprobando que cada anémona estuviera en orden y cada vecino presente.",
      '"¿Otra distribución hoy?", preguntó Finn al pasar junto a la Señora Pulpo, que reacomodaba su colección de piedras por decimoséptima vez esa semana. "Feng shui", respondió ella con firmeza.',
      "El arrecife tenía sus propias reglas, su propio tránsito, sus propios barrios. Finn conocía cada atajo, cada escondite, cada corriente.",
      "Pero hoy, un rincón del arrecife estaba en silencio. Demasiado silencio. Los peces que vivían allí habían desaparecido, y el coral se había vuelto de un gris triste.",
    ],
  },
  {
    id: "ol-2",
    emoji: "🐙",
    title: "Inmersión Profunda",
    subtitle: "Hacia la oscuridad",
    locked: false,
    pages: [
      "Finn le preguntó a la criatura más vieja del arrecife —la Abuela Tortuga, que nadaba desde antes de que nadie pudiera recordar— qué significaba aquel gris.",
      '"El agua está demasiado caliente en ese trozo", dijo la Abuela Tortuga, parpadeando con sus ojos antiguos. "El coral está estresado. Ha mandado a los peces lejos hasta recuperarse."',
      "Finn había oído que esto pasaba muy lejos, en arrecifes que nunca había visto. No creía que pudiera pasar aquí.",
      '"¿Qué podemos hacer?", preguntó. La Abuela Tortuga sonrió. "Exactamente lo que estás haciendo ahora: notarlo. Y luego contárselo a todos los demás."',
      "Así que Finn nadó más rápido que nunca, llamando a cada pez, cada cangrejo, cada babosa de mar que pasaba. Algo andaba mal, y todos necesitaban saberlo.",
    ],
  },
  {
    id: "ol-3",
    emoji: "🌊",
    title: "La Corriente",
    subtitle: "Trabajando juntos",
    locked: true,
    pages: [
      "La noticia se corrió rápido bajo el agua. Por la tarde, cada criatura del arrecife se había reunido en el trozo gris: fue la asamblea más grande que el arrecife había visto jamás.",
      "Los peces loro se ofrecieron a comer las algas que asfixiaban al coral estresado. Los erizos de mar se ofrecieron a limpiar las partes muertas para que el coral nuevo pudiera crecer.",
      "Hasta la Señora Pulpo donó tres de sus mejores piedras para dar sombra sobre los puntos más calientes.",
      "Tardó semanas. Finn revisaba cada mañana. Y entonces, un día, el puntito más pequeño de rosa apareció en medio del gris: coral nuevo, no más grande que su aleta.",
      "Al final de la temporada, el trozo gris había desaparecido, reemplazado por un estallido de colores más brillantes que antes. Los peces regresaron. El arrecife volvió a estar entero.",
    ],
  },
];

export const TINY_SCIENTIST: LocalizedChapter[] = [
  {
    id: "sl-1",
    emoji: "🔬",
    title: "Primer Día de Laboratorio",
    subtitle: "Mezclar y crear",
    locked: false,
    pages: [
      "La habitación de Zara se había convertido oficialmente en un laboratorio. Su escritorio estaba cubierto de tubos de ensayo, bicarbonato, colorante de comida y una lista de experimentos escrita con su letra más prolija.",
      "Experimento n.º 1: Volcán. Vertió vinagre sobre un montículo de bicarbonato. El resultado explotó sobre tres cuadernos y sobre su gato, que se marchó de inmediato.",
      'Limpió todo y anotó en su cuaderno de laboratorio: "Nota: usar cantidades más pequeñas. Además, el gato ya no es un participante voluntario de la investigación."',
      "Experimento n.º 2: Arcoíris en un vaso. Puso en capas miel, jabón lavavajillas, agua y aceite en un frasco alto, añadiendo un colorante distinto a cada uno.",
      "Los colores se asentaron en franjas perfectas. Zara pegó la nariz al vidrio. La ciencia, decidió, era básicamente magia con mejores apuntes.",
    ],
  },
  {
    id: "sl-2",
    emoji: "⚗️",
    title: "La Gran Pregunta",
    subtitle: "¿Por qué funciona?",
    locked: false,
    pages: [
      'El papá de Zara miró el frasco arcoíris y preguntó: "Pero ¿sabes POR QUÉ las capas se mantienen separadas?" Ella abrió la boca… y luego la cerró.',
      "Había hecho la cosa. No había pensado en el porqué. Eso la molestó más de lo que esperaba.",
      'Volvió a su cuaderno de laboratorio y escribió en la parte superior de una página nueva: "DENSIDAD". Luego lo buscó, leyó durante veinte minutos y escribió tres páginas de apuntes.',
      "Los líquidos más densos se hundían. Los menos densos flotaban. La miel era la más pesada, el aceite el más liviano. Los colores solo eran pasajeros.",
      "Hizo el frasco arcoíris otra vez, esta vez narrando cada capa como una presentadora de documentales. Su papá lo filmó. Consiguió cuarenta y siete visitas, casi todas de parientes.",
    ],
  },
  {
    id: "sl-3",
    emoji: "💡",
    title: "Día de la Invención",
    subtitle: "Algo totalmente nuevo",
    locked: true,
    pages: [
      "La feria de ciencias de la escuela era en dos semanas. Todos los demás hacían volcanes. Zara se negó a hacer un volcán. Ya había hecho un volcán. Sobre su gato.",
      'Decidió inventar algo de verdad útil. Tras una lista que incluía "cama que se hace sola" (demasiado difícil) y "robot que hace la tarea" (probablemente ilegal), se decidió por una alarma para regar plantas.',
      "Con una botella de plástico, un poco de hilo y un sensor de humedad de un juguete viejo, construyó un aparato que goteaba agua sobre su planta solo cuando la tierra estaba seca.",
      "Funcionó. Casi siempre. En la tercera prueba empapó su cuaderno de laboratorio, pero eso era un problema de calibración, que resolvió con un trozo de cinta y determinación.",
      'En la feria de ciencias, nadie más tenía una invención. Zara ganó el primer lugar. Escribió en su cuaderno: "Hipótesis confirmada: las ideas originales le ganan a los volcanes todas las veces."',
    ],
  },
];

export const DRAGON_DIARY: LocalizedChapter[] = [
  {
    id: "dd-1",
    emoji: "🐉",
    title: "Querido Diario",
    subtitle: "Primer día siendo un dragón",
    locked: false,
    pages: [
      "Querido Diario, hoy me desperté convertido en dragón. No sé muy bien cómo pasó. Ayer tenía once años y me fui a dormir normalmente. Ahora tengo escamas.",
      "Las escamas son moradas, que resulta ser mi color favorito, así que esa parte está bien. Mis alas, en cambio, tiraron la estantería, lo cual está menos bien.",
      "Mamá vino a despertarme y gritó. Después me abrazó. Después gritó otra vez, pero bajito, con la boca cerrada, lo que de algún modo es peor.",
      'Papá dijo que teníamos que "evaluar la situación". Hizo una hoja de cálculo. Me la comí sin querer. No quise echar fuego. Simplemente pasó.',
      "La escuela va a ser complicada.",
    ],
  },
  {
    id: "dd-2",
    emoji: "🏫",
    title: "Días de Escuela",
    subtitle: "Encajar (más o menos)",
    locked: false,
    pages: [
      'Querido Diario, Mamá llamó a la escuela para explicar. Hubo una larga pausa. Luego la directora dijo: "Tenemos una política para esto." Yo no sabía que había una política para esto.',
      "Tuve que usar la puerta doble y sentarme al fondo, donde había más espacio. Mi mejor amiga Priya me guardó el asiento junto al suyo, aunque ahora soy bastante grande.",
      'En ciencias aprendimos sobre animales de sangre fría. Levanté la garra para mencionar que técnicamente ahora era de sangre caliente, pero con tendencia al fuego. La maestra dijo "fascinante" y me dio una calcomanía.',
      "En el almuerzo derretí mi budín sin querer, lo que lo mejoró bastante. Tres personas me pidieron que derritiera el suyo también. Hice algunos amigos nuevos.",
      "Volar a casa fue más rápido que el autobús. Hay algunas ventajas en esta situación.",
    ],
  },
  {
    id: "dd-3",
    emoji: "🌙",
    title: "La Otra Dragona",
    subtitle: "Ya no estoy solo",
    locked: true,
    pages: [
      'Querido Diario, hoy conocí a otra dragona. Estaba sentada en el techo de la biblioteca, leyendo. Aterricé a su lado. "Eres nuevo", dijo, sin levantar la vista.',
      "Se llama Ember y lleva tres años siendo dragona. Tiene catorce y está muy tranquila con todo el asunto, lo que me resultó enormemente reconfortante.",
      "Me enseñó a plegar bien las alas para dejar de tirar cosas. Es como acomodar un abrigo muy grande. Una vez que le agarras el truco, es fácil.",
      'Le pregunté si sabía por qué había pasado. Se encogió de hombros. "¿Importa? Estás aquí ahora. Con alas y todo." Pensé en eso durante mucho tiempo.',
      'Me prestó un libro llamado "Ser Extraordinario en un Mundo Común". Trataba sobre dragones. La autora era una dragona. No sabía que los dragones escribían libros. Hoy fue un buen día.',
    ],
  },
];

export const DINO_WORLD: LocalizedChapter[] = [
  {
    id: "dw-1",
    emoji: "🦖",
    title: "Día de la Eclosión",
    subtitle: "Un nuevo comienzo",
    locked: false,
    pages: [
      "El huevo había sido del tamaño de una roca enorme. Cuando por fin se agrietó, el valle entero tembló; al menos, eso era lo que Rex siempre les contaba a sus hermanos menores.",
      "Rex era un joven T-Rex, pero aún no se había dado cuenta de eso. Solo sabía que el mundo era inmenso, olía interesante y que tenía mucha, mucha hambre.",
      "Su madre le mostró qué plantas eran lo bastante blandas para atravesar, qué ríos eran lo bastante bajos para cruzar y de qué otros dinosaurios era mejor mantenerse lejos.",
      '"La regla", dijo ella, "es simple: respeta el valle. Todo aquí está conectado. Tiras de un hilo y todo se deshace."',
      "Rex asintió con seriedad y, acto seguido, tropezó con la cola de un estegosaurio. El estegosaurio ni se dio cuenta. Rex decidió empezar por lo pequeño.",
    ],
  },
  {
    id: "dw-2",
    emoji: "🌿",
    title: "Las Reglas del Valle",
    subtitle: "Aprendiendo la tierra",
    locked: false,
    pages: [
      "El valle tenía más reglas de las que Rex esperaba. No beber de las charcas de barro rojo. No cruzar el prado de helechos durante las grandes lluvias. No discutir con los triceratops.",
      "Aprendió cometiendo exactamente los errores que le habían dicho que no cometiera. Las charcas de barro rojo sabían horrible. El prado de helechos bajo la lluvia era como una cascada sobre su cabeza.",
      "No discutió con los triceratops, hay que reconocerlo. Tenían tres cuernos y opiniones muy claras, y Rex apreciaba su hocico.",
      "Su lugar favorito era el borde del acantilado al atardecer, donde el valle entero se extendía abajo en tonos de dorado y verde. Podía ver cada manada, cada río, cada columna de vapor de las aguas termales.",
      '"Algún día", le dijo a un pterodáctilo que pasaba, "conoceré cada rincón de este valle." El pterodáctilo le lanzó una mirada larga y escéptica y se fue volando.',
    ],
  },
  {
    id: "dw-3",
    emoji: "🌋",
    title: "El Estruendo",
    subtitle: "Cuando la tierra habla",
    locked: true,
    pages: [
      "La tierra tembló un martes. Rex supo que era inusual porque los pájaros se callaron primero: cada criatura del valle se detuvo y escuchó.",
      "Las aguas termales cerca de la loma sur burbujeaban más de lo normal. Los dinosaurios más viejos llevaron sus manadas al norte sin que nadie se lo pidiera. Ellos recordaban.",
      "Rex se quedó atrás. Quería ver. Su madre lo encontró, lo agarró de la cola y caminó hacia el norte a un paso que no dejaba lugar a discusión.",
      "La loma sur retumbó una vez más y luego se calmó. Los pájaros regresaron. El valle exhaló. Todo quedó en calma de una forma que se sentía como alivio.",
      "Esa noche Rex se acostó bajo las estrellas y pensó en lo pequeño que era, en lo antiguo que era el valle y en cómo la propia tierra tenía memoria. Sintió, por primera vez, que de verdad pertenecía a algo.",
    ],
  },
];
