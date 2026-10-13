import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSceneImageMemory, loadSceneImage } from '../packages/coloring-engine/src/index';

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2000"><rect width="1600" height="2000" fill="#cceeff"/></svg>';
const requests = new Map<string, Response>();
let decodeFailure = false;

function mockStorage() {
  const cache = {
    match: vi.fn(async (url: string) => requests.get(url)?.clone()),
    put: vi.fn(async (url: string, response: Response) => { requests.set(url, response); }),
    delete: vi.fn(async (url: string | Request) => requests.delete(typeof url === 'string' ? url : url.url)),
    keys: vi.fn(async () => [...requests.keys()].map((url) => new Request(url))),
  };
  vi.stubGlobal('caches', { open: vi.fn(async () => cache) });
  return cache;
}

beforeEach(() => {
  clearSceneImageMemory(); requests.clear(); decodeFailure = false;
  vi.stubGlobal('location', { href: 'https://island.test/editor/one' });
  // Network/cache behavior is tested independently from the real SVG decoder;
  // SVG pixels are covered by the native content render integration test.
  vi.stubGlobal('Image', class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(value: string) {
      if (value) queueMicrotask(() => { if (decodeFailure) this.onerror?.(); else this.onload?.(); });
    }
  });
  vi.stubGlobal('fetch', vi.fn(async () => new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } })));
});

afterEach(() => { clearSceneImageMemory(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('scene image offline lifecycle', () => {
  it('restores first-visit scenes from CacheStorage without a controlled service worker', async () => {
    const cache = mockStorage();
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    await loadSceneImage('/content/backgrounds/sky.svg');
    expect(cache.put).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledTimes(1);
    clearSceneImageMemory();
    vi.mocked(fetch).mockRejectedValue(new TypeError('Offline'));
    await expect(loadSceneImage('/content/backgrounds/sky.svg')).resolves.toBeDefined();
    expect(cache.match).toHaveBeenCalledWith('https://island.test/content/backgrounds/sky.svg');
    expect(revoke).toHaveBeenCalledTimes(2);
  });

  it('limits stored scenes and the decoded image working set', async () => {
    mockStorage();
    for (let index = 0; index < 45; index++) await loadSceneImage(`/content/frames/${index}.svg`);
    expect(requests.size).toBe(40);
    expect(requests.has('https://island.test/content/frames/0.svg')).toBe(false);
    await loadSceneImage('/content/frames/44.svg');
    expect(fetch).toHaveBeenCalledTimes(45);
    await loadSceneImage('/content/frames/35.svg');
    expect(fetch).toHaveBeenCalledTimes(46);
  });

  it('keeps online images usable when persistent storage is unavailable', async () => {
    vi.stubGlobal('caches', { open: vi.fn(async () => { throw new DOMException('Storage blocked', 'SecurityError'); }) });
    await expect(loadSceneImage('/content/backgrounds/sky.svg')).resolves.toBeDefined();
  });

  it('does not cache undecodable data and always revokes the Blob URL', async () => {
    const cache = mockStorage();
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    decodeFailure = true;
    await expect(loadSceneImage('/content/backgrounds/invalid.svg')).rejects.toThrow('読み込めません');
    expect(cache.put).not.toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it('honors cancellation without returning a superseded image from cache', async () => {
    mockStorage();
    await loadSceneImage('/content/backgrounds/sky.svg');
    const controller = new AbortController(); controller.abort();
    await expect(loadSceneImage('/content/backgrounds/sky.svg', controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});
