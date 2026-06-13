// features/farm-game/state/useFarmGame.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useReducer, useRef, useState } from "react";

import { SAVE_DEBOUNCE_MS, STORAGE_KEY } from "../constants";
import type { GameState } from "../types";
import { loadSave, toPersistable } from "./persistence";
import { INITIAL_STATE, reducer } from "./reducer";

/**
 * Ciclo de vida do estado do jogo: reducer + hidratação do save +
 * autosave com debounce + tick de crescimento.
 *
 * Retorna `stateRef` (sempre atualizado) para handlers/loops que precisam
 * ler o estado mais recente sem recriar callbacks a cada frame.
 */
export function useFarmGame() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const stateRef = useRef<GameState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [hydrated, setHydrated] = useState(false);

  // ── Carrega o save no mount ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const save = await loadSave();
      if (cancelled) return;
      if (save) {
        dispatch({ type: "HYDRATE", payload: save });
        // TICK imediato: plantas que cresceram offline já viram "ready"
        setTimeout(() => dispatch({ type: "TICK" }), 0);
      } else {
        dispatch({ type: "HYDRATE", payload: {} }); // primeira sessão: defaults
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Autosave com debounce a cada mudança ──
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(toPersistable(state)),
      ).catch((e) => console.warn("[FarmGame] Failed to save:", e));
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [state, hydrated]);

  // ── Game tick ──
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, []);

  return { state, dispatch, stateRef, hydrated };
}
