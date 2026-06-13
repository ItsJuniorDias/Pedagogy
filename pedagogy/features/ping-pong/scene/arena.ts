/**
 * arena.ts — Piso escuro, grade estilo tron e orbes neon flutuantes.
 */

import * as THREE from "three";
import { TABLE } from "../constants";
import { C3D } from "../theme";
import type { SceneRefs } from "../types";
import { lambert, neon } from "./materials";

export function buildArena(scene: THREE.Scene, r: SceneRefs) {
  // Piso escuro + grade estilo tron
  const floorY = -1.35;
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(30, 0.16, 30),
    lambert(C3D.floor),
  );
  floor.position.set(0, floorY, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(28, 28, C3D.gridA, C3D.gridB);
  grid.position.y = floorY + 0.09;
  scene.add(grid);

  // Orbes neon flutuantes ao redor da arena (ambiente)
  const orbGeo = new THREE.SphereGeometry(0.09, 8, 8);
  for (let i = 0; i < 14; i++) {
    let x = 0;
    let z = 0;
    do {
      x = (Math.random() * 2 - 1) * 11;
      z = (Math.random() * 2 - 1) * 11;
    } while (
      Math.abs(x) < TABLE.halfW + 1.2 &&
      Math.abs(z) < TABLE.halfL + 1.2
    );
    const orb = new THREE.Mesh(
      orbGeo,
      neon(C3D.orbs[i % C3D.orbs.length], {
        transparent: true,
        opacity: 0.85,
      }),
    );
    const baseY = -0.4 + Math.random() * 1.6;
    orb.position.set(x, baseY, z);
    orb.userData.baseY = baseY;
    orb.userData.spd = 0.6 + Math.random() * 1.4;
    orb.userData.off = Math.random() * Math.PI * 2;
    scene.add(orb);
    r.orbs.push(orb);
  }
}
