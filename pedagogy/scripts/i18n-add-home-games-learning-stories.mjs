// scripts/i18n-add-home-games-learning-stories.mjs
// ─────────────────────────────────────────────────────────────────────────────
// Injeta os namespaces `home`, `games`, `paths`, `learningAll` e `stories`
// (+ common.seeAll) em cada locale de lib/i18n/locales. Faz merge profundo e
// mantém as chaves já existentes. Idempotente — pode rodar de novo sem estragar:
//   node scripts/i18n-add-home-games-learning-stories.mjs
//
// `games` e `paths` são namespaces COMPARTILHADOS: usados pela Home, pela tela
// games-all e pela learning-all. O título de jogo/trilha é só EXIBIÇÃO; a chave
// de rota/categoria/storage continua estável (inglês) no código.
// `en` é a referência canônica.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, "..", "lib", "i18n", "locales");

const DATA = {
  // ─── ENGLISH (canônico / fallback) ─────────────────────────────────────────
  en: {
    common: { seeAll: "See all" },
    home: {
      greetingHi: "Hi,",
      greetingName: "Everyone",
      greetingSub: "Let's learn something cool today ✨",
      nav: { space: "Space", art: "Art", toys: "Toys", dinos: "Dinos" },
      banner: { title: "Magic World\nof Stories", cta: "🔍 Explore Now!" },
      chips: {
        all: "All",
        drawing: "Drawing",
        space: "Space",
        animals: "Animals",
        magic: "Magic",
        music: "Music",
      },
      interests: {
        explore: "Explore",
        pets: "Pets",
        space: "Space",
        science: "Science",
      },
      favoritesTitle: "Your Favorites 🌟",
      favoritesLabel: "Favorites",
      learningPathTitle: "Learning Path",
      gamesTitle: "Games 🎮",
      emptyPaths: "No paths for this category yet 🌱",
      emptyGames: "No games for this category yet 🎯",
      pathDone: "done",
    },
    games: {
      header: "Games",
      empty: "No games here yet 🎯",
      farmGame: {
        title: "Farm Game",
        sub: "Manage your farm and harvest crops!",
      },
      pingPong: { title: "Ping Pong", sub: "Classic ping pong game!" },
      pixelRun: { title: "Pixel Run", sub: "Endless runner in space!" },
      gravity: { title: "Gravity Game", sub: "Classic gravity game!" },
      tags: { new: "New ✨", top: "Top ⭐", hot: "Hot 🔥" },
    },
    paths: {
      letters: "Letters",
      school: "School",
      astronaut: "Astronaut",
      space: "Space",
      dinosaurs: "Dinosaurs",
      oceanLife: "Ocean Life",
      colorsArt: "Colors & Art",
      scienceLab: "Science Lab",
    },
    learningAll: {
      header: "Learning Path",
      loading: "Loading your garden… 🌱",
      empty: "Nothing here yet 🌱",
      filters: {
        all: "All",
        inProgress: "In Progress",
        notStarted: "Not Started",
        completed: "Completed",
      },
    },
    stories: {
      header: "Magic Stories ✨",
      heroTitle: "A world of\nadventures ",
      heroSub: "Pick a story and start reading!",
      heroCount: "{{count}} stories available",
      tagsAll: "All",
      chapters: "{{count}} chapters",
      ages: "Ages {{range}}",
    },
  },

  // ─── PORTUGUÊS ──────────────────────────────────────────────────────────────
  pt: {
    common: { seeAll: "Ver tudo" },
    home: {
      greetingHi: "Oi,",
      greetingName: "Pessoal",
      greetingSub: "Vamos aprender algo legal hoje ✨",
      nav: { space: "Espaço", art: "Arte", toys: "Brinquedos", dinos: "Dinos" },
      banner: { title: "Mundo Mágico\nde Histórias", cta: "🔍 Explorar Agora!" },
      chips: {
        all: "Tudo",
        drawing: "Desenho",
        space: "Espaço",
        animals: "Animais",
        magic: "Magia",
        music: "Música",
      },
      interests: {
        explore: "Explorar",
        pets: "Bichinhos",
        space: "Espaço",
        science: "Ciência",
      },
      favoritesTitle: "Seus Favoritos 🌟",
      favoritesLabel: "Favoritos",
      learningPathTitle: "Trilha de Aprendizado",
      gamesTitle: "Jogos 🎮",
      emptyPaths: "Nenhuma trilha nesta categoria ainda 🌱",
      emptyGames: "Nenhum jogo nesta categoria ainda 🎯",
      pathDone: "concluído",
    },
    games: {
      header: "Jogos",
      empty: "Nenhum jogo por aqui ainda 🎯",
      farmGame: {
        title: "Jogo da Fazenda",
        sub: "Cuide da sua fazenda e colha as plantações!",
      },
      pingPong: { title: "Ping-Pong", sub: "Jogo clássico de ping-pong!" },
      pixelRun: { title: "Pixel Run", sub: "Corrida sem fim no espaço!" },
      gravity: { title: "Jogo da Gravidade", sub: "Jogo clássico de gravidade!" },
      tags: { new: "Novo ✨", top: "Top ⭐", hot: "Bombando 🔥" },
    },
    paths: {
      letters: "Letras",
      school: "Escola",
      astronaut: "Astronauta",
      space: "Espaço",
      dinosaurs: "Dinossauros",
      oceanLife: "Vida no Oceano",
      colorsArt: "Cores e Arte",
      scienceLab: "Laboratório de Ciências",
    },
    learningAll: {
      header: "Trilha de Aprendizado",
      loading: "Preparando seu jardim… 🌱",
      empty: "Nada por aqui ainda 🌱",
      filters: {
        all: "Tudo",
        inProgress: "Em andamento",
        notStarted: "Não iniciado",
        completed: "Concluído",
      },
    },
    stories: {
      header: "Histórias Mágicas ✨",
      heroTitle: "Um mundo de\naventuras ",
      heroSub: "Escolha uma história e comece a ler!",
      heroCount: "{{count}} histórias disponíveis",
      tagsAll: "Tudo",
      chapters: "{{count}} capítulos",
      ages: "{{range}} anos",
    },
  },

  // ─── ESPAÑOL ────────────────────────────────────────────────────────────────
  es: {
    common: { seeAll: "Ver todo" },
    home: {
      greetingHi: "Hola,",
      greetingName: "Todos",
      greetingSub: "Aprendamos algo genial hoy ✨",
      nav: { space: "Espacio", art: "Arte", toys: "Juguetes", dinos: "Dinos" },
      banner: {
        title: "Mundo Mágico\nde Historias",
        cta: "🔍 ¡Explorar Ahora!",
      },
      chips: {
        all: "Todo",
        drawing: "Dibujo",
        space: "Espacio",
        animals: "Animales",
        magic: "Magia",
        music: "Música",
      },
      interests: {
        explore: "Explorar",
        pets: "Mascotas",
        space: "Espacio",
        science: "Ciencia",
      },
      favoritesTitle: "Tus Favoritos 🌟",
      favoritesLabel: "Favoritos",
      learningPathTitle: "Ruta de Aprendizaje",
      gamesTitle: "Juegos 🎮",
      emptyPaths: "Aún no hay rutas en esta categoría 🌱",
      emptyGames: "Aún no hay juegos en esta categoría 🎯",
      pathDone: "completado",
    },
    games: {
      header: "Juegos",
      empty: "Aún no hay juegos aquí 🎯",
      farmGame: {
        title: "Juego de Granja",
        sub: "¡Cuida tu granja y cosecha los cultivos!",
      },
      pingPong: { title: "Ping-Pong", sub: "¡Juego clásico de ping-pong!" },
      pixelRun: { title: "Pixel Run", sub: "¡Carrera sin fin en el espacio!" },
      gravity: {
        title: "Juego de Gravedad",
        sub: "¡Juego clásico de gravedad!",
      },
      tags: { new: "Nuevo ✨", top: "Top ⭐", hot: "Popular 🔥" },
    },
    paths: {
      letters: "Letras",
      school: "Escuela",
      astronaut: "Astronauta",
      space: "Espacio",
      dinosaurs: "Dinosaurios",
      oceanLife: "Vida Marina",
      colorsArt: "Colores y Arte",
      scienceLab: "Laboratorio de Ciencias",
    },
    learningAll: {
      header: "Ruta de Aprendizaje",
      loading: "Preparando tu jardín… 🌱",
      empty: "Nada por aquí todavía 🌱",
      filters: {
        all: "Todo",
        inProgress: "En progreso",
        notStarted: "Sin empezar",
        completed: "Completado",
      },
    },
    stories: {
      header: "Historias Mágicas ✨",
      heroTitle: "Un mundo de\naventuras ",
      heroSub: "¡Elige una historia y empieza a leer!",
      heroCount: "{{count}} historias disponibles",
      tagsAll: "Todo",
      chapters: "{{count}} capítulos",
      ages: "{{range}} años",
    },
  },

  // ─── FRANÇAIS ───────────────────────────────────────────────────────────────
  fr: {
    common: { seeAll: "Voir tout" },
    home: {
      greetingHi: "Salut,",
      greetingName: "tout le monde",
      greetingSub: "Apprenons quelque chose de cool aujourd'hui ✨",
      nav: { space: "Espace", art: "Art", toys: "Jouets", dinos: "Dinos" },
      banner: { title: "Monde Magique\ndes Histoires", cta: "🔍 Explorer !" },
      chips: {
        all: "Tout",
        drawing: "Dessin",
        space: "Espace",
        animals: "Animaux",
        magic: "Magie",
        music: "Musique",
      },
      interests: {
        explore: "Explorer",
        pets: "Animaux",
        space: "Espace",
        science: "Science",
      },
      favoritesTitle: "Tes Favoris 🌟",
      favoritesLabel: "Favoris",
      learningPathTitle: "Parcours d'Apprentissage",
      gamesTitle: "Jeux 🎮",
      emptyPaths: "Aucun parcours dans cette catégorie 🌱",
      emptyGames: "Aucun jeu dans cette catégorie 🎯",
      pathDone: "terminé",
    },
    games: {
      header: "Jeux",
      empty: "Pas encore de jeux ici 🎯",
      farmGame: {
        title: "Jeu de la Ferme",
        sub: "Gère ta ferme et récolte tes cultures !",
      },
      pingPong: { title: "Ping-Pong", sub: "Jeu de ping-pong classique !" },
      pixelRun: { title: "Pixel Run", sub: "Course infinie dans l'espace !" },
      gravity: { title: "Jeu de Gravité", sub: "Jeu de gravité classique !" },
      tags: { new: "Nouveau ✨", top: "Top ⭐", hot: "Populaire 🔥" },
    },
    paths: {
      letters: "Lettres",
      school: "École",
      astronaut: "Astronaute",
      space: "Espace",
      dinosaurs: "Dinosaures",
      oceanLife: "Vie Marine",
      colorsArt: "Couleurs et Art",
      scienceLab: "Labo de Sciences",
    },
    learningAll: {
      header: "Parcours d'Apprentissage",
      loading: "Préparation de ton jardin… 🌱",
      empty: "Rien ici pour l'instant 🌱",
      filters: {
        all: "Tout",
        inProgress: "En cours",
        notStarted: "Pas commencé",
        completed: "Terminé",
      },
    },
    stories: {
      header: "Histoires Magiques ✨",
      heroTitle: "Un monde\nd'aventures ",
      heroSub: "Choisis une histoire et commence à lire !",
      heroCount: "{{count}} histoires disponibles",
      tagsAll: "Tout",
      chapters: "{{count}} chapitres",
      ages: "{{range}} ans",
    },
  },

  // ─── 中文 (MANDARIM) ────────────────────────────────────────────────────────
  zh: {
    common: { seeAll: "查看全部" },
    home: {
      greetingHi: "你好，",
      greetingName: "大家",
      greetingSub: "今天来学点酷东西吧 ✨",
      nav: { space: "太空", art: "艺术", toys: "玩具", dinos: "恐龙" },
      banner: { title: "神奇的\n故事世界", cta: "🔍 立即探索！" },
      chips: {
        all: "全部",
        drawing: "绘画",
        space: "太空",
        animals: "动物",
        magic: "魔法",
        music: "音乐",
      },
      interests: {
        explore: "探索",
        pets: "宠物",
        space: "太空",
        science: "科学",
      },
      favoritesTitle: "你的收藏 🌟",
      favoritesLabel: "收藏",
      learningPathTitle: "学习路径",
      gamesTitle: "游戏 🎮",
      emptyPaths: "这个分类还没有学习路径 🌱",
      emptyGames: "这个分类还没有游戏 🎯",
      pathDone: "完成",
    },
    games: {
      header: "游戏",
      empty: "这里还没有游戏 🎯",
      farmGame: { title: "农场游戏", sub: "经营你的农场，收获庄稼！" },
      pingPong: { title: "乒乓球", sub: "经典乒乓球游戏！" },
      pixelRun: { title: "像素跑酷", sub: "太空无尽跑酷！" },
      gravity: { title: "重力游戏", sub: "经典重力游戏！" },
      tags: { new: "新 ✨", top: "热门 ⭐", hot: "火爆 🔥" },
    },
    paths: {
      letters: "字母",
      school: "学校",
      astronaut: "宇航员",
      space: "太空",
      dinosaurs: "恐龙",
      oceanLife: "海洋生物",
      colorsArt: "色彩与艺术",
      scienceLab: "科学实验室",
    },
    learningAll: {
      header: "学习路径",
      loading: "正在培育你的花园… 🌱",
      empty: "这里还什么都没有 🌱",
      filters: {
        all: "全部",
        inProgress: "进行中",
        notStarted: "未开始",
        completed: "已完成",
      },
    },
    stories: {
      header: "神奇故事 ✨",
      heroTitle: "冒险的\n世界 ",
      heroSub: "选一个故事，开始阅读吧！",
      heroCount: "{{count}} 个故事可读",
      tagsAll: "全部",
      chapters: "{{count}} 章",
      ages: "{{range}} 岁",
    },
  },

  // ─── हिन्दी (HINDI) ─────────────────────────────────────────────────────────
  hi: {
    common: { seeAll: "सभी देखें" },
    home: {
      greetingHi: "नमस्ते,",
      greetingName: "सब लोग",
      greetingSub: "आज कुछ मज़ेदार सीखते हैं ✨",
      nav: { space: "अंतरिक्ष", art: "कला", toys: "खिलौने", dinos: "डायनो" },
      banner: { title: "कहानियों की\nजादुई दुनिया", cta: "🔍 अभी खोजें!" },
      chips: {
        all: "सभी",
        drawing: "ड्रॉइंग",
        space: "अंतरिक्ष",
        animals: "जानवर",
        magic: "जादू",
        music: "संगीत",
      },
      interests: {
        explore: "खोजें",
        pets: "पालतू",
        space: "अंतरिक्ष",
        science: "विज्ञान",
      },
      favoritesTitle: "आपके पसंदीदा 🌟",
      favoritesLabel: "पसंदीदा",
      learningPathTitle: "सीखने का सफ़र",
      gamesTitle: "खेल 🎮",
      emptyPaths: "इस श्रेणी में अभी कोई सफ़र नहीं है 🌱",
      emptyGames: "इस श्रेणी में अभी कोई खेल नहीं है 🎯",
      pathDone: "पूरा",
    },
    games: {
      header: "खेल",
      empty: "यहाँ अभी कोई खेल नहीं है 🎯",
      farmGame: {
        title: "फ़ार्म गेम",
        sub: "अपने खेत की देखभाल करें और फ़सल काटें!",
      },
      pingPong: { title: "पिंग पॉन्ग", sub: "क्लासिक पिंग पॉन्ग खेल!" },
      pixelRun: { title: "पिक्सेल रन", sub: "अंतरिक्ष में अंतहीन दौड़!" },
      gravity: { title: "ग्रैविटी गेम", sub: "क्लासिक ग्रैविटी खेल!" },
      tags: { new: "नया ✨", top: "टॉप ⭐", hot: "हॉट 🔥" },
    },
    paths: {
      letters: "अक्षर",
      school: "स्कूल",
      astronaut: "अंतरिक्ष यात्री",
      space: "अंतरिक्ष",
      dinosaurs: "डायनासोर",
      oceanLife: "समुद्री जीवन",
      colorsArt: "रंग और कला",
      scienceLab: "विज्ञान प्रयोगशाला",
    },
    learningAll: {
      header: "सीखने का सफ़र",
      loading: "आपका बगीचा तैयार हो रहा है… 🌱",
      empty: "यहाँ अभी कुछ नहीं है 🌱",
      filters: {
        all: "सभी",
        inProgress: "जारी",
        notStarted: "शुरू नहीं हुआ",
        completed: "पूरा हुआ",
      },
    },
    stories: {
      header: "जादुई कहानियाँ ✨",
      heroTitle: "रोमांच की\nदुनिया ",
      heroSub: "एक कहानी चुनें और पढ़ना शुरू करें!",
      heroCount: "{{count}} कहानियाँ उपलब्ध",
      tagsAll: "सभी",
      chapters: "{{count}} अध्याय",
      ages: "उम्र {{range}}",
    },
  },

  // ─── العربية (ÁRABE — RTL) ──────────────────────────────────────────────────
  ar: {
    common: { seeAll: "عرض الكل" },
    home: {
      greetingHi: "مرحبًا",
      greetingName: "بالجميع",
      greetingSub: "لنتعلّم شيئًا رائعًا اليوم ✨",
      nav: {
        space: "الفضاء",
        art: "الفن",
        toys: "الألعاب",
        dinos: "الديناصورات",
      },
      banner: { title: "عالم القصص\nالسحري", cta: "🔍 استكشف الآن!" },
      chips: {
        all: "الكل",
        drawing: "الرسم",
        space: "الفضاء",
        animals: "الحيوانات",
        magic: "السحر",
        music: "الموسيقى",
      },
      interests: {
        explore: "استكشاف",
        pets: "الحيوانات الأليفة",
        space: "الفضاء",
        science: "العلوم",
      },
      favoritesTitle: "مفضّلاتك 🌟",
      favoritesLabel: "المفضّلة",
      learningPathTitle: "مسار التعلّم",
      gamesTitle: "الألعاب 🎮",
      emptyPaths: "لا توجد مسارات في هذه الفئة بعد 🌱",
      emptyGames: "لا توجد ألعاب في هذه الفئة بعد 🎯",
      pathDone: "مكتمل",
    },
    games: {
      header: "الألعاب",
      empty: "لا توجد ألعاب هنا بعد 🎯",
      farmGame: {
        title: "لعبة المزرعة",
        sub: "اعتنِ بمزرعتك واحصد المحاصيل!",
      },
      pingPong: { title: "بينغ بونغ", sub: "لعبة بينغ بونغ الكلاسيكية!" },
      pixelRun: { title: "بيكسل رَن", sub: "جري لا نهائي في الفضاء!" },
      gravity: { title: "لعبة الجاذبية", sub: "لعبة الجاذبية الكلاسيكية!" },
      tags: { new: "جديد ✨", top: "الأفضل ⭐", hot: "رائج 🔥" },
    },
    paths: {
      letters: "الحروف",
      school: "المدرسة",
      astronaut: "رائد الفضاء",
      space: "الفضاء",
      dinosaurs: "الديناصورات",
      oceanLife: "الحياة البحرية",
      colorsArt: "الألوان والفن",
      scienceLab: "مختبر العلوم",
    },
    learningAll: {
      header: "مسار التعلّم",
      loading: "جارٍ تجهيز حديقتك… 🌱",
      empty: "لا شيء هنا بعد 🌱",
      filters: {
        all: "الكل",
        inProgress: "قيد التقدّم",
        notStarted: "لم يبدأ",
        completed: "مكتمل",
      },
    },
    stories: {
      header: "قصص سحرية ✨",
      heroTitle: "عالم من\nالمغامرات ",
      heroSub: "اختر قصة وابدأ القراءة!",
      heroCount: "{{count}} قصة متاحة",
      tagsAll: "الكل",
      chapters: "{{count}} فصول",
      ages: "الأعمار {{range}}",
    },
  },
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      target[key] = deepMerge(target[key] ?? {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

for (const [lang, additions] of Object.entries(DATA)) {
  const file = join(LOCALES_DIR, `${lang}.json`);
  const json = JSON.parse(readFileSync(file, "utf8"));
  deepMerge(json, additions);
  writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`updated ${lang}.json`);
}
console.log("done");
