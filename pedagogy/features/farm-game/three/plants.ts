// features/farm-game/three/plants.ts
import * as THREE from "three";

import { CROPS } from "../data/crops";
import { peculiarityOf } from "../data/peculiarities";
import type { Crop, PlantVisual, Tile } from "../types";
import { GEO, STAR_GEO } from "./geometry";

// ─── Procedural plant meshes (realistic, per-crop) ───────────────────────────
// Cada cultura tem um modelo próprio e reconhecível (3 estágios).
// Geometrias e materiais ficam em nível de módulo → ~zero custo por tile.
// Os materiais respondem às mesmas luzes (Hemisphere + Directional) do solo PBR.

// ── Material caches ───────────────────────────────────────────────────────────

const MAT_LAMBERT = new Map<number, THREE.MeshLambertMaterial>();
/** Material fosco (folhas, caules, terra). */
function lam(color: number): THREE.MeshLambertMaterial {
  let m = MAT_LAMBERT.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color });
    MAT_LAMBERT.set(color, m);
  }
  return m;
}

const MAT_GLOSSY = new Map<number, THREE.MeshPhongMaterial>();
/** Material levemente brilhante para frutas — dá um specular suave e "molhado". */
function glossy(color: number, shininess = 55): THREE.MeshPhongMaterial {
  const key = color * 1000 + shininess;
  let m = MAT_GLOSSY.get(key);
  if (!m) {
    m = new THREE.MeshPhongMaterial({ color, shininess, specular: 0x2a2a2a });
    MAT_GLOSSY.set(key, m);
  }
  return m;
}

// Cristal lendário — auto-iluminado
const CRYSTAL_MAT = new THREE.MeshPhongMaterial({
  color: 0x67e8f9,
  emissive: 0x0891b2,
  shininess: 100,
  transparent: true,
  opacity: 0.9,
});

// ── Floreios de peculiaridade ("no mapa") ───────────────────────────────────
// Geometrias/materiais em nível de módulo (compartilhados, nunca mutados).
// Só algumas sementes têm accent → custo desprezível.
const ACCENT_SPARK_GEO = new THREE.OctahedronGeometry(0.03);
const ACCENT_HALO_GEO = new THREE.SphereGeometry(0.36, 12, 10);
const SPARK_MAT = new THREE.MeshBasicMaterial({ color: 0xffe066 });
const GLOW_MAT = new THREE.MeshBasicMaterial({
  color: 0x67e8f9,
  transparent: true,
  opacity: 0.14,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

// Paleta de verdes reaproveitada
const FOLIAGE = {
  sprout: 0x86efac,
  stem: 0x2e7d32,
  stemLight: 0x43a047,
  leaf: 0x43a047,
  leafLight: 0x66bb6a,
  leafDark: 0x1b5e20,
};

// ── Helper de mesh ─────────────────────────────────────────────────────────────

function pm(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ── Estágio 1 — broto (igual para todos) ───────────────────────────────────────

function buildSprout(): THREE.Group {
  const g = new THREE.Group();
  const mat = lam(FOLIAGE.sprout);
  const l1 = pm(GEO.sproutLeaf, mat);
  l1.position.set(0.035, 0.1, 0);
  l1.rotation.z = -0.35;
  const l2 = pm(GEO.sproutLeaf, mat);
  l2.position.set(-0.035, 0.08, 0);
  l2.rotation.z = 0.35;
  g.add(l1, l2);
  return g;
}

// ── Estágio 2 — planta jovem (caule + folhas, com botão da cor da fruta) ───────

function buildYoung(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const stem = pm(GEO.youngStem, lam(FOLIAGE.stem));
  stem.position.y = 0.17;
  g.add(stem);
  for (let i = 0; i < 3; i++) {
    const leaf = pm(GEO.youngLeaf, lam(FOLIAGE.leaf));
    const pivot = new THREE.Group();
    leaf.position.set(0.1, 0, 0);
    leaf.rotation.z = -1.0;
    pivot.add(leaf);
    pivot.position.y = 0.13 + i * 0.08;
    pivot.rotation.y = i * ((Math.PI * 2) / 3);
    g.add(pivot);
  }
  // botãozinho prenunciando a cor da colheita
  const bud = pm(GEO.grapeBall, lam(crop.color3d));
  bud.scale.setScalar(0.7);
  bud.position.y = 0.36;
  g.add(bud);
  return g;
}

// ── Estágio 3 — builders por cultura ───────────────────────────────────────────

function matWheat(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const stalkMat = lam(0xbfa05a);
  const golden = crop.id === "golden_wheat";
  const headMat = golden ? glossy(0xffe066, 90) : lam(crop.color3d);
  const positions: [number, number][] = [
    [0, 0],
    [0.1, 0.05],
    [-0.1, 0.04],
    [0.06, -0.1],
    [-0.07, -0.09],
    [0.12, -0.04],
  ];
  positions.forEach(([x, z], i) => {
    const lean = (i % 2 ? 1 : -1) * 0.08;
    const stalk = pm(GEO.wheatStalk, stalkMat);
    stalk.position.set(x, 0.25, z);
    stalk.rotation.z = lean;
    g.add(stalk);

    const head = pm(GEO.wheatHead, headMat);
    head.scale.set(0.7, 1.9, 0.7);
    head.position.set(x + lean * 0.4, 0.56, z);
    head.rotation.z = lean;
    g.add(head);

    for (let a = -1; a <= 1; a += 2) {
      const awn = pm(GEO.wheatAwn, stalkMat);
      awn.position.set(x + lean * 0.4 + a * 0.02, 0.66, z);
      awn.rotation.z = lean + a * 0.2;
      g.add(awn);
    }
  });
  return g;
}

function matLettuce(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const ring = (
    count: number,
    mat: THREE.Material,
    radius: number,
    scale: number,
    tilt: number,
    y: number,
    phase = 0,
  ) => {
    for (let i = 0; i < count; i++) {
      const cup = pm(GEO.leafCup, mat);
      cup.scale.set(scale, scale * 0.7, scale);
      const a = (i / count) * Math.PI * 2 + phase;
      cup.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      cup.rotation.z = Math.cos(a) * tilt;
      cup.rotation.x = -Math.sin(a) * tilt;
      g.add(cup);
    }
  };
  ring(5, lam(FOLIAGE.leafDark), 0.12, 1.05, 0.6, 0.08);
  ring(5, lam(crop.color3d), 0.07, 0.8, 0.35, 0.12, 0.4);
  const core = pm(GEO.leafCup, lam(0xbef264));
  core.scale.set(0.55, 0.6, 0.55);
  core.position.y = 0.14;
  g.add(core);
  return g;
}

function matCarrot(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  // "ombro" laranja saindo da terra (ponta enterrada)
  const root = pm(GEO.carrotRoot, glossy(crop.color3d, 30));
  root.scale.set(1, 0.7, 1);
  root.position.y = 0.05;
  g.add(root);
  // folhagem em leque (penacho)
  for (let i = 0; i < 6; i++) {
    const pivot = new THREE.Group();
    const stem = pm(GEO.frondStem, lam(FOLIAGE.leafDark));
    stem.position.y = 0.18;
    pivot.add(stem);
    for (let j = 0; j < 3; j++) {
      const lf = pm(GEO.frondLeaf, lam(FOLIAGE.leafLight));
      lf.position.set(0.03, 0.12 + j * 0.07, 0);
      lf.rotation.z = -0.8;
      pivot.add(lf);
    }
    pivot.rotation.y = i * (Math.PI / 3);
    pivot.rotation.x = 0.18;
    g.add(pivot);
  }
  return g;
}

function matPotato(_crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const leafMat = lam(FOLIAGE.leaf);
  for (let i = 0; i < 4; i++) {
    const lf = pm(GEO.leafBlade, leafMat);
    const a = i * (Math.PI / 2) + 0.4;
    lf.position.set(Math.cos(a) * 0.06, 0.18, Math.sin(a) * 0.06);
    lf.rotation.z = -0.6;
    lf.rotation.y = a;
    g.add(lf);
  }
  const top = pm(GEO.bush, leafMat);
  top.scale.set(0.7, 0.55, 0.7);
  top.position.y = 0.2;
  g.add(top);
  // tubérculos marrons visíveis na terra
  const tuberMat = glossy(0xb98a55, 18);
  const tpos: [number, number, number][] = [
    [0.13, 0.04, 0.05],
    [-0.1, 0.03, 0.1],
    [0.02, 0.03, -0.13],
  ];
  tpos.forEach(([x, y, z], i) => {
    const t = pm(GEO.tuber, tuberMat);
    t.scale.set(1, 0.8, 1.25);
    t.position.set(x, y, z);
    t.rotation.y = i;
    g.add(t);
  });
  return g;
}

function matCorn(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const stalk = pm(GEO.cornStalk, lam(0x4d7c0f));
  stalk.position.y = 0.32;
  g.add(stalk);
  for (let i = 0; i < 4; i++) {
    const lf = pm(GEO.cornLeaf, lam(FOLIAGE.leaf));
    lf.scale.set(0.5, 1, 0.3);
    lf.position.set(0, 0.3 + i * 0.08, 0);
    lf.rotation.z = i % 2 ? 1.2 : -1.2;
    lf.rotation.y = i * 1.3;
    g.add(lf);
  }
  const cobMat = glossy(crop.color3d, 40);
  const cob = pm(GEO.cob, cobMat);
  cob.position.set(0.09, 0.34, 0.02);
  cob.rotation.z = -0.18;
  g.add(cob);
  const tip = pm(GEO.cobTip, cobMat);
  tip.position.set(0.12, 0.47, 0.02);
  tip.rotation.z = -0.18;
  g.add(tip);
  const husk = pm(GEO.husk, lam(FOLIAGE.leafLight));
  husk.scale.set(0.7, 1, 0.7);
  husk.position.set(0.07, 0.3, 0.02);
  husk.rotation.z = -0.1;
  g.add(husk);
  for (let i = 0; i < 3; i++) {
    const t = pm(GEO.tassel, lam(0xd9c27a));
    t.position.set((i - 1) * 0.02, 0.66, 0);
    t.rotation.z = (i - 1) * 0.25;
    g.add(t);
  }
  return g;
}

function matTomato(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const bush = pm(GEO.bush, lam(FOLIAGE.leafDark));
  bush.scale.set(1, 0.7, 1);
  bush.position.y = 0.16;
  g.add(bush);
  for (let i = 0; i < 3; i++) {
    const lf = pm(GEO.leafBlade, lam(FOLIAGE.leaf));
    const a = i * 2.1;
    lf.position.set(Math.cos(a) * 0.18, 0.22, Math.sin(a) * 0.18);
    lf.rotation.z = -0.9;
    lf.rotation.y = a;
    g.add(lf);
  }
  const fruitMat = glossy(crop.color3d, 75);
  const fpos: [number, number, number][] = [
    [0.15, 0.18, 0.08],
    [-0.13, 0.12, 0.12],
    [0.0, 0.26, -0.14],
    [0.08, 0.1, -0.05],
  ];
  fpos.forEach(([x, y, z]) => {
    const f = pm(GEO.roundFruit, fruitMat);
    f.scale.set(1, 0.85, 1);
    f.position.set(x, y, z);
    g.add(f);
    const cx = pm(GEO.calyx, lam(FOLIAGE.stem));
    cx.position.set(x, y + 0.09, z);
    g.add(cx);
  });
  return g;
}

function matStrawberry(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const lf = pm(GEO.bush, lam(FOLIAGE.leaf));
    lf.scale.set(0.45, 0.18, 0.45);
    const a = i * ((Math.PI * 2) / 5);
    lf.position.set(Math.cos(a) * 0.14, 0.05, Math.sin(a) * 0.14);
    g.add(lf);
  }
  const berryMat = glossy(crop.color3d, 65);
  const bpos: [number, number, number][] = [
    [0.1, 0.1, 0.06],
    [-0.09, 0.09, -0.05],
    [0.02, 0.12, -0.12],
  ];
  bpos.forEach(([x, y, z]) => {
    const b = pm(GEO.berryCone, berryMat);
    b.rotation.x = Math.PI; // ponta pra baixo
    b.position.set(x, y, z);
    g.add(b);
    const crown = pm(GEO.calyx, lam(FOLIAGE.leafDark));
    crown.scale.set(1.4, 1, 1.4);
    crown.position.set(x, y + 0.09, z);
    g.add(crown);
  });
  // florzinha branca
  const fc = pm(GEO.flowerCore, lam(0xfde047));
  fc.position.set(-0.02, 0.13, 0.1);
  g.add(fc);
  for (let i = 0; i < 5; i++) {
    const p = pm(GEO.flowerPetal, lam(0xffffff));
    const a = i * ((Math.PI * 2) / 5);
    p.scale.set(1, 0.5, 1);
    p.position.set(
      -0.02 + Math.cos(a) * 0.035,
      0.13,
      0.1 + Math.sin(a) * 0.035,
    );
    g.add(p);
  }
  return g;
}

function matSunflower(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const stem = pm(GEO.sunStem, lam(FOLIAGE.stem));
  stem.position.y = 0.33;
  g.add(stem);
  for (let i = 0; i < 2; i++) {
    const lf = pm(GEO.leafBlade, lam(FOLIAGE.leaf));
    lf.scale.set(1, 1.1, 0.5);
    lf.position.set(i ? 0.1 : -0.1, 0.3, 0);
    lf.rotation.z = i ? -1.1 : 1.1;
    g.add(lf);
  }
  // cabeça da flor encarando pra cima (câmera fica no alto)
  const head = new THREE.Group();
  const petalCount = 12;
  for (let i = 0; i < petalCount; i++) {
    const a = (i / petalCount) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.rotation.y = a;
    const petal = pm(GEO.sunPetal, lam(crop.color3d));
    petal.rotation.z = -Math.PI / 2; // deita a pétala apontando pra fora
    petal.scale.set(1, 1, 0.5);
    petal.position.set(0.17, 0, 0);
    pivot.add(petal);
    head.add(pivot);
  }
  const disc = pm(GEO.sunDisc, lam(0x5b3a1a));
  disc.position.y = 0.02;
  head.add(disc);
  const seeds = pm(GEO.sunSeed, lam(0x3b2410));
  seeds.scale.set(1, 0.3, 1);
  seeds.position.y = 0.05;
  head.add(seeds);
  head.position.set(0, 0.66, 0.02);
  head.rotation.x = -0.12; // leve inclinação na direção da câmera
  g.add(head);
  return g;
}

function matStarfruit(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const lf = pm(GEO.leafBlade, lam(FOLIAGE.leaf));
    const a = i * (Math.PI / 2);
    lf.scale.set(0.7, 0.8, 0.4);
    lf.position.set(Math.cos(a) * 0.1, 0.06, Math.sin(a) * 0.1);
    lf.rotation.z = -0.8;
    lf.rotation.y = a;
    g.add(lf);
  }
  const fruitMat = glossy(crop.color3d, 75);
  const star = pm(STAR_GEO, fruitMat);
  star.scale.set(1, 1, 0.95);
  star.position.set(0.04, 0.28, 0);
  star.rotation.x = Math.PI / 2; // eixo longo na vertical → estrela vista de cima
  star.rotation.z = 0.25;
  star.rotation.y = 0.3;
  g.add(star);
  const star2 = pm(STAR_GEO, fruitMat);
  star2.scale.setScalar(0.55);
  star2.position.set(-0.12, 0.14, 0.08);
  star2.rotation.x = Math.PI / 2;
  star2.rotation.z = -0.4;
  g.add(star2);
  return g;
}

function matPumpkin(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const body = glossy(crop.color3d, 35);
  // lobos formam as "costelas" da abóbora
  const center = pm(GEO.pumpkinLobe, body);
  center.scale.set(1.5, 1.0, 1.5);
  center.position.y = 0.13;
  g.add(center);
  const lobes = 6;
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const lobe = pm(GEO.pumpkinLobe, body);
    lobe.scale.set(0.55, 1.05, 1.0);
    lobe.position.set(Math.cos(a) * 0.13, 0.13, Math.sin(a) * 0.13);
    lobe.rotation.y = -a;
    g.add(lobe);
  }
  const stem = pm(GEO.pumpkinStem, lam(0x4d7c0f));
  stem.position.y = 0.27;
  stem.rotation.z = 0.2;
  g.add(stem);
  return g;
}

function matWatermelon(_crop: Crop): THREE.Group {
  const g = new THREE.Group();
  // casca verde-clara (cor fixa: o color3d do catálogo é escuro demais p/ casca)
  const body = pm(GEO.melonBody, glossy(0x4d9e4f, 28));
  body.scale.set(1.05, 0.92, 1.05);
  body.position.y = 0.2;
  g.add(body);
  // listras escuras (anéis verticais; metade interna some dentro do corpo)
  const stripeMat = lam(0x14532d);
  for (let i = 0; i < 6; i++) {
    const stripe = pm(GEO.melonStripe, stripeMat);
    stripe.scale.set(1.05, 0.92, 1.05);
    stripe.position.y = 0.2;
    stripe.rotation.y = (i / 6) * Math.PI;
    g.add(stripe);
  }
  const vine = pm(GEO.vine, lam(FOLIAGE.stem));
  vine.position.set(0.05, 0.42, 0);
  vine.rotation.x = 0.6;
  g.add(vine);
  return g;
}

function matGrape(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const grapeMat = glossy(crop.color3d, 75);
  // cacho afunilado: linhas largas em cima, ponta embaixo
  const rows = [
    { y: 0.34, n: 4, r: 0.1 },
    { y: 0.27, n: 4, r: 0.12 },
    { y: 0.2, n: 3, r: 0.09 },
    { y: 0.13, n: 2, r: 0.06 },
    { y: 0.07, n: 1, r: 0 },
  ];
  rows.forEach((row, ri) => {
    for (let i = 0; i < row.n; i++) {
      const a = (i / row.n) * Math.PI * 2 + ri * 0.6;
      const b = pm(GEO.grapeBall, grapeMat);
      b.position.set(Math.cos(a) * row.r, row.y, Math.sin(a) * row.r);
      g.add(b);
    }
  });
  const stem = pm(GEO.frondStem, lam(0x6b4423));
  stem.scale.set(1, 0.5, 1);
  stem.position.y = 0.4;
  g.add(stem);
  const leaf = pm(GEO.grapeLeaf, lam(FOLIAGE.leaf));
  leaf.scale.set(1.2, 0.3, 1);
  leaf.position.set(0.08, 0.43, 0);
  g.add(leaf);
  return g;
}

function matDragonfruit(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const body = pm(GEO.dragonBody, glossy(crop.color3d, 60));
  body.scale.set(0.85, 1.15, 0.85);
  body.position.y = 0.22;
  g.add(body);
  // escamas/abas verdes ao redor (o "look" da pitaya)
  const finMat = lam(0x4ade80);
  const finCount = 7;
  for (let i = 0; i < finCount; i++) {
    const a = (i / finCount) * Math.PI * 2;
    const yy = 0.16 + (i % 3) * 0.07;
    const fin = pm(GEO.dragonFin, finMat);
    fin.scale.set(0.8, 1, 0.5);
    fin.position.set(Math.cos(a) * 0.16, yy, Math.sin(a) * 0.16);
    fin.rotation.z = -1.1;
    fin.rotation.y = -a;
    fin.rotation.x = 0.3;
    g.add(fin);
  }
  // coroa no topo
  for (let i = 0; i < 4; i++) {
    const a = i * (Math.PI / 2);
    const fin = pm(GEO.dragonFin, finMat);
    fin.scale.set(0.6, 0.9, 0.4);
    fin.position.set(Math.cos(a) * 0.05, 0.4, Math.sin(a) * 0.05);
    fin.rotation.z = Math.cos(a) * 0.5;
    fin.rotation.x = -Math.sin(a) * 0.5;
    g.add(fin);
  }
  return g;
}

function matCrystal(_crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const core = pm(GEO.crystalCore, CRYSTAL_MAT);
  core.position.y = 0.16;
  core.rotation.y = 0.4;
  g.add(core);
  const shards = 6;
  for (let i = 0; i < shards; i++) {
    const a = (i / shards) * Math.PI * 2;
    const shard = pm(GEO.crystalShard, CRYSTAL_MAT);
    shard.scale.setScalar(0.6 + (i % 2) * 0.4);
    shard.position.set(Math.cos(a) * 0.12, 0.14, Math.sin(a) * 0.12);
    shard.rotation.z = Math.cos(a) * 0.5;
    shard.rotation.x = -Math.sin(a) * 0.5;
    g.add(shard);
  }
  const tall = pm(GEO.crystalShard, CRYSTAL_MAT);
  tall.scale.setScalar(1.2);
  tall.position.y = 0.32;
  g.add(tall);
  return g;
}

// ── Registro: PlantVisual → builder ────────────────────────────────────────────

const VISUAL_BUILDERS: Record<PlantVisual, (crop: Crop) => THREE.Group> = {
  wheat: matWheat,
  lettuce: matLettuce,
  carrot: matCarrot,
  potato: matPotato,
  corn: matCorn,
  tomato: matTomato,
  strawberry: matStrawberry,
  sunflower: matSunflower,
  starfruit: matStarfruit,
  pumpkin: matPumpkin,
  watermelon: matWatermelon,
  grape: matGrape,
  dragonfruit: matDragonfruit,
  crystal: matCrystal,
};

// ── Floreio de peculiaridade na planta madura ───────────────────────────────
// Lê crop → peculiarityOf(crop).accent. A maioria das sementes não tem accent
// (return cedo). Usa geometrias/materiais compartilhados → ~zero alocação.

function addAccent(g: THREE.Group, crop: Crop): void {
  const accent = peculiarityOf(crop).accent;
  if (!accent) return;

  if (accent === "spark") {
    // faíscas douradas pairando acima (golden_wheat, star_fruit)
    const pts: [number, number, number][] = [
      [0.12, 0.62, 0.05],
      [-0.1, 0.72, -0.04],
      [0.02, 0.8, 0.1],
    ];
    pts.forEach(([x, y, z]) => {
      const sp = new THREE.Mesh(ACCENT_SPARK_GEO, SPARK_MAT);
      sp.position.set(x, y, z);
      g.add(sp);
    });
  } else if (accent === "glow") {
    // halo translúcido ao redor (crystal_rose)
    const halo = new THREE.Mesh(ACCENT_HALO_GEO, GLOW_MAT);
    halo.position.y = 0.2;
    g.add(halo);
  } else if (accent === "petals") {
    // pétalas flutuando perto do topo, na cor da cultura (sunflower)
    const mat = lam(crop.color3d);
    for (let i = 0; i < 3; i++) {
      const a = i * ((Math.PI * 2) / 3);
      const p = pm(GEO.grapeBall, mat);
      p.scale.setScalar(0.5);
      p.position.set(Math.cos(a) * 0.22, 0.5 + (i % 2) * 0.06, Math.sin(a) * 0.22);
      g.add(p);
    }
  }
}

function buildMature(crop: Crop): THREE.Group {
  const g = (VISUAL_BUILDERS[crop.visual] ?? matTomato)(crop);
  addAccent(g, crop);
  return g;
}

/** Cache key: we only rebuild the mesh when the stage changes */
export function plantKey(t: Tile): string | null {
  if (t.state === "planted") return "planted";
  if (t.state === "growing") return "growing";
  if (t.state === "ready" && t.cropId) return `ready:${t.cropId}`;
  return null;
}

export function buildPlant(t: Tile): THREE.Group | null {
  if (t.state === "planted") return buildSprout();
  if (t.state === "growing" && t.cropId) return buildYoung(CROPS[t.cropId]);
  if (t.state === "growing") return buildSprout();
  if (t.state === "ready" && t.cropId) return buildMature(CROPS[t.cropId]);
  return null;
}
