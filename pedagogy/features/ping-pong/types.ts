/**
 * types.ts — Tipos compartilhados do NEON PONG.
 */

import { Renderer } from "expo-three";
import { Animated } from "react-native";
import * as THREE from "three";

export type Phase = "idle" | "serving" | "play" | "paused" | "over";
export type DiffId = "easy" | "normal" | "hard";

export interface Diff {
  id: DiffId;
  label: string;
  emoji: string;
  color: string;
  aiSpeed: number; // velocidade máx. da raquete da CPU (un/s)
  ballSpeed: number; // velocidade base da bola (un/s)
}

export interface FloatingLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  anim: Animated.Value;
}

/** Refs vivos usados pelo loop do jogo (fora do ciclo de render do React). */
export interface SceneRefs {
  renderer: Renderer | null;
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  ball: THREE.Mesh | null;
  player: THREE.Group | null;
  ai: THREE.Group | null;
  orbs: THREE.Mesh[];
  vel: { x: number; z: number };
  targetX: number; // alvo da raquete do jogador (arrasto do dedo)
  phase: Phase;
  serveAt: number;
  serveDir: 1 | -1; // 1 = em direção ao jogador, -1 = em direção à CPU
  speedMul: number;
  rally: number;
  animFrame: number;
  t: number; // tempo acumulado p/ animações ambientes
}
