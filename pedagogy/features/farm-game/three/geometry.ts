// features/farm-game/three/geometry.ts
import * as THREE from "three";

import { COLS, ROWS, STRIDE } from "../constants";

// ─── Posição do tile no mundo ─────────────────────────────────────────────────

export function tileWorldPos(id: number): THREE.Vector3 {
  const col = id % COLS;
  const row = Math.floor(id / COLS);
  const cx = (COLS - 1) / 2;
  const cy = (ROWS - 1) / 2;
  return new THREE.Vector3((col - cx) * STRIDE, 0, (row - cy) * STRIDE);
}

// ─── Geometrias compartilhadas das plantas ────────────────────────────────────
// Em nível de módulo → ~zero custo por tile (instâncias reaproveitadas).

export const GEO = {
  // genéricas / estágios
  sproutLeaf: new THREE.ConeGeometry(0.05, 0.2, 5),
  youngStem: new THREE.CylinderGeometry(0.028, 0.042, 0.34, 6),
  youngLeaf: new THREE.ConeGeometry(0.07, 0.2, 5),
  leafBlade: new THREE.ConeGeometry(0.08, 0.22, 5),
  bush: new THREE.SphereGeometry(0.22, 10, 9),
  frondStem: new THREE.CylinderGeometry(0.01, 0.014, 0.26, 4),

  // trigo
  wheatStalk: new THREE.CylinderGeometry(0.012, 0.02, 0.5, 5),
  wheatHead: new THREE.SphereGeometry(0.05, 6, 8),
  wheatAwn: new THREE.ConeGeometry(0.006, 0.12, 4),

  // alface (folhas em concha)
  leafCup: new THREE.SphereGeometry(
    0.2,
    10,
    8,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.55,
  ),

  // cenoura
  carrotRoot: new THREE.ConeGeometry(0.12, 0.22, 10),
  frondLeaf: new THREE.ConeGeometry(0.03, 0.12, 4),

  // batata
  tuber: new THREE.SphereGeometry(0.12, 8, 7),

  // milho
  cornStalk: new THREE.CylinderGeometry(0.035, 0.05, 0.64, 6),
  cob: new THREE.CylinderGeometry(0.058, 0.045, 0.26, 8),
  cobTip: new THREE.ConeGeometry(0.045, 0.1, 8),
  husk: new THREE.ConeGeometry(0.07, 0.3, 5),
  tassel: new THREE.ConeGeometry(0.01, 0.12, 4),
  cornLeaf: new THREE.ConeGeometry(0.06, 0.5, 5),

  // tomate / fruta redonda genérica
  roundFruit: new THREE.SphereGeometry(0.1, 12, 10),
  calyx: new THREE.ConeGeometry(0.05, 0.04, 5),

  // morango (cone, ponta pra baixo)
  berryCone: new THREE.ConeGeometry(0.075, 0.16, 8),
  flowerPetal: new THREE.SphereGeometry(0.03, 6, 6),
  flowerCore: new THREE.SphereGeometry(0.018, 6, 6),

  // girassol
  sunStem: new THREE.CylinderGeometry(0.03, 0.045, 0.66, 6),
  sunDisc: new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16),
  sunPetal: new THREE.ConeGeometry(0.045, 0.16, 4),
  sunSeed: new THREE.SphereGeometry(0.1, 12, 8),

  // abóbora (lobos)
  pumpkinLobe: new THREE.SphereGeometry(0.13, 10, 8),
  pumpkinStem: new THREE.CylinderGeometry(0.025, 0.035, 0.12, 6),

  // melancia
  melonBody: new THREE.SphereGeometry(0.24, 14, 12),
  melonStripe: new THREE.TorusGeometry(0.242, 0.012, 6, 22),
  vine: new THREE.TorusGeometry(0.05, 0.008, 5, 10, Math.PI * 1.4),

  // uva
  grapeBall: new THREE.SphereGeometry(0.05, 8, 7),
  grapeLeaf: new THREE.SphereGeometry(0.12, 8, 6),

  // dragonfruit
  dragonBody: new THREE.SphereGeometry(0.16, 12, 12),
  dragonFin: new THREE.ConeGeometry(0.05, 0.2, 4),

  // cristal
  crystalShard: new THREE.ConeGeometry(0.06, 0.4, 6),
  crystalCore: new THREE.OctahedronGeometry(0.1),
};

/** Carambola: estrela de 5 pontas extrudada (a seção transversal é o "look"). */
function makeStarGeo(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const spikes = 5;
  const outer = 0.13;
  const inner = 0.05;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.015,
    bevelSegments: 1,
    steps: 1,
  });
  geo.center();
  return geo;
}

export const STAR_GEO = makeStarGeo();
