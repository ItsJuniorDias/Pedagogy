// scripts/i18n-add-story-cards.mjs
// ─────────────────────────────────────────────────────────────────────────────
// Traduz a CASCA da tela de Histórias Mágicas + o rótulo de capítulo do leitor:
//   • storyTitles  — título EXIBIDO de cada card (rota continua por `id`, estável)
//   • storyTags    — as tags do filtro (a lógica compara o valor CRU em EN → estável)
//   • storyBadges  — selos "New"/"Hot"
//   • details.chapter — "Chapter {{number}}" → estrutural (não é conteúdo narrativo)
//
// IMPORTANTE: isto é a CASCA. O texto de leitura dos capítulos (as `pages`, ~40k
// palavras) e os `subtitle` narrativos continuam em inglês — é localização de
// CONTEÚDO, feita história a história. A história das vogais (phonics) é o único
// caso onde a tradução quebra a pedagogia (A → Ava).
//
// Estrutura "por-chave": cada item traz as 7 línguas juntas, e o DATA por-língua
// é montado no fim. Idempotente:  node scripts/i18n-add-story-cards.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, "..", "lib", "i18n", "locales");
const LANGS = ["en", "pt", "es", "fr", "zh", "hi", "ar"];

// ─── TÍTULOS DOS CARDS (chave = id da história, estável para rota) ─────────────
const TITLES = {
  thevowelvillage: { en: "The Vowel Village", pt: "A Vila das Vogais", es: "El Pueblo de las Vocales", fr: "Le Village des Voyelles", zh: "元音村", hi: "स्वरों का गाँव", ar: "قرية الحروف المتحرّكة" },
  theclockworkdetective: { en: "The Clockwork Detective", pt: "O Detetive de Engrenagens", es: "El Detective de Relojería", fr: "Le Détective Mécanique", zh: "发条侦探", hi: "घड़ी-मशीन जासूस", ar: "المحقّق الآلي" },
  theunderwaterexplorers: { en: "The Underwater Explorers", pt: "Os Exploradores Submarinos", es: "Los Exploradores Submarinos", fr: "Les Explorateurs Sous-marins", zh: "水下探险家", hi: "पानी के नीचे खोजी", ar: "مستكشفو الأعماق" },
  thefeelingsGarden: { en: "The Feelings Garden", pt: "O Jardim dos Sentimentos", es: "El Jardín de los Sentimientos", fr: "Le Jardin des Émotions", zh: "情感花园", hi: "भावनाओं का बगीचा", ar: "حديقة المشاعر" },
  therobotsjournal: { en: "The Robot's Journal", pt: "O Diário do Robô", es: "El Diario del Robot", fr: "Le Journal du Robot", zh: "机器人的日记", hi: "रोबोट की डायरी", ar: "يوميّات الروبوت" },
  themapmakersdaughter: { en: "The Mapmaker's Daughter", pt: "A Filha do Cartógrafo", es: "La Hija del Cartógrafo", fr: "La Fille du Cartographe", zh: "制图师的女儿", hi: "नक़्शानवीस की बेटी", ar: "ابنة رسّام الخرائط" },
  thewordcollector: { en: "The Word Collector", pt: "O Colecionador de Palavras", es: "El Coleccionista de Palabras", fr: "Le Collectionneur de Mots", zh: "词语收藏家", hi: "शब्द संग्राहक", ar: "جامع الكلمات" },
  thelighthousekeepersson: { en: "The Lighthouse Keeper's Son", pt: "O Filho do Faroleiro", es: "El Hijo del Farero", fr: "Le Fils du Gardien de Phare", zh: "灯塔看守人的儿子", hi: "लाइटहाउस कीपर का बेटा", ar: "ابن حارس المنارة" },
  thegrandmothersrecipebox: { en: "The Grandmother's Recipe Box", pt: "A Caixa de Receitas da Vovó", es: "El Recetario de la Abuela", fr: "La Boîte à Recettes de Grand-mère", zh: "祖母的食谱盒", hi: "दादी का व्यंजन-संदूक", ar: "صندوق وصفات الجدّة" },
  thefieldguide: { en: "Field Guide: Impossible Creatures", pt: "Guia de Campo: Criaturas Impossíveis", es: "Guía de Campo: Criaturas Imposibles", fr: "Guide de Terrain : Créatures Impossibles", zh: "野外指南：不可能的生物", hi: "फ़ील्ड गाइड: असंभव जीव", ar: "دليل ميداني: مخلوقات مستحيلة" },
  thescienceofsmallwonders: { en: "The Science of Small Wonders", pt: "A Ciência das Pequenas Maravilhas", es: "La Ciencia de las Pequeñas Maravillas", fr: "La Science des Petites Merveilles", zh: "微小奇迹的科学", hi: "छोटे अजूबों का विज्ञान", ar: "علم العجائب الصغيرة" },
  thecloudreader: { en: "The Cloud Reader", pt: "A Leitora de Nuvens", es: "La Lectora de Nubes", fr: "La Liseuse de Nuages", zh: "读云人", hi: "बादल पढ़ने वाली", ar: "قارئة الغيوم" },
  TAIRBRTY: { en: "Pipo & the Flower Fairy", pt: "Pipo e a Fada das Flores", es: "Pipo y el Hada de las Flores", fr: "Pipo et la Fée des Fleurs", zh: "皮波与花仙子", hi: "पिपो और फूल परी", ar: "بيبو وحوريّة الأزهار" },
  STHM_STHAP: { en: "Storm & Starmap", pt: "Tempestade e Mapa Estelar", es: "Tormenta y Mapa Estelar", fr: "Tempête et Carte des Étoiles", zh: "风暴与星图", hi: "तूफ़ान और तारा-नक़्शा", ar: "العاصفة وخريطة النجوم" },
  KATUION: { en: "Katuion: The Dreamer's Dictionary", pt: "Katuion: O Dicionário do Sonhador", es: "Katuion: El Diccionario del Soñador", fr: "Katuion : Le Dictionnaire du Rêveur", zh: "卡图翁：梦想家的词典", hi: "कातुइओन: स्वप्नदर्शी का शब्दकोश", ar: "كاتويون: قاموس الحالم" },
  SPACEADVENTURE: { en: "Space Adventure: Mission Starfall", pt: "Aventura Espacial: Missão Queda Estelar", es: "Aventura Espacial: Misión Estrella Fugaz", fr: "Aventure Spatiale : Mission Chute d'Étoile", zh: "太空冒险：陨星任务", hi: "अंतरिक्ष साहसिक: मिशन स्टारफॉल", ar: "مغامرة فضائية: مهمّة سقوط النجم" },
  ROCKET_ADVENTURE: { en: "Rocket Adventure", pt: "Aventura de Foguete", es: "Aventura en Cohete", fr: "Aventure en Fusée", zh: "火箭冒险", hi: "रॉकेट साहसिक", ar: "مغامرة الصاروخ" },
  MAGIC_FOREST: { en: "Magic Forest", pt: "Floresta Mágica", es: "Bosque Mágico", fr: "Forêt Magique", zh: "魔法森林", hi: "जादुई जंगल", ar: "الغابة السحريّة" },
  OCEAN_FRIENDS: { en: "Ocean Friends", pt: "Amigos do Oceano", es: "Amigos del Océano", fr: "Amis de l'Océan", zh: "海洋朋友", hi: "समुद्री दोस्त", ar: "أصدقاء المحيط" },
  TINY_SCIENTIST: { en: "Tiny Scientist", pt: "Pequeno Cientista", es: "Pequeño Científico", fr: "Petit Scientifique", zh: "小科学家", hi: "नन्हा वैज्ञानिक", ar: "العالِم الصغير" },
  DRAGON_DIARY: { en: "Dragon Diary", pt: "Diário do Dragão", es: "Diario del Dragón", fr: "Journal du Dragon", zh: "龙的日记", hi: "ड्रैगन की डायरी", ar: "يوميّات التنّين" },
  DINO_WORLD: { en: "Dino World", pt: "Mundo dos Dinos", es: "Mundo Dino", fr: "Monde des Dinos", zh: "恐龙世界", hi: "डायनासोर की दुनिया", ar: "عالم الديناصورات" },
  thetimelibrary: { en: "The Time Library", pt: "A Biblioteca do Tempo", es: "La Biblioteca del Tiempo", fr: "La Bibliothèque du Temps", zh: "时间图书馆", hi: "समय पुस्तकालय", ar: "مكتبة الزمن" },
  thegiantwhowept: { en: "The Giant Who Wept Mountains", pt: "O Gigante que Chorou Montanhas", es: "El Gigante que Lloró Montañas", fr: "Le Géant qui Pleurait des Montagnes", zh: "哭出群山的巨人", hi: "पहाड़ रोने वाला दैत्य", ar: "العملاق الذي بكى جبالًا" },
  theartofbeing: { en: "The Art of Being Wrong", pt: "A Arte de Estar Errado", es: "El Arte de Equivocarse", fr: "L'Art d'Avoir Tort", zh: "犯错的艺术", hi: "ग़लत होने की कला", ar: "فنّ أن تكون مخطئًا" },
  theinsectorchestra: { en: "The Insect Orchestra", pt: "A Orquestra dos Insetos", es: "La Orquesta de Insectos", fr: "L'Orchestre des Insectes", zh: "昆虫交响乐团", hi: "कीट वाद्यवृंद", ar: "أوركسترا الحشرات" },
  thesandcastlearchitect: { en: "The Sandcastle Architect", pt: "O Arquiteto de Castelos de Areia", es: "El Arquitecto de Castillos de Arena", fr: "L'Architecte de Châteaux de Sable", zh: "沙堡建筑师", hi: "रेत-महल वास्तुकार", ar: "مهندس قِلاع الرمل" },
  thecolourthief: { en: "The Colour Thief", pt: "O Ladrão de Cores", es: "El Ladrón de Colores", fr: "Le Voleur de Couleurs", zh: "颜色小偷", hi: "रंग चोर", ar: "لصّ الألوان" },
  theslowtrainexpresses: { en: "The Slow Train Express", pt: "O Expresso do Trem Lento", es: "El Expreso del Tren Lento", fr: "L'Express du Train Lent", zh: "慢车特快", hi: "धीमी रेल एक्सप्रेस", ar: "قطار البطيء السريع" },
  thespellchecker: { en: "The Spell Checker", pt: "O Corretor de Feitiços", es: "El Corrector de Hechizos", fr: "Le Correcteur de Sorts", zh: "拼写检查员", hi: "वर्तनी-जाँचकर्ता", ar: "مدقّق التعاويذ" },
  thevolcanologist: { en: "Young Volcanologist", pt: "Jovem Vulcanólogo", es: "Joven Vulcanólogo", fr: "Jeune Volcanologue", zh: "少年火山学家", hi: "युवा ज्वालामुखी-विज्ञानी", ar: "عالِم البراكين الصغير" },
  thenightgarden: { en: "The Night Garden", pt: "O Jardim Noturno", es: "El Jardín Nocturno", fr: "Le Jardin de Nuit", zh: "夜之花园", hi: "रात का बगीचा", ar: "حديقة الليل" },
  theforgottenalphabet: { en: "The Forgotten Alphabet", pt: "O Alfabeto Esquecido", es: "El Alfabeto Olvidado", fr: "L'Alphabet Oublié", zh: "被遗忘的字母表", hi: "भूली हुई वर्णमाला", ar: "الأبجديّة المنسيّة" },
  thebeekeeper: { en: "The Last Beekeeper", pt: "A Última Apicultora", es: "La Última Apicultora", fr: "La Dernière Apicultrice", zh: "最后的养蜂人", hi: "आख़िरी मधुमक्खी-पालक", ar: "آخر مربّي النحل" },
  theislandofmists: { en: "The Island of Mists", pt: "A Ilha das Névoas", es: "La Isla de las Nieblas", fr: "L'Île des Brumes", zh: "迷雾岛", hi: "कोहरों का द्वीप", ar: "جزيرة الضباب" },
  thecityofclocks: { en: "The City of Clocks", pt: "A Cidade dos Relógios", es: "La Ciudad de los Relojes", fr: "La Cité des Horloges", zh: "时钟之城", hi: "घड़ियों का शहर", ar: "مدينة الساعات" },
  thecoralqueen: { en: "The Coral Queen", pt: "A Rainha do Coral", es: "La Reina del Coral", fr: "La Reine du Corail", zh: "珊瑚女王", hi: "मूँगा रानी", ar: "ملكة المرجان" },
  theglasscomposer: { en: "The Glass Composer", pt: "A Compositora de Vidro", es: "La Compositora de Cristal", fr: "La Compositrice de Verre", zh: "玻璃作曲家", hi: "काँच संगीतकार", ar: "مؤلّفة الزجاج" },
  thewindmapper: { en: "The Wind Mapper", pt: "O Cartógrafo dos Ventos", es: "El Cartógrafo del Viento", fr: "Le Cartographe des Vents", zh: "绘风者", hi: "पवन-मानचित्रकार", ar: "راسم خرائط الرياح" },
  theanimalwhisperer: { en: "The Animal Whisperer", pt: "A Encantadora de Animais", es: "La Susurradora de Animales", fr: "La Murmureuse aux Animaux", zh: "动物低语者", hi: "पशु-फुसफुसाहट", ar: "همّاسة الحيوانات" },
  thedreamarchitect: { en: "The Dream Architect", pt: "A Arquiteta dos Sonhos", es: "La Arquitecta de Sueños", fr: "L'Architecte des Rêves", zh: "梦境建筑师", hi: "स्वप्न वास्तुकार", ar: "مهندسة الأحلام" },
  thechrononauts: { en: "The Chrononauts", pt: "Os Crononautas", es: "Los Crononautas", fr: "Les Chrononautes", zh: "时间航行者", hi: "क्रोनोनॉट्स", ar: "ملّاحو الزمن" },
  thepapergarden: { en: "The Paper Garden", pt: "O Jardim de Papel", es: "El Jardín de Papel", fr: "Le Jardin de Papier", zh: "纸花园", hi: "काग़ज़ का बगीचा", ar: "حديقة الورق" },
  thespacefarmer: { en: "The Space Farmer", pt: "O Fazendeiro Espacial", es: "El Granjero Espacial", fr: "Le Fermier de l'Espace", zh: "太空农夫", hi: "अंतरिक्ष किसान", ar: "مزارع الفضاء" },
  themuseumguard: { en: "The Museum Guard's Secret", pt: "O Segredo do Guarda do Museu", es: "El Secreto del Guardia del Museo", fr: "Le Secret du Gardien du Musée", zh: "博物馆守卫的秘密", hi: "संग्रहालय रक्षक का रहस्य", ar: "سرّ حارس المتحف" },
  thelostlanguage: { en: "The Lost Language", pt: "A Língua Perdida", es: "La Lengua Perdida", fr: "La Langue Perdue", zh: "失落的语言", hi: "खोई हुई भाषा", ar: "اللغة المفقودة" },
  thesnowarchitect: { en: "The Snow Architect", pt: "A Arquiteta da Neve", es: "La Arquitecta de Nieve", fr: "L'Architecte de Neige", zh: "雪之建筑师", hi: "बर्फ़ वास्तुकार", ar: "مهندسة الثلج" },
  thetreetelephone: { en: "The Tree Telephone", pt: "O Telefone das Árvores", es: "El Teléfono de los Árboles", fr: "Le Téléphone des Arbres", zh: "树木电话", hi: "पेड़ों का टेलीफ़ोन", ar: "هاتف الأشجار" },
  thelastlighthouse: { en: "The Last Lighthouse", pt: "O Último Farol", es: "El Último Faro", fr: "Le Dernier Phare", zh: "最后的灯塔", hi: "आख़िरी लाइटहाउस", ar: "المنارة الأخيرة" },
  thegravityinventor: { en: "The Gravity Inventor", pt: "A Inventora da Gravidade", es: "La Inventora de la Gravedad", fr: "L'Inventrice de la Gravité", zh: "重力发明家", hi: "गुरुत्व आविष्कारक", ar: "مخترعة الجاذبيّة" },
  thewhaledreamer: { en: "The Whale Dreamer", pt: "A Sonhadora de Baleias", es: "La Soñadora de Ballenas", fr: "La Rêveuse de Baleines", zh: "鲸之梦者", hi: "व्हेल स्वप्नदर्शी", ar: "حالمة الحيتان" },
};

// ─── TAGS DO FILTRO (chave = valor cru em EN, que a lógica de filtro compara) ──
const TAGS = {
  Adventure: { en: "Adventure", pt: "Aventura", es: "Aventura", fr: "Aventure", zh: "冒险", hi: "साहसिक", ar: "مغامرة" },
  Animals: { en: "Animals", pt: "Animais", es: "Animales", fr: "Animaux", zh: "动物", hi: "जानवर", ar: "حيوانات" },
  Art: { en: "Art", pt: "Arte", es: "Arte", fr: "Art", zh: "艺术", hi: "कला", ar: "فنّ" },
  Bedtime: { en: "Bedtime", pt: "Hora de dormir", es: "Para dormir", fr: "Au coucher", zh: "睡前", hi: "सोने का समय", ar: "وقت النوم" },
  Emotional: { en: "Emotional", pt: "Emoções", es: "Emocional", fr: "Émotions", zh: "情感", hi: "भावनात्मक", ar: "مشاعر" },
  Family: { en: "Family", pt: "Família", es: "Familia", fr: "Famille", zh: "家庭", hi: "परिवार", ar: "عائلة" },
  Fantasy: { en: "Fantasy", pt: "Fantasia", es: "Fantasía", fr: "Fantaisie", zh: "奇幻", hi: "फंतासी", ar: "خيال" },
  Friendship: { en: "Friendship", pt: "Amizade", es: "Amistad", fr: "Amitié", zh: "友谊", hi: "दोस्ती", ar: "صداقة" },
  Growth: { en: "Growth", pt: "Crescimento", es: "Crecimiento", fr: "Grandir", zh: "成长", hi: "विकास", ar: "نموّ" },
  Journey: { en: "Journey", pt: "Jornada", es: "Viaje", fr: "Voyage", zh: "旅程", hi: "सफ़र", ar: "رحلة" },
  Language: { en: "Language", pt: "Linguagem", es: "Lenguaje", fr: "Langage", zh: "语言", hi: "भाषा", ar: "لغة" },
  Letters: { en: "Letters", pt: "Letras", es: "Letras", fr: "Lettres", zh: "字母", hi: "अक्षर", ar: "حروف" },
  Magic: { en: "Magic", pt: "Magia", es: "Magia", fr: "Magie", zh: "魔法", hi: "जादू", ar: "سحر" },
  Music: { en: "Music", pt: "Música", es: "Música", fr: "Musique", zh: "音乐", hi: "संगीत", ar: "موسيقى" },
  Mystery: { en: "Mystery", pt: "Mistério", es: "Misterio", fr: "Mystère", zh: "悬疑", hi: "रहस्य", ar: "غموض" },
  Nature: { en: "Nature", pt: "Natureza", es: "Naturaleza", fr: "Nature", zh: "自然", hi: "प्रकृति", ar: "طبيعة" },
  Ocean: { en: "Ocean", pt: "Oceano", es: "Océano", fr: "Océan", zh: "海洋", hi: "महासागर", ar: "محيط" },
  "Sci-Fi": { en: "Sci-Fi", pt: "Ficção científica", es: "Ciencia ficción", fr: "Science-fiction", zh: "科幻", hi: "साइंस-फ़िक्शन", ar: "خيال علمي" },
  Science: { en: "Science", pt: "Ciência", es: "Ciencia", fr: "Science", zh: "科学", hi: "विज्ञान", ar: "علوم" },
  Steampunk: { en: "Steampunk", pt: "Steampunk", es: "Steampunk", fr: "Steampunk", zh: "蒸汽朋克", hi: "स्टीमपंक", ar: "ستيمبانك" },
  Surreal: { en: "Surreal", pt: "Surreal", es: "Surrealista", fr: "Surréaliste", zh: "超现实", hi: "अतियथार्थ", ar: "سرياليّ" },
  Winter: { en: "Winter", pt: "Inverno", es: "Invierno", fr: "Hiver", zh: "冬天", hi: "सर्दी", ar: "شتاء" },
};

// ─── SELOS ────────────────────────────────────────────────────────────────────
const BADGES = {
  New: { en: "New", pt: "Novo", es: "Nuevo", fr: "Nouveau", zh: "新", hi: "नया", ar: "جديد" },
  Hot: { en: "Hot", pt: "Em alta", es: "Popular", fr: "Tendance", zh: "热门", hi: "हॉट", ar: "رائج" },
};

// ─── RÓTULO DE CAPÍTULO (estrutural) ──────────────────────────────────────────
const CHAPTER = { en: "Chapter {{number}}", pt: "Capítulo {{number}}", es: "Capítulo {{number}}", fr: "Chapitre {{number}}", zh: "第 {{number}} 章", hi: "अध्याय {{number}}", ar: "الفصل {{number}}" };

// Monta { lang: { storyTitles:{...}, storyTags:{...}, storyBadges:{...}, details:{chapter} } }
function pick(map, lang) {
  const out = {};
  for (const [k, v] of Object.entries(map)) out[k] = v[lang];
  return out;
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      target[key] = deepMerge(target[key] ?? {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

for (const lang of LANGS) {
  const additions = {
    storyTitles: pick(TITLES, lang),
    storyTags: pick(TAGS, lang),
    storyBadges: pick(BADGES, lang),
    details: { chapter: CHAPTER[lang] },
  };
  const file = join(LOCALES_DIR, `${lang}.json`);
  const json = JSON.parse(readFileSync(file, "utf8"));
  deepMerge(json, additions);
  writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`updated ${lang}.json`);
}
console.log("done");
