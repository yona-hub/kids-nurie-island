import { afterAll, describe, expect, it } from 'vitest';
import { createCanvas, Path2D as NativePath } from '@napi-rs/canvas';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { ColoringEngine, revealViewportRegion, type EngineCanvas, type Viewport } from '../packages/coloring-engine/src/index';
import type { Template, TemplateSummary } from '../packages/shared-types/src/index';

const catalog = JSON.parse(readFileSync('content/storybook-generated/compiled/legacy-catalog.json', 'utf8')) as TemplateSummary[];
const templates = catalog.map(entry => JSON.parse(readFileSync(`apps/web/public${entry.assetUrl}`, 'utf8')) as Template);
const evidence: { templateId: string; regions: number; initialLookupMs: number[] }[] = [];
const size = { width: 400, height: 500 };
function engineFor(template: Template) {
  const engine = new ColoringEngine(createCanvas(320, 400) as unknown as EngineCanvas, {
    createCanvas: (width, height) => createCanvas(width, height) as unknown as EngineCanvas,
    createPath: path => new NativePath(path) as unknown as Path2D,
  });
  engine.resize(320, 400, 1); engine.loadTemplate(template);
  return engine;
}

describe('keyboard interior anchors and viewport reveal', () => {
  it.each(templates)('$id: all approved regions have a visible, exact hit anchor at zoom 1, 2 and 4', template => {
    const engine = engineFor(template), before = engine.getMetrics();
    const times: number[] = [];
    try {
      const points = template.regions.map(region => {
        const start = performance.now(), point = engine.getRegionPoint(region.id);
        times.push(performance.now() - start);
        expect(point, region.id).not.toBeNull();
        expect(engine.hitTest(point!, false), region.id).toBe(region.id);
        return point!;
      });
      // Focus queries neither rerasterize the picture nor allocate texture surfaces.
      expect(engine.getMetrics()).toEqual(before);
      for (const scale of [1, 2, 4]) {
        let view: Viewport = { scale, x: size.width * (1 - scale) / 2, y: size.height * (1 - scale) / 2 };
        for (const reverse of [false, true]) {
          const indices = template.regions.map((_, index) => index);
          for (const index of reverse ? indices.reverse() : indices) {
            const region = template.regions[index], point = points[index];
            view = revealViewportRegion(view, region.bounds, point, size);
            const screen = { x: point.x / 1600 * size.width * scale + view.x, y: point.y / 2000 * size.height * scale + view.y };
            expect(view.scale).toBe(scale);
            expect(screen.x, `${region.id} x`).toBeGreaterThanOrEqual(0);
            expect(screen.x, `${region.id} x`).toBeLessThanOrEqual(size.width);
            expect(screen.y, `${region.id} y`).toBeGreaterThanOrEqual(0);
            expect(screen.y, `${region.id} y`).toBeLessThanOrEqual(size.height);
          }
        }
      }
      evidence.push({ templateId: template.id, regions: template.regions.length, initialLookupMs: times });
    } finally { engine.dispose(); }
  });

  it('avoids a central hole and returns cached point copies', () => {
    const region = { ...templates[0].regions[0], id: 'ring', bounds: { x: 100, y: 100, width: 1400, height: 1800 }, path: 'M100 100H1500V1900H100Z M300 300V1700H1300V300Z' };
    const engine = engineFor({ ...templates[0], regions: [region], details: [], lineWidth: 0 });
    expect(engine.hitTest({ x: 800, y: 1000 }, false)).toBeNull();
    const point = engine.getRegionPoint('ring')!;
    expect(engine.hitTest(point, false)).toBe('ring');
    const expected = { ...point }; point.x = -10000;
    expect(engine.getRegionPoint('ring')).toEqual(expected);
    engine.dispose();
  });

  it('does not expose an occluded point or retain it after a new template', () => {
    const back = { ...templates[0].regions[0], id: 'back', path: 'M100 100H800V900H100Z', bounds: { x: 100, y: 100, width: 700, height: 800 } };
    const front = { ...back, id: 'front' };
    const template = { ...templates[0], regions: [back, front], details: [], lineWidth: 0 };
    const engine = engineFor(template);
    expect(engine.getRegionPoint('back')).toBeNull();
    expect(engine.hitTest(engine.getRegionPoint('front')!, false)).toBe('front');
    engine.loadTemplate({ ...template, regions: [back] });
    expect(engine.hitTest(engine.getRegionPoint('back')!, false)).toBe('back');
    engine.dispose();
  });
});

afterAll(() => {
  const times = evidence.flatMap(entry => entry.initialLookupMs).sort((a, b) => a - b);
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/keyboard-region-anchors.json', JSON.stringify({ measuredAt: new Date().toISOString(), method: 'At most 337 fixed candidates against already compiled Path2D; point cache only; no raster inspection or segmentation', totalRegions: times.length, p95Ms: times[Math.floor(times.length * 0.95)], maxMs: times.at(-1), templates: evidence }, null, 2));
});
