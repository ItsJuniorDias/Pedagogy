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
import type { GameState, Tile } from "../types";
import { tileWorldPos } from "./geometry";
import { buildGrassField } from "./grass";
import { buildPlant, plantKey } from "./plants";
import { applyTileMat, createSoilMaterials, getSurfaceGeo } from "./soil";

// ─── Three.js Scene Manager (ref object) ─────────────────────────────────────

export interface SceneRefs {
  renderer: Renderer | null;
  scene: THREE.Scene | null;
  camera: THREE.OrthographicCamera | null;
  tileObjs: THREE.Mesh[];
  plantObjs: (THREE.Group | null)[];
  animFrame: number;
  readyAnim: number;
}

export function createSceneRefs(): SceneRefs {
  return {
    renderer: null,
    scene: null,
    camera: null,
    tileObjs: [],
    plantObjs: [],
    animFrame: 0,
    readyAnim: 0,
  };
}

interface Params {
  /** Tiles reativos — dispara o sync da cena quando o estado do jogo muda. */
  tiles: Tile[];
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
  stateRef,
  refs,
  viewSize,
  glSize,
  onTilePress,
}: Params) {
  const hoveredId = useRef(-1);

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
      dir.shadow.mapSize.set(1024, 1024);
      dir.shadow.camera.near = 1;
      dir.shadow.camera.far = 40;
      dir.shadow.camera.left = -8;
      dir.shadow.camera.right = 8;
      dir.shadow.camera.top = 8;
      dir.shadow.camera.bottom = -8;
      dir.shadow.bias = -0.0008;
      r.scene.add(dir);

      const aspect = w / h;
      const VIEW = 4.6;
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

      // Render loop — plant pop-in + swaying of ready crops
      let lastT = performance.now();
      const animate = () => {
        r.animFrame = requestAnimationFrame(animate);
        const now = performance.now();
        const dt = (now - lastT) / 1000;
        lastT = now;

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

  const onTouchStart = useCallback(
    (e: any) => {
      const { locationX, locationY } = e.nativeEvent;
      const id = pickTile(locationX, locationY);
      if (id >= 0) {
        const r = refs.current;
        if (hoveredId.current >= 0 && r.tileObjs[hoveredId.current]) {
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

  const onTouchEnd = useCallback(
    (e: any) => {
      const { locationX, locationY } = e.nativeEvent;
      let id = pickTile(locationX, locationY);
      if (id < 0) id = hoveredId.current;

      const r = refs.current;
      if (hoveredId.current >= 0 && r.tileObjs[hoveredId.current]) {
        applyTileMat(
          r.tileObjs[hoveredId.current],
          stateRef.current.tiles[hoveredId.current],
        );
      }
      hoveredId.current = -1;
      if (id >= 0) pressRef.current(id);
    },
    [pickTile, refs, stateRef],
  );

  // ── Cleanup ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      cancelAnimationFrame(refs.current.animFrame);
      refs.current.renderer?.dispose?.();
    };
  }, [refs]);

  return { onContextCreate, onCanvasLayout, onTouchStart, onTouchEnd };
}
