// ping-pong/audio/sfx.ts
// Mesma API do módulo web (`sfx.serve()`, `sfx.paddle(isPlayer, spin)`, …),
// agora tocando os arquivos pré-renderizados via expo-audio.

import { engine } from "./engine";

export const sfx = {
  /** Saque: bip curto de "atenção". */
  serve() {
    engine.playSfx("serve");
  },
  /**
   * Rebatida. `isPlayer` muda o timbre (você é mais agudo); `spin` (0..1) troca
   * para a variante "brilhante" quando há corte forte.
   */
  paddle(isPlayer = false, spin = 0) {
    const hard = spin >= 0.5;
    engine.playSfx(
      isPlayer
        ? hard
          ? "paddlePlayerHard"
          : "paddlePlayer"
        : hard
          ? "paddleCpuHard"
          : "paddleCpu",
    );
  },
  /** Bola na parede de vidro. */
  wall() {
    engine.playSfx("wall");
  },
  /** Corte com efeito: whoosh. */
  spin() {
    engine.playSfx("spin");
  },
  /** Ponto do jogador (sobe). */
  scorePlayer() {
    engine.playSfx("scorePlayer");
  },
  /** Ponto da CPU/oponente (desce). */
  scoreCpu() {
    engine.playSfx("scoreCpu");
  },
  /** Vitória: fanfarra. */
  win() {
    engine.playSfx("win");
  },
  /** Derrota: descida triste. */
  lose() {
    engine.playSfx("lose");
  },
};

export type Sfx = typeof sfx;
