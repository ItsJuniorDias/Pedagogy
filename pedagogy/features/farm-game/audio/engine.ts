// features/farm-game/audio/engine.ts
// ─────────────────────────────────────────────────────────────────────────────
// Motor de áudio baseado em `expo-audio` (parte do SDK do Expo → roda no Expo
// Go e em dev builds, SEM módulo nativo de terceiros).
//
// A síntese procedural foi pré-renderizada para arquivos .wav (veja
// tools/render-audio.mjs). Aqui só os tocamos:
//   • trilha "farm": um player em loop;
//   • efeitos: um pequeno POOL de players por som (permite sobreposição rápida).
//
// O mudo é persistido no AsyncStorage. Tudo embrulhado em try/catch: áudio nunca
// derruba o jogo. Se `expo-audio` não existir por algum motivo, degrada para
// silêncio em vez de quebrar.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  MUSIC_SOURCES,
  SFX_SOURCES,
  type SfxName,
  type TrackId,
} from "./sources";

// Tipos só de compilação (apagados em runtime).
type ExpoAudio = typeof import("expo-audio");
type Player = ReturnType<ExpoAudio["createAudioPlayer"]>;

// Carregamento defensivo (expo-audio é do SDK, mas não custa blindar).
let EA: ExpoAudio | null = null;
try {
  EA = require("expo-audio") as ExpoAudio;
} catch {
  EA = null;
  if (typeof console !== "undefined" && console.warn) {
    console.warn(
      "[audio] expo-audio ausente — o jogo roda sem som. " +
        "Rode: npx expo install expo-audio",
    );
  }
}

const STORE_KEY = "pedagogy.audio.muted.v1";
const POOL = 2; // players por efeito (sobreposição)
const MUSIC_VOLUME = 0.6;

class AudioEngine {
  private muted = false;
  private listeners = new Set<(m: boolean) => void>();
  private modeSet = false;

  private sfxPools: Partial<Record<SfxName, { players: Player[]; idx: number }>> =
    {};
  private musicPlayer: Player | null = null;
  private musicTrack: TrackId | null = null;

  constructor() {
    AsyncStorage.getItem(STORE_KEY)
      .then((v) => {
        if (v === "1") {
          this.muted = true;
          this.applyMute();
          this.emit();
        }
      })
      .catch(() => {});
  }

  get isMuted(): boolean {
    return this.muted;
  }

  subscribe(fn: (m: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
  private emit(): void {
    this.listeners.forEach((f) => f(this.muted));
  }

  /** Configura a sessão (tocar mesmo no silencioso) uma única vez. */
  private ensureMode(): void {
    if (this.modeSet || !EA) return;
    this.modeSet = true;
    try {
      EA.setAudioModeAsync({ playsInSilentMode: true })?.catch?.(() => {});
    } catch {
      /* ignore */
    }
  }

  /** Mantido por compatibilidade com o SoundButton/hook (gesto). */
  unlock(): void {
    this.ensureMode();
  }

  // ── Efeitos ────────────────────────────────────────────────────────────────
  playSfx(name: SfxName): void {
    if (this.muted || !EA) return;
    try {
      this.ensureMode();
      let pool = this.sfxPools[name];
      if (!pool) {
        const src = SFX_SOURCES[name];
        const players = Array.from({ length: POOL }, () =>
          EA!.createAudioPlayer(src),
        );
        pool = { players, idx: 0 };
        this.sfxPools[name] = pool;
      }
      const p = pool.players[pool.idx];
      pool.idx = (pool.idx + 1) % pool.players.length;
      p.seekTo(0);
      p.play();
    } catch {
      /* nunca derruba o jogo */
    }
  }

  // ── Trilha ───────────────────────────────────────────────────────────────────
  startMusic(track: TrackId): void {
    if (!EA) return;
    try {
      this.ensureMode();
      if (this.musicTrack === track && this.musicPlayer) {
        this.musicPlayer.play();
        return;
      }
      this.stopMusic();
      const player = EA.createAudioPlayer(MUSIC_SOURCES[track]);
      player.loop = true;
      player.volume = MUSIC_VOLUME;
      player.muted = this.muted;
      player.play();
      this.musicPlayer = player;
      this.musicTrack = track;
    } catch {
      /* ignore */
    }
  }

  stopMusic(): void {
    try {
      if (this.musicPlayer) {
        this.musicPlayer.pause();
        this.musicPlayer.release?.();
      }
    } catch {
      /* ignore */
    }
    this.musicPlayer = null;
    this.musicTrack = null;
  }

  // ── Mudo ─────────────────────────────────────────────────────────────────────
  private applyMute(): void {
    try {
      if (this.musicPlayer) this.musicPlayer.muted = this.muted;
    } catch {
      /* ignore */
    }
  }

  setMuted(m: boolean): void {
    this.muted = m;
    AsyncStorage.setItem(STORE_KEY, m ? "1" : "0").catch(() => {});
    this.applyMute();
    this.emit();
  }
  toggleMuted(): void {
    this.setMuted(!this.muted);
  }
}

export const engine = new AudioEngine();
