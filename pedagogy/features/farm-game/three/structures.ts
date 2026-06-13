// features/farm-game/three/structures.ts
import * as THREE from "three";

import type { StructureId } from "../types";

// ─── Modelos 3D das construções (low-poly "realista") ────────────────────────
// Mesma pegada do solo/grama: MeshStandardMaterial (PBR) reagindo às mesmas
// luzes, com sombra. Cada builder devolve um Group com a BASE em y=0 — a cena
// posiciona no chão. Construídas uma única vez (quando compradas) → custo ok.

const MATS = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: number, rough = 0.92, metal = 0): THREE.MeshStandardMaterial {
  const key = `${color}|${rough}|${metal}`;
  let m = MATS.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: rough,
      metalness: metal,
    });
    MATS.set(key, m);
  }
  return m;
}

function msh(geo: THREE.BufferGeometry, m: THREE.Material): THREE.Mesh {
  const o = new THREE.Mesh(geo, m);
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
}
const box = (w: number, h: number, d: number, c: number, r = 0.92) =>
  msh(new THREE.BoxGeometry(w, h, d), mat(c, r));
const cyl = (rt: number, rb: number, h: number, c: number, seg = 12, r = 0.9) =>
  msh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c, r));
const sph = (rad: number, c: number, r = 0.85) =>
  msh(new THREE.SphereGeometry(rad, 14, 12), mat(c, r));
const cone = (rad: number, h: number, c: number, seg = 10) =>
  msh(new THREE.ConeGeometry(rad, h, seg), mat(c));

/** Telhado de duas águas: duas placas que se encontram na cumeeira (y=height). */
function gableRoof(
  width: number,
  depth: number,
  height: number,
  color: number,
  overhang = 0.12,
): THREE.Group {
  const g = new THREE.Group();
  const slope = Math.hypot(width / 2, height);
  const angle = Math.atan2(height, width / 2);
  const t = 0.07;
  const len = slope + overhang;
  const dep = depth + overhang * 2;
  const right = box(len, t, dep, color, 0.8);
  right.position.set(width / 4, height / 2, 0);
  right.rotation.z = -angle;
  const left = box(len, t, dep, color, 0.8);
  left.position.set(-width / 4, height / 2, 0);
  left.rotation.z = angle;
  g.add(right, left);
  return g;
}

/** Empena (triângulo fino) que tapa o vão sob o telhado, na cor da parede. */
function gableEnd(width: number, height: number, color: number): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, height);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.06,
    bevelEnabled: false,
  });
  geo.translate(0, 0, -0.03);
  return msh(geo, mat(color));
}

// ─── 🐶 Doghouse + cachorro ──────────────────────────────────────────────────

function buildDog(): THREE.Group {
  const g = new THREE.Group();
  const fur = 0x8d5a2b;
  const furDark = 0x6f4520;

  const body = sph(0.18, fur);
  body.scale.set(1.1, 1.0, 1.45);
  body.position.y = 0.2;
  g.add(body);

  const head = sph(0.14, fur);
  head.position.set(0, 0.34, 0.22);
  g.add(head);

  const snout = box(0.1, 0.08, 0.11, furDark);
  snout.position.set(0, 0.3, 0.34);
  g.add(snout);
  const nose = sph(0.03, 0x1a1a1a);
  nose.position.set(0, 0.32, 0.41);
  g.add(nose);

  for (const sx of [-1, 1]) {
    const eye = sph(0.022, 0x1a1a1a);
    eye.position.set(0.06 * sx, 0.38, 0.32);
    g.add(eye);
    const ear = sph(0.06, furDark);
    ear.scale.set(0.55, 1.25, 0.4);
    ear.position.set(0.12 * sx, 0.36, 0.18);
    g.add(ear);
    const legF = cyl(0.04, 0.04, 0.2, fur);
    legF.position.set(0.08 * sx, 0.1, 0.33);
    g.add(legF);
  }

  const tail = cyl(0.03, 0.02, 0.2, fur, 6);
  tail.position.set(0, 0.3, -0.22);
  tail.rotation.x = -0.9;
  g.add(tail);

  return g;
}

function buildDoghouse(): THREE.Group {
  const g = new THREE.Group();
  const wood = 0x9c6f47;
  const roofC = 0xb5462f;
  const W = 1.0;
  const H = 0.75;
  const D = 1.1;

  const body = box(W, H, D, wood, 0.95);
  body.position.y = H / 2;
  g.add(body);

  for (const sz of [-1, 1]) {
    const end = gableEnd(W, 0.42, wood);
    end.position.set(0, H, (D / 2) * sz);
    g.add(end);
  }

  const roof = gableRoof(W + 0.14, D + 0.1, 0.42, roofC);
  roof.position.y = H;
  g.add(roof);

  // entrada arqueada (caixa escura + topo arredondado)
  const dark = 0x241a12;
  const door = box(0.42, 0.46, 0.06, dark);
  door.position.set(0, 0.25, D / 2 + 0.01);
  g.add(door);
  const arch = cyl(0.21, 0.21, 0.06, dark, 14);
  arch.rotation.x = Math.PI / 2;
  arch.position.set(0, 0.48, D / 2 + 0.01);
  g.add(arch);

  // tigela de comida
  const bowl = cyl(0.12, 0.1, 0.07, 0xd9472f, 12);
  bowl.position.set(0.52, 0.035, 0.55);
  g.add(bowl);

  // o cachorro, sentado na frente
  const dog = buildDog();
  dog.position.set(-0.18, 0, 0.95);
  dog.rotation.y = -0.25;
  g.add(dog);

  return g;
}

// ─── 🐮 Celeiro + vaca ───────────────────────────────────────────────────────

function buildCow(): THREE.Group {
  const g = new THREE.Group();
  const white = 0xf5f5f5;
  const spot = 0x2b2b2b;
  const pink = 0xf3b6c2;

  const body = sph(0.3, white, 0.8);
  body.scale.set(1.2, 1.0, 1.7);
  body.position.y = 0.55;
  g.add(body);

  // manchas
  const spots: [number, number, number, number][] = [
    [0.18, 0.66, 0.2, 0.13],
    [-0.2, 0.6, -0.15, 0.15],
    [0.05, 0.74, -0.35, 0.11],
    [-0.12, 0.5, 0.4, 0.1],
  ];
  spots.forEach(([x, y, z, r]) => {
    const s = sph(r, spot, 0.85);
    s.scale.set(1, 0.4, 1.3);
    s.position.set(x, y, z);
    g.add(s);
  });

  const head = sph(0.2, white, 0.8);
  head.position.set(0, 0.62, 0.52);
  g.add(head);
  const snout = box(0.19, 0.15, 0.13, pink);
  snout.position.set(0, 0.55, 0.64);
  g.add(snout);
  for (const sx of [-1, 1]) {
    const nostril = sph(0.022, 0x6b4a4f);
    nostril.position.set(0.05 * sx, 0.54, 0.71);
    g.add(nostril);
    const eye = sph(0.035, 0x1a1a1a);
    eye.position.set(0.09 * sx, 0.7, 0.58);
    g.add(eye);
    const ear = sph(0.07, white, 0.85);
    ear.scale.set(0.5, 0.9, 1.1);
    ear.position.set(0.21 * sx, 0.66, 0.46);
    g.add(ear);
    const horn = cone(0.04, 0.12, 0xe8e0cf);
    horn.position.set(0.09 * sx, 0.8, 0.5);
    horn.rotation.z = -0.3 * sx;
    g.add(horn);
  }

  // pernas com casco escuro
  const legPos: [number, number][] = [
    [0.18, 0.45],
    [-0.18, 0.45],
    [0.18, -0.45],
    [-0.18, -0.45],
  ];
  legPos.forEach(([x, z]) => {
    const leg = cyl(0.07, 0.06, 0.5, white, 8);
    leg.position.set(x, 0.25, z);
    g.add(leg);
    const hoof = cyl(0.075, 0.075, 0.09, 0x2b2b2b, 8);
    hoof.position.set(x, 0.045, z);
    g.add(hoof);
  });

  const udder = sph(0.12, pink, 0.8);
  udder.scale.set(1.2, 0.9, 1);
  udder.position.set(0, 0.28, 0.18);
  g.add(udder);

  const tail = cyl(0.03, 0.02, 0.5, white, 6);
  tail.position.set(0, 0.5, -0.72);
  tail.rotation.x = 0.5;
  g.add(tail);
  const tuft = sph(0.05, spot);
  tuft.position.set(0, 0.27, -0.86);
  g.add(tuft);

  return g;
}

function buildBarn(): THREE.Group {
  const g = new THREE.Group();
  const red = 0xa11e1e;
  const roofC = 0x3f3f46;
  const trim = 0xf3f3f3;
  const cream = 0xe8e0cf;
  const W = 2.3;
  const H = 1.5;
  const D = 1.9;

  const body = box(W, H, D, red, 0.95);
  body.position.y = H / 2;
  g.add(body);

  for (const sz of [-1, 1]) {
    const end = gableEnd(W, 0.8, red);
    end.position.set(0, H, (D / 2) * sz);
    g.add(end);
  }

  const roof = gableRoof(W + 0.22, D + 0.16, 0.8, roofC, 0.16);
  roof.position.y = H;
  g.add(roof);

  // batentes brancos nas quinas
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const post = box(0.09, H, 0.09, trim, 0.85);
      post.position.set((W / 2 - 0.02) * sx, H / 2, (D / 2 - 0.02) * sz);
      g.add(post);
    }

  // portões duplos com "X" branco
  for (const sx of [-1, 1]) {
    const door = box(0.86, 1.12, 0.06, cream, 0.9);
    door.position.set(0.46 * sx, 0.56, D / 2 + 0.02);
    g.add(door);
    const diag = Math.atan2(1.1, 0.84);
    for (const s of [-1, 1]) {
      const batten = box(0.06, 1.4, 0.04, trim, 0.85);
      batten.position.set(0.46 * sx, 0.56, D / 2 + 0.06);
      batten.rotation.z = diag * s;
      g.add(batten);
    }
  }
  // viga branca acima dos portões
  const lintel = box(1.9, 0.1, 0.07, trim, 0.85);
  lintel.position.set(0, 1.16, D / 2 + 0.04);
  g.add(lintel);

  // janelinha do sótão na empena
  const loft = box(0.42, 0.42, 0.06, 0x5e3c1d);
  loft.position.set(0, 1.28, D / 2 + 0.03);
  g.add(loft);
  const lh = box(0.42, 0.05, 0.07, trim, 0.85);
  lh.position.set(0, 1.28, D / 2 + 0.05);
  g.add(lh);
  const lv = box(0.05, 0.42, 0.07, trim, 0.85);
  lv.position.set(0, 1.28, D / 2 + 0.05);
  g.add(lv);

  // cupola + cata-vento na cumeeira
  const cupBody = box(0.32, 0.3, 0.32, trim, 0.85);
  cupBody.position.set(0, H + 0.85, 0);
  g.add(cupBody);
  const cupRoof = cone(0.27, 0.24, roofC, 4);
  cupRoof.position.set(0, H + 1.12, 0);
  cupRoof.rotation.y = Math.PI / 4;
  g.add(cupRoof);
  const vane = cyl(0.012, 0.012, 0.2, 0x222222, 6);
  vane.position.set(0, H + 1.32, 0);
  g.add(vane);

  // a vaca, na frente do celeiro
  const cow = buildCow();
  cow.position.set(0.1, 0, 1.35);
  cow.rotation.y = -0.4;
  g.add(cow);

  return g;
}

// ─── 🐝 Colmeia (caixa de abelha) + abelhas ──────────────────────────────────

function buildBeehive(): THREE.Group {
  const g = new THREE.Group();
  const honey = [0xd2a24c, 0xc8983f, 0xcea052];
  const woodDark = 0x6f4f2a;
  const seamC = 0x5a4327;

  // suporte
  for (const sx of [-1, 1]) {
    const leg = box(0.1, 0.3, 0.1, woodDark, 0.9);
    leg.position.set(0.26 * sx, 0.15, 0);
    g.add(leg);
  }
  const baseBoard = box(0.82, 0.06, 0.72, 0x7a5a34, 0.9);
  baseBoard.position.y = 0.31;
  g.add(baseBoard);

  // caixas empilhadas (supers)
  const boxH = 0.28;
  let y = 0.34;
  for (let i = 0; i < 3; i++) {
    const sup = box(0.7, boxH, 0.6, honey[i % honey.length], 0.85);
    sup.position.y = y + boxH / 2;
    g.add(sup);
    const seam = box(0.72, 0.03, 0.62, seamC, 0.9);
    seam.position.y = y;
    g.add(seam);
    y += boxH;
  }

  // entrada + prancha de pouso
  const entrance = box(0.42, 0.05, 0.04, 0x241a12);
  entrance.position.set(0, 0.4, 0.31);
  g.add(entrance);
  const landing = box(0.5, 0.03, 0.13, 0x7a5a34, 0.9);
  landing.position.set(0, 0.37, 0.37);
  g.add(landing);

  // tampa telescópica (madeira + chapa metálica)
  const lid = box(0.8, 0.08, 0.7, 0xb98a4a, 0.85);
  lid.position.y = y + 0.04;
  g.add(lid);
  const cap = box(0.78, 0.03, 0.68, 0x9aa0a6, 0.4);
  cap.position.y = y + 0.095;
  g.add(cap);

  // abelhas
  const beeSpots: [number, number, number][] = [
    [0.18, 0.55, 0.45],
    [-0.1, 0.7, 0.4],
    [0.05, 0.45, 0.5],
    [0.3, 0.62, 0.2],
  ];
  beeSpots.forEach(([x, by, z]) => {
    const bee = sph(0.035, 0xf6c615, 0.6);
    bee.scale.set(1.2, 1, 1);
    bee.position.set(x, by, z);
    g.add(bee);
    const band = sph(0.037, 0x222222, 0.6);
    band.scale.set(0.5, 1.05, 1.05);
    band.position.set(x, by, z);
    g.add(band);
  });

  // pote de mel ao lado
  const jar = cyl(0.12, 0.11, 0.22, 0xd98a1f, 14, 0.4);
  jar.position.set(0.6, 0.42, 0.3);
  g.add(jar);
  const jarLid = cyl(0.13, 0.13, 0.05, 0x7a5a34, 14);
  jarLid.position.set(0.6, 0.55, 0.3);
  g.add(jarLid);

  return g;
}

// ─── Registro ─────────────────────────────────────────────────────────────────

const BUILDERS: Record<StructureId, () => THREE.Group> = {
  doghouse: buildDoghouse,
  barn: buildBarn,
  beehive: buildBeehive,
};

/** Roda a construção pra encarar o centro da fazenda (a frente fica visível). */
const FACE_Y: Record<StructureId, number> = {
  doghouse: Math.PI * 0.75, // canto "up" (-x,-z)
  barn: Math.PI * 1.25, // canto "right" (+x,-z)
  beehive: Math.PI * 1.75, // canto "down" (+x,+z)
};

export function buildStructure(id: StructureId): THREE.Group {
  const g = BUILDERS[id]();
  g.rotation.y = FACE_Y[id];
  return g;
}
