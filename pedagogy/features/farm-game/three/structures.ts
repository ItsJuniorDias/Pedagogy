// features/farm-game/three/structures.ts
import * as THREE from "three";

import type { StructureId } from "../types";
import { COW_ROT_Y, createCow } from "./cowModel";
import { createDog, DOG_ROT_Y } from "./dogModel";

// ─── Modelos 3D das construções (low-poly "realista") ────────────────────────
// Mesma pegada do solo/grama: MeshStandardMaterial (PBR) reagindo às mesmas
// luzes, com sombra. Cada builder devolve um Group com a BASE em y=0 — a cena
// posiciona no chão. Construídas uma única vez (quando compradas) → custo ok.

const MATS = new Map<string, THREE.MeshStandardMaterial>();
function mat(
  color: number,
  rough = 0.92,
  metal = 0,
): THREE.MeshStandardMaterial {
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

// ─── Animação ────────────────────────────────────────────────────────────────
// Uma construção pode expor `group.userData.tick(t, dt)` — o loop de render o
// chama a cada frame (t em segundos). As partes que se movem ficam dentro de um
// "pivô" (Group) pra girarem em torno da BASE (pescoço, garupa…), não do centro
// da geometria. Tudo é construído uma vez, então o custo por frame é só o sin().
type Tick = (t: number, dt: number) => void;

/** Group-pivô numa âncora do mundo; reparenta os meshes p/ coords locais dela. */
function pivotAt(
  x: number,
  y: number,
  z: number,
  ...parts: THREE.Object3D[]
): THREE.Group {
  const p = new THREE.Group();
  p.position.set(x, y, z);
  for (const o of parts) {
    o.position.set(o.position.x - x, o.position.y - y, o.position.z - z);
    p.add(o);
  }
  return p;
}

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

  // cabeça (+ focinho/olhos/orelhas) num pivô no pescoço → olha em volta e arfa
  const head = sph(0.14, fur);
  head.position.set(0, 0.34, 0.22);
  const snout = box(0.1, 0.08, 0.11, furDark);
  snout.position.set(0, 0.3, 0.34);
  const nose = sph(0.03, 0x1a1a1a);
  nose.position.set(0, 0.32, 0.41);
  const headParts: THREE.Object3D[] = [head, snout, nose];
  for (const sx of [-1, 1]) {
    const eye = sph(0.022, 0x1a1a1a);
    eye.position.set(0.06 * sx, 0.38, 0.32);
    const ear = sph(0.06, furDark);
    ear.scale.set(0.55, 1.25, 0.4);
    ear.position.set(0.12 * sx, 0.36, 0.18);
    headParts.push(eye, ear);
  }
  const headPivot = pivotAt(0, 0.26, 0.12, ...headParts);
  g.add(headPivot);

  // patas dianteiras (cão sentado) — ficam fixas no corpo
  for (const sx of [-1, 1]) {
    const legF = cyl(0.04, 0.04, 0.2, fur);
    legF.position.set(0.08 * sx, 0.1, 0.33);
    g.add(legF);
  }

  // rabo num pivô na base (junto ao corpo) → abana de um lado pro outro
  const tail = cyl(0.03, 0.02, 0.2, fur, 6);
  tail.position.set(0, 0.3, -0.22);
  tail.rotation.x = -0.9;
  const tailPivot = pivotAt(0, 0.235, -0.14, tail);
  g.add(tailPivot);

  g.userData.tick = ((t: number) => {
    tailPivot.rotation.y = 0.6 * Math.sin(t * 8); // abanada feliz e rápida
    headPivot.rotation.y = 0.2 * Math.sin(t * 0.9); // olhando em volta
    headPivot.rotation.x = 0.05 * Math.sin(t * 2.4); // leve arfada
    headPivot.rotation.z = 0.1 * Math.sin(t * 0.37); // cabecinha curiosa
    const br = 1 + 0.03 * Math.sin(t * 2.2); // respiração
    body.scale.set(1.1 * br, 1.0 * br, 1.45);
  }) as Tick;

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

  // 🦊 o "cachorro" agora é um modelo low-poly animado (raposa CC0). O GLB
  // carrega de forma assíncrona: o canil já aparece e o bicho entra quando o
  // modelo termina de carregar, com o AnimationMixer tocando o idle. Se o load
  // falhar, cai no cachorro procedural antigo — o canil nunca fica vazio.
  let tickFn: Tick = () => {};
  g.userData.tick = ((t: number, dt: number) => tickFn(t, dt)) as Tick;

  createDog()
    .then(({ group, mixer }) => {
      group.position.set(-0.05, 0, 1.0);
      group.rotation.y = DOG_ROT_Y;
      g.add(group);
      tickFn = (_t, dt) => mixer.update(dt); // anima o esqueleto
    })
    .catch(() => {
      const dog = buildDog(); // fallback procedural
      dog.position.set(-0.18, 0, 0.95);
      dog.rotation.y = -0.25;
      g.add(dog);
      tickFn = dog.userData.tick as Tick;
    });

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

  // cabeça (+ focinho/olhos/orelhas/chifres) num pivô no pescoço → pasta e mastiga
  const head = sph(0.2, white, 0.8);
  head.position.set(0, 0.62, 0.52);
  const snout = box(0.19, 0.15, 0.13, pink);
  snout.position.set(0, 0.55, 0.64);
  const headParts: THREE.Object3D[] = [head, snout];
  for (const sx of [-1, 1]) {
    const nostril = sph(0.022, 0x6b4a4f);
    nostril.position.set(0.05 * sx, 0.54, 0.71);
    const eye = sph(0.035, 0x1a1a1a);
    eye.position.set(0.09 * sx, 0.7, 0.58);
    const ear = sph(0.07, white, 0.85);
    ear.scale.set(0.5, 0.9, 1.1);
    ear.position.set(0.21 * sx, 0.66, 0.46);
    const horn = cone(0.04, 0.12, 0xe8e0cf);
    horn.position.set(0.09 * sx, 0.8, 0.5);
    horn.rotation.z = -0.3 * sx;
    headParts.push(nostril, eye, ear, horn);
  }
  const headPivot = pivotAt(0, 0.5, 0.3, ...headParts);
  g.add(headPivot);

  // pernas com casco escuro (fixas no corpo)
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

  // rabo + tufo num pivô na garupa → balança como pêndulo, enxotando moscas
  const tail = cyl(0.03, 0.02, 0.5, white, 6);
  tail.position.set(0, 0.5, -0.72);
  tail.rotation.x = 0.5;
  const tuft = sph(0.05, spot);
  tuft.position.set(0, 0.27, -0.86);
  const tailPivot = pivotAt(0, 0.72, -0.6, tail, tuft);
  g.add(tailPivot);

  g.userData.tick = ((t: number) => {
    // pasto: de tempos em tempos abaixa a cabeça; de cabeça erguida, mastiga
    const graze = Math.max(0, Math.sin(t * 0.4)) ** 3;
    const chew = (1 - graze) * 0.025 * Math.sin(t * 7);
    headPivot.rotation.x = 0.95 * graze + chew;
    headPivot.rotation.y = 0.06 * Math.sin(t * 0.5);
    // rabo: pêndulo lento + flick ocasional
    tailPivot.rotation.z = 0.22 * Math.sin(t * 1.1) + 0.12 * Math.sin(t * 0.43);
    tailPivot.rotation.x = 0.06 * Math.sin(t * 2.0);
    const br = 1 + 0.025 * Math.sin(t * 1.6); // respiração
    body.scale.set(1.2 * br, 1.0 * br, 1.7);
  }) as Tick;

  return g;
}

/** Cercadinho retangular de madeira (postes + 2 trilhos) com portão no lado +z. */
function buildPaddockFence(
  width: number,
  depth: number,
  gateW: number,
): THREE.Group {
  const g = new THREE.Group();
  const woodPost = 0x7a5230;
  const woodRail = 0x9c6f47;
  const PH = 0.55;
  const PW = 0.09;
  const railH = [0.22, 0.44];
  const hw = width / 2;
  const hd = depth / 2;

  const post = (x: number, z: number) => {
    const p = box(PW, PH, PW, woodPost, 0.9);
    p.position.set(x, PH / 2, z);
    g.add(p);
  };
  const rail = (ax: number, az: number, bx: number, bz: number) => {
    const len = Math.hypot(bx - ax, bz - az);
    const ang = Math.atan2(bz - az, bx - ax);
    for (const y of railH) {
      const r = box(len, 0.06, 0.035, woodRail, 0.85);
      r.position.set((ax + bx) / 2, y, (az + bz) / 2);
      r.rotation.y = -ang;
      g.add(r);
    }
  };

  // postes: 4 cantos + meio das laterais/fundo + 2 batentes do portão
  post(-hw, -hd);
  post(hw, -hd);
  post(-hw, hd);
  post(hw, hd);
  post(0, -hd);
  post(-hw, 0);
  post(hw, 0);
  post(-gateW / 2, hd);
  post(gateW / 2, hd);

  // trilhos: fundo + laterais inteiros; frente (+z) com o vão do portão no meio
  rail(-hw, -hd, hw, -hd);
  rail(-hw, -hd, -hw, hd);
  rail(hw, -hd, hw, hd);
  rail(-hw, hd, -gateW / 2, hd);
  rail(gateW / 2, hd, hw, hd);

  return g;
}

function buildBarn(): THREE.Group {
  const g = new THREE.Group();
  const red = 0xa6231f;
  const roofC = 0x3a3a42;
  const trim = 0xf5f5f5;
  const cream = 0xe8e0cf;
  const stone = 0x9e958a;
  const W = 2.3;
  const H = 1.5;
  const D = 1.8;
  const baseY = 0.2; // topo da fundação
  const topY = baseY + H; // topo das paredes

  // fundação de pedra
  const found = box(W + 0.16, baseY, D + 0.16, stone, 0.95);
  found.position.y = baseY / 2;
  g.add(found);

  // corpo
  const body = box(W, H, D, red, 0.95);
  body.position.y = baseY + H / 2;
  g.add(body);

  // empenas + telhado
  for (const sz of [-1, 1]) {
    const end = gableEnd(W, 0.8, red);
    end.position.set(0, topY, (D / 2) * sz);
    g.add(end);
  }
  const roof = gableRoof(W + 0.22, D + 0.16, 0.8, roofC, 0.16);
  roof.position.y = topY;
  g.add(roof);

  // batentes brancos nas quinas
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const post = box(0.09, H, 0.09, trim, 0.85);
      post.position.set(
        (W / 2 - 0.02) * sx,
        baseY + H / 2,
        (D / 2 - 0.02) * sz,
      );
      g.add(post);
    }

  // portões duplos com "X" branco
  for (const sx of [-1, 1]) {
    const door = box(0.86, 1.12, 0.06, cream, 0.9);
    door.position.set(0.46 * sx, baseY + 0.56, D / 2 + 0.02);
    g.add(door);
    const diag = Math.atan2(1.1, 0.84);
    for (const s of [-1, 1]) {
      const batten = box(0.06, 1.4, 0.04, trim, 0.85);
      batten.position.set(0.46 * sx, baseY + 0.56, D / 2 + 0.06);
      batten.rotation.z = diag * s;
      g.add(batten);
    }
  }
  const lintel = box(1.9, 0.1, 0.07, trim, 0.85);
  lintel.position.set(0, baseY + 1.16, D / 2 + 0.04);
  g.add(lintel);

  // janelinha do sótão na empena
  const loft = box(0.42, 0.42, 0.06, 0x5e3c1d);
  loft.position.set(0, baseY + 1.28, D / 2 + 0.03);
  g.add(loft);
  const lh = box(0.42, 0.05, 0.07, trim, 0.85);
  lh.position.set(0, baseY + 1.28, D / 2 + 0.05);
  g.add(lh);
  const lv = box(0.05, 0.42, 0.07, trim, 0.85);
  lv.position.set(0, baseY + 1.28, D / 2 + 0.05);
  g.add(lv);

  // cupola + cata-vento na cumeeira
  const cupBody = box(0.32, 0.3, 0.32, trim, 0.85);
  cupBody.position.set(0, topY + 0.85, 0);
  g.add(cupBody);
  const cupRoof = cone(0.27, 0.24, roofC, 4);
  cupRoof.position.set(0, topY + 1.12, 0);
  cupRoof.rotation.y = Math.PI / 4;
  g.add(cupRoof);
  const vane = cyl(0.012, 0.012, 0.2, 0x222222, 6);
  vane.position.set(0, topY + 1.32, 0);
  g.add(vane);

  // 🥫 silo ao lado (cilindro metálico + cúpula + anéis) → cara de fazenda
  const siloX = -(W / 2) - 0.62;
  const siloZ = -0.15;
  const siloR = 0.5;
  const siloH = 1.95;
  const siloBody = cyl(siloR, siloR, siloH, 0xcfcabf, 18, 0.6);
  siloBody.position.set(siloX, siloH / 2, siloZ);
  g.add(siloBody);
  const dome = sph(siloR, 0xb4afa6, 0.5);
  dome.scale.set(1, 0.55, 1);
  dome.position.set(siloX, siloH, siloZ);
  g.add(dome);
  for (const ry of [0.45, 0.95, 1.45]) {
    const ring = cyl(siloR + 0.02, siloR + 0.02, 0.05, 0x9a958c, 18, 0.7);
    ring.position.set(siloX, ry, siloZ);
    g.add(ring);
  }

  // 🐮 paddock cercado na frente (+z), com a vaquinha dentro
  const padW = 2.6;
  const padD = 2.2;
  const padZ = D / 2 + padD / 2 + 0.05; // borda de trás logo à frente do celeiro
  const fence = buildPaddockFence(padW, padD, 0.8);
  fence.position.set(0, 0, padZ);
  g.add(fence);

  // a vaca entra de forma assíncrona (igual à raposa). Fallback: vaca procedural.
  let tickFn: Tick = () => {};
  g.userData.tick = ((t: number, dt: number) => tickFn(t, dt)) as Tick;
  createCow()
    .then(({ group, update }) => {
      group.position.set(0, 0, padZ + 0.1);
      group.rotation.y = COW_ROT_Y; // encara o portão / centro
      g.add(group);
      tickFn = (_t, dt) => update(dt);
    })
    .catch(() => {
      const cow = buildCow(); // fallback procedural
      cow.position.set(0, 0, padZ);
      g.add(cow);
      tickFn = cow.userData.tick as Tick;
    });

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

  // abelhas — cada uma (corpo + faixa) num grupinho que paira perto da entrada
  const beeHomes: [number, number, number][] = [
    [0.18, 0.55, 0.45],
    [-0.1, 0.7, 0.4],
    [0.05, 0.45, 0.5],
    [0.3, 0.62, 0.2],
  ];
  const bees = beeHomes.map(([hx, hy, hz], i) => {
    const bee = new THREE.Group();
    const bd = sph(0.035, 0xf6c615, 0.6);
    bd.scale.set(1.2, 1, 1);
    const band = sph(0.037, 0x222222, 0.6);
    band.scale.set(0.5, 1.05, 1.05);
    bee.add(bd, band);
    bee.position.set(hx, hy, hz);
    g.add(bee);
    return {
      bee,
      hx,
      hy,
      hz,
      ph: i * 1.7, // fase única → cada uma voa diferente
      sp: 1.6 + i * 0.25, // velocidade da órbita
      r: 0.13 + (i % 2) * 0.05, // raio da órbita
    };
  });

  // pote de mel ao lado
  const jar = cyl(0.12, 0.11, 0.22, 0xd98a1f, 14, 0.4);
  jar.position.set(0.6, 0.42, 0.3);
  g.add(jar);
  const jarLid = cyl(0.13, 0.13, 0.05, 0x7a5a34, 14);
  jarLid.position.set(0.6, 0.55, 0.3);
  g.add(jarLid);

  g.userData.tick = ((t: number) => {
    for (const b of bees) {
      const a = t * b.sp + b.ph;
      b.bee.position.set(
        b.hx + b.r * Math.cos(a) + 0.03 * Math.sin(t * 22 + b.ph), // + zumbido
        b.hy + 0.1 * Math.sin(a * 1.7) + 0.02 * Math.sin(t * 30 + b.ph),
        b.hz + b.r * Math.sin(a * 1.3),
      );
      b.bee.rotation.y = -a; // aponta o corpo na direção do voo (aprox.)
    }
  }) as Tick;

  return g;
}

// ─── 🏡 Casa do fazendeiro ───────────────────────────────────────────────────

function buildFarmhouse(): THREE.Group {
  const g = new THREE.Group();
  const wall = 0xf3e9d6; // reboco creme
  const trim = 0xffffff;
  const roofC = 0x8f4a36; // telha terracota
  const woodDoor = 0x6b4423;
  const stone = 0x9e958a;
  const glassC = 0xbfe3f2;
  const W = 2.4;
  const H = 1.5;
  const D = 2.0;
  const baseY = 0.18; // topo da fundação (onde as paredes começam)
  const topY = baseY + H; // topo das paredes
  const fz = D / 2; // plano da frente (+z)

  // fundação de pedra
  const found = box(W + 0.16, 0.18, D + 0.16, stone, 0.95);
  found.position.y = 0.09;
  g.add(found);

  // corpo
  const body = box(W, H, D, wall, 0.9);
  body.position.y = baseY + H / 2;
  g.add(body);

  // empenas sob o telhado
  for (const sz of [-1, 1]) {
    const end = gableEnd(W, 0.9, wall);
    end.position.set(0, topY, (D / 2) * sz);
    g.add(end);
  }

  // telhado
  const roof = gableRoof(W + 0.22, D + 0.18, 0.9, roofC, 0.16);
  roof.position.y = topY;
  g.add(roof);

  // chaminé de tijolo + fumacinha
  const chimney = box(0.3, 0.7, 0.3, 0x9b4a3a, 0.95);
  chimney.position.set(-0.7, topY + 0.55, -0.3);
  g.add(chimney);
  const chimCap = box(0.38, 0.08, 0.38, stone, 0.9);
  chimCap.position.set(-0.7, topY + 0.92, -0.3);
  g.add(chimCap);
  const smokeX = -0.7;
  const smokeZ = -0.3;
  const smokeY0 = topY + 0.95; // logo acima da tampa da chaminé
  const RISE = 1.15; // o quanto sobe ao longo da vida
  const DRIFT = 0.45; // deriva lateral com o "vento"
  const puffs = Array.from({ length: 6 }, (_, i) => {
    const m = new THREE.MeshStandardMaterial({
      color: 0xdfe2e6,
      roughness: 1,
      transparent: true,
      opacity: 0,
    });
    const puff = msh(new THREE.SphereGeometry(0.12, 10, 8), m);
    puff.castShadow = false;
    puff.receiveShadow = false;
    puff.position.set(smokeX, smokeY0, smokeZ);
    g.add(puff);
    return { puff, m, phase: i / 6 }; // fases espaçadas → fluxo contínuo
  });
  g.userData.tick = ((t: number) => {
    for (const { puff, m, phase } of puffs) {
      const u = (t * 0.16 + phase) % 1; // vida 0→1 (sobe, expande, some)
      puff.position.set(
        smokeX + DRIFT * u + 0.05 * Math.sin(t * 1.4 + phase * 6),
        smokeY0 + RISE * u,
        smokeZ + 0.04 * Math.sin(t * 1.1 + phase * 6),
      );
      puff.scale.setScalar(0.6 + 1.6 * u); // dilata ao subir
      m.opacity = Math.min(u * 6, 1) * (1 - u) * 0.6; // surge rápido, some no fim
    }
  }) as Tick;

  // porta + moldura + degrau
  const doorFrame = box(0.62, 0.92, 0.06, trim, 0.85);
  doorFrame.position.set(0, baseY + 0.46, fz + 0.01);
  g.add(doorFrame);
  const door = box(0.5, 0.82, 0.06, woodDoor, 0.8);
  door.position.set(0, baseY + 0.41, fz + 0.04);
  g.add(door);
  const knob = sph(0.03, 0xd4af37, 0.4);
  knob.position.set(0.17, baseY + 0.41, fz + 0.08);
  g.add(knob);
  const step = box(0.8, 0.1, 0.3, stone, 0.95);
  step.position.set(0, baseY + 0.05, fz + 0.18);
  g.add(step);

  // alpendre sobre a porta (telhadinho + dois pilares)
  for (const sx of [-1, 1]) {
    const post = cyl(0.04, 0.04, 0.92, woodDoor, 8);
    post.position.set(0.34 * sx, baseY + 0.46, fz + 0.28);
    g.add(post);
  }
  const porch = box(0.92, 0.07, 0.52, roofC, 0.8);
  porch.position.set(0, baseY + 0.95, fz + 0.2);
  g.add(porch);

  // duas janelas com vidro, cruzeta e venezianas
  for (const sx of [-1, 1]) {
    const wx = 0.78 * sx;
    const wy = baseY + 0.85;
    const frame = box(0.5, 0.5, 0.05, trim, 0.85);
    frame.position.set(wx, wy, fz + 0.01);
    g.add(frame);
    const pane = box(0.4, 0.4, 0.04, glassC, 0.25);
    pane.position.set(wx, wy, fz + 0.03);
    g.add(pane);
    const mh = box(0.42, 0.04, 0.05, trim, 0.85);
    mh.position.set(wx, wy, fz + 0.05);
    g.add(mh);
    const mv = box(0.04, 0.42, 0.05, trim, 0.85);
    mv.position.set(wx, wy, fz + 0.05);
    g.add(mv);
    for (const s of [-1, 1]) {
      const shutter = box(0.12, 0.5, 0.04, 0x4f7a52, 0.85);
      shutter.position.set(wx + 0.31 * s, wy, fz + 0.02);
      g.add(shutter);
    }
  }

  // floreira sob a janela direita
  const fbx = 0.78;
  const fbY = baseY + 0.55;
  const fbox = box(0.5, 0.1, 0.12, woodDoor, 0.85);
  fbox.position.set(fbx, fbY, fz + 0.08);
  g.add(fbox);
  const flowerCols = [0xff6b6b, 0xffd93d, 0xff8fc7];
  [-0.15, 0, 0.15].forEach((ox, i) => {
    const fl = sph(0.05, flowerCols[i], 0.7);
    fl.position.set(fbx + ox, fbY + 0.09, fz + 0.08);
    g.add(fl);
  });

  return g;
}

// ─── Registro ─────────────────────────────────────────────────────────────────

const BUILDERS: Record<StructureId, () => THREE.Group> = {
  doghouse: buildDoghouse,
  farmhouse: buildFarmhouse,
  barn: buildBarn,
  beehive: buildBeehive,
};

/** Roda a construção pra encarar o centro da fazenda (a frente fica visível). */
const FACE_Y: Record<StructureId, number> = {
  doghouse: Math.PI * 0.5, // canto "up" (-x,-z)
  farmhouse: Math.PI * 0.25, // canto "left" (-x,+z)
  // O +z do celeiro (portas + cercado + vaca) tem que encarar a câmera, senão
  // o cercado fica ATRÁS. Câmera ortográfica olha de (+x,+z) → 0.25π = de frente.
  barn: Math.PI * 0.25, // encara a câmera (cercado/vaca na frente)
  beehive: Math.PI * 0.5, // canto "down" (+x,+z)
};

export function buildStructure(id: StructureId): THREE.Group {
  const g = BUILDERS[id]();
  g.rotation.y = FACE_Y[id];
  return g;
}
