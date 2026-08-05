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
const LANGS = ["en", "pt", "es", "fr", "de", "hi", "ar"];

// ─── TÍTULOS DOS CARDS (chave = id da história, estável para rota) ─────────────
const TITLES = {
  thevowelvillage: { en: "The Vowel Village", pt: "A Vila das Vogais", es: "El Pueblo de las Vocales", fr: "Le Village des Voyelles", de: "Das Dorf der Vokale", hi: "स्वरों का गाँव", ar: "قرية الحروف المتحرّكة" },
  theclockworkdetective: { en: "The Clockwork Detective", pt: "O Detetive de Engrenagens", es: "El Detective de Relojería", fr: "Le Détective Mécanique", de: "Der Uhrwerk-Detektiv", hi: "घड़ी-मशीन जासूस", ar: "المحقّق الآلي" },
  theunderwaterexplorers: { en: "The Underwater Explorers", pt: "Os Exploradores Submarinos", es: "Los Exploradores Submarinos", fr: "Les Explorateurs Sous-marins", de: "Die Unterwasser-Entdecker", hi: "पानी के नीचे खोजी", ar: "مستكشفو الأعماق" },
  thefeelingsGarden: { en: "The Feelings Garden", pt: "O Jardim dos Sentimentos", es: "El Jardín de los Sentimientos", fr: "Le Jardin des Émotions", de: "Der Garten der Gefühle", hi: "भावनाओं का बगीचा", ar: "حديقة المشاعر" },
  therobotsjournal: { en: "The Robot's Journal", pt: "O Diário do Robô", es: "El Diario del Robot", fr: "Le Journal du Robot", de: "Das Tagebuch des Roboters", hi: "रोबोट की डायरी", ar: "يوميّات الروبوت" },
  themapmakersdaughter: { en: "The Mapmaker's Daughter", pt: "A Filha do Cartógrafo", es: "La Hija del Cartógrafo", fr: "La Fille du Cartographe", de: "Die Tochter der Kartografin", hi: "नक़्शानवीस की बेटी", ar: "ابنة رسّام الخرائط" },
  thewordcollector: { en: "The Word Collector", pt: "O Colecionador de Palavras", es: "El Coleccionista de Palabras", fr: "Le Collectionneur de Mots", de: "Der Wörtersammler", hi: "शब्द संग्राहक", ar: "جامع الكلمات" },
  thelighthousekeepersson: { en: "The Lighthouse Keeper's Son", pt: "O Filho do Faroleiro", es: "El Hijo del Farero", fr: "Le Fils du Gardien de Phare", de: "Der Sohn des Leuchtturmwärters", hi: "लाइटहाउस कीपर का बेटा", ar: "ابن حارس المنارة" },
  thegrandmothersrecipebox: { en: "The Grandmother's Recipe Box", pt: "A Caixa de Receitas da Vovó", es: "El Recetario de la Abuela", fr: "La Boîte à Recettes de Grand-mère", de: "Omas Rezeptkasten", hi: "दादी का व्यंजन-संदूक", ar: "صندوق وصفات الجدّة" },
  thefieldguide: { en: "Field Guide: Impossible Creatures", pt: "Guia de Campo: Criaturas Impossíveis", es: "Guía de Campo: Criaturas Imposibles", fr: "Guide de Terrain : Créatures Impossibles", de: "Feldführer: Unmögliche Kreaturen", hi: "फ़ील्ड गाइड: असंभव जीव", ar: "دليل ميداني: مخلوقات مستحيلة" },
  thescienceofsmallwonders: { en: "The Science of Small Wonders", pt: "A Ciência das Pequenas Maravilhas", es: "La Ciencia de las Pequeñas Maravillas", fr: "La Science des Petites Merveilles", de: "Die Wissenschaft der kleinen Wunder", hi: "छोटे अजूबों का विज्ञान", ar: "علم العجائب الصغيرة" },
  thecloudreader: { en: "The Cloud Reader", pt: "A Leitora de Nuvens", es: "La Lectora de Nubes", fr: "La Liseuse de Nuages", de: "Die Wolkenleserin", hi: "बादल पढ़ने वाली", ar: "قارئة الغيوم" },
  TAIRBRTY: { en: "Pipo & the Flower Fairy", pt: "Pipo e a Fada das Flores", es: "Pipo y el Hada de las Flores", fr: "Pipo et la Fée des Fleurs", de: "Pipo und die Blumenfee", hi: "पिपो और फूल परी", ar: "بيبو وحوريّة الأزهار" },
  STHM_STHAP: { en: "Storm & Starmap", pt: "Tempestade e Mapa Estelar", es: "Tormenta y Mapa Estelar", fr: "Tempête et Carte des Étoiles", de: "Sturm und Sternenkarte", hi: "तूफ़ान और तारा-नक़्शा", ar: "العاصفة وخريطة النجوم" },
  KATUION: { en: "Katuion: The Dreamer's Dictionary", pt: "Katuion: O Dicionário do Sonhador", es: "Katuion: El Diccionario del Soñador", fr: "Katuion : Le Dictionnaire du Rêveur", de: "Katuion: Das Wörterbuch der Träumer", hi: "कातुइओन: स्वप्नदर्शी का शब्दकोश", ar: "كاتويون: قاموس الحالم" },
  SPACEADVENTURE: { en: "Space Adventure: Mission Starfall", pt: "Aventura Espacial: Missão Queda Estelar", es: "Aventura Espacial: Misión Estrella Fugaz", fr: "Aventure Spatiale : Mission Chute d'Étoile", de: "Weltraumabenteuer: Mission Sternfall", hi: "अंतरिक्ष साहसिक: मिशन स्टारफॉल", ar: "مغامرة فضائية: مهمّة سقوط النجم" },
  ROCKET_ADVENTURE: { en: "Rocket Adventure", pt: "Aventura de Foguete", es: "Aventura en Cohete", fr: "Aventure en Fusée", de: "Raketenabenteuer", hi: "रॉकेट साहसिक", ar: "مغامرة الصاروخ" },
  MAGIC_FOREST: { en: "Magic Forest", pt: "Floresta Mágica", es: "Bosque Mágico", fr: "Forêt Magique", de: "Der Zauberwald", hi: "जादुई जंगल", ar: "الغابة السحريّة" },
  OCEAN_FRIENDS: { en: "Ocean Friends", pt: "Amigos do Oceano", es: "Amigos del Océano", fr: "Amis de l'Océan", de: "Freunde des Ozeans", hi: "समुद्री दोस्त", ar: "أصدقاء المحيط" },
  TINY_SCIENTIST: { en: "Tiny Scientist", pt: "Pequeno Cientista", es: "Pequeño Científico", fr: "Petit Scientifique", de: "Die kleine Forscherin", hi: "नन्हा वैज्ञानिक", ar: "العالِم الصغير" },
  DRAGON_DIARY: { en: "Dragon Diary", pt: "Diário do Dragão", es: "Diario del Dragón", fr: "Journal du Dragon", de: "Das Drachentagebuch", hi: "ड्रैगन की डायरी", ar: "يوميّات التنّين" },
  DINO_WORLD: { en: "Dino World", pt: "Mundo dos Dinos", es: "Mundo Dino", fr: "Monde des Dinos", de: "Dinowelt", hi: "डायनासोर की दुनिया", ar: "عالم الديناصورات" },
  thetimelibrary: { en: "The Time Library", pt: "A Biblioteca do Tempo", es: "La Biblioteca del Tiempo", fr: "La Bibliothèque du Temps", de: "Die Bibliothek der Zeit", hi: "समय पुस्तकालय", ar: "مكتبة الزمن" },
  thegiantwhowept: { en: "The Giant Who Wept Mountains", pt: "O Gigante que Chorou Montanhas", es: "El Gigante que Lloró Montañas", fr: "Le Géant qui Pleurait des Montagnes", de: "Der Riese, der Berge weinte", hi: "पहाड़ रोने वाला दैत्य", ar: "العملاق الذي بكى جبالًا" },
  theartofbeing: { en: "The Art of Being Wrong", pt: "A Arte de Estar Errado", es: "El Arte de Equivocarse", fr: "L'Art d'Avoir Tort", de: "Die Kunst, sich zu irren", hi: "ग़लत होने की कला", ar: "فنّ أن تكون مخطئًا" },
  theinsectorchestra: { en: "The Insect Orchestra", pt: "A Orquestra dos Insetos", es: "La Orquesta de Insectos", fr: "L'Orchestre des Insectes", de: "Das Insektenorchester", hi: "कीट वाद्यवृंद", ar: "أوركسترا الحشرات" },
  thesandcastlearchitect: { en: "The Sandcastle Architect", pt: "O Arquiteto de Castelos de Areia", es: "El Arquitecto de Castillos de Arena", fr: "L'Architecte de Châteaux de Sable", de: "Der Sandburg-Architekt", hi: "रेत-महल वास्तुकार", ar: "مهندس قِلاع الرمل" },
  thecolourthief: { en: "The Colour Thief", pt: "O Ladrão de Cores", es: "El Ladrón de Colores", fr: "Le Voleur de Couleurs", de: "Der Farbendieb", hi: "रंग चोर", ar: "لصّ الألوان" },
  theslowtrainexpresses: { en: "The Slow Train Express", pt: "O Expresso do Trem Lento", es: "El Expreso del Tren Lento", fr: "L'Express du Train Lent", de: "Der langsame Schnellzug", hi: "धीमी रेल एक्सप्रेस", ar: "قطار البطيء السريع" },
  thespellchecker: { en: "The Spell Checker", pt: "O Corretor de Feitiços", es: "El Corrector de Hechizos", fr: "Le Correcteur de Sorts", de: "Die Zauberprüferin", hi: "वर्तनी-जाँचकर्ता", ar: "مدقّق التعاويذ" },
  thevolcanologist: { en: "Young Volcanologist", pt: "Jovem Vulcanólogo", es: "Joven Vulcanólogo", fr: "Jeune Volcanologue", de: "Die junge Vulkanologin", hi: "युवा ज्वालामुखी-विज्ञानी", ar: "عالِم البراكين الصغير" },
  thenightgarden: { en: "The Night Garden", pt: "O Jardim Noturno", es: "El Jardín Nocturno", fr: "Le Jardin de Nuit", de: "Der Nachtgarten", hi: "रात का बगीचा", ar: "حديقة الليل" },
  theforgottenalphabet: { en: "The Forgotten Alphabet", pt: "O Alfabeto Esquecido", es: "El Alfabeto Olvidado", fr: "L'Alphabet Oublié", de: "Das vergessene Alphabet", hi: "भूली हुई वर्णमाला", ar: "الأبجديّة المنسيّة" },
  thebeekeeper: { en: "The Last Beekeeper", pt: "A Última Apicultora", es: "La Última Apicultora", fr: "La Dernière Apicultrice", de: "Der letzte Imker", hi: "आख़िरी मधुमक्खी-पालक", ar: "آخر مربّي النحل" },
  theislandofmists: { en: "The Island of Mists", pt: "A Ilha das Névoas", es: "La Isla de las Nieblas", fr: "L'Île des Brumes", de: "Die Insel der Nebel", hi: "कोहरों का द्वीप", ar: "جزيرة الضباب" },
  thecityofclocks: { en: "The City of Clocks", pt: "A Cidade dos Relógios", es: "La Ciudad de los Relojes", fr: "La Cité des Horloges", de: "Die Stadt der Uhren", hi: "घड़ियों का शहर", ar: "مدينة الساعات" },
  thecoralqueen: { en: "The Coral Queen", pt: "A Rainha do Coral", es: "La Reina del Coral", fr: "La Reine du Corail", de: "Die Korallenkönigin", hi: "मूँगा रानी", ar: "ملكة المرجان" },
  theglasscomposer: { en: "The Glass Composer", pt: "A Compositora de Vidro", es: "La Compositora de Cristal", fr: "La Compositrice de Verre", de: "Die Glaskomponistin", hi: "काँच संगीतकार", ar: "مؤلّفة الزجاج" },
  thewindmapper: { en: "The Wind Mapper", pt: "O Cartógrafo dos Ventos", es: "El Cartógrafo del Viento", fr: "Le Cartographe des Vents", de: "Der Windkartograf", hi: "पवन-मानचित्रकार", ar: "راسم خرائط الرياح" },
  theanimalwhisperer: { en: "The Animal Whisperer", pt: "A Encantadora de Animais", es: "La Susurradora de Animales", fr: "La Murmureuse aux Animaux", de: "Die Tierflüsterin", hi: "पशु-फुसफुसाहट", ar: "همّاسة الحيوانات" },
  thedreamarchitect: { en: "The Dream Architect", pt: "A Arquiteta dos Sonhos", es: "La Arquitecta de Sueños", fr: "L'Architecte des Rêves", de: "Die Traumarchitektin", hi: "स्वप्न वास्तुकार", ar: "مهندسة الأحلام" },
  thechrononauts: { en: "The Chrononauts", pt: "Os Crononautas", es: "Los Crononautas", fr: "Les Chrononautes", de: "Die Chrononauten", hi: "क्रोनोनॉट्स", ar: "ملّاحو الزمن" },
  thepapergarden: { en: "The Paper Garden", pt: "O Jardim de Papel", es: "El Jardín de Papel", fr: "Le Jardin de Papier", de: "Der Papiergarten", hi: "काग़ज़ का बगीचा", ar: "حديقة الورق" },
  thespacefarmer: { en: "The Space Farmer", pt: "O Fazendeiro Espacial", es: "El Granjero Espacial", fr: "Le Fermier de l'Espace", de: "Der Weltraumbauer", hi: "अंतरिक्ष किसान", ar: "مزارع الفضاء" },
  themuseumguard: { en: "The Museum Guard's Secret", pt: "O Segredo do Guarda do Museu", es: "El Secreto del Guardia del Museo", fr: "Le Secret du Gardien du Musée", de: "Das Geheimnis des Museumswächters", hi: "संग्रहालय रक्षक का रहस्य", ar: "سرّ حارس المتحف" },
  thelostlanguage: { en: "The Lost Language", pt: "A Língua Perdida", es: "La Lengua Perdida", fr: "La Langue Perdue", de: "Die verlorene Sprache", hi: "खोई हुई भाषा", ar: "اللغة المفقودة" },
  thesnowarchitect: { en: "The Snow Architect", pt: "A Arquiteta da Neve", es: "La Arquitecta de Nieve", fr: "L'Architecte de Neige", de: "Die Schnee-Architektin", hi: "बर्फ़ वास्तुकार", ar: "مهندسة الثلج" },
  thetreetelephone: { en: "The Tree Telephone", pt: "O Telefone das Árvores", es: "El Teléfono de los Árboles", fr: "Le Téléphone des Arbres", de: "Das Baumtelefon", hi: "पेड़ों का टेलीफ़ोन", ar: "هاتف الأشجار" },
  thelastlighthouse: { en: "The Last Lighthouse", pt: "O Último Farol", es: "El Último Faro", fr: "Le Dernier Phare", de: "Der letzte Leuchtturm", hi: "आख़िरी लाइटहाउस", ar: "المنارة الأخيرة" },
  thegravityinventor: { en: "The Gravity Inventor", pt: "A Inventora da Gravidade", es: "La Inventora de la Gravedad", fr: "L'Inventrice de la Gravité", de: "Die Erfinderin der Schwerkraft", hi: "गुरुत्व आविष्कारक", ar: "مخترعة الجاذبيّة" },
  thewhaledreamer: { en: "The Whale Dreamer", pt: "A Sonhadora de Baleias", es: "La Soñadora de Ballenas", fr: "La Rêveuse de Baleines", de: "Die Walträumerin", hi: "व्हेल स्वप्नदर्शी", ar: "حالمة الحيتان" },
};

// ─── TAGS DO FILTRO (chave = valor cru em EN, que a lógica de filtro compara) ──
const TAGS = {
  Adventure: { en: "Adventure", pt: "Aventura", es: "Aventura", fr: "Aventure", de: "Abenteuer", hi: "साहसिक", ar: "مغامرة" },
  Animals: { en: "Animals", pt: "Animais", es: "Animales", fr: "Animaux", de: "Tiere", hi: "जानवर", ar: "حيوانات" },
  Art: { en: "Art", pt: "Arte", es: "Arte", fr: "Art", de: "Kunst", hi: "कला", ar: "فنّ" },
  Bedtime: { en: "Bedtime", pt: "Hora de dormir", es: "Para dormir", fr: "Au coucher", de: "Gutenacht", hi: "सोने का समय", ar: "وقت النوم" },
  Emotional: { en: "Emotional", pt: "Emoções", es: "Emocional", fr: "Émotions", de: "Gefühle", hi: "भावनात्मक", ar: "مشاعر" },
  Family: { en: "Family", pt: "Família", es: "Familia", fr: "Famille", de: "Familie", hi: "परिवार", ar: "عائلة" },
  Fantasy: { en: "Fantasy", pt: "Fantasia", es: "Fantasía", fr: "Fantaisie", de: "Fantasie", hi: "फंतासी", ar: "خيال" },
  Friendship: { en: "Friendship", pt: "Amizade", es: "Amistad", fr: "Amitié", de: "Freundschaft", hi: "दोस्ती", ar: "صداقة" },
  Growth: { en: "Growth", pt: "Crescimento", es: "Crecimiento", fr: "Grandir", de: "Wachstum", hi: "विकास", ar: "نموّ" },
  Journey: { en: "Journey", pt: "Jornada", es: "Viaje", fr: "Voyage", de: "Reise", hi: "सफ़र", ar: "رحلة" },
  Language: { en: "Language", pt: "Linguagem", es: "Lenguaje", fr: "Langage", de: "Sprache", hi: "भाषा", ar: "لغة" },
  Letters: { en: "Letters", pt: "Letras", es: "Letras", fr: "Lettres", de: "Buchstaben", hi: "अक्षर", ar: "حروف" },
  Magic: { en: "Magic", pt: "Magia", es: "Magia", fr: "Magie", de: "Zauber", hi: "जादू", ar: "سحر" },
  Music: { en: "Music", pt: "Música", es: "Música", fr: "Musique", de: "Musik", hi: "संगीत", ar: "موسيقى" },
  Mystery: { en: "Mystery", pt: "Mistério", es: "Misterio", fr: "Mystère", de: "Rätsel", hi: "रहस्य", ar: "غموض" },
  Nature: { en: "Nature", pt: "Natureza", es: "Naturaleza", fr: "Nature", de: "Natur", hi: "प्रकृति", ar: "طبيعة" },
  Ocean: { en: "Ocean", pt: "Oceano", es: "Océano", fr: "Océan", de: "Ozean", hi: "महासागर", ar: "محيط" },
  "Sci-Fi": { en: "Sci-Fi", pt: "Ficção científica", es: "Ciencia ficción", fr: "Science-fiction", de: "Sci-Fi", hi: "साइंस-फ़िक्शन", ar: "خيال علمي" },
  Science: { en: "Science", pt: "Ciência", es: "Ciencia", fr: "Science", de: "Wissenschaft", hi: "विज्ञान", ar: "علوم" },
  Steampunk: { en: "Steampunk", pt: "Steampunk", es: "Steampunk", fr: "Steampunk", de: "Steampunk", hi: "स्टीमपंक", ar: "ستيمبانك" },
  Surreal: { en: "Surreal", pt: "Surreal", es: "Surrealista", fr: "Surréaliste", de: "Surreal", hi: "अतियथार्थ", ar: "سرياليّ" },
  Winter: { en: "Winter", pt: "Inverno", es: "Invierno", fr: "Hiver", de: "Winter", hi: "सर्दी", ar: "شتاء" },
};

// ─── SELOS ────────────────────────────────────────────────────────────────────
const BADGES = {
  New: { en: "New", pt: "Novo", es: "Nuevo", fr: "Nouveau", de: "Neu", hi: "नया", ar: "جديد" },
  Hot: { en: "Hot", pt: "Em alta", es: "Popular", fr: "Tendance", de: "Beliebt", hi: "हॉट", ar: "رائج" },
};

// ─── RÓTULO DE CAPÍTULO (estrutural) ──────────────────────────────────────────
const CHAPTER = { en: "Chapter {{number}}", pt: "Capítulo {{number}}", es: "Capítulo {{number}}", fr: "Chapitre {{number}}", de: "Kapitel {{number}}", hi: "अध्याय {{number}}", ar: "الفصل {{number}}" };

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
