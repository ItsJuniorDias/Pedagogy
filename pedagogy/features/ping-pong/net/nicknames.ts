/**
 * nicknames.ts — Gerador de apelido fofo no cliente (fallback offline).
 *
 * Normalmente quem dá o apelido é o servidor (autoritativo). Este gerador é
 * usado só quando o jogo roda sem servidor ou enquanto a conexão não chegou,
 * pra que a UI nunca fique sem um `{ nick, emoji }` fofinho para mostrar.
 */

import type { Identity } from "./protocol";

const EMOJIS = [
  "🦊", "🐼", "🐱", "🐶", "🦄", "🐧", "🐸", "🐢", "🦉", "🐙",
  "🦖", "🐝", "🦋", "🐞", "🐬", "🦔", "🐨", "🐯", "🦁", "🐰",
  "🌟", "🍕", "🍓", "🌈", "👾", "🚀", "🔥", "⚡", "🎈", "🍩",
];

const ADJ = [
  "Cuddly", "Speedy", "Wacky", "Bouncy", "Shiny", "Cheeky",
  "Turbo", "Magic", "Hungry", "Sleepy", "Ninja", "Cosmic",
  "Jelly", "Pixel", "Stellar", "Greedy", "Giggly", "Sassy",
  "Rocket", "Marshmallow", "Caramel", "Thunder", "Confetti", "Spicy",
];

const NOUN = [
  "Fox", "Panda", "Kitten", "Penguin", "Frog", "Turtle",
  "Unicorn", "Octopus", "Owl", "Bee", "Butterfly", "Capybara",
  "Bunny", "Dino", "Llama", "Seal", "Tiger", "Otter",
  "Squirrel", "Hedgehog", "Dolphin", "Ladybug", "Bat", "Cub",
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Apelido fofo local (sem id de servidor). */
export function makeLocalNickname(): Identity {
  return {
    id: `local_${Math.random().toString(36).slice(2, 9)}`,
    nick: `${pick(ADJ)}${pick(NOUN)}`,
    emoji: pick(EMOJIS),
  };
}
