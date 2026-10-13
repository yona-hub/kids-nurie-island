import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createCanvas, Path2D as NativePath, loadImage } from '@napi-rs/canvas';
import { describe, it, expect } from 'vitest';
import { ColoringEngine, type EngineCanvas } from '../packages/coloring-engine/src/index';
import type { SceneAsset, SceneComposition, Template, TemplateSummary, RegionPaints } from '../packages/shared-types/src/index';
import type { ComposedScene } from '../packages/coloring-engine/src/storybook-scene';

const read = async <T>(file: string) => JSON.parse(await fs.readFile(file, 'utf8')) as T;
const publicFile = (url: string) => `apps/web/public${url}`;
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const makeCanvas = (width: number, height: number) => createCanvas(width, height) as unknown as EngineCanvas;
const pixels = (canvas: EngineCanvas) => canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;

describe('I24 complete environments and designed frames', () => {
  it('registers all 30 individual generated originals and keeps every previous scene ID and immutable URL', async () => {
    const generation = await read<{ tool: string; humanAdoption: string; assets: { kind: string; id: string; originalFile: string; sha256: string; prompt: string }[] }>('content/scene-art-v3/manifest.json');
    expect(generation.tool).toBe('built-in image_gen'); expect(generation.humanAdoption).toBe('not-received');
    expect(generation.assets.filter(asset => asset.kind === 'backgrounds')).toHaveLength(10);
    expect(generation.assets.filter(asset => asset.kind === 'frames')).toHaveLength(20);
    expect(new Set(generation.assets.map(asset => `${asset.kind}/${asset.id}`)).size).toBe(30);
    for (const asset of generation.assets) {
      expect(asset.prompt.length).toBeGreaterThan(300);
      expect(sha(await fs.readFile(asset.originalFile))).toBe(asset.sha256);
    }
    for (const kind of ['backgrounds', 'frames']) {
      const before = await read<SceneAsset[]>(`content/scene-art-v3/compiled/before-${kind}.json`);
      const after = await read<SceneAsset[]>(`apps/web/public/content/${kind}.json`);
      expect(new Set(after.map(asset => asset.id)).size).toBe(after.length);
      expect(after.filter(asset => asset.catalogVisible !== false)).toHaveLength(kind === 'backgrounds' ? 11 : 21);
      for (const old of before) {
        const current = after.find(asset => asset.id === old.id)!;
        const { catalogVisible: _beforeVisibility, ...original } = old;
        const { catalogVisible: _afterVisibility, ...retained } = current;
        expect(retained).toEqual(original);
        for (const url of [old.assetUrl, old.thumbnailUrl, old.compositionUrl].filter((url): url is string => !!url)) expect(sha(await fs.readFile(publicFile(url)))).toBe(url.match(/\.([a-f0-9]{64})\./)![1]);
      }
    }
  });

  it('publishes opaque full landscapes and transparent contiguous frames with a protected opening and artwork in front', async () => {
    for (const kind of ['backgrounds', 'frames']) {
      const catalog = (await read<SceneAsset[]>(`apps/web/public/content/${kind}.json`)).filter(asset => asset.catalogVisible !== false && asset.compositionUrl);
      for (const asset of catalog) {
        const composition = await read<SceneComposition>(publicFile(asset.compositionUrl!));
        expect(composition.layers).toHaveLength(kind === 'backgrounds' ? 1 : 4);
        expect(composition.layers.every(layer => layer.opacity === 1)).toBe(true);
        if (kind === 'frames') expect(composition.placement).toBe('behind-artwork');
        const canvas = createCanvas(800, 1000), ctx = canvas.getContext('2d'); ctx.scale(.5, .5);
        for (const layer of composition.layers) {
          expect(sha(await fs.readFile(publicFile(layer.assetUrl)))).toBe(layer.assetUrl.match(/\.([a-f0-9]{64})\./)![1]);
          ctx.drawImage(await loadImage(publicFile(layer.assetUrl)), layer.x, layer.y, layer.width, layer.height);
        }
        const rgba = ctx.getImageData(0, 0, 800, 1000).data;
        if (kind === 'backgrounds') {
          let opaque = true; for (let index = 3; index < rgba.length; index += 4) if (rgba[index] !== 255) opaque = false;
          expect(opaque, asset.id).toBe(true);
        } else {
          const opening = ctx.getImageData(161, 161, 478, 678).data;
          let transparent = true; for (let index = 3; index < opening.length; index += 4) if (opening[index] !== 0) transparent = false;
          expect(transparent, asset.id).toBe(true);
          // Real continuous ornament must exist on all four sides.
          for (const [x, y, width, height] of [[0, 0, 800, 80], [0, 920, 800, 80], [0, 80, 80, 840], [720, 80, 80, 840]]) {
            const edge = ctx.getImageData(x, y, width, height).data;
            let ink = 0; for (let index = 3; index < edge.length; index += 4) if (edge[index] > 32) ink++;
            expect(ink, `${asset.id} edge ${x},${y}`).toBeGreaterThan(200);
          }
        }
      }
    }
  });

  it('never covers opaque drawing pixels on any of the ten templates, in the viewport or snapshot, even with a solid frame', async () => {
    const entries = await read<TemplateSummary[]>('apps/web/public/content/catalog.json');
    const solid = createCanvas(16, 20), solidContext = solid.getContext('2d'); solidContext.fillStyle = '#ff00ff'; solidContext.fillRect(0, 0, 16, 20);
    const frame = { composition: { schemaVersion: 1, width: 1600, height: 2000, placement: 'behind-artwork', layers: [{ assetUrl: '', x: 0, y: 0, width: 1600, height: 2000 }] }, images: [solid] } as unknown as ComposedScene;
    for (const entry of entries) {
      const template = await read<Template>(publicFile(entry.assetUrl));
      const paints = Object.fromEntries(template.regions.filter(region => !template.paintingProfile!.eyes.some(eye => eye.highlightId === region.id)).map(region => [region.id, { color: '#2598FF', paintType: 'smooth' }])) as RegionPaints;
      const canvas = makeCanvas(320, 400), engine = new ColoringEngine(canvas, { createCanvas: makeCanvas, createPath: value => new NativePath(value) as unknown as Path2D });
      engine.loadTemplate(template, paints); engine.resize(320, 400, 1);
      const before = engine.renderSnapshot(320), viewBefore = new Uint8ClampedArray(pixels(canvas));
      const mask = createCanvas(320, 400), maskContext = mask.getContext('2d'); maskContext.scale(.2, .2); maskContext.fill(new NativePath(template.paintingProfile!.opaquePath!));
      const alpha = maskContext.getImageData(0, 0, 320, 400).data;
      engine.setScene({ frame }); const after = engine.renderSnapshot(320);
      const a = pixels(before), b = pixels(after), viewAfter = pixels(canvas);
      let checked = 0, differences = 0, viewDifferences = 0;
      for (let index = 3; index < alpha.length; index += 4) if (alpha[index] === 255) {
        checked++;
        for (let channel = -3; channel <= 0; channel++) {
          if (a[index + channel] !== b[index + channel]) differences++;
          if (viewBefore[index + channel] !== viewAfter[index + channel]) viewDifferences++;
        }
      }
      expect(checked, entry.id).toBeGreaterThan(1000);
      expect(differences, `${entry.id} exported drawing`).toBe(0);
      expect(viewDifferences, `${entry.id} viewport drawing`).toBe(0);
      before.width = before.height = after.width = after.height = 1; engine.dispose();
    }
  });
});
