import { createCanvas, Path2D as NativePath } from '@napi-rs/canvas';
import { describe, expect, it } from 'vitest';
import { ColoringEngine, type EngineCanvas } from '../packages/coloring-engine/src/index';
import type { Region, Template } from '../packages/shared-types/src/index';

function curvedRegion(id: string, path: string): Region {
  const [left, top, right, bottom] = new NativePath(path).computeTightBounds();
  return { id, name: id, path, bounds: { x: Math.floor(left), y: Math.floor(top), width: Math.ceil(right) - Math.floor(left), height: Math.ceil(bottom) - Math.floor(top) }, material: 'plastic', shade: true, highlight: true, texture: 0.5, direction: 35, seed: 835, confidence: 1 };
}

// The small second shape forces the dirty clip to cross the curved first shape.
const template: Template = {
  schemaVersion: 1, id: 'dirty-curves', themeId: 'robots', title: '曲線の部分再描画', width: 1600, height: 2000,
  approved: true, defaultColorFamily: 'blue', lineWidth: 12,
  regions: [
    curvedRegion('back', 'M153 273 C420 44 1349 243 1391 702 C1440 1010 1119 1499 821 1751 C399 1827 47 1022 153 273Z'),
    curvedRegion('front', 'M413 619 C669 417 940 636 1011 942 Q832 1085 714 978 Q470 835 413 619Z'),
    curvedRegion('small', 'M757 673 Q828 705 814 786 Q746 829 703 756 Q698 693 757 673Z'),
  ],
  details: [{ path: 'M552 880 Q728 704 936 855', strokeWidth: 8 }],
};

function harness(width: number, maxCacheBytes?: number) {
  const canvas = createCanvas(width, width * 1.25);
  const engine = new ColoringEngine(canvas as unknown as EngineCanvas, {
    createCanvas: (w, h) => createCanvas(w, h) as unknown as EngineCanvas,
    createPath: (path) => new NativePath(path) as unknown as Path2D,
    maxCacheBytes,
    requestFrame: () => 1, cancelFrame: () => undefined,
  });
  engine.resize(width, width * 1.25, 1);
  return { engine, canvas, pixels: () => Buffer.from(canvas.getContext('2d').getImageData(0, 0, width, width * 1.25).data) };
}

describe('dirty rectangle equivalence across curved overlapping regions', () => {
  it.each([320, 800, 1280])('matches a fresh full redraw at %s pixels after paint, overwrite, and erase', width => {
    const actual = harness(width), reference = harness(width);
    const background = createCanvas(1600, 2000);
    const context = background.getContext('2d'); context.fillStyle = '#84DFFF'; context.fillRect(0, 0, 1600, 2000);
    actual.engine.loadTemplate(template);
    for (const engine of [actual.engine, reference.engine]) engine.setScene({ background: background as unknown as CanvasImageSource });
    try {
      for (const [id, paint] of [
        ['back', { color: '#FF6AA3', paintType: 'crayon' }],
        ['front', { color: '#4EAEFF', paintType: 'pencil' }],
        ['small', { color: '#25C95B', paintType: 'smooth' }],
        ['front', { color: '#FFD8B2', paintType: 'smooth' }],
        ['back', null], ['small', null], ['front', null],
      ] as const) {
        actual.engine.paint(id, paint, undefined, true);
        reference.engine.loadTemplate(template, actual.engine.getPaints());
        expect(actual.pixels().equals(reference.pixels()), `${id}: ${paint?.paintType ?? 'erase'}`).toBe(true);
        if (id === 'small' && paint) {
          const snapshot = actual.engine.renderSnapshot(width);
          const output = snapshot.getContext('2d')!.getImageData(0, 0, width, width * 1.25).data;
          const display = actual.pixels();
          let maximumDifference = 0;
          for (let channel = 0; channel < output.length; channel++) maximumDifference = Math.max(maximumDifference, Math.abs(output[channel] - display[channel]));
          // Alpha compositing over the display's separate transparent layers can
          // round by one unit; the logical surface and texture remain identical.
          expect(maximumDifference).toBeLessThanOrEqual(2);
          snapshot.width = 1; snapshot.height = 1;
        }
      }
    } finally { actual.engine.dispose(); reference.engine.dispose(); }
  });

  it('preserves the same pixels when the surface cache cannot retain any region', () => {
    const actual = harness(320, 0), reference = harness(320);
    try {
      actual.engine.loadTemplate(template);
      actual.engine.paint('back', { color: '#F44336', paintType: 'crayon' }, undefined, true);
      actual.engine.paint('small', { color: '#2F80ED', paintType: 'pencil' }, undefined, true);
      reference.engine.loadTemplate(template, actual.engine.getPaints());
      expect(actual.pixels().equals(reference.pixels())).toBe(true);
      expect(actual.engine.getMetrics().cacheBytes).toBe(0);
    } finally { actual.engine.dispose(); reference.engine.dispose(); }
  });
});
