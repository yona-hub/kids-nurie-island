// @vitest-environment jsdom
import { createRef } from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Project, Template, TemplateSummary } from '../../packages/shared-types/src/index';
import { ArtworkCanvas, type ArtworkHandle } from '../../apps/web/src/components/ArtworkCanvas';

// The production component and full hit-test engine run unchanged. Only the
// Canvas implementation is injected because jsdom has no native Canvas2D.
vi.mock('@island/engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../packages/coloring-engine/src/index')>();
  const native = await import('@napi-rs/canvas');
  return {
    ...actual,
    ColoringEngine: class extends actual.ColoringEngine {
      constructor() {
        super(native.createCanvas(400, 500) as unknown as import('../../packages/coloring-engine/src/index').EngineCanvas, {
          createCanvas: (width, height) => native.createCanvas(width, height) as unknown as import('../../packages/coloring-engine/src/index').EngineCanvas,
          createPath: path => new native.Path2D(path) as unknown as Path2D,
        });
      }
    },
  };
});

const catalog = JSON.parse(readFileSync('content/storybook-generated/compiled/legacy-catalog.json', 'utf8')) as TemplateSummary[];
const templates = catalog.map(entry => JSON.parse(readFileSync(`apps/web/public${entry.assetUrl}`, 'utf8')) as Template);
const size = { width: 400, height: 500 };
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  // jsdom omits this standard browser API; production listens for DPR changes.
  vi.stubGlobal('matchMedia', (media:string)=>Object.assign(new EventTarget(),{media,matches:true,onchange:null,addListener(){},removeListener(){}}));
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(size.width);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(size.height);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 400, bottom: 500, ...size, toJSON: () => ({}) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function mounted(template = templates.find(entry => entry.themeId === 'princess')!) {
  const handle = createRef<ArtworkHandle>(), onPaint = vi.fn(), onReady = vi.fn();
  const project: Project = { schemaVersion: 1, id: 'keyboard-work', userId: 'keyboard-user', templateId: template.id, title: template.title, status: 'draft', regions: {}, backgroundId: 'white', frameId: 'none', version: 0, metadata: {}, createdAt: '2026-10-07T00:00:00Z', updatedAt: '2026-10-07T00:00:00Z' };
  const result = render(<ArtworkCanvas ref={handle} template={template} project={project} backgrounds={[]} frames={[]} interactive onPaint={onPaint} onReady={onReady} onError={message => { throw new Error(message); }} />);
  await waitFor(() => expect(onReady).toHaveBeenCalled());
  const stage = result.getByTestId('artwork'); fireEvent.focus(stage);
  const view = () => {
    const match = result.container.querySelector<HTMLElement>('.artwork-transform')!.style.transform.match(/translate\(([-\d.e+]+)px, ([-\d.e+]+)px\) scale\(([-\d.e+]+)\)/)!;
    return { x: Number(match[1]), y: Number(match[2]), scale: Number(match[3]) };
  };
  const marker = () => result.container.querySelector<HTMLElement>('.region-focus-marker')!;
  return { ...result, handle, stage, view, marker, onPaint };
}

describe('ArtworkCanvas keyboard navigation', () => {
  it.each(templates)('$id: forward and backward selection reveals every region at 1×, 2× and 4× before Enter paints it', async template => {
    const app = await mounted(template);
    let selected = 0;
    for (const scale of [1, 2, 4]) {
      act(() => app.handle.current!.zoom(scale / app.view().scale));
      for (const direction of [1, -1]) for (let i = 0; i < template.regions.length; i++) {
        fireEvent.keyDown(app.stage, { key: direction === 1 ? 'ArrowRight' : 'ArrowLeft' });
        selected = (selected + direction + template.regions.length) % template.regions.length;
        const region = template.regions[selected], marker = app.marker();
        expect(marker.dataset.regionId).toBe(region.id);
        expect(app.view().scale).toBe(scale);
        expect(parseFloat(marker.style.left)).toBeGreaterThanOrEqual(0);
        expect(parseFloat(marker.style.left)).toBeLessThanOrEqual(size.width);
        expect(parseFloat(marker.style.top)).toBeGreaterThanOrEqual(0);
        expect(parseFloat(marker.style.top)).toBeLessThanOrEqual(size.height);
        const count = app.onPaint.mock.calls.length;
        fireEvent.keyDown(app.stage, { key: 'Enter' });
        expect(app.onPaint).toHaveBeenCalledTimes(count + 1);
        const [id, point] = app.onPaint.mock.calls.at(-1)!;
        expect(id).toBe(region.id);
        expect(app.handle.current!.engine()!.hitTest(point, false)).toBe(region.id);
      }
    }
  });

  it('does not cancel Ctrl, Meta or Alt shortcuts, while ordinary + and - still zoom the drawing', async () => {
    const app = await mounted();
    act(() => app.handle.current!.zoom(2));
    for (const modifier of ['ctrlKey', 'metaKey', 'altKey']) for (const key of ['+', '=', '-', '0', 'ArrowLeft', 'Enter', ' ', 'Escape']) {
      const before = app.view(), event = new KeyboardEvent('keydown', { key, [modifier]: true, bubbles: true, cancelable: true });
      fireEvent(app.stage, event);
      expect(event.defaultPrevented, `${modifier} ${key}`).toBe(false);
      expect(app.view()).toEqual(before);
      expect(app.onPaint).not.toHaveBeenCalled();
    }
    fireEvent.keyDown(app.stage, { key: '+', shiftKey: true }); expect(app.view().scale).toBe(2.5);
    fireEvent.keyDown(app.stage, { key: '-' }); expect(app.view().scale).toBe(2);
  });

  it('preserves modified wheel defaults and still handles an ordinary wheel', async () => {
    const app = await mounted();
    for (const modifier of ['ctrlKey', 'metaKey', 'altKey']) {
      const before = app.view(), event = new WheelEvent('wheel', { deltaY: -100, clientX: 200, clientY: 250, [modifier]: true, bubbles: true, cancelable: true });
      fireEvent(app.stage, event);
      expect(event.defaultPrevented).toBe(false); expect(app.view()).toEqual(before);
    }
    const event = new WheelEvent('wheel', { deltaY: -100, clientX: 200, clientY: 250, bubbles: true, cancelable: true });
    fireEvent(app.stage, event);
    expect(event.defaultPrevented).toBe(true); expect(app.view().scale).toBeGreaterThan(1);
  });

  it('reveals an offscreen selection before a subsequent Enter paints, without reducing zoom', async () => {
    const app = await mounted();
    act(() => app.handle.current!.zoom(4));
    expect(parseFloat(app.marker().style.top)).toBeLessThan(0);
    fireEvent.keyDown(app.stage, { key: 'Enter' });
    expect(app.onPaint).not.toHaveBeenCalled();
    expect(parseFloat(app.marker().style.top)).toBeGreaterThanOrEqual(0);
    expect(app.view().scale).toBe(4);
    fireEvent.keyDown(app.stage, { key: 'Enter' });
    expect(app.onPaint).toHaveBeenCalledTimes(1);
  });
});
