// @vitest-environment jsdom
import { createRef } from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Point, Project, Template } from '../../packages/shared-types/src/index';
import type { Viewport } from '../../packages/coloring-engine/src/geometry';
import { ArtworkCanvas, type ArtworkHandle } from '../../apps/web/src/components/ArtworkCanvas';

// jsdom does not rasterize Canvas2D. Only the raster backend is replaced;
// the mounted component, geometry, gesture state and event handlers are real.
vi.mock('@island/engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../packages/coloring-engine/src/index')>();
  return {
    ...actual,
    ColoringEngine: class {
      loadTemplate() {}
      resize() {}
      setScene() {}
      setViewport() {}
      dispose() {}
      hitTest() { return 'subject'; }
    },
  };
});

const size = { width: 400, height: 500 };
const template: Template = {
  schemaVersion: 1, id: 'gesture-test', themeId: 'robots', title: 'ジェスチャーの確認', width: 1600, height: 2000,
  approved: true, defaultColorFamily: 'blue', lineWidth: 12,
  regions: [{ id: 'subject', name: '絵', path: 'M0 0H1600V2000H0Z', bounds: { x: 0, y: 0, width: 1600, height: 2000 }, material: 'standard', confidence: 1, shade: false, highlight: false, texture: 0, direction: 0, seed: 1 }],
  details: [],
};
const project: Project = {
  schemaVersion: 1, id: 'gesture-work', userId: 'gesture-user', templateId: template.id, title: template.title,
  status: 'draft', regions: {}, backgroundId: 'white', frameId: 'none', version: 0, metadata: {},
  createdAt: '2026-10-06T00:00:00Z', updatedAt: '2026-10-06T00:00:00Z',
};

class TouchPointerEvent extends MouseEvent {
  readonly pointerId: number;
  readonly pointerType: string;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? 'touch';
  }
}

beforeEach(() => {
  vi.stubGlobal('PointerEvent', TouchPointerEvent);
  vi.stubGlobal('matchMedia', (media:string)=>Object.assign(new EventTarget(),{media,matches:true,onchange:null,addListener(){},removeListener(){}}));
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(size.width);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(size.height);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 20, y: 40, left: 20, top: 40, right: 420, bottom: 540, ...size, toJSON: () => ({}) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function mounted(view: Viewport = { scale: 1, x: 0, y: 0 }) {
  const handle = createRef<ArtworkHandle>();
  const onPaint = vi.fn(), onReady = vi.fn(), onError = vi.fn();
  const rendered = render(<ArtworkCanvas ref={handle} template={template} project={project} backgrounds={[]} frames={[]} interactive onPaint={onPaint} onReady={onReady} onError={onError} />);
  await waitFor(() => expect(onReady).toHaveBeenCalled());
  const stage = rendered.getByTestId('artwork');
  const captures = new Set<number>();
  Object.assign(stage, {
    setPointerCapture: (id: number) => captures.add(id),
    hasPointerCapture: (id: number) => captures.has(id),
    releasePointerCapture: (id: number) => {
      if (captures.delete(id)) fireEvent(stage, new TouchPointerEvent('lostpointercapture', { bubbles: true, pointerId: id }));
    },
  });
  const pointer = (type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel' | 'lostpointercapture', id: number, point: Point) => {
    fireEvent(stage, new TouchPointerEvent(type, { bubbles: true, cancelable: true, pointerId: id, pointerType: 'touch', clientX: 20 + point.x, clientY: 40 + point.y, button: 0 }));
  };
  const readView = (): Viewport => {
    const transform = rendered.container.querySelector<HTMLElement>('.artwork-transform')!.style.transform;
    const match = transform.match(/translate\(([-\d.e+]+)px, ([-\d.e+]+)px\) scale\(([-\d.e+]+)\)/);
    if (!match) throw new Error(`Unexpected artwork transform: ${transform}`);
    return { x: Number(match[1]), y: Number(match[2]), scale: Number(match[3]) };
  };
  if (view.scale !== 1) act(() => handle.current!.zoom(view.scale));
  const zoomed = readView();
  if (zoomed.x !== view.x || zoomed.y !== view.y) {
    pointer('pointerdown', 9, { x: 200, y: 250 });
    pointer('pointermove', 9, { x: 200 + view.x - zoomed.x, y: 250 + view.y - zoomed.y });
    pointer('pointerup', 9, { x: 200 + view.x - zoomed.x, y: 250 + view.y - zoomed.y });
  }
  expect(readView()).toEqual(view);
  expect(onPaint).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
  return { pointer, readView, onPaint, stage, handle };
}

function expectView(actual: Viewport, expected: Viewport) {
  expect(actual.scale).toBeCloseTo(expected.scale, 8);
  expect(actual.x).toBeCloseTo(expected.x, 8);
  expect(actual.y).toBeCloseTo(expected.y, 8);
  expect(actual.x).toBeLessThanOrEqual(0);
  expect(actual.y).toBeLessThanOrEqual(0);
  expect(actual.x).toBeGreaterThanOrEqual(size.width * (1 - actual.scale));
  expect(actual.y).toBeGreaterThanOrEqual(size.height * (1 - actual.scale));
}

describe('ArtworkCanvas real pointer pinch handling', () => {
  it('A04-01: a one-finger inward pinch at the top-left edge does not shift the picture by -25px', async () => {
    const app = await mounted({ scale: 2, x: 0, y: 0 });
    app.pointer('pointerdown', 1, { x: 100, y: 250 });
    app.pointer('pointerdown', 2, { x: 300, y: 250 });
    app.pointer('pointermove', 2, { x: 250, y: 250 });
    expectView(app.readView(), { scale: 1.5, x: 0, y: 0 });
    app.pointer('pointerup', 2, { x: 250, y: 250 });
    app.pointer('pointerup', 1, { x: 100, y: 250 });
    expect(app.onPaint).not.toHaveBeenCalled();
  });

  const cases: { name: string; view: Viewport; first: Point; second: Point; moved: 1 | 2; to: Point; expected: Viewport }[] = [
    { name: 'left edge inward', view: { scale: 2, x: 0, y: -250 }, first: { x: 100, y: 250 }, second: { x: 300, y: 250 }, moved: 2, to: { x: 250, y: 250 }, expected: { scale: 1.5, x: 0, y: -125 } },
    { name: 'right edge inward', view: { scale: 2, x: -400, y: -250 }, first: { x: 100, y: 250 }, second: { x: 300, y: 250 }, moved: 1, to: { x: 150, y: 250 }, expected: { scale: 1.5, x: -200, y: -125 } },
    { name: 'top edge inward', view: { scale: 2, x: -200, y: 0 }, first: { x: 200, y: 100 }, second: { x: 200, y: 300 }, moved: 2, to: { x: 200, y: 250 }, expected: { scale: 1.5, x: -100, y: 0 } },
    { name: 'bottom edge inward', view: { scale: 2, x: -200, y: -500 }, first: { x: 200, y: 200 }, second: { x: 200, y: 400 }, moved: 1, to: { x: 200, y: 250 }, expected: { scale: 1.5, x: -100, y: -250 } },
    { name: 'left edge outward', view: { scale: 2, x: 0, y: -250 }, first: { x: 100, y: 250 }, second: { x: 300, y: 250 }, moved: 2, to: { x: 350, y: 250 }, expected: { scale: 2.5, x: -25, y: -375 } },
    { name: 'right edge outward', view: { scale: 2, x: -400, y: -250 }, first: { x: 100, y: 250 }, second: { x: 300, y: 250 }, moved: 1, to: { x: 50, y: 250 }, expected: { scale: 2.5, x: -575, y: -375 } },
    { name: 'top edge outward', view: { scale: 2, x: -200, y: 0 }, first: { x: 200, y: 100 }, second: { x: 200, y: 300 }, moved: 2, to: { x: 200, y: 350 }, expected: { scale: 2.5, x: -300, y: -25 } },
    { name: 'bottom edge outward', view: { scale: 2, x: -200, y: -500 }, first: { x: 200, y: 200 }, second: { x: 200, y: 400 }, moved: 1, to: { x: 200, y: 150 }, expected: { scale: 2.5, x: -300, y: -725 } },
  ];
  it.each(cases)('keeps the correct anchor at the $name', async ({ view, first, second, moved, to, expected }) => {
    const app = await mounted(view);
    app.pointer('pointerdown', 1, first);
    app.pointer('pointerdown', 2, second);
    app.pointer('pointermove', moved, to);
    expectView(app.readView(), expected);
    app.pointer('pointerup', 1, moved === 1 ? to : first);
    app.pointer('pointerup', 2, moved === 2 ? to : second);
    expect(app.onPaint).not.toHaveBeenCalled();
  });

  it('clamps the scale to 1 and to 4 before computing the new anchor', async () => {
    const app = await mounted({ scale: 3.5, x: -500, y: -625 });
    app.pointer('pointerdown', 1, { x: 100, y: 250 });
    app.pointer('pointerdown', 2, { x: 300, y: 250 });
    app.pointer('pointermove', 2, { x: 500, y: 250 });
    expectView(app.readView(), { scale: 4, x: -500, y: -750 });
    app.pointer('pointermove', 2, { x: 105, y: 250 });
    expectView(app.readView(), { scale: 1, x: 0, y: 0 });
    app.pointer('pointerup', 1, { x: 100, y: 250 });
    app.pointer('pointerup', 2, { x: 105, y: 250 });
    expect(app.onPaint).not.toHaveBeenCalled();
  });

  it.each(['pointercancel', 'lostpointercapture'] as const)('does not paint after a pinch interrupted by %s, and accepts the next real tap', async (interruption) => {
    const app = await mounted();
    app.pointer('pointerdown', 1, { x: 100, y: 250 });
    app.pointer('pointerdown', 2, { x: 300, y: 250 });
    app.pointer('pointermove', 2, { x: 350, y: 250 });
    app.pointer(interruption, 2, { x: 350, y: 250 });
    app.pointer('pointerup', 1, { x: 100, y: 250 });
    app.pointer('pointerup', 2, { x: 350, y: 250 });
    expect(app.onPaint).not.toHaveBeenCalled();
    app.pointer('pointerdown', 3, { x: 200, y: 250 });
    app.pointer('pointerup', 3, { x: 200, y: 250 });
    expect(app.onPaint).toHaveBeenCalledTimes(1);
    expect(app.onPaint.mock.calls[0][0]).toBe('subject');
    const painted = app.onPaint.mock.calls[0][1] as Point;
    expect(painted.x).toBeCloseTo(720);
    expect(painted.y).toBeCloseTo(1000);
  });

  it('a stationary two-finger contact is not a paint tap', async () => {
    const app = await mounted();
    app.pointer('pointerdown', 1, { x: 100, y: 250 });
    app.pointer('pointerdown', 2, { x: 300, y: 250 });
    app.pointer('pointerup', 2, { x: 300, y: 250 });
    app.pointer('pointerup', 1, { x: 100, y: 250 });
    expect(app.onPaint).not.toHaveBeenCalled();
  });
});

describe('ArtworkCanvas wheel units and pending taps', () => {
  const point = { x: 125, y: 190 };
  const wheel = (stage: HTMLElement, deltaMode: number, deltaY: number, at = point, modifier?: string) => {
    const event = new WheelEvent('wheel', { deltaMode, deltaY, clientX: 20 + at.x, clientY: 40 + at.y, bubbles: true, cancelable: true, ...(modifier ? { [modifier]: true } : {}) });
    fireEvent(stage, event);
    return event;
  };

  it.each([{ mode: 0, delta: -100 }, { mode: 1, delta: -4 }, { mode: 2, delta: -.2 }])('mode $mode gives equivalent cursor-anchored zoom and reverses without painting', async ({ mode, delta }) => {
    const app = await mounted({ scale: 2, x: -200, y: -250 });
    app.stage.style.lineHeight = '25px';
    const before = app.readView();
    expect(wheel(app.stage, mode, delta).defaultPrevented).toBe(true);
    const after = app.readView();
    expect(after.scale).toBeCloseTo(2 * Math.exp(.15), 10);
    expect((point.x - after.x) / after.scale).toBeCloseTo((point.x - before.x) / before.scale, 10);
    expect((point.y - after.y) / after.scale).toBeCloseTo((point.y - before.y) / before.scale, 10);
    wheel(app.stage, mode, -delta);
    expectView(app.readView(), before);
    expect(app.onPaint).not.toHaveBeenCalled();
  });

  it('reads deltaMode before deltaY to avoid browser compatibility unit conversion', async () => {
    const app = await mounted(), order: string[] = [];
    app.stage.style.lineHeight = '25px';
    const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: 145, clientY: 230 });
    Object.defineProperties(event, {
      deltaMode: { get: () => { order.push('mode'); return 1; } },
      deltaY: { get: () => { order.push('delta'); return -4; } },
    });
    fireEvent(app.stage, event);
    expect(order).toEqual(['mode', 'delta']);
    expect(app.readView().scale).toBeCloseTo(Math.exp(.15), 10);
  });

  it('uses current computed line height, with a font-size fallback for normal', async () => {
    const app = await mounted();
    app.stage.style.lineHeight = '40px';
    wheel(app.stage, 1, -2.5);
    expect(app.readView().scale).toBeCloseTo(Math.exp(.15), 10);
    act(() => app.handle.current!.reset());
    app.stage.style.lineHeight = 'normal'; app.stage.style.fontSize = '20px';
    wheel(app.stage, 1, -1);
    expect(app.readView().scale).toBeCloseTo(Math.exp(24 * .0015), 10);
  });

  it('uses the resized viewport height for a page and makes one page meaningful', async () => {
    const app = await mounted();
    wheel(app.stage, 2, -1);
    expect(app.readView().scale).toBeCloseTo(Math.exp(.75), 10);
    expect(app.readView().scale).toBeGreaterThan(2);
    act(() => app.handle.current!.reset());
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(250);
    wheel(app.stage, 2, -1);
    expect(app.readView().scale).toBeCloseTo(Math.exp(.375), 10);
  });

  it('keeps every corner fixed while clamping each unit to the 1–4 scale range', async () => {
    const app = await mounted(); app.stage.style.lineHeight = '25px';
    for (const mode of [0, 1, 2]) for (const at of [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 0, y: 500 }, { x: 400, y: 500 }]) {
      act(() => app.handle.current!.reset());
      wheel(app.stage, mode, -10_000, at);
      expectView(app.readView(), { scale: 4, x: -3 * at.x, y: -3 * at.y });
      wheel(app.stage, mode, 10_000, at);
      expectView(app.readView(), { scale: 1, x: 0, y: 0 });
    }
    expect(app.onPaint).not.toHaveBeenCalled();
  });

  it('leaves all modified units and a zero vertical delta to browser defaults', async () => {
    const app = await mounted({ scale: 2, x: -200, y: -250 });
    for (const mode of [0, 1, 2]) for (const modifier of ['ctrlKey', 'metaKey', 'altKey']) {
      const before = app.readView();
      expect(wheel(app.stage, mode, -1, point, modifier).defaultPrevented).toBe(false);
      expect(app.readView()).toEqual(before);
    }
    expect(wheel(app.stage, 0, 0).defaultPrevented).toBe(false);
    expect(app.onPaint).not.toHaveBeenCalled();
  });

  it('cancels a pending pointer tap when wheel zoom intervenes and accepts the next tap', async () => {
    const app = await mounted();
    app.pointer('pointerdown', 1, point);
    wheel(app.stage, 2, -1);
    app.pointer('pointerup', 1, point);
    expect(app.onPaint).not.toHaveBeenCalled();
    app.pointer('pointerdown', 2, point);
    app.pointer('pointerup', 2, point);
    expect(app.onPaint).toHaveBeenCalledTimes(1);
  });
});
