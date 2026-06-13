// features/farm-game/three/grass.ts
import * as THREE from "three";

import { FIELD_HALF, GRASS_BORDER, TILE_H } from "../constants";

// ─── Ground / grass colors ────────────────────────────────────────────────────

const GRASS_GROUND = 0x4caf50;
const GRASS_TUFTS = [0x2e7d32, 0x388e3c, 0x43a047, 0x66bb6a];
const FLOWER_COLORS = [0xffeb3b, 0xff7043, 0xf06292, 0xffffff];

// ─── Grass field builder ──────────────────────────────────────────────────────

export function buildGrassField(scene: THREE.Scene) {
  const groundSize = FIELD_HALF * 2 + GRASS_BORDER * 2;
  const groundGeo = new THREE.BoxGeometry(groundSize, 0.14, groundSize);
  const groundMat = new THREE.MeshStandardMaterial({
    color: GRASS_GROUND,
    roughness: 1,
    metalness: 0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.set(0, -TILE_H / 2 - 0.07, 0);
  ground.receiveShadow = true;
  scene.add(ground);

  const tuftGeo = new THREE.ConeGeometry(0.07, 0.22, 5);
  const tuftMats = GRASS_TUFTS.map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }),
  );
  const margin = 0.25;
  const outer = FIELD_HALF + GRASS_BORDER - 0.3;

  const randomBorderPos = (): [number, number] => {
    let x = 0;
    let z = 0;
    do {
      x = (Math.random() * 2 - 1) * outer;
      z = (Math.random() * 2 - 1) * outer;
    } while (
      Math.abs(x) < FIELD_HALF + margin &&
      Math.abs(z) < FIELD_HALF + margin
    );
    return [x, z];
  };

  for (let i = 0; i < 110; i++) {
    const [x, z] = randomBorderPos();
    const tuft = new THREE.Mesh(
      tuftGeo,
      tuftMats[Math.floor(Math.random() * tuftMats.length)],
    );
    const sc = 0.7 + Math.random() * 0.8;
    tuft.scale.set(sc, sc, sc);
    tuft.position.set(x, -TILE_H / 2 + 0.11 * sc, z);
    tuft.rotation.y = Math.random() * Math.PI;
    tuft.castShadow = true;
    scene.add(tuft);
  }

  const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.16, 5);
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x2e7d32,
    roughness: 0.9,
  });
  const headGeo = new THREE.SphereGeometry(0.05, 8, 8);

  for (let i = 0; i < 18; i++) {
    const [x, z] = randomBorderPos();
    const flower = new THREE.Group();
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.08;
    const head = new THREE.Mesh(
      headGeo,
      new THREE.MeshStandardMaterial({
        color: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
        roughness: 0.7,
      }),
    );
    head.position.y = 0.18;
    flower.add(stem, head);
    flower.position.set(x, -TILE_H / 2, z);
    scene.add(flower);
  }
}
