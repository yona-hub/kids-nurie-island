import { afterAll, describe, expect, it } from 'vitest';
import { createCanvas, Path2D as NativePath, loadImage } from '@napi-rs/canvas';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ColoringEngine, type EngineCanvas } from '../packages/coloring-engine/src/index';
import type { RegionPaints, Template, TemplateSummary } from '../packages/shared-types/src/index';

const catalog = JSON.parse(readFileSync('content/storybook-generated/compiled/legacy-catalog.json', 'utf8')) as TemplateSummary[];
const colors = ['#FF8FBA', '#25C95B', '#FFDE57', '#4EAEFF', '#BA7A4B', '#B783FF', '#FFD8B2', '#FF6157', '#A7EFB5', '#858C98', '#FF922E'];
const sheet = createCanvas(1500, 850);
const sheetContext = sheet.getContext('2d');
sheetContext.fillStyle = '#EDF5F5'; sheetContext.fillRect(0, 0, 1500, 850);
const report: Record<string, unknown>[] = [];

describe('all ten retained adopted templates in the legacy painting engine', () => {
  it('contains ten approved templates', () => expect(catalog).toHaveLength(10));
  for (const [index, entry] of catalog.entries()) {
    it(`${entry.id}: every region is tappable, materials mix, and export matches the completed screen`, async () => {
      const template = JSON.parse(readFileSync(`apps/web/public${entry.assetUrl}`, 'utf8')) as Template;
      const display = createCanvas(800, 1000);
      const engine = new ColoringEngine(display as unknown as EngineCanvas, {
        createCanvas: (width, height) => createCanvas(width, height) as unknown as EngineCanvas,
        createPath: (path) => new NativePath(path) as unknown as Path2D,
        requestFrame: () => 1, cancelFrame: () => undefined,
      });
      engine.loadTemplate(template);
      const inaccessible: string[] = [];
      for (const region of template.regions) {
        const b = region.bounds;
        let found = false;
        for (let y = b.y + 8; y < b.y + b.height - 5 && !found; y += 8) {
          for (let x = b.x + 8; x < b.x + b.width - 5; x += 8) {
            if (engine.hitTest({ x, y }, false) === region.id) { found = true; break; }
          }
        }
        if (!found) inaccessible.push(region.id);
      }
      expect(inaccessible).toEqual([]);
      const regions: RegionPaints = Object.fromEntries(template.regions.map((region, i) => [region.id, { color: colors[i % colors.length], paintType: (['smooth', 'crayon', 'pencil'] as const)[i % 3] }]));
      const start = performance.now();
      engine.setScene({ regions });
      const renderMs = performance.now() - start;
      const snapshot = engine.renderSnapshot(800);
      const actual = display.getContext('2d').getImageData(0, 0, 800, 1000).data;
      const expected = snapshot.getContext('2d')!.getImageData(0, 0, 800, 1000).data;
      let substantialDifferences = 0;
      for (let pixel = 0; pixel < actual.length; pixel++) if (Math.abs(actual[pixel] - expected[pixel]) > 8) substantialDifferences++;
      // Separate transparent layers can differ by <=1 level at antialiased
      // intersections. Detect missing fills, changed patterns or wrong order.
      expect(substantialDifferences / actual.length).toBeLessThan(0.0005);
      const blob = await engine.exportPng();
      const png = Buffer.from(await blob.arrayBuffer());
      const image = await loadImage(png);
      const x = index % 5 * 300; const y = Math.floor(index / 5) * 425;
      sheetContext.drawImage(image, x + 10, y + 12, 280, 350);
      sheetContext.fillStyle = '#24383D'; sheetContext.font = '16px sans-serif';
      sheetContext.fillText(entry.id, x + 12, y + 384);
      sheetContext.font = '13px sans-serif'; sheetContext.fillText(`${template.regions.length} regions / 3 paint types`, x + 12, y + 405);
      report.push({ id: entry.id, regions: template.regions.length, inaccessible, initialPaintMs: renderMs, substantialPixelDifferences: substantialDifferences, pngBytes: png.length, metrics: engine.getMetrics() });
      snapshot.width = 1; snapshot.height = 1;
      engine.dispose();
    });
  }
});

afterAll(() => {
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/engine-content.png', sheet.toBuffer('image/png'));
  writeFileSync('test-results/engine-content.json', JSON.stringify(report, null, 2));
});
