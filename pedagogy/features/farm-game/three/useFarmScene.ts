// features/farm-game/three/useFarmScene.ts
import { Renderer } from "expo-three";
import {
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
} from "react";
import type { LayoutChangeEvent } from "react-native";
import * as THREE from "three";

import { COLS, ROWS, TILE_H, TILE_W } from "../constants";
import { structurePos } from "../data/structures";
import type { GameState, StructureId, Tile } from "../types";
import { tileWorldPos } from "./geometry";
import { buildGrassField } from "./grass";
import { buildPlant, plantKey } from "./plants";
import { applyTileMat, createSoilMaterials, getSurfaceGeo } from "./soil";
import { buildStructure } from "./structures";

// ─── Câmera: base fixa + pan no chão ─────────────────────────────────────────
const VIEW = 4.6; // meia-altura do frustum ortográfico
const CAM_POS = new THREE.Vector3(8, 10, 8);
const CAM_TARGET = new THREE.Vector3(0, 0, 0);
const SQ = Math.SQRT1_2;
// Direções de tela projetadas no chão (a câmera não gira, então são constantes).
const SCREEN_RIGHT = new THREE.Vector3(SQ, 0, -SQ);
const SCREEN_UP = new THREE.Vector3(-SQ, 0, -SQ);
// Limites do pan (em unidades de mundo ao longo de cada eixo de tela).
const PAN_RIGHT_MIN = -7.5; // esquerda: até a casa do fazendeiro
const PAN_RIGHT_MAX = 7.5; // direita: até o celeiro
const PAN_UP_MIN = -7.5; // baixo: até a colmeia
const PAN_UP_MAX = 7.5; // cima: até a casinha
const PAN_SENS = 2.2; // sensibilidade do arraste
const PAN_EASE = 0.18; // suavização (lerp por frame)
const DRAG_THRESHOLD = 9; // px pra diferenciar toque de arraste
/** Topo do chão de grama (base das construções). */
const GROUND_TOP = -TILE_H / 2;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

// ─── Three.js Scene Manager (ref object) ─────────────────────────────────────

export interface SceneRefs {
  renderer: Renderer | null;
  scene: THREE.Scene | null;
  camera: THREE.OrthographicCamera | null;
  tileObjs: THREE.Mesh[];
  plantObjs: (THREE.Group | null)[];
  structureObjs: Partial<Record<StructureId, THREE.Group>>;
  animFrame: number;
  readyAnim: number;
  // pan da câmera (suavizado): atual segue o alvo a cada frame
  panRight: number;
  panUp: number;
  panRightTarget: number;
  panUpTarget: number;
}

export function createSceneRefs(): SceneRefs {
  return {
    renderer: null,
    scene: null,
    camera: null,
    tileObjs: [],
    plantObjs: [],
    structureObjs: {},
    animFrame: 0,
    readyAnim: 0,
    panRight: 0,
    panUp: 0,
    panRightTarget: 0,
    panUpTarget: 0,
  };
}

/** Reposiciona câmera+alvo pelo offset de pan no chão. */
function applyPan(r: SceneRefs): void {
  if (!r.camera) return;
  const ox = SCREEN_RIGHT.x * r.panRight + SCREEN_UP.x * r.panUp;
  const oz = SCREEN_RIGHT.z * r.panRight + SCREEN_UP.z * r.panUp;
  r.camera.position.set(CAM_POS.x + ox, CAM_POS.y, CAM_POS.z + oz);
  r.camera.lookAt(CAM_TARGET.x + ox, CAM_TARGET.y, CAM_TARGET.z + oz);
}

/** Cria/remove as construções conforme a posse muda. */
function syncStructures(
  r: SceneRefs,
  owned: Record<StructureId, boolean>,
): void {
  if (!r.scene) return;
  (Object.keys(owned) as StructureId[]).forEach((id) => {
    const has = owned[id];
    const obj = r.structureObjs[id];
    if (has && !obj) {
      const g = buildStructure(id);
      const p = structurePos(id);
      g.position.set(p.x, GROUND_TOP, p.z);
      g.userData.spawnAt = performance.now();
      r.scene!.add(g);
      r.structureObjs[id] = g;
    } else if (!has && obj) {
      r.scene!.remove(obj);
      delete r.structureObjs[id];
    }
  });
}

interface Params {
  /** Tiles reativos — dispara o sync da cena quando o estado do jogo muda. */
  tiles: Tile[];
  /** Construções compradas — dispara o build/remoção no cenário. */
  structures: Record<StructureId, boolean>;
  /** Estado sempre atualizado — lido pelo loop de render e pelos toques. */
  stateRef: MutableRefObject<GameState>;
  /** Refs da cena (donas no screen, preenchidas aqui). */
  refs: MutableRefObject<SceneRefs>;
  /** Tamanho do layout do GLView em pontos lógicos (mesma unidade do toque). */
  viewSize: MutableRefObject<{ w: number; h: number }>;
  /** Tamanho do drawing buffer do GL em pixels físicos. */
  glSize: MutableRefObject<{ w: number; h: number }>;
  /** Handler de toque num tile (resolve a ferramenta selecionada). */
  onTilePress: (tileId: number) => void;
}

export function useFarmScene({
  tiles,
  structures,
  stateRef,
  refs,
  viewSize,
  glSize,
  onTilePress,
}: Params) {
  const hoveredId = useRef(-1);
  // Scratch do arraste — distingue toque (planta) de arraste (pan da câmera).
  const drag = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    startRight: 0,
    startUp: 0,
  });

  // Mantém o handler de toque sempre atual sem recriar a cena/closures.
  const pressRef = useRef(onTilePress);
  useEffect(() => {
    pressRef.current = onTilePress;
  }, [onTilePress]);

  // ── Sync Three.js scene when game state changes ─────────────────────────────

  useEffect(() => {
    const r = refs.current;
    if (!r.scene) return;
    tiles.forEach((tile, id) => {
      const mesh = r.tileObjs[id];
      if (!mesh) return;
      applyTileMat(mesh, tile, hoveredId.current === id);

      const want = plantKey(tile);
      const cur = r.plantObjs[id];
      if (cur && cur.userData.key === want) return; // stage unchanged

      if (cur) {
        r.scene!.remove(cur);
        r.plantObjs[id] = null;
      }
      if (!want) return;

      const g = buildPlant(tile)!;
      g.userData.key = want;
      g.userData.spawnAt = performance.now(); // animates the entry "pop"
      const pos = tileWorldPos(id);
      g.position.set(pos.x, TILE_H / 2, pos.z);
      g.rotation.y = (id % 7) * 0.9; // deterministic variation across tiles
      r.scene!.add(g);
      r.plantObjs[id] = g;
    });
  }, [tiles, refs]);

  // ── Sync structures when ownership changes ──────────────────────────────────

  useEffect(() => {
    syncStructures(refs.current, structures);
  }, [structures, refs]);

  // ── GL context creation ──────────────────────────────────────────────────────

  const onContextCreate = useCallback(
    async (gl: WebGLRenderingContext) => {
      const r = refs.current;
      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;
      glSize.current = { w, h };

      // @ts-ignore — expo-three Renderer accepts the gl context
      r.renderer = new Renderer({ gl });
      r.renderer!.setSize(w, h);
      r.renderer!.shadowMap.enabled = true;
      r.renderer!.shadowMap.type = THREE.PCFSoftShadowMap;
      // Correct color management → PBR soil reads right (no washed-out look)
      {
        const R: any = r.renderer;
        if ("outputColorSpace" in R)
          R.outputColorSpace = (THREE as any).SRGBColorSpace;
        else R.outputEncoding = (THREE as any).sRGBEncoding;
      }

      r.scene = new THREE.Scene();
      r.scene.background = null;

      // Hemisphere (sky/ground bounce) + warm sun — flatters the soil normals
      r.scene.add(new THREE.HemisphereLight(0xbfe3ff, 0x6a4a2e, 0.85));
      const dir = new THREE.DirectionalLight(0xfff2d6, 1.5);
      dir.position.set(6, 11, 4);
      dir.castShadow = true;
      dir.shadow.mapSize.set(2048, 2048);
      dir.shadow.camera.near = 1;
      dir.shadow.camera.far = 45;
      dir.shadow.camera.left = -11;
      dir.shadow.camera.right = 11;
      dir.shadow.camera.top = 11;
      dir.shadow.camera.bottom = -11;
      dir.shadow.bias = -0.0008;
      r.scene.add(dir);

      const aspect = w / h;
      r.camera = new THREE.OrthographicCamera(
        -VIEW * aspect,
        VIEW * aspect,
        VIEW,
        -VIEW,
        0.1,
        100,
      );
      r.camera.position.set(8, 10, 8);
      r.camera.lookAt(0, 0, 0);
      r.camera.updateProjectionMatrix();
      applyPan(r); // aplica pan inicial (0 = centralizado)

      buildGrassField(r.scene);

      // Tile = soil block (depth + sides) + a displaced surface plane (the dirt)
      const boxGeo = new THREE.BoxGeometry(TILE_W, TILE_H, TILE_W);
      for (let id = 0; id < ROWS * COLS; id++) {
        const { surfMat, boxMat } = createSoilMaterials();
        const mesh = new THREE.Mesh(boxGeo, boxMat);
        mesh.receiveShadow = true;
        mesh.castShadow = true;

        const surf = new THREE.Mesh(getSurfaceGeo(false), surfMat);
        surf.position.y = TILE_H / 2 + 0.004; // sits on the block's top
        surf.receiveShadow = true;
        mesh.add(surf);

        mesh.userData.surface = surf;
        mesh.userData.surfMat = surfMat;
        mesh.userData.boxMat = boxMat;

        const pos = tileWorldPos(id);
        mesh.position.copy(pos);
        (mesh as any).tileId = id;
        applyTileMat(mesh, {
          id,
          state: "empty",
          watered: false,
          waterCount: 0,
        } as Tile);
        r.scene.add(mesh);
        r.tileObjs[id] = mesh;
      }

      // Sync existing state (restored save or hot reload)
      stateRef.current.tiles.forEach((tile, id) => {
        applyTileMat(r.tileObjs[id], tile);
        const want = plantKey(tile);
        if (!want) return;
        const g = buildPlant(tile)!;
        g.userData.key = want;
        g.userData.spawnAt = performance.now();
        const pos = tileWorldPos(id);
        g.position.set(pos.x, TILE_H / 2, pos.z);
        g.rotation.y = (id % 7) * 0.9;
        r.scene!.add(g);
        r.plantObjs[id] = g;
      });

      // Build structures already owned (restored save / hot reload)
      syncStructures(r, stateRef.current.structures);

      // Render loop — plant pop-in + swaying of ready crops
      let lastT = performance.now();
      const animate = () => {
        r.animFrame = requestAnimationFrame(animate);
        const now = performance.now();
        const dt = (now - lastT) / 1000;
        lastT = now;

        // câmera: suaviza o pan em direção ao alvo
        const dr = r.panRightTarget - r.panRight;
        const du = r.panUpTarget - r.panUp;
        if (Math.abs(dr) > 0.0004 || Math.abs(du) > 0.0004) {
          r.panRight += dr * PAN_EASE;
          r.panUp += du * PAN_EASE;
          applyPan(r);
        }

        r.readyAnim += dt * 2;
        const ts = stateRef.current.tiles;
        ts.forEach((t, i) => {
          const g = r.plantObjs[i];
          if (!g) return;

          // entry animation (pop)
          const age = now - (g.userData.spawnAt ?? now);
          let sc = 1;
          if (age < 350) sc = 0.4 + 0.6 * Math.min(1, age / 350);

          if (t.state === "ready") {
            sc *= 1 + 0.06 * Math.sin(r.readyAnim + i);
            g.rotation.z = 0.05 * Math.sin(r.readyAnim * 1.3 + i);
          } else {
            g.rotation.z = 0.02 * Math.sin(r.readyAnim * 0.7 + i); // light breeze
          }
          g.scale.set(sc, sc, sc);
        });

        // construções: leve pop ao surgir + animações dos bichos/fumaça
        (Object.keys(r.structureObjs) as StructureId[]).forEach((id) => {
          const g = r.structureObjs[id];
          if (!g) return;
          const age = now - (g.userData.spawnAt ?? now);
          if (age < 450) {
            const sc = 0.6 + 0.4 * Math.min(1, age / 450);
            g.scale.setScalar(sc);
          } else if (g.scale.x !== 1) {
            g.scale.setScalar(1);
          }
          (
            g.userData.tick as ((t: number, dt: number) => void) | undefined
          )?.(now / 1000, dt);
        });

        r.renderer!.render(r.scene!, r.camera!);
        (gl as any).endFrameEXP?.();
      };
      animate();
    },
    [refs, glSize, stateRef],
  );

  // ── Touch → tile picking ─────────────────────────────────────────────────────

  const pickTile = useCallback(
    (px: number, py: number): number => {
      const r = refs.current;
      if (!r.camera || !r.scene) return -1;
      const { w, h } = viewSize.current;
      if (w <= 1 || h <= 1) return -1;
      const nx = (px / w) * 2 - 1;
      const ny = -(py / h) * 2 + 1;

      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(nx, ny), r.camera);
      // Non-recursive: only the tile blocks are tested (surface children ignored)
      const hits = ray.intersectObjects(r.tileObjs.filter(Boolean), false);
      if (hits.length > 0) return (hits[0].object as any).tileId as number;
      return -1;
    },
    [refs, viewSize],
  );

  const onCanvasLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      viewSize.current = { w: width, h: height };
    },
    [viewSize],
  );

  /** Limpa o realce do tile sob o dedo. */
  const clearHover = useCallback(() => {
    const r = refs.current;
    if (hoveredId.current >= 0 && r.tileObjs[hoveredId.current]) {
      applyTileMat(
        r.tileObjs[hoveredId.current],
        stateRef.current.tiles[hoveredId.current],
      );
    }
    hoveredId.current = -1;
  }, [refs, stateRef]);

  const onTouchStart = useCallback(
    (e: any) => {
      const { locationX, locationY } = e.nativeEvent;
      const r = refs.current;
      drag.current = {
        active: true,
        moved: false,
        startX: locationX,
        startY: locationY,
        startRight: r.panRightTarget,
        startUp: r.panUpTarget,
      };
      // realça o tile sob o dedo (a planta só sai no touchEnd se NÃO arrastar)
      const id = pickTile(locationX, locationY);
      if (id >= 0) {
        if (
          hoveredId.current >= 0 &&
          hoveredId.current !== id &&
          r.tileObjs[hoveredId.current]
        ) {
          applyTileMat(
            r.tileObjs[hoveredId.current],
            stateRef.current.tiles[hoveredId.current],
          );
        }
        hoveredId.current = id;
        if (r.tileObjs[id]) {
          applyTileMat(r.tileObjs[id], stateRef.current.tiles[id], true);
        }
      }
    },
    [pickTile, refs, stateRef],
  );

  const onTouchMove = useCallback(
    (e: any) => {
      const d = drag.current;
      if (!d.active) return;
      const { locationX, locationY } = e.nativeEvent;
      const dx = locationX - d.startX;
      const dy = locationY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (!d.moved) {
        d.moved = true; // virou arraste → cancela o realce do toque
        clearHover();
      }
      const r = refs.current;
      const h = viewSize.current.h || 1;
      const worldPerPx = ((2 * VIEW) / h) * PAN_SENS;
      // arrastar pra cima/direita revela o que está em cima/à direita
      r.panRightTarget = clamp(
        d.startRight + dx * worldPerPx,
        PAN_RIGHT_MIN,
        PAN_RIGHT_MAX,
      );
      r.panUpTarget = clamp(
        d.startUp + -dy * worldPerPx,
        PAN_UP_MIN,
        PAN_UP_MAX,
      );
    },
    [refs, viewSize, clearHover],
  );

  const onTouchEnd = useCallback(
    (e: any) => {
      const d = drag.current;
      d.active = false;
      if (d.moved) {
        clearHover();
        return; // foi pan da câmera: não planta/colhe
      }
      const { locationX, locationY } = e.nativeEvent;
      let id = pickTile(locationX, locationY);
      if (id < 0) id = hoveredId.current;
      clearHover();
      if (id >= 0) pressRef.current(id);
    },
    [pickTile, clearHover],
  );

  /** Volta a câmera pro centro da fazenda (suave). */
  const recenter = useCallback(() => {
    const r = refs.current;
    r.panRightTarget = 0;
    r.panUpTarget = 0;
  }, [refs]);

  // ── Cleanup ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      cancelAnimationFrame(refs.current.animFrame);
      refs.current.renderer?.dispose?.();
    };
  }, [refs]);

  return {
    onContextCreate,
    onCanvasLayout,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    recenter,
  };
}
