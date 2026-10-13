import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createCanvas, loadImage, Path2D as NativePath } from '@napi-rs/canvas';
import { describe, expect, it } from 'vitest';
import { ColoringEngine, constrainViewport, screenToLogical, type EngineCanvas } from '../packages/coloring-engine/src/index';
import type { Point, Template } from '../packages/shared-types/src/index';

interface RegionMetric { id: string; usableDiameter: number; labelPoint: [number, number] }
interface RasterQA { templateId: string; originalSha256: string; templateSha256: string; regions: RegionMetric[] }
const base = 'tools/asset-pipeline/output';
const evidenceBase = 'content/generated-lineart/interaction';
const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const round = (value: number) => Math.round(value * 1000) / 1000;
const requested = process.env.GENERATED_TEMPLATE_IDS?.split(',').filter(Boolean);
const versions = new Map<string, { id: string; version: number }>();
if (existsSync(base)) for (const id of readdirSync(base)) {
  const match = /^(gen-[a-z0-9-]+)-v(\d+)$/.exec(id);
  if (match && (!versions.has(match[1]) || versions.get(match[1])!.version < Number(match[2]))) versions.set(match[1], { id, version: Number(match[2]) });
}
const ids = requested ?? [...versions.values()].map(entry => entry.id).sort();

// Current 390×844 editor: 439px stage minus 9px vertical padding = 430px;
// its 4:5 drawing is 344px wide. The round trip uses integer CSS tap pixels.
const mobileScreen = { width: 390, height: 844 };
const content = { width: 344, height: 430 };
const paint = { color: '#DE246D', paintType: 'smooth' as const };
const colored = (pixel: number[]) => pixel[3] === 255 && pixel[0] > pixel[1] + 55 && pixel[2] > pixel[1] + 25;
function pixel(canvas: EngineCanvas, point: Point): number[] {
  return [...canvas.getContext('2d')!.getImageData(Math.floor(point.x * canvas.width / 1600), Math.floor(point.y * canvas.height / 2000), 1, 1).data];
}
async function decodedPng(engine: ColoringEngine) {
  const bytes = Buffer.from(await (await engine.exportPng()).arrayBuffer());
  const image = await loadImage(bytes);
  const canvas = createCanvas(image.width, image.height);
  canvas.getContext('2d').drawImage(image, 0, 0);
  expect([image.width, image.height]).toEqual([2048, 2560]);
  return { canvas: canvas as unknown as EngineCanvas, bytes, sha256: digest(bytes) };
}

describe.skipIf(ids.length === 0)('generated raster region interaction evidence', () => {
  it.each(ids.length ? ids : ['uncompiled-generated-assets'])('%s has reachable paint/erase targets at 4× zoom with recorded narrow-target limits', async id => {
    const directory = `${base}/${id}`;
    const templateBytes = readFileSync(`${directory}/template.json`);
    const template = JSON.parse(templateBytes.toString()) as Template;
    const qa = JSON.parse(readFileSync(`${directory}/qa.json`, 'utf8')) as RasterQA;
    const version = /-v(\d+)$/.exec(id)![1];
    const sourcePath = `content/generated-lineart/originals/${template.themeId}-v${version}.png`;
    expect(qa.originalSha256).toBe(digest(readFileSync(sourcePath)));
    expect(qa.templateSha256).toBe(digest(templateBytes));
    expect(qa.templateId).toBe(template.id);
    expect(template.lineWidth).toBe(0);
    const metrics = new Map(qa.regions.map(metric => [metric.id, metric]));
    expect([...metrics.keys()]).toEqual(template.regions.map(region => region.id));

    const canvas = createCanvas(688, 860) as unknown as EngineCanvas;
    const engine = new ColoringEngine(canvas, {
      createCanvas: (width, height) => createCanvas(width, height) as unknown as EngineCanvas,
      createPath: path => new NativePath(path) as unknown as Path2D,
      requestFrame: () => 1, cancelFrame: () => undefined,
    });
    // This test-only copy lets QA exercise unpublished data. It never changes
    // the source approval, catalog, image, contour, or compiler width threshold.
    engine.resize(content.width, content.height, 2);
    engine.loadTemplate({ ...template, approved: true });
    const blank = await decodedPng(engine);
    try {
      const records = template.regions.map(region => {
        const metric = metrics.get(region.id)!;
        const logical = { x: metric.labelPoint[0], y: metric.labelPoint[1] };
        const viewport = constrainViewport({ scale: 4, x: content.width / 2 - logical.x * content.width / 1600 * 4, y: content.height / 2 - logical.y * content.height / 2000 * 4 }, content);
        const screenPoint = { x: Math.round(logical.x / 1600 * content.width * 4 + viewport.x), y: Math.round(logical.y / 2000 * content.height * 4 + viewport.y) };
        const roundTrip = screenToLogical(screenPoint, viewport, content);
        const directHit = engine.hitTest(roundTrip, false), assistedHit = engine.hitTest(roundTrip, true);
        const inViewport = screenPoint.x >= 0 && screenPoint.x <= content.width && screenPoint.y >= 0 && screenPoint.y <= content.height;
        const blankDisplayPixel = pixel(canvas, logical);
        const jitter = [4, 8].map(radiusCssPx => {
          let directTargetHits = 0, assistedTargetHits = 0, misses = 0;
          const conflicts = new Map<string, number>();
          for (let step = 0; step < 8; step++) {
            const angle = step * Math.PI / 4;
            const sample = screenToLogical({ x: screenPoint.x + Math.cos(angle) * radiusCssPx, y: screenPoint.y + Math.sin(angle) * radiusCssPx }, viewport, content);
            if (engine.hitTest(sample, false) === region.id) directTargetHits++;
            const assisted = engine.hitTest(sample, true);
            if (assisted === region.id) assistedTargetHits++;
            else if (assisted === null) misses++;
            else conflicts.set(assisted, (conflicts.get(assisted) ?? 0) + 1);
          }
          return { radiusCssPx, samples: 8, directTargetHits, assistedTargetHits, misses, conflicts: Object.fromEntries(conflicts) };
        });
        engine.paint(region.id, paint, roundTrip, true);
        const paintedDisplayPixel = pixel(canvas, logical);
        return {
          id: region.id, pathSha256: digest(region.path), name: region.name,
          usableDiameter: metric.usableDiameter, screenDiameterAtZoom4: round(metric.usableDiameter * content.width / 1600 * 4),
          labelPoint: logical, viewport, screenPoint, roundTrip: { x: round(roundTrip.x), y: round(roundTrip.y) },
          directHit, assistedHit, hitAtZoom4: inViewport && directHit === region.id && assistedHit === region.id,
          painted: engine.getPaints()[region.id]?.color === paint.color && colored(paintedDisplayPixel),
          erased: false, blankDisplayPixel, paintedDisplayPixel, erasedDisplayPixel: [] as number[],
          blankPngPixel: pixel(blank.canvas, logical), paintedPngPixel: [] as number[], erasedPngPixel: [] as number[],
          jitter, widthExceptionCandidate: metric.usableDiameter >= 17 && metric.usableDiameter < 24,
          limitation: metric.usableDiameter < 17 ? 'Below the 17 logical px exception range; center reachability does not qualify this region for a width exception.' : null,
        };
      });
      const paintedPng = await decodedPng(engine);
      for (const record of records) {
        record.paintedPngPixel = pixel(paintedPng.canvas, record.labelPoint);
        record.painted = record.painted && colored(record.paintedPngPixel);
        engine.paint(record.id, null, record.roundTrip, true);
        record.erasedDisplayPixel = pixel(canvas, record.labelPoint);
        record.erased = engine.getPaints()[record.id] === undefined && JSON.stringify(record.erasedDisplayPixel) === JSON.stringify(record.blankDisplayPixel);
      }
      const erasedPng = await decodedPng(engine);
      for (const record of records) {
        record.erasedPngPixel = pixel(erasedPng.canvas, record.labelPoint);
        record.erased = record.erased && JSON.stringify(record.erasedPngPixel) === JSON.stringify(record.blankPngPixel);
      }
      const pass = records.every(record => record.hitAtZoom4 && record.painted && record.erased);
      const evidence = {
        schemaVersion: 1, measuredAt: new Date().toISOString(), templateId: id,
        originalSha256: qa.originalSha256, templateSha256: qa.templateSha256,
        sourcePath, templatePath: `${directory}/template.json`, mobileScreen, contentSize: content, pixelRatio: 2,
        method: 'Real ColoringEngine with @napi-rs/canvas. Test-only approved copy; original approval is unchanged. Every labelPoint is transformed through a constrained 4× viewport, rounded to integer CSS pixels, converted back with production screenToLogical, hit-tested with assist on/off, painted, erased, and sampled in the backing canvas and decoded 2048×2560 PNG. This is automated reachability evidence, not a child usability study. Jitter samples report neighboring-region conflicts; widths below 17 logical px are not exception candidates.',
        png: { width: 2048, height: 2560, paintedSha256: paintedPng.sha256, erasedSha256: erasedPng.sha256, erasedEqualsBlank: erasedPng.sha256 === blank.sha256 },
        pass, regions: records,
      };
      mkdirSync(evidenceBase, { recursive: true });
      mkdirSync('test-results/generated-interaction', { recursive: true });
      writeFileSync(`${evidenceBase}/${id}.json`, JSON.stringify(evidence, null, 2));
      writeFileSync(`test-results/generated-interaction/${id}-painted.png`, paintedPng.bytes);
      writeFileSync(`test-results/generated-interaction/${id}-erased.png`, erasedPng.bytes);
      paintedPng.canvas.width = 1; paintedPng.canvas.height = 1;
      erasedPng.canvas.width = 1; erasedPng.canvas.height = 1;
      // Compiler inputs may be regenerated concurrently. Do not publish stale
      // evidence as a successful test when the source/path changed mid-run.
      expect(digest(readFileSync(`${directory}/template.json`))).toBe(qa.templateSha256);
      expect(records.filter(record => !record.hitAtZoom4 || !record.painted || !record.erased).map(record => ({ id: record.id, hit: record.hitAtZoom4, painted: record.painted, erased: record.erased }))).toEqual([]);
      expect(evidence.png.erasedEqualsBlank).toBe(true);
    } finally {
      blank.canvas.width = 1; blank.canvas.height = 1;
      engine.dispose();
    }
  }, 30_000);
});
