export const CONTENT_DATA_CACHE = 'island-content-data-v1';
export const CONTENT_ART_CACHE = 'island-art-v1';
export const CONTENT_SCENE_CACHE = 'island-scene-images-v1';
export const MANIFEST_CACHE_HEADER = 'X-Island-Content-Cache';

/** Legacy fixed names and immutable, resolution-specific generated home art. */
export function isHomeIllustration(pathname: string): boolean {
  return /^\/images\/islands\/[a-z]+-v\d+(?:(?:-(?:small|tiny))?|-(?:480|960)\.[a-f0-9]{64})\.webp$/.test(pathname);
}

export function isContentManifest(pathname: string): boolean {
  return /^\/content\/(catalog|backgrounds|frames|upgrade-index)\.json$/.test(pathname);
}

export function isImmutableContentAsset(pathname: string): boolean {
  return /^\/content\/(templates|backgrounds|frames|decor|media)\/[a-z0-9-]+\.[a-f0-9]{64}\.(json|svg|png)$/.test(pathname);
}

export function isTemplateAssetUrl(url: string, id: string): boolean {
  return new RegExp(`^/content/templates/${id}(?:\\.[a-f0-9]{64})?\\.json$`).test(url);
}

/** Cache enumeration only reads known content caches, never user project storage. */
export async function cachedRevisionUrl(kind: 'templates' | 'backgrounds' | 'frames', id: string, currentUrl?: string): Promise<string | undefined> {
  if (!/^[a-z0-9-]{1,80}$/.test(id) || typeof caches === 'undefined') return undefined;
  const extension = kind === 'templates' ? 'json' : '(?:svg|png)';
  const pattern = new RegExp(`^/content/${kind}/${id}(?:\\.[a-f0-9]{64})?\\.${extension}$`);
  const cacheNames = kind === 'templates' ? [CONTENT_DATA_CACHE, CONTENT_ART_CACHE] : [CONTENT_SCENE_CACHE, CONTENT_ART_CACHE];
  const alternatives: string[] = [];
  try {
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      if (currentUrl && await cache.match(currentUrl)) return currentUrl;
      for (const request of [...await cache.keys()].reverse()) {
        const pathname = new URL(request.url).pathname;
        if (pattern.test(pathname)) alternatives.push(pathname);
      }
    }
  } catch { /* Browsers may disable or evict cache storage. */ }
  return alternatives[0];
}

export async function cachedTemplateResponse(url: string): Promise<Response | undefined> {
  if (typeof caches === 'undefined') return undefined;
  for (const name of [CONTENT_DATA_CACHE, CONTENT_ART_CACHE]) {
    try {
      const result = await (await caches.open(name)).match(url);
      if (result) return result;
    } catch { /* Continue with the other bounded cache. */ }
  }
  return undefined;
}
