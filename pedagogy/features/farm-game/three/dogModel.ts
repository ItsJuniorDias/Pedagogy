// features/farm-game/three/dogModel.ts
import { Asset } from "expo-asset";
import * as THREE from "three";
// Se o Metro reclamar deste caminho ("Unable to resolve three/examples/jsm…"),
// instale `three-stdlib` e troque por:  import { GLTFLoader } from "three-stdlib";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// ─── 🦊 "Cachorro" low-poly (na verdade a raposa CC0 do PixelMannen) ──────────
// KhronosGroup/glTF-Sample-Assets → rigada, com 3 animações: Survey, Walk, Run.
// É um canídeo, então cai bem como mascote da fazenda.
//
// Licença: malha CC0 (PixelMannen); rig + animação CC BY 4.0 (tomkranis);
// conversão glTF CC BY 4.0 (@AsoboStudio, @scurest). → exige crédito (ver README).
//
// Pra trocar por OUTRO bicho: ponha o .glb em ../assets, mude o import MODEL e,
// se preciso, IDLE_CLIP / DOG_SCALE / DOG_ROT_Y abaixo. O resto continua igual.
import MODEL from "../assets/Fox.glb";

// A raposa vem ~79 unidades de altura e virada num eixo qualquer → encolhe MUITO
// e talvez precise girar. Estes três são os botões pra acertar no olho:
export const DOG_SCALE = 0.0055; // ~0.43 de altura no mundo (≈ o cão antigo)
export const DOG_ROT_Y = 0; // se ela aparecer de costas, troque p/ Math.PI
// Cor do pelo. `null` = mantém a textura original (laranja). Um valor pinta por
// cima (removendo a textura) → preta agora; troque o tom à vontade (0x222222 se
// achar muito escura, 0xf5f5f5 p/ branca, etc.).
export const DOG_COLOR: number | null = 0x141414; // preta
const IDLE_CLIP = "Survey"; // clipe tocado parado (Survey | Walk | Run)

/** Carrega o GLB e devolve a cena + as animações (uma instância por chamada). */
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

/**
 * Instancia o "cachorro" pronto pro cenário + um AnimationMixer já tocando o
 * idle. Lembre de chamar `mixer.update(dt)` a cada frame (o loop de render já
 * faz isso via group.userData.tick).
 */
export async function createDog(): Promise<{
  group: THREE.Group;
  mixer: THREE.AnimationMixer;
}> {
  const { scene, clips } = await loadGLTF();

  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.castShadow = true;
    m.receiveShadow = true;
    if (DOG_COLOR != null) {
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        const sm = mat as THREE.MeshStandardMaterial;
        sm.map = null; // tira a textura de pelo laranja
        sm.color.setHex(DOG_COLOR); // pinta de preto
        sm.roughness = 0.9; // fosco (pelo, não plástico)
        sm.metalness = 0;
        sm.needsUpdate = true; // recompila o shader sem a textura
      }
    }
  });
  scene.scale.setScalar(DOG_SCALE);

  const mixer = new THREE.AnimationMixer(scene);
  const clip = THREE.AnimationClip.findByName(clips, IDLE_CLIP) ?? clips[0];
  if (clip) mixer.clipAction(clip).play();

  return { group: scene, mixer };
}
