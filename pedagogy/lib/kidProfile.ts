// lib/kidProfile.ts
// ─────────────────────────────────────────────────────────────────────────────
// Fonte única de verdade do PERFIL DA CRIANÇA (nome + idade).
// Coletado no onboarding e consumido em: Profile, Paywall e saudação da Home.
//
// Persistido em AsyncStorage — mesma abordagem já usada no app
// (@subscription_status, @reading_progress_v1), então não precisa de lib nova.
//
// Além do CRUD assíncrono, expõe um hook reativo (useKidProfile) com um
// pub/sub em memória: quando o onboarding grava o perfil, qualquer tela montada
// (ex.: Paywall aberto logo em seguida) re-renderiza sozinha, sem precisar de
// foco/reload.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const STORAGE_KEY = "@kid_profile_v1";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type KidProfile = {
  /** Nome da criança, já com trim. Nunca vazio quando persistido. */
  name: string;
  /** Idade em anos (2–10 no fluxo atual). null = não informada. */
  age: number | null;
};

// Faixa etária suportada pelo app (histórias para 2–10 anos).
export const MIN_AGE = 2;
export const MAX_AGE = 10;

// ─── CACHE + PUB/SUB EM MEMÓRIA ───────────────────────────────────────────────
// `undefined` = ainda não lemos do disco; `null` = lido, mas não existe perfil.
let cache: KidProfile | null | undefined = undefined;
const listeners = new Set<(p: KidProfile | null) => void>();

function emit(p: KidProfile | null) {
  cache = p;
  listeners.forEach((l) => l(p));
}

// ─── SANITIZAÇÃO ──────────────────────────────────────────────────────────────

/** Normaliza a idade para inteiro dentro da faixa; fora disso vira null. */
export function clampAge(age: number | null | undefined): number | null {
  if (age == null || Number.isNaN(age)) return null;
  const n = Math.round(age);
  if (n < MIN_AGE || n > MAX_AGE) return null;
  return n;
}

function sanitize(p: Partial<KidProfile>): KidProfile {
  return {
    name: (p.name ?? "").trim(),
    age: clampAge(p.age ?? null),
  };
}

// ─── API ──────────────────────────────────────────────────────────────────────

/** Lê o perfil do disco (usa cache quando já carregado). null se não existir. */
export async function getKidProfile(): Promise<KidProfile | null> {
  if (cache !== undefined) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cache = raw ? (sanitize(JSON.parse(raw)) as KidProfile) : null;
  } catch {
    cache = null;
  }
  return cache;
}

/** Grava (ou atualiza) o perfil, notificando todas as telas montadas. */
export async function saveKidProfile(
  profile: Partial<KidProfile>,
): Promise<KidProfile> {
  const clean = sanitize(profile);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch {
    // Falha ao gravar não deve interromper o fluxo de onboarding.
  }
  emit(clean);
  return clean;
}

/** Remove o perfil (útil em "resetar dados"/logout). */
export async function clearKidProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
  emit(null);
}

// ─── HOOK REATIVO ─────────────────────────────────────────────────────────────

type UseKidProfile = {
  /** Perfil atual (null enquanto carrega ou se não existir). */
  profile: KidProfile | null;
  /** true até a primeira leitura do disco concluir. */
  loading: boolean;
  /** Atalho para gravar e propagar em todas as telas. */
  save: (p: Partial<KidProfile>) => Promise<KidProfile>;
};

/**
 * Assina o perfil da criança. Carrega do disco no primeiro mount e re-renderiza
 * automaticamente sempre que saveKidProfile/clearKidProfile forem chamados em
 * qualquer lugar do app.
 */
export function useKidProfile(): UseKidProfile {
  const [profile, setProfile] = useState<KidProfile | null>(cache ?? null);
  const [loading, setLoading] = useState(cache === undefined);

  useEffect(() => {
    let mounted = true;

    if (cache === undefined) {
      getKidProfile().then((p) => {
        if (mounted) {
          setProfile(p);
          setLoading(false);
        }
      });
    } else {
      setProfile(cache);
      setLoading(false);
    }

    const listener = (p: KidProfile | null) => {
      if (mounted) setProfile(p);
    };
    listeners.add(listener);
    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  return { profile, loading, save: saveKidProfile };
}
