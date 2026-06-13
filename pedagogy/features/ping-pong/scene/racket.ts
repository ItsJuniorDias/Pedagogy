/**
 * racket.ts — Raquete de verdade 🏓: lâmina com borracha colorida,
 * aro NEON brilhante e cabo de madeira.
 */

import * as THREE from "three";
import { RACKET, TABLE } from "../constants";
import { C3D } from "../theme";
import { lambert, neon } from "./materials";

export function buildRacket(
  rubberColor: number,
  edgeColor: number,
): THREE.Group {
  const g = new THREE.Group();
  const R = RACKET.r;
  const bladeY = TABLE.topY + R + 0.06; // centro da lâmina, base quase encostando na mesa

  // Lâmina: disco em pé, de frente para a mesa (normal no eixo Z)
  // Ordem dos materiais do cilindro: [lateral, tampa +Y, tampa -Y]
  // Após rotation.x = π/2 → tampa -Y vira a FACE que olha para a rede
  const blade = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, RACKET.thick, 28),
    [
      lambert(0x111827), // lateral da borracha
      lambert(C3D.rubberBack), // verso (preto)
      lambert(rubberColor), // face de borracha colorida
    ],
  );
  blade.rotation.x = Math.PI / 2;
  blade.position.y = bladeY;
  blade.castShadow = true;
  g.add(blade);

  // Aro NEON ao redor da lâmina (brilha — identidade de cada lado)
  const edge = new THREE.Mesh(
    new THREE.TorusGeometry(R, 0.03, 8, 36),
    neon(edgeColor),
  );
  edge.position.y = bladeY;
  g.add(edge);

  // Cabo de madeira, inclinado para trás (em direção a quem segura)
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.07, 0.42, 10),
    lambert(C3D.wood),
  );
  handle.position.set(0, bladeY - R - 0.13, 0.11);
  handle.rotation.x = 0.5;
  handle.castShadow = true;
  g.add(handle);

  // Anel do cabo na cor do time (detalhe)
  const grip = new THREE.Mesh(
    new THREE.TorusGeometry(0.072, 0.018, 6, 14),
    neon(edgeColor),
  );
  grip.position.set(0, bladeY - R - 0.02, 0.06);
  grip.rotation.x = Math.PI / 2 - 0.5;
  g.add(grip);

  return g;
}
