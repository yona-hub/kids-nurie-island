import { afterAll, describe, expect, it } from 'vitest';
import { createCanvas, Path2D as NativePath } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
import { arch, platform } from 'node:os';
import { ColoringEngine, type EngineCanvas } from '../packages/coloring-engine/src/index';
import type { PaintType, Region, Template } from '../packages/shared-types/src/index';

const timings: Record<string, unknown> = {};
const percentile = (values: number[], p: number) => [...values].sort((left, right) => left - right)[Math.min(values.length - 1, Math.floor(values.length * p))];

function benchmarkTemplate(): Template {
  const regions: Region[] = Array.from({ length: 35 }, (_, index) => {
    const x = 90 + index % 5 * 290; const y = 60 + Math.floor(index / 5) * 280;
    return {
      id: `area-${index}`, name: `領域${index}`, path: `M${x + 20} ${y}Q${x} ${y} ${x} ${y + 30}V${y + 210}Q${x} ${y + 240} ${x + 25} ${y + 240}H${x + 200}Q${x + 225} ${y + 240} ${x + 225} ${y + 210}V${y + 30}Q${x + 225} ${y} ${x + 205} ${y}Z`,
      bounds: { x, y, width: 225, height: 240 },
      material: (['standard', 'hair', 'fur', 'metal', 'wood', 'glass', 'stone'] as const)[index % 7], confidence: 1, shade: true, highlight: true, texture: 0.6, direction: 85, seed: index,
    };
  });
  return { schemaVersion: 1, id: 'performance-shapes', themeId: 'robots', title: '負荷試験', width: 1600, height: 2000, defaultColorFamily: 'blue', approved: true, regions, details: [], lineWidth: 12 };
}

describe('CPU canvas performance budget', () => {
  it('updates one region within 100 ms and bounds memory at the capped display size', () => {
    const display = createCanvas(800, 1000) as unknown as EngineCanvas;
    const engine = new ColoringEngine(display, {
      createCanvas: (width, height) => createCanvas(width, height) as unknown as EngineCanvas,
      createPath: (path) => new NativePath(path) as unknown as Path2D,
      requestFrame: () => 1, cancelFrame: () => undefined,
    });
    const content = benchmarkTemplate();
    engine.resize(800, 1000, 2);
    engine.loadTemplate(content);
    for (const material of ['smooth', 'crayon', 'pencil'] as PaintType[]) {
      const samples: number[] = [];
      for (let iteration = 0; iteration < 70; iteration++) {
        const start = performance.now();
        engine.paint(`area-${iteration % 35}`, { color: iteration < 35 ? '#2F80ED' : '#FF6AA3', paintType: material }, undefined, true);
        samples.push(performance.now() - start);
      }
      timings[material] = { p50Ms: percentile(samples, 0.5), p95Ms: percentile(samples, 0.95), maximumMs: Math.max(...samples), samples: samples.length };
      // A broad maximum guards severe regressions without treating this host as
      // evidence for a physical Android phone. Real-device release QA is separate.
      expect(percentile(samples, 0.95)).toBeLessThan(100);
    }
    const exportStart = performance.now();
    const snapshot = engine.renderSnapshot();
    timings.exportRenderMs = performance.now() - exportStart;
    timings.backingSize = { width: display.width, height: display.height };
    timings.metrics = engine.getMetrics();
    expect(engine.getMetrics().cacheBytes).toBeLessThanOrEqual(16 * 1024 * 1024);
    expect(engine.getMetrics().layerBytes).toBeLessThanOrEqual(24_576_000);
    expect(snapshot.width).toBe(2048);
    snapshot.width = 1; snapshot.height = 1;
    engine.dispose();
  });
});

afterAll(() => {
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/engine-performance.json', JSON.stringify({ environment: { platform: platform(), arch: arch(), renderer: '@napi-rs/canvas CPU (not a browser or mobile device)' }, ...timings }, null, 2));
});
