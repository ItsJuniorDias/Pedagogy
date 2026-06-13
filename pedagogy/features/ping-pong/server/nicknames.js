/**
 * nicknames.js — Gerador de apelidos fofinhos (emoji + nick) no servidor.
 *
 * O servidor é a AUTORIDADE do apelido: cada jogador que conecta ganha um
 * `{ nick, emoji }` aleatório e fofo, garantidamente único entre quem está
 * online no momento. O cliente apenas exibe o que recebe.
 */

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

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Gera um apelido fofo único.
 * @param {Set<string>} taken nicks já em uso (para evitar repetição)
 */
export function makeNickname(taken = new Set()) {
  for (let i = 0; i < 40; i++) {
    const emoji = pick(EMOJIS);
    const nick = `${pick(ADJ)}${pick(NOUN)}`;
    if (!taken.has(nick)) return { nick, emoji };
  }
  // fallback com sufixo numérico se (improvável) tudo colidir
  const emoji = pick(EMOJIS);
  const nick = `${pick(ADJ)}${pick(NOUN)}${Math.floor(Math.random() * 999)}`;
  return { nick, emoji };
}
