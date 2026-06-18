// hooks/useReadingTimer.ts
// ─────────────────────────────────────────────────────────────────────────────
// Cronômetro de leitura "passivo".
// Mede o tempo em que a tela do leitor está EM FOCO e o app está ATIVO, e
// grava esses segundos em addReadingTime() — que alimenta o gráfico
// "This week" do Profile.
//
// Por que medir foco + AppState (e não um setInterval cru)?
//  • Se a criança vai pra outra aba/tela → useFocusEffect faz o flush.
//  • Se o app vai pro background (tela bloqueada, troca de app) → o listener
//    de AppState faz o flush e pausa a contagem, então minimizar o app por
//    1h não conta como 1h de leitura.
//
// Uso (no leitor):
//   useReadingTimer();              // sempre ligado
//   useReadingTimer(!chapter.locked); // ou condicional
// ─────────────────────────────────────────────────────────────────────────────

import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

import { addReadingTime } from "../lib/readingProgress";

export function useReadingTimer(enabled: boolean = true): void {
  // Timestamp (ms) de quando o "trecho" atual de leitura começou.
  // null = cronômetro parado.
  const startRef = useRef<number | null>(null);

  const begin = useCallback(() => {
    if (startRef.current == null) startRef.current = Date.now();
  }, []);

  const flush = useCallback(() => {
    if (startRef.current == null) return;
    const elapsedSec = (Date.now() - startRef.current) / 1000;
    startRef.current = null;
    // addReadingTime já clampa e ignora valores <= 0; não precisa await aqui.
    void addReadingTime(elapsedSec);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;

      begin(); // tela ganhou foco → começa a contar

      const sub = AppState.addEventListener(
        "change",
        (next: AppStateStatus) => {
          if (next === "active") begin();
          else flush(); // background / inactive → pausa e grava
        },
      );

      // tela perdeu foco (voltou, trocou de aba, desmontou) → grava
      return () => {
        flush();
        sub.remove();
      };
    }, [enabled, begin, flush]),
  );
}
