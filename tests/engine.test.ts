import { describe, expect, it } from 'vitest';
import { createCanvas, Path2D as NativePath, loadImage } from '@napi-rs/canvas';
import type { MaterialType, Region, RegionPaints, Template } from '../packages/shared-types/src/index';
import { ColoringEngine, TapTracker, constrainViewport, fixedSeed, screenToLogical, seededRandom, zoomViewportAt, type EngineCanvas } from '../packages/coloring-engine/src/index';

const materials: MaterialType[] = ['standard', 'skin', 'hair', 'fur', 'fabric', 'metal', 'plastic', 'glass', 'rubber', 'wood', 'stone'];

function region(id: string, x: number, y: number, material: MaterialType = 'standard'): Region {
  return { id, name: id, path: `M${x} ${y}h260v300h-260Z`, bounds: { x, y, width: 260, height: 300 }, material, confidence: 1, shade: true, highlight: true, texture: 0.7, direction: 80, seed: 321 };
}

const template: Template = {
  schemaVersion: 1, id: 'engine-test', themeId: 'robots', title: '検証用領域', width: 1600, height: 2000,
  approved: true, defaultColorFamily: 'blue', lineWidth: 12,
  regions: materials.map((material, index) => region(`r${index}`, 100 + (index % 4) * 360, 140 + Math.floor(index / 4) * 480, material)),
  details: [{ path: 'M150 190L300 190', strokeWidth: 10 }],
};

function harness(options: { maxCacheBytes?: number } = {}) {
  const canvas = createCanvas(800, 1000);
  const allocated: EngineCanvas[] = [];
  let time = 1_000;
  let frameId = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  const engine = new ColoringEngine(canvas as unknown as EngineCanvas, {
    createCanvas: (width, height) => {
      const native = createCanvas(width, height);
      const nativeConvert = native.convertToBlob.bind(native);
      const result = native as unknown as EngineCanvas;
      // The injected native library calls this option `mime`; the browser
      // OffscreenCanvas contract used by EngineCanvas calls it `type`.
      result.convertToBlob = options => nativeConvert({ mime: options?.type, quality: options?.quality });
      allocated.push(result);
      return result;
    },
    createPath: (path) => new NativePath(path) as unknown as Path2D,
    now: () => time,
    requestFrame: (callback) => { callbacks.set(++frameId, callback); return frameId; },
    cancelFrame: (id) => { callbacks.delete(id); },
    ...options,
  });
  engine.loadTemplate(template);
  const tick = (milliseconds = 16) => {
    time += milliseconds;
    const pending = [...callbacks.values()];
    callbacks.clear();
    for (const callback of pending) callback(time);
  };
  return { engine, canvas, callbacks, allocated, tick };
}

function pixels(canvas: EngineCanvas): Uint8ClampedArray {
  return canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
}

function pixel(canvas: EngineCanvas, x: number, y: number): number[] {
  return [...canvas.getContext('2d')!.getImageData(x, y, 1, 1).data];
}

function painting(): RegionPaints {
  return Object.fromEntries(template.regions.map((item, index) => [item.id, { color: '#2F80ED', paintType: (['smooth', 'crayon', 'pencil'] as const)[index % 3] }]));
}

describe('canvas painting, layering and reproducibility', () => {
  it('picks the frontmost closed shape with a logical identity hit context', () => {
    const { engine } = harness();
    engine.loadTemplate({ ...template, regions: [region('back', 100, 140), region('front', 200, 220)] });
    expect(engine.hitTest({ x: 260, y: 300 })).toBe('front');
    expect(engine.hitTest({ x: 110, y: 150 })).toBe('back');
    engine.resize(390, 487.5, 3);
    expect(engine.hitTest({ x: 260, y: 300 })).toBe('front');
    expect(engine.hitTest({ x: 0, y: 0 })).toBeNull();
    expect(engine.hitTest({ x: -4, y: 150 })).toBeNull();
    expect(engine.hitTest({ x: Number.NaN, y: 150 })).toBeNull();
    expect(engine.hitTest({ x: 92, y: 300 }, false)).toBeNull();
    expect(engine.hitTest({ x: 92, y: 300 }, true)).toBe('back');
    engine.dispose();
  });

  it('keeps a white subject over the independent background, including erase', () => {
    const { engine } = harness();
    const background = createCanvas(1600, 2000);
    const context = background.getContext('2d');
    context.fillStyle = '#12A855'; context.fillRect(0, 0, 1600, 2000);
    engine.setScene({ background: background as unknown as CanvasImageSource });
    engine.paint('r0', { color: '#FF6157', paintType: 'crayon' }, undefined, true);
    engine.paint('r0', null);
    const snapshot = engine.renderSnapshot(800);
    expect(pixel(snapshot, 5, 5)).toEqual([18, 168, 85, 255]);
    expect(pixel(snapshot, 120, 150)).toEqual([255, 255, 255, 255]);
    expect(engine.getPaints()).toEqual({});
    engine.dispose();
  });

  it('completely overwrites the former paint and allows three materials in one work', () => {
    const { engine } = harness();
    engine.setScene({ regions: painting() });
    engine.paint('r0', { color: '#F44336', paintType: 'crayon' }, undefined, true);
    engine.paint('r0', { color: '#2F80ED', paintType: 'smooth' }, undefined, true);
    const overwritten = pixels(engine.renderSnapshot(400));
    const fresh = harness();
    fresh.engine.setScene({ regions: painting() });
    expect(Buffer.from(overwritten).equals(Buffer.from(pixels(fresh.engine.renderSnapshot(400))))).toBe(true);
    expect(new Set(Object.values(engine.getPaints()).map((paint) => paint.paintType)).size).toBe(3);
    engine.dispose(); fresh.engine.dispose();
  });

  it('uses stable texture at any session, raster size and tap origin', () => {
    const first = harness(); const second = harness();
    first.engine.setScene({ regions: painting() });
    second.engine.setScene({ regions: painting() });
    first.engine.paint('r0', { color: '#8445D8', paintType: 'pencil' }, { x: 110, y: 150 });
    second.engine.paint('r0', { color: '#8445D8', paintType: 'pencil' }, { x: 350, y: 430 });
    second.engine.resize(960, 1200, 2);
    const left = pixels(first.engine.renderSnapshot(800));
    const right = pixels(second.engine.renderSnapshot(800));
    expect(Buffer.from(left).equals(Buffer.from(right))).toBe(true);
    first.tick(220);
    expect(Buffer.from(pixels(first.engine.renderSnapshot(800))).equals(Buffer.from(right))).toBe(true);
    first.engine.dispose(); second.engine.dispose();
  });

  it('keeps the composited display equivalent to a deterministic export at matching size', () => {
    const { engine, canvas } = harness();
    engine.setScene({ regions: painting() });
    const preview = pixels(canvas as unknown as EngineCanvas);
    const exportPixels = pixels(engine.renderSnapshot(800));
    let changed = 0; let maxDifference = 0;
    for (let index = 0; index < preview.length; index++) {
      const difference = Math.abs(preview[index] - exportPixels[index]);
      if (difference > 2) changed++;
      maxDifference = Math.max(maxDifference, difference);
    }
    expect(changed / preview.length).toBeLessThan(0.00005);
    expect(maxDifference).toBeLessThanOrEqual(4);
    engine.dispose();
  });

  it('composites details and decorative frame above paint', () => {
    const { engine } = harness();
    const frame = createCanvas(1600, 2000);
    const context = frame.getContext('2d'); context.fillStyle = '#F44336'; context.fillRect(0, 0, 1600, 35);
    engine.setScene({ regions: painting(), frame: frame as unknown as CanvasImageSource });
    const snapshot = engine.renderSnapshot(800);
    expect(pixel(snapshot, 200, 8)).toEqual([244, 67, 54, 255]);
    expect(pixel(snapshot, 110, 95)).toEqual([0, 0, 0, 255]);
    engine.dispose();
  });

  it.each([0, -6])('does not add region outlines when lineWidth is %s, while preserving the filled original ink in display and PNG', async (lineWidth) => {
    const { engine, canvas } = harness();
    engine.loadTemplate({
      ...template, lineWidth,
      regions: [{ ...region('subject', 100, 140), shade: false, highlight: false, texture: 0 }],
      details: [{ path: 'M160 160H180V240H160Z', fill: '#000000', strokeWidth: 0 }],
    });
    for (const image of [canvas as unknown as EngineCanvas, engine.renderSnapshot(800)]) {
      expect(pixel(image, 50, 100)).toEqual([255, 255, 255, 255]);
      expect(pixel(image, 85, 100)).toEqual([0, 0, 0, 255]);
      expect(pixel(image, 79, 100)).toEqual([255, 255, 255, 255]);
    }
    expect(engine.hitTest({ x: 120, y: 200 }, false)).toBe('subject');
    engine.paint('subject', { color: '#F44336', paintType: 'smooth' }, undefined, true);
    expect(pixel(canvas as unknown as EngineCanvas, 50, 100)).toEqual([244, 67, 54, 255]);
    expect(pixel(canvas as unknown as EngineCanvas, 85, 100)).toEqual([0, 0, 0, 255]);
    const png = await loadImage(Buffer.from(await (await engine.exportPng()).arrayBuffer()));
    const decoded = createCanvas(png.width, png.height);
    decoded.getContext('2d').drawImage(png, 0, 0);
    expect(pixel(decoded as unknown as EngineCanvas, 128, 256)).toEqual([244, 67, 54, 255]);
    expect(pixel(decoded as unknown as EngineCanvas, 218, 256)).toEqual([0, 0, 0, 255]);
    engine.paint('subject', null);
    expect(pixel(canvas as unknown as EngineCanvas, 50, 100)).toEqual([255, 255, 255, 255]);
    expect(pixel(canvas as unknown as EngineCanvas, 85, 100)).toEqual([0, 0, 0, 255]);
    engine.dispose();
  });

  it('exports real PNG 2048×2560 and decodable WebP thumbnails', async () => {
    const { engine } = harness();
    engine.setScene({ regions: painting() });
    const png = await engine.exportPng();
    const bytes = Buffer.from(await png.arrayBuffer());
    expect(png.type).toBe('image/png');
    expect(bytes.subarray(1, 4).toString()).toBe('PNG');
    const decoded = await loadImage(bytes);
    expect([decoded.width, decoded.height]).toEqual([2048, 2560]);
    const thumbnail = await engine.exportThumbnail();
    expect(thumbnail.type).toBe('image/webp');
    const small = await loadImage(Buffer.from(await thumbnail.arrayBuffer()));
    expect([small.width, small.height]).toEqual([320, 400]);
    engine.dispose();
  });

  it('makes all eleven materials deterministic and keeps white and black understated', () => {
    const { engine } = harness();
    for (const color of ['#FFFFFF', '#000000']) {
      engine.setScene({ regions: Object.fromEntries(template.regions.map((item) => [item.id, { color, paintType: 'smooth' }])) });
      const snapshot = engine.renderSnapshot(800);
      for (const item of template.regions) {
        const value = pixel(snapshot, Math.floor((item.bounds.x + 130) / 2), Math.floor((item.bounds.y + 160) / 2))[0];
        if (color === '#FFFFFF') expect(value).toBeGreaterThan(230);
        else expect(value).toBeLessThan(48);
      }
    }
    engine.dispose();
  });
});

describe('nonblocking feedback and bounded resources', () => {
  it('updates state immediately, preserves same-content scene updates, and completes within 220 ms', () => {
    const { engine, tick, callbacks } = harness();
    engine.paint('r0', { color: '#F44336', paintType: 'smooth' }, { x: 200, y: 300 });
    engine.paint('r1', { color: '#2598FF', paintType: 'crayon' }, { x: 600, y: 300 });
    engine.paint('r2', { color: '#25C95B', paintType: 'pencil' }, { x: 950, y: 300 });
    expect(Object.keys(engine.getPaints())).toHaveLength(3);
    expect(engine.getMetrics().activeAnimations).toBe(3);
    engine.setScene({ regions: engine.getPaints() });
    expect(engine.getMetrics().activeAnimations).toBe(3);
    expect(callbacks.size).toBe(1);
    tick(220);
    expect(engine.getMetrics().activeAnimations).toBe(0);
    expect(callbacks.size).toBe(0);
    engine.dispose();
  });

  it('cancels obsolete spreading and respects reduced motion without delaying paint', () => {
    const { engine, tick } = harness();
    engine.paint('r0', { color: '#F44336', paintType: 'smooth' }, { x: 200, y: 300 });
    tick(30);
    engine.paint('r0', { color: '#25C95B', paintType: 'pencil' }, { x: 200, y: 300 });
    tick(220);
    expect(engine.getPaints().r0).toEqual({ color: '#25C95B', paintType: 'pencil' });
    engine.paint('r0', null);
    expect(engine.getPaints().r0).toBeUndefined();
    engine.paint('r0', { color: '#F44336', paintType: 'smooth' }, { x: 200, y: 300 }, true);
    expect(engine.getMetrics().activeAnimations).toBe(0);
    engine.dispose();
  });

  it('builds only the changed texture and bounds the cache across many replacements', () => {
    const { engine } = harness({ maxCacheBytes: 3 * 1024 * 1024 });
    engine.setScene({ regions: painting() });
    const before = engine.getMetrics().textureBuilds;
    engine.paint('r0', { color: '#F44336', paintType: 'pencil' }, undefined, true);
    expect(engine.getMetrics().textureBuilds - before).toBe(1);
    for (let index = 0; index < 90; index++) engine.paint(`r${index % 11}`, { color: `#${(index * 751 + 12900).toString(16).padStart(6, '0')}`, paintType: 'crayon' }, undefined, true);
    expect(engine.getMetrics().cacheBytes).toBeLessThanOrEqual(3 * 1024 * 1024);
    engine.dispose();
    expect(engine.getMetrics().cacheBytes).toBe(0);
  });

  it('releases all internal surfaces and scheduled frames on dispose', () => {
    const { engine, callbacks, allocated } = harness();
    engine.setScene({ regions: painting() });
    engine.paint('r0', { color: '#F44336', paintType: 'smooth' }, { x: 200, y: 300 });
    engine.dispose(); engine.dispose();
    expect(callbacks.size).toBe(0);
    expect(allocated.every((canvas) => canvas.width === 1 && canvas.height === 1)).toBe(true);
    expect(() => engine.paint('r0', null)).toThrow();
  });

  it('limits device pixel ratio and backing memory on large high-density screens', () => {
    const { engine, canvas } = harness();
    engine.resize(3000, 3750, 4);
    expect(canvas.width / canvas.height).toBe(0.8);
    expect(canvas.width * canvas.height).toBeLessThanOrEqual(2_048_000);
    engine.resize(400, 500, 4);
    expect([canvas.width, canvas.height]).toEqual([800, 1000]);
    engine.dispose();
  });

  it('rejects invalid content before replacing the working template', () => {
    const { engine } = harness();
    expect(() => engine.loadTemplate({ ...template, approved: false })).toThrow();
    expect(() => engine.loadTemplate({ ...template, regions: [region('r0', 100, 100), region('r0', 500, 500)] })).toThrow();
    expect(() => engine.paint('r0', { color: 'red', paintType: 'smooth' })).toThrow();
    expect(engine.hitTest({ x: 200, y: 300 })).toBe('r0');
    engine.dispose();
  });
});

describe('gesture geometry', () => {
  it('keeps the pointer anchored and clamps oversized drags', () => {
    const size = { width: 400, height: 500 };
    const view = zoomViewportAt({ scale: 1, x: 0, y: 0 }, 2, { x: 100, y: 200 }, size);
    expect(view).toEqual({ scale: 2, x: -100, y: -200 });
    expect(screenToLogical({ x: 100, y: 200 }, view, size)).toEqual({ x: 400, y: 800 });
    expect(constrainViewport({ scale: 9, x: -5000, y: 9999 }, size)).toEqual({ scale: 4, x: -1200, y: 0 });
    expect(constrainViewport({ scale: 1, x: 500, y: -300 }, size)).toEqual({ scale: 1, x: 0, y: 0 });
  });

  it('never treats a pan out and back or pinch as a paint tap', () => {
    const tracker = new TapTracker();
    tracker.begin({ x: 10, y: 10 }); tracker.move({ x: 30, y: 10 });
    expect(tracker.end({ x: 10, y: 10 })).toBe(false);
    tracker.begin({ x: 10, y: 10 }); tracker.markMultiplePointers();
    expect(tracker.end({ x: 10, y: 10 })).toBe(false);
    tracker.begin({ x: 10, y: 10 });
    expect(tracker.end({ x: 13, y: 12 })).toBe(true);
    tracker.begin({ x: 10, y: 10 }); tracker.cancel();
    expect(tracker.end({ x: 10, y: 10 })).toBe(false);
  });

  it('uses fixed seeds without ambient random state', () => {
    const first = seededRandom(fixedSeed('template:region:pencil'));
    const second = seededRandom(fixedSeed('template:region:pencil'));
    expect(Array.from({ length: 20 }, first)).toEqual(Array.from({ length: 20 }, second));
    expect(fixedSeed('template:region:pencil')).not.toBe(fixedSeed('template:region:crayon'));
  });
});
