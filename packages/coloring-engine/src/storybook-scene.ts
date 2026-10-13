import type { SceneAsset, SceneComposition } from '../../shared-types/src/index';
import { loadSceneImage } from './canvas';

export interface ComposedScene { composition: SceneComposition; images: CanvasImageSource[] }
export type SceneImage = CanvasImageSource | ComposedScene;
export const isComposedScene = (scene: SceneImage): scene is ComposedScene => 'composition' in scene;
export const frameBehindArtwork = (scene: SceneImage | null): boolean => !!scene && isComposedScene(scene) && scene.composition.placement === 'behind-artwork';
const MANIFEST_CACHE = 'island-scene-manifests-v2';

export async function loadSceneAsset(asset: SceneAsset, signal?: AbortSignal): Promise<SceneImage> {
  if (!asset.compositionUrl) return loadSceneImage(asset.assetUrl, signal);
  const url = new URL(asset.compositionUrl, location.href);
  if (url.origin !== location.origin || !/^\/content\/(backgrounds|frames)\/[a-z0-9-]+\.[a-f0-9]{64}\.json$/.test(url.pathname)) throw new Error('背景のデータが正しくありません。');
  const cache = typeof caches !== 'undefined' ? await caches.open(MANIFEST_CACHE).catch(() => null) : null;
  let response: Response;
  try { response = await fetch(url, { signal }); if (!response.ok) throw new Error('scene unavailable'); }
  catch (error) { signal?.throwIfAborted(); const saved = await cache?.match(url).catch(() => undefined); if (!saved) throw error; response = saved; }
  const data: unknown = await response.clone().json();
  const c = data as SceneComposition;
  if (!c || c.schemaVersion !== 1 || c.width !== 1600 || c.height !== 2000 || !Array.isArray(c.layers) || c.layers.length > 80 ||
    (c.baseColor && !/^#[0-9a-f]{6}$/i.test(c.baseColor)) || (c.borderColor && !/^#[0-9a-f]{6}$/i.test(c.borderColor)) ||
    (c.placement !== undefined && c.placement !== 'behind-artwork') ||
    c.layers.some(layer => !/^\/content\/decor\/[a-z0-9-]+\.[a-f0-9]{64}\.png$/.test(layer.assetUrl) || ![layer.x, layer.y, layer.width, layer.height, layer.rotation ?? 0, layer.opacity ?? 1].every(Number.isFinite) || layer.width <= 0 || layer.height <= 0 || (layer.opacity ?? 1) < 0 || (layer.opacity ?? 1) > 1)) throw new Error('背景のデータが正しくありません。');
  const unique = new Map<string,Promise<HTMLImageElement>>();
  for (const layer of c.layers) if (!unique.has(layer.assetUrl)) unique.set(layer.assetUrl,loadSceneImage(layer.assetUrl,signal));
  const images = await Promise.all(c.layers.map(layer => unique.get(layer.assetUrl)!));
  signal?.throwIfAborted();
  if (cache) {
    try {
    await cache.put(url, response).catch(() => undefined);
    const keys = await cache.keys(); for (const old of keys.slice(0, Math.max(0, keys.length - 32))) await cache.delete(old);
    } catch { /* Successful rendering must survive private mode and cache quota failures. */ }
  }
  signal?.throwIfAborted();
  return { composition: c, images };
}

export function drawScene(context: CanvasRenderingContext2D, scene: SceneImage): void {
  if (!isComposedScene(scene)) { context.drawImage(scene, 0, 0, 1600, 2000); return; }
  const { composition: c, images } = scene;
  if (c.baseColor) { context.fillStyle = c.baseColor; context.fillRect(0, 0, 1600, 2000); }
  if (c.borderColor) {
    context.save();context.strokeStyle = c.borderColor;context.lineWidth = 12;context.lineJoin = 'round';context.strokeRect(25,25,1550,1950);context.restore();
  }
  c.layers.forEach((layer, i) => {
    context.save();context.globalAlpha = layer.opacity ?? 1;
    context.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);context.rotate((layer.rotation ?? 0) * Math.PI / 180);
    context.drawImage(images[i], -layer.width / 2, -layer.height / 2, layer.width, layer.height);context.restore();
  });
}
