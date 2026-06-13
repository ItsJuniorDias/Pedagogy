// ─── STORY REGISTRY MOCKS ────────────────────────────────────────────────────
// IDs aqui devem bater com o STORY_MAP em ReadStoryScreen após
// .toUpperCase().replace(/\s/g, "") — ex: "SPACEADVENTURE", "MAGICFOREST", etc.

export type StoryMockId =
  | "ROCKET_ADVENTURE"
  | "MAGIC_FOREST"
  | "OCEAN_FRIENDS"
  | "SCIENCE_LAB"
  | "DRAGON_DIARY"
  | "DINO_WORLD";

// ─── CHAPTERS ────────────────────────────────────────────────────────────────

export const ROCKET_ADVENTURE = [
  {
    id: "sa-1",
    emoji: "🚀",
    title: "Liftoff!",
    subtitle: "The journey begins",
    locked: false,
    pages: [
      "The countdown echoed through the launch pad. Ten… nine… eight… Young astronaut Leo gripped his seat as the engines roared to life beneath him.",
      "Seven… six… five… The rocket shuddered like a giant waking from a deep sleep. Leo could feel every bolt and panel vibrating with raw energy.",
      "Four… three… two… one… IGNITION! A wall of white smoke exploded outward and the rocket punched through the sky, leaving Earth behind in seconds.",
      "Leo pressed his face against the porthole. Below him, the clouds shrank into cotton wisps. The blue curve of the planet filled his entire view.",
      "Mission Control crackled in his helmet: Leo, you are GO for orbit. He gave a thumbs-up to the empty seat beside him — reserved for his best friend, a small stuffed bear named Cosmo.",
    ],
  },
  {
    id: "sa-2",
    emoji: "🌕",
    title: "Moon Pit Stop",
    subtitle: "Dust and craters",
    locked: false,
    pages: [
      "The Moon grew from a marble to a mountain as Leo guided the shuttle into lunar orbit. Gray craters stretched in every direction like frozen ripples.",
      "He landed with a gentle thud in the Sea of Tranquility. The dust puffed up in slow, silent clouds around the landing struts.",
      '"One small step," Leo whispered to Cosmo, then burst out laughing as he bounced three metres into the air on his very first stride.',
      "He collected rock samples, planted a tiny flag made from his mom's old scarf, and ate a floating cheese sandwich for lunch.",
      "Before heading back, he carved his name in the dust with a gloved finger. The Moon had no wind — his signature would stay there forever.",
    ],
  },
  {
    id: "sa-3",
    emoji: "🪐",
    title: "Ring Rider",
    subtitle: "Saturn's surprise",
    locked: true,
    pages: [
      "Saturn appeared like a painting — golden and ringed and impossibly large. Leo cut the engines and simply stared for a full minute.",
      "The rings were made of ice chunks ranging from the size of a snowflake to the size of a house. Leo flew the shuttle between them like a slalom course.",
      'A small icy rock tapped the hull: CLONK. Cosmo toppled off the dashboard. Leo scooped him up. "We\'re okay, buddy."',
      "Deep in the rings he spotted something extraordinary: a perfect sphere of ice that glowed faint blue from within. He scooped it into a sample jar.",
      '"Mission Control," he radioed, barely breathing, "I think I just found something no one has ever seen before." There was a long silence — then a deafening cheer.',
    ],
  },
];

export const MAGIC_FOREST = [
  {
    id: "mf-1",
    emoji: "🌲",
    title: "The First Step",
    subtitle: "Into the green",
    locked: false,
    pages: [
      "Mia had lived next to the Magic Forest her whole life, but she had never dared go in. Today was different. Today she had her grandmother's compass.",
      "The moment she crossed the mossy stone wall, the air changed. It smelled of cinnamon and rain and something she couldn't quite name — possibilities, maybe.",
      "The trees here were ancient, their trunks wider than her house. Tiny lights floated between the branches like slow-motion fireflies.",
      'A fox with a silver tail sat in the middle of the path. It looked at her the way people look at old friends. "You took your time," it said.',
      "Mia didn't scream. She had always secretly believed animals could talk — she just hadn't expected them to be so polite about it.",
    ],
  },
  {
    id: "mf-2",
    emoji: "🍄",
    title: "Mushroom Town",
    subtitle: "Tiny neighbors",
    locked: false,
    pages: [
      "The silver fox — whose name was Pip — led Mia to a clearing hidden beneath an enormous fallen oak.",
      "There, built into the roots and the earth, was a whole town of mushroom-cap houses. Smoke curled from acorn chimneys. Tiny windows glowed amber.",
      "The residents were hedgehogs no bigger than Mia's fist, each wearing a coat made from a single fallen leaf.",
      'The Mayor — a very round hedgehog in a maple-leaf waistcoat — bowed so low his nose touched the ground. "We\'ve been waiting for the Compass Keeper," he announced.',
      "Mia looked down at her grandmother's compass. The needle, she now noticed, wasn't pointing north. It was spinning slowly, like it was searching for something else entirely.",
    ],
  },
  {
    id: "mf-3",
    emoji: "🌟",
    title: "The Lost Star",
    subtitle: "A sky mystery",
    locked: true,
    pages: [
      "The hedgehog mayor explained the problem in a grave, squeaky voice: a star had fallen into the forest three nights ago and it was slowly going out.",
      "Without it, the forest's magic would dim. The firefly-lights would fade. The talking animals would forget their words. Mushroom Town would go dark.",
      "The fallen star was the size of a watermelon and sat in a pond at the forest's heart, flickering like a candle in the wind.",
      "Mia knelt beside it. It was warm, and it hummed very faintly — the same frequency as her grandmother used to hum while cooking.",
      'She opened the compass. The needle stopped spinning and pointed straight at the star. Her grandmother\'s voice seemed to whisper: "You already know what to do, love."',
    ],
  },
];

export const OCEANFRIENDS = [
  {
    id: "ol-1",
    emoji: "🐠",
    title: "Reef Morning",
    subtitle: "Colors underwater",
    locked: false,
    pages: [
      "At sunrise, the coral reef was already awake. A thousand fish darted through tunnels of pink and orange coral like living confetti.",
      "Finn the clownfish was doing his morning rounds — checking that every anemone was in order, every neighbor accounted for.",
      'He passed Mrs. Octopus, who was rearranging her rock collection for the seventeenth time that week. "Different layout today?" Finn asked. "Feng shui," she replied firmly.',
      "The reef had its own rules, its own traffic, its own neighbourhoods. Finn knew every shortcut, every hiding spot, every current.",
      "But today, one corner of the reef was quiet. Too quiet. The fish that lived there were gone, and the coral had turned an unhappy grey.",
    ],
  },
  {
    id: "ol-2",
    emoji: "🐙",
    title: "Deep Dive",
    subtitle: "Into the dark",
    locked: false,
    pages: [
      "Finn asked the oldest creature on the reef — Gran Turtle, who had been swimming since before anyone could remember — what the grey meant.",
      '"The water is too warm in that patch," Gran Turtle said, blinking her ancient eyes. "The coral is stressed. It has sent the fish away until it recovers."',
      "Finn had heard of this happening far away, in reefs he'd never seen. He didn't think it could happen here.",
      '"What can we do?" he asked. Gran Turtle smiled. "Exactly what you\'re doing now — noticing. And then telling everyone else."',
      "So Finn swam faster than he ever had, calling out to every fish, every crab, every sea slug he passed. Something was wrong, and everyone needed to know.",
    ],
  },
  {
    id: "ol-3",
    emoji: "🌊",
    title: "The Current",
    subtitle: "Working together",
    locked: true,
    pages: [
      "Word spread fast underwater. By afternoon, every creature on the reef had gathered at the grey patch — it was the biggest meeting the reef had ever seen.",
      "The parrotfish offered to eat the algae that was smothering the stressed coral. The sea urchins offered to clear the dead bits so new coral could grow.",
      "Even Mrs. Octopus donated three of her best rocks to provide shade over the warmest spots.",
      "It took weeks. Finn checked every morning. And then one day, the tiniest dot of pink appeared in the grey — new coral, no bigger than his fin.",
      "By the end of the season the grey patch was gone, replaced by a burst of colours brighter than before. The fish came back. The reef was whole again.",
    ],
  },
];

export const TINY_SCIENTIST = [
  {
    id: "sl-1",
    emoji: "🔬",
    title: "Lab Day One",
    subtitle: "Mixing and making",
    locked: false,
    pages: [
      "Zara's bedroom had officially become a laboratory. Her desk was covered in test tubes, baking soda, food colouring, and a list of experiments she'd written in her neatest handwriting.",
      "Experiment #1: Volcano. She poured vinegar into a mound of baking soda. The result exploded across three notebooks and her cat, who left immediately.",
      'She wiped everything down and wrote in her lab journal: "Note — use smaller amounts. Also, cat is no longer a willing research participant."',
      "Experiment #2: Rainbow in a glass. She layered honey, dish soap, water, and oil in a tall jar, adding different food colours to each.",
      "The colours settled into perfect stripes. Zara pressed her nose to the glass. Science, she decided, was basically just magic with better notes.",
    ],
  },
  {
    id: "sl-2",
    emoji: "⚗️",
    title: "The Big Question",
    subtitle: "Why does it work?",
    locked: false,
    pages: [
      'Zara\'s dad looked at the rainbow jar and asked, "But do you know WHY the layers stay separate?" She opened her mouth — and then closed it.',
      "She'd made the thing. She hadn't thought about the why. That bothered her more than she expected.",
      'She went back to her lab journal and wrote at the top of a new page: "DENSITY." Then she looked it up, read for twenty minutes, and wrote three pages of notes.',
      "Denser liquids sank. Less dense liquids floated. The honey was the heaviest, the oil the lightest. The colours were just passengers.",
      "She made the rainbow jar again, this time narrating each layer like a documentary presenter. Her dad filmed it. It got forty-seven views, mostly from relatives.",
    ],
  },
  {
    id: "sl-3",
    emoji: "💡",
    title: "Invention Day",
    subtitle: "Something brand new",
    locked: true,
    pages: [
      "The school science fair was in two weeks. Everyone else was doing volcanoes. Zara refused to do a volcano. She had already done a volcano. On her cat.",
      'She decided to invent something genuinely useful. After a list that included "self-making bed" (too hard) and "homework robot" (probably illegal), she settled on a plant-watering alarm.',
      "Using a plastic bottle, some string, and a moisture sensor from an old toy, she built a device that would drip water onto her plant only when the soil was dry.",
      "It worked. Mostly. On the third test it drenched her lab journal, but that was a calibration issue, which she fixed with a piece of tape and determination.",
      'At the science fair, no one else had an invention. Zara won first place. She wrote in her journal: "Hypothesis confirmed: original ideas beat volcanoes every time."',
    ],
  },
];

export const DRAGON_DIARY = [
  {
    id: "dd-1",
    emoji: "🐉",
    title: "Dear Diary",
    subtitle: "Day one of being a dragon",
    locked: false,
    pages: [
      "Dear Diary, today I woke up as a dragon. I am not sure how this happened. Yesterday I was eleven years old and went to sleep normally. Now I have scales.",
      "The scales are purple, which is actually my favourite colour, so that part is fine. My wings, however, knocked over the bookshelf, which is less fine.",
      "Mum came to wake me up and screamed. Then she hugged me. Then she screamed again but quietly, with her mouth closed, which is somehow worse.",
      'Dad said we needed to "assess the situation." He made a spreadsheet. I ate it by accident. I did not mean to breathe fire. It just happened.',
      "School is going to be complicated.",
    ],
  },
  {
    id: "dd-2",
    emoji: "🏫",
    title: "School Days",
    subtitle: "Fitting in (sort of)",
    locked: false,
    pages: [
      'Dear Diary, Mum rang the school to explain. There was a long pause. Then the headmistress said, "We have a policy for this." I did not know there was a policy for this.',
      "I had to use the double doors and sit at the back where there was more room. My best friend Priya saved me the seat next to hers even though I am now quite large.",
      'In science we learned about cold-blooded animals. I raised my claw to mention I was technically now warm-blooded but fire-adjacent. The teacher said "fascinating" and gave me a sticker.',
      "At lunch I accidentally melted my pudding, which improved it significantly. Three people asked me to melt theirs too. I made some new friends.",
      "Flying home was faster than the bus. There are some advantages to this situation.",
    ],
  },
  {
    id: "dd-3",
    emoji: "🌙",
    title: "The Other Dragon",
    subtitle: "Not alone anymore",
    locked: true,
    pages: [
      'Dear Diary, today I met another dragon. She was sitting on the roof of the library, reading. I landed next to her. "You\'re new," she said, not looking up.',
      "Her name is Ember and she has been a dragon for three years. She is fourteen and very calm about the whole thing, which I found extremely comforting.",
      "She taught me how to fold my wings properly so I stop knocking things over. It is like tucking in a very large coat. Once you know the trick, it's easy.",
      'I asked her if she knew why it happened. She shrugged. "Does it matter? You\'re here now. Wings and all." I thought about that for a long time.',
      'She lent me a book called "Being Extraordinary in an Ordinary World." It was about dragons. The author was a dragon. I did not know dragons wrote books. Today was a good day.',
    ],
  },
];

export const DINO_WORLD = [
  {
    id: "dw-1",
    emoji: "🦖",
    title: "Hatching Day",
    subtitle: "A new beginning",
    locked: false,
    pages: [
      "The egg had been the size of a boulder. When it finally cracked, the whole valley shook — at least, that's what Rex always told his younger siblings.",
      "Rex was a young T-Rex, but he hadn't figured that out yet. He just knew the world was enormous and smelled interesting and he was very, very hungry.",
      "His mother showed him which plants were soft enough to push through, which rivers were shallow enough to cross, and which other dinosaurs to leave alone.",
      '"The rule," she said, "is simple: respect the valley. Everything here is connected. You pull one thread and the whole thing unravels."',
      "Rex nodded seriously, then immediately tripped over a stegosaurus tail. The stegosaurus didn't even notice. Rex decided to start small.",
    ],
  },
  {
    id: "dw-2",
    emoji: "🌿",
    title: "Valley Rules",
    subtitle: "Learning the land",
    locked: false,
    pages: [
      "The valley had more rules than Rex expected. Don't drink from the red mud pools. Don't cross the fern meadow during the big rains. Don't argue with the triceratops.",
      "He learned by making exactly the mistakes he'd been told not to make. The red mud pools tasted terrible. The fern meadow in rain was like a waterfall on his head.",
      "He did not argue with the triceratops, to his credit. They had three horns and very clear opinions and Rex valued his snout.",
      "His favourite place was the cliff edge at sunset, where the whole valley spread out below in shades of gold and green. He could see every herd, every river, every plume of steam from the hot springs.",
      '"Someday," he told a passing pterodactyl, "I\'ll know every part of this valley." The pterodactyl gave him a long, skeptical look and flew away.',
    ],
  },
  {
    id: "dw-3",
    emoji: "🌋",
    title: "The Rumble",
    subtitle: "When the ground speaks",
    locked: true,
    pages: [
      "The ground shook on a Tuesday. Rex knew it was unusual because the birds went silent first — every creature in the valley stopped and listened.",
      "The hot springs near the southern ridge were bubbling more than usual. The older dinosaurs moved their herds north without being asked. They remembered.",
      "Rex stayed behind. He wanted to see. His mother found him, grabbed him by the tail, and walked north at a pace that left no room for discussion.",
      "The southern ridge rumbled once more, then settled. The birds came back. The valley exhaled. Everything went quiet in the way that felt like relief.",
      "That night Rex lay under the stars and thought about how small he was, and how old the valley was, and how the ground itself had a memory. He felt, for the first time, like he truly belonged to something.",
    ],
  },
];

// ─── STORIES GRID DATA ────────────────────────────────────────────────────────
// Use este array em StoriesScreen no lugar do STORIES hardcoded.
// O campo `id` bate com as chaves do STORY_MAP após .toUpperCase().replace(/\s/g, "")

export const STORIES_MOCK = [
  {
    id: "spaceadventure", // → "SPACEADVENTURE"
    emoji: "🚀",
    title: "Rocket Adventure",
    tag: "Adventure",
    pages: 15,
    bg: "#EBF4FF",
    accent: "#1E90FF",
    badge: "New",
  },
  {
    id: "magicforest", // → "MAGICFOREST"
    emoji: "🌲",
    title: "Magic Forest",
    tag: "Fantasy",
    pages: 15,
    bg: "#E8F8F0",
    accent: "#27AE60",
    badge: null,
  },
  {
    id: "oceanlife", // → "OCEANLIFE"
    emoji: "🐠",
    title: "Ocean Friends",
    tag: "Animals",
    pages: 15,
    bg: "#FFF0F5",
    accent: "#00ACC1",
    badge: "Hot",
  },
  {
    id: "sciencelab", // → "SCIENCELAB"
    emoji: "🔬",
    title: "Tiny Scientist",
    tag: "Science",
    pages: 15,
    bg: "#FFF7E0",
    accent: "#F5A623",
    badge: null,
  },
  {
    id: "dragondiary", // → "DRAGONDIARY"
    emoji: "🐉",
    title: "Dragon Diary",
    tag: "Fantasy",
    pages: 15,
    bg: "#F3F0FF",
    accent: "#6C5CE7",
    badge: "New",
  },
  {
    id: "dinoworld", // → "DINOWORLD"
    emoji: "🦖",
    title: "Dino World",
    tag: "Adventure",
    pages: 15,
    bg: "#FFF7E0",
    accent: "#27AE60",
    badge: null,
  },
];
