// features/farm-game/types/assets.d.ts
// Metro entende `import x from "./model.glb"` (devolve o id do asset); o
// TypeScript precisa desta declaração ambiente pra não reclamar do import.
declare module "*.glb" {
  const asset: number;
  export default asset;
}
declare module "*.gltf" {
  const asset: number;
  export default asset;
}
