/**
 * useRanking.ts — Hook React do ranking persistente.
 *
 * Carrega o perfil do AsyncStorage na montagem, expõe `recordMatch` para
 * registrar uma partida (marcação de ponto depois da partida) e `reset` para
 * zerar tudo. Toda a lógica de acúmulo/pontuação vive em storage/ranking.ts —
 * aqui só há estado de UI.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  clearRanking,
  emptyProfile,
  loadRanking,
  recordMatchResult,
} from "../storage";
import type { MatchRecord, MatchResult, RankingProfile } from "../storage";

export function useRanking() {
  const [profile, setProfile] = useState<RankingProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  // Última partida registrada — útil p/ a tela de fim mostrar "+pontos".
  const [lastRecord, setLastRecord] = useState<MatchRecord | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    (async () => {
      const p = await loadRanking();
      if (mounted.current) {
        setProfile(p);
        setLoading(false);
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  /** Registra uma partida concluída e devolve o registro criado. */
  const recordMatch = useCallback(async (m: MatchResult) => {
    const { profile: next, record } = await recordMatchResult(m);
    if (mounted.current) {
      setProfile(next);
      setLastRecord(record);
    }
    return record;
  }, []);

  /** Zera o ranking persistido. */
  const reset = useCallback(async () => {
    const empty = await clearRanking();
    if (mounted.current) {
      setProfile(empty);
      setLastRecord(null);
    }
  }, []);

  /** Limpa só o "último registro" (ex.: ao fechar a tela de fim). */
  const clearLastRecord = useCallback(() => setLastRecord(null), []);

  return {
    profile,
    loading,
    lastRecord,
    recordMatch,
    reset,
    clearLastRecord,
  };
}
