/**
 * materials.ts — Fábricas de materiais Three.js.
 */

import * as THREE from "three";

export function lambert(
  color: number,
  opts: THREE.MeshLambertMaterialParameters = {},
) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

// Material "neon": não reage à luz → cor pura, parece emissivo
export function neon(
  color: number,
  opts: THREE.MeshBasicMaterialParameters = {},
) {
  return new THREE.MeshBasicMaterial({ color, ...opts });
}
