// mocks/i18n/fr/storyMocks.fr.ts
// Traduction (fr) — semences ROCKET_ADVENTURE + MAGIC_FOREST. Le pipeline
// complète le reste. id / emoji / locked identiques à l'anglais.
// (Pages en template literals : le français est dense en apostrophes.)

import type { LocalizedChapter } from "../types";

export const ROCKET_ADVENTURE: LocalizedChapter[] = [
  {
    id: "sa-1",
    emoji: "🚀",
    title: "Décollage !",
    subtitle: "Le voyage commence",
    locked: false,
    pages: [
      `Le compte à rebours résonna sur le pas de tir. Dix… neuf… huit… Le jeune astronaute Leo agrippa son siège tandis que les moteurs rugissaient, s'éveillant sous lui.`,
      `Sept… six… cinq… La fusée trembla comme un géant sortant d'un profond sommeil. Leo sentait chaque boulon et chaque panneau vibrer d'une énergie brute.`,
      `Quatre… trois… deux… un… ALLUMAGE ! Un mur de fumée blanche explosa vers l'extérieur et la fusée transperça le ciel, laissant la Terre derrière elle en quelques secondes.`,
      `Leo colla son visage au hublot. En dessous, les nuages rétrécissaient en filaments de coton. La courbe bleue de la planète remplissait tout son champ de vision.`,
      `Le Contrôle de Mission crépita dans son casque : Leo, tu es AUTORISÉ pour l'orbite. Il leva le pouce vers le siège vide à côté de lui, réservé à son meilleur ami, un petit ours en peluche nommé Cosmo.`,
    ],
  },
  {
    id: "sa-2",
    emoji: "🌕",
    title: "Escale sur la Lune",
    subtitle: "Poussière et cratères",
    locked: false,
    pages: [
      `La Lune grandit d'une bille à une montagne tandis que Leo guidait la navette vers l'orbite lunaire. Des cratères gris s'étendaient dans toutes les directions, comme des ondulations figées.`,
      `Il atterrit avec un choc doux dans la mer de la Tranquillité. La poussière s'éleva en nuages lents et silencieux autour des pieds d'atterrissage.`,
      `« Un petit pas », murmura Leo à Cosmo, puis il éclata de rire en bondissant de trois mètres dès sa toute première enjambée.`,
      `Il récolta des échantillons de roche, planta un petit drapeau fait de la vieille écharpe de sa maman et déjeuna d'un sandwich au fromage flottant.`,
      `Avant de repartir, il grava son nom dans la poussière du bout d'un doigt ganté. La Lune n'avait pas de vent : sa signature resterait là pour toujours.`,
    ],
  },
  {
    id: "sa-3",
    emoji: "🪐",
    title: "Cavalier des Anneaux",
    subtitle: "La surprise de Saturne",
    locked: true,
    pages: [
      `Saturne apparut comme un tableau : dorée, cerclée d'anneaux et incroyablement immense. Leo coupa les moteurs et resta simplement à contempler pendant une minute entière.`,
      `Les anneaux étaient faits de blocs de glace allant de la taille d'un flocon de neige à celle d'une maison. Leo pilota la navette entre eux comme sur un slalom.`,
      `Un petit caillou glacé heurta la coque : CLONC. Cosmo bascula du tableau de bord. Leo le rattrapa. « On va bien, mon pote. »`,
      `Au plus profond des anneaux, il aperçut quelque chose d'extraordinaire : une sphère de glace parfaite qui luisait d'un bleu pâle de l'intérieur. Il la recueillit dans un bocal à échantillons.`,
      `« Contrôle de Mission », dit-il à la radio, respirant à peine, « je crois que je viens de trouver quelque chose que personne n'a jamais vu. » Il y eut un long silence, puis une acclamation assourdissante.`,
    ],
  },
];

export const MAGIC_FOREST: LocalizedChapter[] = [
  {
    id: "mf-1",
    emoji: "🌲",
    title: "Le Premier Pas",
    subtitle: "Vers le vert",
    locked: false,
    pages: [
      `Mia avait vécu toute sa vie à côté de la Forêt Magique, mais elle n'avait jamais osé y entrer. Aujourd'hui, c'était différent. Aujourd'hui, elle avait la boussole de sa grand-mère.`,
      `À l'instant où elle franchit le muret de pierre couvert de mousse, l'air changea. Il sentait la cannelle, la pluie et quelque chose qu'elle ne savait pas tout à fait nommer : des possibilités, peut-être.`,
      `Les arbres y étaient anciens, aux troncs plus larges que sa maison. De petites lumières flottaient entre les branches comme des lucioles au ralenti.`,
      `« Tu as pris ton temps », dit un renard à la queue argentée, assis au milieu du sentier. Il la regardait comme on regarde de vieux amis.`,
      `Mia ne cria pas. Elle avait toujours cru en secret que les animaux pouvaient parler ; elle ne s'attendait simplement pas à ce qu'ils soient si polis à ce sujet.`,
    ],
  },
  {
    id: "mf-2",
    emoji: "🍄",
    title: "Le Village Champignon",
    subtitle: "De minuscules voisins",
    locked: false,
    pages: [
      `Le renard argenté, qui s'appelait Pip, conduisit Mia jusqu'à une clairière cachée sous un énorme chêne tombé.`,
      `Là, bâtie dans les racines et la terre, se dressait toute une ville de maisons en chapeau de champignon. La fumée s'échappait de cheminées en gland. De petites fenêtres brillaient couleur d'ambre.`,
      `Les habitants étaient des hérissons pas plus gros que le poing de Mia, chacun portant un manteau fait d'une seule feuille tombée.`,
      `« Nous attendions la Gardienne de la Boussole », annonça le Maire, un hérisson tout rond en gilet de feuille d'érable, s'inclinant si bas que son nez toucha le sol.`,
      `Mia regarda la boussole de sa grand-mère. L'aiguille, remarqua-t-elle alors, ne pointait pas vers le nord. Elle tournait lentement, comme si elle cherchait tout autre chose.`,
    ],
  },
  {
    id: "mf-3",
    emoji: "🌟",
    title: "L'Étoile Perdue",
    subtitle: "Un mystère dans le ciel",
    locked: true,
    pages: [
      `Le maire hérisson expliqua le problème d'une voix grave et aiguë : une étoile était tombée dans la forêt trois nuits plus tôt et elle s'éteignait peu à peu.`,
      `Sans elle, la magie de la forêt faiblirait. Les lumières des lucioles s'éteindraient. Les animaux parlants oublieraient leurs mots. Le Village Champignon sombrerait dans le noir.`,
      `L'étoile tombée était de la taille d'une pastèque et reposait dans un étang au cœur de la forêt, vacillant comme une bougie dans le vent.`,
      `Mia s'agenouilla près d'elle. Elle était tiède et bourdonnait très faiblement, à la même fréquence que sa grand-mère fredonnait autrefois en cuisinant.`,
      `Elle ouvrit la boussole. L'aiguille cessa de tourner et pointa droit vers l'étoile. La voix de sa grand-mère sembla murmurer : « Tu sais déjà quoi faire, mon amour. »`,
    ],
  },
];
