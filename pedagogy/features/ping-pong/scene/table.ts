/**
 * table.ts — Mesa escura com linhas neon, rede, paredes de vidro e pernas.
 */

import * as THREE from "three";
import { TABLE } from "../constants";
import { C3D } from "../theme";
import { lambert, neon } from "./materials";

export function buildTable(scene: THREE.Scene) {
  // Tampo escuro
  const top = new THREE.Mesh(new THREE.BoxGeometry(TABLE.w, 0.18, TABLE.l), [
    lambert(C3D.tableSide),
    lambert(C3D.tableSide),
    lambert(C3D.tableTop),
    lambert(C3D.tableSide),
    lambert(C3D.tableSide),
    lambert(C3D.tableSide),
  ]);
  top.position.set(0, 0, 0);
  top.receiveShadow = true;
  scene.add(top);

  // Linhas NEON ciano (borda + linha central)
  const lineMat = neon(C3D.lines);
  const mkLine = (w: number, l: number, x: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, l), lineMat);
    m.position.set(x, TABLE.topY + 0.007, z);
    scene.add(m);
  };
  mkLine(TABLE.w, 0.06, 0, TABLE.halfL - 0.03); // borda perto do jogador
  mkLine(TABLE.w, 0.06, 0, -(TABLE.halfL - 0.03)); // borda da CPU
  mkLine(0.06, TABLE.l, TABLE.halfW - 0.03, 0); // laterais
  mkLine(0.06, TABLE.l, -(TABLE.halfW - 0.03), 0);
  mkLine(0.05, TABLE.l, 0, 0); // linha central

  // Rede translúcida azulada
  const net = new THREE.Mesh(
    new THREE.BoxGeometry(TABLE.w + 0.3, 0.3, 0.035),
    new THREE.MeshBasicMaterial({
      color: C3D.net,
      transparent: true,
      opacity: 0.3,
    }),
  );
  net.position.set(0, TABLE.topY + 0.15, 0);
  scene.add(net);
  const postGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.34, 8);
  [-1, 1].forEach((side) => {
    const post = new THREE.Mesh(postGeo, lambert(C3D.legs));
    post.position.set(side * (TABLE.halfW + 0.15), TABLE.topY + 0.17, 0);
    scene.add(post);
  });

  // Paredes laterais de vidro (seguram a bola) — azuladas no tema neon
  const glassMat = new THREE.MeshBasicMaterial({
    color: C3D.glassWall,
    transparent: true,
    opacity: 0.16,
  });
  [-1, 1].forEach((side) => {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.42, TABLE.l),
      glassMat,
    );
    wall.position.set(side * (TABLE.halfW + 0.04), TABLE.topY + 0.21, 0);
    scene.add(wall);
  });

  // Pernas
  const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.3, 8);
  [
    [TABLE.halfW - 0.4, TABLE.halfL - 0.5],
    [-(TABLE.halfW - 0.4), TABLE.halfL - 0.5],
    [TABLE.halfW - 0.4, -(TABLE.halfL - 0.5)],
    [-(TABLE.halfW - 0.4), -(TABLE.halfL - 0.5)],
  ].forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeo, lambert(C3D.legs));
    leg.position.set(x, -0.72, z);
    scene.add(leg);
  });
}
