// features/farm-game/three/soil.ts
import * as THREE from "three";

import { TILE_W } from "../constants";
import type { Tile, TileState } from "../types";

// ─── Realistic procedural soil ────────────────────────────────────────────────
// Sem DOM/Canvas no React Native, então os mapas do solo são "baked" em
// DataTextures a partir de um heightfield de value-noise. PBR
// (MeshStandardMaterial) + normal map dão relevo real à terra; tints/roughness
// por estado reaproveitam o mesmo conjunto de texturas.

/** Tiny fractal value-noise. Determinístico por seed. */
function makeNoise2D(seed = 1337) {
  const rand = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453;
    return n - Math.floor(n);
  };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const value = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const u = smooth(x - xi);
    const v = smooth(y - yi);
    return lerp(
      lerp(rand(xi, yi), rand(xi + 1, yi), u),
      lerp(rand(xi, yi + 1), rand(xi + 1, yi + 1), u),
      v,
    );
  };
  return (x: number, y: number, octaves = 4) => {
    let amp = 1;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += value(x * freq, y * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return sum / norm;
  };
}

const mix3 = (a: number[], b: number[], t: number) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** Works on both modern three (colorSpace) and older expo-three (encoding). */
function setColorSpace(tex: THREE.Texture, srgb: boolean) {
  const T: any = THREE;
  if ("colorSpace" in tex) {
    (tex as any).colorSpace = srgb ? T.SRGBColorSpace : T.LinearSRGBColorSpace;
  } else {
    (tex as any).encoding = srgb ? T.sRGBEncoding : T.LinearEncoding;
  }
}

let _soilTex: { color: THREE.DataTexture; normal: THREE.DataTexture } | null =
  null;

/** Bakes o color map (sRGB) + normal map (linear). 128 px = POT → WebGL1. */
function getSoilTextures() {
  if (_soilTex) return _soilTex;
  const size = 128;
  const noise = makeNoise2D(20240607);
  const height = new Float32Array(size * size);
  const pebble = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const nx = (x / size) * 6;
      const ny = (y / size) * 6;
      const base = noise(nx, ny, 5);
      const p = noise(nx * 3.7 + 40, ny * 3.7 + 40, 2);
      const peb = p > 0.8 ? (p - 0.8) / 0.2 : 0; // small stones 0..1
      height[i] = Math.min(1, base * 0.85 + peb * 0.5);
      pebble[i] = peb;
    }
  }

  // Color — lightish base, the material multiplies a per-state tint over it
  const dark = [120, 86, 56];
  const midC = [165, 124, 84];
  const light = [205, 170, 126];
  const stone = [150, 146, 138];
  const color = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const h = height[i];
    let c =
      h < 0.5 ? mix3(dark, midC, h / 0.5) : mix3(midC, light, (h - 0.5) / 0.5);
    if (pebble[i] > 0.15) c = mix3(c, stone, Math.min(1, pebble[i]));
    color[i * 4] = c[0];
    color[i * 4 + 1] = c[1];
    color[i * 4 + 2] = c[2];
    color[i * 4 + 3] = 255;
  }

  // Normal map from the heightfield (central difference, wrapped for tiling)
  const idx = (x: number, y: number) =>
    (((y % size) + size) % size) * size + (((x % size) + size) % size);
  const strength = 2.6;
  const normal = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      let nx = (height[idx(x - 1, y)] - height[idx(x + 1, y)]) * strength;
      let ny = (height[idx(x, y - 1)] - height[idx(x, y + 1)]) * strength;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
      normal[i * 4] = (nx * 0.5 + 0.5) * 255;
      normal[i * 4 + 1] = (ny * 0.5 + 0.5) * 255;
      normal[i * 4 + 2] = (nz * 0.5 + 0.5) * 255;
      normal[i * 4 + 3] = 255;
    }
  }

  const colorTex = new THREE.DataTexture(color, size, size, THREE.RGBAFormat);
  setColorSpace(colorTex, true);
  const normalTex = new THREE.DataTexture(normal, size, size, THREE.RGBAFormat);
  setColorSpace(normalTex, false);
  for (const t of [colorTex, normalTex]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.needsUpdate = true;
  }
  _soilTex = { color: colorTex, normal: normalTex };
  return _soilTex;
}

/** Subdivided + displaced top surface. Furrowed variant adds plow rows. */
let _flatGeo: THREE.BufferGeometry | null = null;
let _furrowGeo: THREE.BufferGeometry | null = null;

function buildSoilSurfaceGeo(furrowed: boolean): THREE.BufferGeometry {
  const seg = 22;
  const geo = new THREE.PlaneGeometry(TILE_W, TILE_W, seg, seg);
  geo.rotateX(-Math.PI / 2); // lie flat, normals up
  const noise = makeNoise2D(furrowed ? 412 : 77);
  const pos = geo.attributes.position;
  const half = TILE_W / 2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const u = x / TILE_W + 0.5;
    const v = z / TILE_W + 0.5;
    let h = (noise(u * 5, v * 5, 3) - 0.5) * 0.05; // fine grain
    if (furrowed) h += Math.sin(u * Math.PI * 2 * 4) * 0.03; // 4 plow rows
    // taper height to ~0 at edges so neighbouring tiles meet cleanly
    const fall =
      1 - Math.pow(Math.max(Math.abs(x) / half, Math.abs(z) / half), 6);
    pos.setY(i, h * fall);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export const getSurfaceGeo = (furrowed: boolean) =>
  furrowed
    ? (_furrowGeo ??= buildSoilSurfaceGeo(true))
    : (_flatGeo ??= buildSoilSurfaceGeo(false));

/** Pure helper sobre o Tile: solo úmido escurece quando regado. */
function tileStateKey(tile: Tile): TileState | "watered" {
  if ((tile.state === "planted" || tile.state === "growing") && tile.watered)
    return "watered"; // dark/moist soil
  return tile.state;
}

/** Per-state look. surf/box = tint multiplied over the texture; low rough = wet. */
const SOIL_LOOK: Record<
  TileState | "watered",
  { surf: number; box: number; rough: number; normal: number }
> = {
  empty: { surf: 0xb39a73, box: 0x927856, rough: 1.0, normal: 0.55 },
  tilled: { surf: 0x86603c, box: 0x6a4c2e, rough: 0.96, normal: 1.0 },
  planted: { surf: 0x7d5836, box: 0x624628, rough: 0.96, normal: 1.0 },
  growing: { surf: 0x6f4d2f, box: 0x583f24, rough: 0.93, normal: 1.0 },
  watered: { surf: 0x4a3422, box: 0x3a2a1d, rough: 0.42, normal: 0.9 }, // moist
  ready: { surf: 0x86603c, box: 0x6a4c2e, rough: 0.96, normal: 1.0 },
};

const HOVER_EMISSIVE = 0x2f6b1e;

/** Fresh material pair per tile (textures shared) → per-tile hover glow. */
export function createSoilMaterials() {
  const { color, normal } = getSoilTextures();
  const surfMat = new THREE.MeshStandardMaterial({
    map: color,
    normalMap: normal,
    roughness: 1,
    metalness: 0,
    normalScale: new THREE.Vector2(1, 1),
  });
  const boxMat = new THREE.MeshStandardMaterial({
    map: color,
    normalMap: normal,
    roughness: 1,
    metalness: 0,
    normalScale: new THREE.Vector2(0.5, 0.5),
  });
  return { surfMat, boxMat };
}

/** Mutates the tile's own materials/geometry — zero allocation after init. */
export function applyTileMat(mesh: THREE.Mesh, tile: Tile, hovered = false) {
  const surf = mesh.userData.surface as THREE.Mesh | undefined;
  const surfMat = mesh.userData.surfMat as
    | THREE.MeshStandardMaterial
    | undefined;
  const boxMat = mesh.userData.boxMat as THREE.MeshStandardMaterial | undefined;
  if (!surf || !surfMat || !boxMat) return;

  const key = tileStateKey(tile);
  const look = SOIL_LOOK[key];

  surfMat.color.setHex(look.surf);
  surfMat.roughness = look.rough;
  surfMat.normalScale.set(look.normal, look.normal);
  boxMat.color.setHex(look.box);
  boxMat.roughness = Math.min(1, look.rough + 0.05);

  const wantGeo = getSurfaceGeo(key !== "empty"); // worked soil gets furrows
  if (surf.geometry !== wantGeo) surf.geometry = wantGeo;

  surfMat.emissive.setHex(hovered ? HOVER_EMISSIVE : 0x000000);
  surfMat.emissiveIntensity = hovered ? 0.45 : 0;
}
