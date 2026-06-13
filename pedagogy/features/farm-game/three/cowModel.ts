// features/farm-game/three/cowModel.ts
import { Asset } from "expo-asset";
import * as THREE from "three";
// Mesmo caso do dogModel: se o Metro reclamar, troque por "three-stdlib".
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// ─── 🐮 Vaca: "Spot", de Keenan Crane (domínio público) ──────────────────────
// Convertida de .obj → .glb. Vem SEM cor e SEM esqueleto, então a gente:
//   1) pinta de branco com pintas pretas (cor por VÉRTICE — não depende de UV);
//   2) dá uma animação idle procedural (respira / muda o peso).
// Se você trocar por um .glb COM animação (ex.: a vaca CC0 do Quaternius), o
// loader detecta os clipes e toca o idle do próprio modelo no lugar.
import MODEL from "../assets/Cow.glb";

export const COW_SCALE = 0.5; // ~0.85 de altura no mundo (maior que a raposa)
export const COW_ROT_Y = Math.PI / 2; // facing da vaca no cercado (diagonal 3/4
// com a câmera). Agora é aplicado UMA vez. Gire à vontade; +Math.PI vira de frente↔costas.

// Cor (hex sRGB) — branca com pintas quase pretas, estilo holandesa (malhada).
const BASE_COLOR = 0xf2f2f2;
const SPOT_COLOR = 0x161616;
// Pintas: mexa aqui pra ter mais/menos/maiores manchas.
const SPOT_SCALE = 2.5; // frequência do ruído (↑ = pintas menores)
const SPOT_THRESHOLD = 0.55; // ~30% de cobertura preta
const SPOT_EDGE = 0.06; // suavidade da borda da pinta
const IDLE_CLIP = "Idle"; // usado só se o .glb tiver animação

// ── ruído de valor 3D → máscara de pintas (idêntico ao que foi calibrado) ────
const fract = (x: number) => x - Math.floor(x);
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function hash(x: number, y: number, z: number): number {
  return fract(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453);
}
function vnoise(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  const w = smooth(z - zi);
  const c = (i: number, j: number, k: number) => hash(xi + i, yi + j, zi + k);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}
function spotMask(x: number, y: number, z: number): number {
  let nv = vnoise(x * SPOT_SCALE, y * SPOT_SCALE, z * SPOT_SCALE);
  nv =
    0.65 * nv +
    0.35 *
      vnoise(
        x * SPOT_SCALE * 2.3 + 11,
        y * SPOT_SCALE * 2.3 + 5,
        z * SPOT_SCALE * 2.3 + 7,
      );
  const t = Math.min(
    1,
    Math.max(0, (nv - (SPOT_THRESHOLD - SPOT_EDGE)) / (2 * SPOT_EDGE)),
  );
  return t * t * (3 - 2 * t);
}

/** Pinta uma malha de branco com pintas pretas via cor por vértice. */
function paintSpots(mesh: THREE.Mesh): void {
  const geo = mesh.geometry;
  if (!geo.attributes.normal) geo.computeVertexNormals(); // .obj não trouxe normais
  const pos = geo.attributes.position;
  const n = pos.count;
  const colors = new Float32Array(n * 3);
  const cWhite = new THREE.Color().setHex(BASE_COLOR, THREE.SRGBColorSpace);
  const cBlack = new THREE.Color().setHex(SPOT_COLOR, THREE.SRGBColorSpace);
  const tmp = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const s = spotMask(pos.getX(i), pos.getY(i), pos.getZ(i));
    tmp.copy(cWhite).lerp(cBlack, s);
    colors[3 * i] = tmp.r;
    colors[3 * i + 1] = tmp.g;
    colors[3 * i + 2] = tmp.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  mesh.material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0,
  });
}

async function loadGLTF(): Promise<{
  scene: THREE.Group;
  clips: THREE.AnimationClip[];
}> {
  const asset = Asset.fromModule(MODEL);
  if (!asset.downloaded) await asset.downloadAsync();
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(asset.localUri ?? asset.uri);
  return { scene: gltf.scene, clips: gltf.animations };
}

export interface LoadedCow {
  group: THREE.Group;
  update: (dt: number) => void;
}

/** Instancia a vaca pronta (pintada + apoiada no chão) + um update(dt). */
export async function createCow(): Promise<LoadedCow> {
  const { scene, clips } = await loadGLTF();

  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
      paintSpots(m);
    }
  });

  scene.scale.setScalar(COW_SCALE);

  // recentra: pés no y=0 e corpo centrado em x/z (o .obj tem a origem no meio).
  // Sem rotação aqui — quem orienta a vaca é o `root` (no structures.ts), pra a
  // rotação não ser aplicada duas vezes.
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  scene.position.x -= (box.min.x + box.max.x) / 2;
  scene.position.z -= (box.min.z + box.max.z) / 2;
  scene.position.y -= box.min.y;

  // hierarquia: root (orientação + posição, no structures.ts)
  //           > bobber (animação idle; pivota no chão → pés grudados)
  //           > scene (modelo já escalado e apoiado em y=0)
  const bobber = new THREE.Group();
  bobber.add(scene);
  const root = new THREE.Group();
  root.add(bobber);

  // se o .glb tiver animação (ex.: a vaca CC0 do Quaternius), toca ela e pronto
  if (clips.length > 0) {
    const mixer = new THREE.AnimationMixer(scene);
    const clip = THREE.AnimationClip.findByName(clips, IDLE_CLIP) ?? clips[0];
    mixer.clipAction(clip).play();
    return { group: root, update: (dt) => mixer.update(dt) };
  }

  // idle procedural (Spot não tem esqueleto): respira, balança o peso, olha em
  // volta e abaixa a cabeça pra "pastar". Tudo no `bobber` (pivot no chão).
  let t = 0;
  return {
    group: root,
    update: (dt: number) => {
      t += dt;
      bobber.scale.setScalar(1 + 0.02 * Math.sin(t * 1.5)); // respira (pulsa de leve)
      bobber.position.y = 0.025 * (0.5 + 0.5 * Math.sin(t * 1.5)); // sobe/desce
      bobber.rotation.z = 0.03 * Math.sin(t * 0.8); // muda o peso de lado
      bobber.rotation.y = 0.12 * Math.sin(t * 0.45); // olha pros lados
      bobber.rotation.x = 0.04 * Math.sin(t * 0.65 + 1); // abaixa/levanta a cabeça
    },
  };
}
