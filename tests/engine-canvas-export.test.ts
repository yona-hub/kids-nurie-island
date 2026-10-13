import { describe, expect, it, vi } from 'vitest';
import { canvasBlob, type EngineCanvas } from '../packages/coloring-engine/src/canvas';

describe('browser canvas export APIs', () => {
  it.each(['image/png', 'image/webp'] as const)('settles %s when an OffscreenCanvas also exposes the legacy promise toBlob API', async (type) => {
    const encoded = new Blob(['encoded image'], { type });
    // Firefox's deprecated OffscreenCanvas.toBlob returns a Promise; it never
    // invokes an HTMLCanvasElement-style callback. Both methods exist at once.
    const legacyToBlob = vi.fn(() => Promise.resolve(encoded));
    const convertToBlob = vi.fn(async () => encoded);
    const canvas: EngineCanvas = { width: 8, height: 8, getContext: () => null, toBlob: legacyToBlob, convertToBlob };
    expect(await canvasBlob(canvas, type, 0.82)).toBe(encoded);
    expect(convertToBlob).toHaveBeenCalledWith({ type, quality: 0.82 });
    expect(legacyToBlob).not.toHaveBeenCalled();
  }, 1000);

  it('exports a DOM canvas through its callback when convertToBlob is absent', async () => {
    const encoded = new Blob(['encoded image'], { type: 'image/png' });
    const toBlob = vi.fn((callback: BlobCallback) => callback(encoded));
    const canvas: EngineCanvas = { width: 8, height: 8, getContext: () => null, toBlob };
    expect(await canvasBlob(canvas, 'image/png')).toBe(encoded);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', undefined);
  });

  it('propagates a rejected standard encoder without falling into the legacy API', async () => {
    const failure = new DOMException('Image encoding failed', 'EncodingError');
    const toBlob = vi.fn();
    const canvas: EngineCanvas = { width: 8, height: 8, getContext: () => null, toBlob, convertToBlob: async () => { throw failure; } };
    await expect(canvasBlob(canvas, 'image/png')).rejects.toBe(failure);
    expect(toBlob).not.toHaveBeenCalled();
  }, 1000);

  it('rejects a failed DOM canvas encoder so UI error handling can recover', async () => {
    const canvas: EngineCanvas = { width: 8, height: 8, getContext: () => null, toBlob: callback => callback(null) };
    await expect(canvasBlob(canvas, 'image/png')).rejects.toThrow('画像を書き出せませんでした');
  });
});
