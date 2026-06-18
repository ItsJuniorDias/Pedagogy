// features/farm-game/audio/useGameAudio.ts
// Hook React: liga/desliga a trilha de uma faixa enquanto a tela estiver montada
// e expõe o estado de mudo + um toggle (para o botão da HUD).

import { useCallback, useEffect, useState } from "react";

import { engine } from "./engine";
import { music, type TrackId } from "./music";

export function useGameAudio(track: TrackId) {
  const [muted, setMuted] = useState<boolean>(engine.isMuted);

  // Mantém o botão sincronizado caso o mudo mude em qualquer lugar.
  useEffect(() => engine.subscribe(setMuted), []);

  // Toca a trilha enquanto a tela viver; para ao desmontar.
  useEffect(() => {
    engine.unlock();
    music.start(track);
    return () => music.stop();
  }, [track]);

  const toggle = useCallback(() => engine.toggleMuted(), []);

  return { muted, toggle };
}
