import type { Bounds, Point } from '../../shared-types/src/index';

export interface Viewport { scale: number; x: number; y: number }
export interface ViewportSize { width: number; height: number }
export const DEFAULT_VIEWPORT: Readonly<Viewport> = { scale: 1, x: 0, y: 0 };

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** x/y are CSS pixel translations; CSS transform-origin must be 0 0. */
export function constrainViewport(viewport: Viewport, container: ViewportSize, content: ViewportSize = container): Viewport {
  const scale = clamp(Number.isFinite(viewport.scale) ? viewport.scale : 1, 1, 4);
  const axis = (offset: number, visible: number, drawing: number) => {
    if (drawing * scale <= visible) return (visible - drawing * scale) / 2;
    return clamp(Number.isFinite(offset) ? offset : 0, visible - drawing * scale, 0);
  };
  return { scale, x: axis(viewport.x, container.width, content.width), y: axis(viewport.y, container.height, content.height) };
}

/** Keep the logical point under the cursor fixed while zooming, then constrain. */
export function zoomViewportAt(viewport: Viewport, nextScale: number, point: Point, container: ViewportSize, content: ViewportSize = container): Viewport {
  return pinchViewport(viewport, nextScale, point, point, container, content);
}

/** WheelEvent delta modes: 0=CSS pixels, 1=text lines, 2=visible pages.
 * The view supplies the current computed line height and visible page height. */
export function wheelDeltaPixels(deltaY: number, deltaMode: number, lineHeight: number, pageHeight: number): number {
  if (!Number.isFinite(deltaY)) return 0;
  const unit = deltaMode === 0 ? 1 : deltaMode === 1 ? lineHeight : deltaMode === 2 ? pageHeight : 0;
  return Number.isFinite(unit) && unit > 0 ? deltaY * unit : 0;
}

/** Apply moving pinch anchors before constraining: an intermediate clamp loses motion at the edges. */
export function pinchViewport(viewport: Viewport, nextScale: number, oldCenter: Point, newCenter: Point, container: ViewportSize, content: ViewportSize = container): Viewport {
  const scale = clamp(nextScale, 1, 4);
  const ratio = scale / viewport.scale;
  return constrainViewport({ scale, x: newCenter.x - (oldCenter.x - viewport.x) * ratio, y: newCenter.y - (oldCenter.y - viewport.y) * ratio }, container, content);
}

export function screenToLogical(point: Point, viewport: Viewport, content: ViewportSize, logical: ViewportSize = { width: 1600, height: 2000 }): Point {
  return {
    x: ((point.x - viewport.x) / viewport.scale / content.width) * logical.width,
    y: ((point.y - viewport.y) / viewport.scale / content.height) * logical.height,
  };
}

/** Reveal a keyboard target without changing zoom. Large regions use a real interior point. */
export function revealViewportRegion(viewport: Viewport, bounds: Bounds, point: Point, container: ViewportSize, logical: ViewportSize = { width: 1600, height: 2000 }): Viewport {
  const margin = Math.min(24, container.width / 8, container.height / 8);
  const axis = (offset: number, start: number, length: number, anchor: number, visible: number, logicalSize: number) => {
    const scale = visible * viewport.scale / logicalSize;
    if (length * scale <= visible - margin * 2) {
      if (start * scale + offset < margin) return margin - start * scale;
      if ((start + length) * scale + offset > visible - margin) return visible - margin - (start + length) * scale;
      return offset;
    }
    return clamp(offset, margin - anchor * scale, visible - margin - anchor * scale);
  };
  return constrainViewport({
    scale: viewport.scale,
    x: axis(viewport.x, bounds.x, bounds.width, point.x, container.width, logical.width),
    y: axis(viewport.y, bounds.y, bounds.height, point.y, container.height, logical.height),
  }, container);
}

export function intersects(a: Bounds, b: Bounds): boolean {
  return a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y;
}

export function expandBounds(bounds: Bounds, margin: number): Bounds {
  return { x: bounds.x - margin, y: bounds.y - margin, width: bounds.width + margin * 2, height: bounds.height + margin * 2 };
}

export function unionBounds(bounds: Bounds[]): Bounds {
  const x = Math.min(...bounds.map((bound) => bound.x));
  const y = Math.min(...bounds.map((bound) => bound.y));
  return { x, y, width: Math.max(...bounds.map((bound) => bound.x + bound.width)) - x, height: Math.max(...bounds.map((bound) => bound.y + bound.height)) - y };
}

/** Explicit movement memory prevents a drag out and back from becoming a tap. */
export class TapTracker {
  private origin: Point | null = null;
  private moved = false;
  private multiPointer = false;
  constructor(readonly threshold = 8) {}
  begin(point: Point): void { this.origin = point; this.moved = false; this.multiPointer = false; }
  move(point: Point): void {
    if (this.origin && Math.hypot(point.x - this.origin.x, point.y - this.origin.y) > this.threshold) this.moved = true;
  }
  markMultiplePointers(): void { this.multiPointer = true; }
  end(point: Point): boolean {
    this.move(point);
    const isTap = this.origin !== null && !this.moved && !this.multiPointer;
    this.origin = null;
    return isTap;
  }
  cancel(): void { this.origin = null; this.moved = true; }
}
