/** Minimal DOM canvas boundary, also injectable for CPU rendering tests. */
export interface EngineCanvas {
  width: number;
  height: number;
  getContext(type: '2d', options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D | null;
  toBlob?: (callback: BlobCallback, type?: string, quality?: number) => void;
  convertToBlob?: (options?: ImageEncodeOptions) => Promise<Blob>;
}

export type CanvasFactory = (width: number, height: number) => EngineCanvas;
export type PathFactory = (path: string) => Path2D;

export const createBrowserCanvas: CanvasFactory = (width, height) => {
  // HTMLCanvasElement.toBlob is supported by all our target browsers. Offscreen
  // canvases avoid adding hidden DOM nodes, with the DOM canvas as a fallback.
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(width, height)
    : document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas as EngineCanvas;
};

/** Relative-light blending must keep the same raster path after zooming or
 * reloading. Chrome can otherwise change image-filter rounding as GPU image
 * caches warm up. Prime only the new surface renderer's intermediate canvases. */
export const createStableSurfaceCanvas: CanvasFactory = (width, height) => {
  const canvas = createBrowserCanvas(width, height);
  canvas.getContext('2d', { alpha: true, willReadFrequently: true });
  return canvas;
};

export function context2D(canvas: EngineCanvas): CanvasRenderingContext2D {
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) throw new Error('この端末では描画を開始できませんでした。');
  return context;
}

export const canvasImage = (canvas: EngineCanvas): CanvasImageSource => canvas as CanvasImageSource;

export async function canvasBlob(canvas: EngineCanvas, type: 'image/png' | 'image/webp', quality?: number): Promise<Blob> {
  // Firefox also exposes a deprecated OffscreenCanvas.toBlob that returns a
  // Promise instead of accepting a callback. Prefer the standard offscreen API
  // before testing for HTMLCanvasElement's callback-based method.
  if (canvas.convertToBlob) return canvas.convertToBlob({ type, quality });
  if (canvas.toBlob) {
    return new Promise((resolve, reject) => {
      canvas.toBlob?.((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('画像を書き出せませんでした。もう一度おためしください。'));
      }, type, quality);
    });
  }
  throw new Error('この端末では画像の書き出しが利用できません。');
}

const SCENE_CACHE = 'island-scene-images-v1';
const MAX_STORED_SCENES = 40;
const MAX_DECODED_SCENES = 6;
const MAX_DECODED_BYTES = 32 * 1024 * 1024;
const decodedScenes = new Map<string, HTMLImageElement>();

function decodeSceneBlob(blob: Blob, signal?: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Image load cancelled', 'AbortError'));
      return;
    }
    const image = new Image();
    const objectUrl = URL.createObjectURL(blob);
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal?.removeEventListener('abort', abort);
      URL.revokeObjectURL(objectUrl);
    };
    const abort = () => {
      cleanup();
      image.src = '';
      reject(new DOMException('Image load cancelled', 'AbortError'));
    };
    image.onload = () => { cleanup(); resolve(image); };
    image.onerror = () => { cleanup(); reject(new Error('背景・かざりわくを読み込めませんでした。')); };
    signal?.addEventListener('abort', abort, { once: true });
    image.src = objectUrl;
  });
}

/** Works before the first service-worker takeover, with bounded disk and RAM caches. */
export async function loadSceneImage(url: string, signal?: AbortSignal): Promise<HTMLImageElement> {
  signal?.throwIfAborted();
  const key = new URL(url, location.href).href;
  const ready = decodedScenes.get(key);
  if (ready) { decodedScenes.delete(key); decodedScenes.set(key, ready); return ready; }
  // CacheStorage can be unavailable in private browsing or at the storage limit.
  const cache = typeof caches !== 'undefined' ? await caches.open(SCENE_CACHE).catch(() => null) : null;
  let response: Response;
  let fetched = false;
  try {
    response = await fetch(key, { signal, credentials: 'same-origin' });
    if (!response.ok) throw new Error('Scene image request failed');
    fetched = true;
  } catch (error) {
    signal?.throwIfAborted();
    const cached = await cache?.match(key).catch(() => undefined);
    if (!cached) throw error;
    response = cached;
  }
  const savedResponse = fetched && cache ? response.clone() : null;
  const image = await decodeSceneBlob(await response.blob(), signal);
  signal?.throwIfAborted();
  if (cache && savedResponse) {
    try {
      // Reinsert for deterministic oldest-first eviction even on renewed fetches.
      await cache.delete(key);
      await cache.put(key, savedResponse);
      const keys = await cache.keys();
      for (const stale of keys.slice(0, Math.max(0, keys.length - MAX_STORED_SCENES))) await cache.delete(stale);
    } catch { /* The already decoded image remains usable when persistent storage is full. */ }
  }
  signal?.throwIfAborted();
  decodedScenes.set(key, image);
  const decodedBytes = () => [...decodedScenes.values()].reduce((bytes, value) => bytes + value.naturalWidth * value.naturalHeight * 4, 0);
  while (decodedScenes.size > MAX_DECODED_SCENES || decodedBytes() > MAX_DECODED_BYTES) {
    const oldest = decodedScenes.keys().next().value;
    if (oldest !== undefined) decodedScenes.delete(oldest);
  }
  return image;
}

/** Release decoded image references on explicit cache cleanup or account changes. */
export function clearSceneImageMemory(): void { decodedScenes.clear(); }
