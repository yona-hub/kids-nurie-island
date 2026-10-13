import type { Bounds, Point, Region, RegionPaint, RegionPaints, Template } from '../../shared-types/src/index';
import { CANVAS_HEIGHT, CANVAS_WIDTH, EXPORT_WIDTH } from '../../shared-types/src/index';
import { SurfaceCache, type RegionSurface } from './cache';
import { canvasBlob, canvasImage, context2D, createBrowserCanvas, type CanvasFactory, type EngineCanvas, type PathFactory } from './canvas';
import { clamp, expandBounds, intersects, unionBounds } from './geometry';
import { drawRegionFinish, fixedSeed, seededRandom, SPREAD_DURATION } from './texture';

export interface EngineOptions {
  createCanvas?: CanvasFactory;
  createPath?: PathFactory;
  now?: () => number;
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (handle: number) => void;
  maxCacheBytes?: number;
  maxCanvasPixels?: number;
  maxPixelRatio?: number;
}

export interface SceneUpdate {
  regions?: RegionPaints;
  background?: CanvasImageSource | null;
  frame?: CanvasImageSource | null;
}

export interface EngineMetrics {
  paints: number;
  textureBuilds: number;
  cacheHits: number;
  cacheMisses: number;
  frames: number;
  lastPaintMs: number;
  maxPaintMs: number;
  lastFrameMs: number;
  maxFrameMs: number;
  cacheBytes: number;
  layerBytes: number;
  activeAnimations: number;
}

interface CompiledRegion { region: Region; path: Path2D; dirtyBounds: Bounds }
interface Spread {
  previous: RegionPaint | null;
  next: RegionPaint;
  center: Point;
  radius: number;
  start: number;
  duration: number;
}

function samePaint(left: RegionPaint | undefined | null, right: RegionPaint | undefined | null): boolean {
  return left?.color === right?.color && left?.paintType === right?.paintType;
}

function copyPaint(paint: RegionPaint): RegionPaint {
  if (!/^#[0-9a-f]{6}$/i.test(paint.color) || !['smooth', 'crayon', 'pencil'].includes(paint.paintType)) {
    throw new Error('塗り方のデータを読み込めませんでした。');
  }
  return { color: paint.color.toUpperCase(), paintType: paint.paintType };
}

// A fixed, finite set of hit-test probes; no image analysis or path subdivision.
const REGION_POINT_CANDIDATES: readonly Point[] = [
  { x: 0.5, y: 0.5 },
  ...[4, 8, 16].flatMap(count => Array.from({ length: count * count }, (_, index) => ({
    x: (index % count + 0.5) / count, y: (Math.floor(index / count) + 0.5) / count,
  })).sort((a, b) => (a.x - 0.5) ** 2 + (a.y - 0.5) ** 2 - (b.x - 0.5) ** 2 - (b.y - 0.5) ** 2)),
];

/** Canvas2D renderer. No React or storage state is retained by this class. */
export class ColoringEngine {
  private readonly createCanvas: CanvasFactory;
  private readonly createPath: PathFactory;
  private readonly now: () => number;
  private readonly requestFrame: (callback: FrameRequestCallback) => number;
  private readonly cancelFrame: (handle: number) => void;
  private readonly cache: SurfaceCache;
  private readonly maxCanvasPixels: number;
  private readonly maxPixelRatio: number;
  private readonly context: CanvasRenderingContext2D;
  private readonly hitCanvas: EngineCanvas;
  private readonly hitContext: CanvasRenderingContext2D;
  private paintLayer: EngineCanvas;
  private detailLayer: EngineCanvas;
  private compiled: CompiledRegion[] = [];
  private compiledById = new Map<string, CompiledRegion>();
  private regionPoints = new Map<string, Point | null>();
  private detailPaths: { path: Path2D; fill?: string; strokeWidth: number }[] = [];
  private template: Template | null = null;
  private paints: RegionPaints = {};
  private background: CanvasImageSource | null = null;
  private frame: CanvasImageSource | null = null;
  private scale = 0.5;
  private spreads = new Map<string, Spread>();
  private pendingFrame: number | null = null;
  private disposed = false;
  private counters = { paints: 0, textureBuilds: 0, cacheHits: 0, cacheMisses: 0, frames: 0, lastPaintMs: 0, maxPaintMs: 0, lastFrameMs: 0, maxFrameMs: 0 };

  constructor(readonly canvas: EngineCanvas, options: EngineOptions = {}) {
    this.createCanvas = options.createCanvas ?? createBrowserCanvas;
    this.createPath = options.createPath ?? ((path) => new Path2D(path));
    this.now = options.now ?? (() => performance.now());
    this.requestFrame = options.requestFrame ?? ((callback) => requestAnimationFrame(callback));
    this.cancelFrame = options.cancelFrame ?? ((handle) => cancelAnimationFrame(handle));
    this.cache = new SurfaceCache(Math.max(0, options.maxCacheBytes ?? 16 * 1024 * 1024));
    this.maxCanvasPixels = Math.max(80_000, options.maxCanvasPixels ?? 2_048_000);
    this.maxPixelRatio = Math.max(1, options.maxPixelRatio ?? 2);
    this.context = context2D(canvas);
    this.hitCanvas = this.createCanvas(1, 1);
    this.hitContext = context2D(this.hitCanvas);
    this.paintLayer = this.createCanvas(800, 1000);
    this.detailLayer = this.createCanvas(800, 1000);
    canvas.width = 800;
    canvas.height = 1000;
  }

  loadTemplate(template: Template, regions: RegionPaints = {}): void {
    this.assertAlive();
    if (!template.approved || template.width !== CANVAS_WIDTH || template.height !== CANVAS_HEIGHT) throw new Error('このぬりえはまだ使えません。');
    const seen = new Set<string>();
    const compiled = template.regions.map((region) => {
      if (seen.has(region.id)) throw new Error('ぬりえの領域が重複しています。');
      seen.add(region.id);
      if (!region.id || !/z\s*$/i.test(region.path) || region.bounds.width <= 0 || region.bounds.height <= 0 ||
        ![region.bounds.x, region.bounds.y, region.bounds.width, region.bounds.height].every(Number.isFinite)) throw new Error('ぬりえの領域を読み込めませんでした。');
      return { region, path: this.createPath(region.path), dirtyBounds: expandBounds(region.bounds, Math.max(0, template.lineWidth) + 3) };
    });
    const detailPaths = template.details.map((detail) => ({ path: this.createPath(detail.path), fill: detail.fill, strokeWidth: detail.strokeWidth ?? template.lineWidth }));
    // Compile completely before replacing the currently usable scene.
    const nextPaints = this.normalizePaints(regions, seen);
    this.cancelSpreads();
    this.cache.clear();
    this.template = template;
    this.compiled = compiled;
    this.compiledById = new Map(compiled.map((item) => [item.region.id, item]));
    this.regionPoints.clear();
    this.detailPaths = detailPaths;
    this.paints = nextPaints;
    this.rebuildDetails();
    this.redrawPaintLayer();
    this.render();
  }

  setScene(update: SceneUpdate): void {
    this.assertAlive();
    let changed: Bounds[] = [];
    if (update.regions) {
      const next = this.normalizePaints(update.regions, new Set(this.compiledById.keys()));
      for (const item of this.compiled) {
        if (!samePaint(this.paints[item.region.id], next[item.region.id])) {
          this.spreads.delete(item.region.id);
          changed.push(item.dirtyBounds);
        }
      }
      this.paints = next;
    }
    if (update.background !== undefined) this.background = update.background;
    if (update.frame !== undefined) this.frame = update.frame;
    if (changed.length > 0) {
      // One bounded patch redraw handles an externally loaded project as well as
      // programmatic edits. Same-content React updates preserve live spreading.
      changed = [unionBounds(changed)];
      this.redrawPaintLayer(changed[0]);
    }
    this.render();
  }

  resize(cssWidth: number, cssHeight: number, pixelRatio = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1): void {
    this.assertAlive();
    if (!Number.isFinite(cssWidth) || !Number.isFinite(cssHeight) || cssWidth <= 0 || cssHeight <= 0) return;
    const ratio = clamp(Number.isFinite(pixelRatio) ? pixelRatio : 1, 1, this.maxPixelRatio);
    const fit = Math.min(cssWidth / CANVAS_WIDTH, cssHeight / CANVAS_HEIGHT) * ratio;
    const limited = Math.min(fit, Math.sqrt(this.maxCanvasPixels / (CANVAS_WIDTH * CANVAS_HEIGHT)));
    // Multiples of four preserve the exact 4:5 ratio and identical x/y scale.
    const width = Math.max(4, Math.round(CANVAS_WIDTH * limited / 4) * 4);
    const height = width * 5 / 4;
    if (this.canvas.width === width && this.canvas.height === height) return;
    this.cancelSpreads();
    this.cache.clear();
    this.scale = width / CANVAS_WIDTH;
    for (const layer of [this.canvas, this.paintLayer, this.detailLayer]) { layer.width = width; layer.height = height; }
    this.rebuildDetails();
    this.redrawPaintLayer();
    this.render();
  }

  paint(regionId: string, paint: RegionPaint | null, point?: Point, reducedMotion = false): void {
    this.assertAlive();
    const item = this.compiledById.get(regionId);
    if (!item) throw new Error('ぬる場所が見つかりませんでした。');
    const next = paint === null ? null : copyPaint(paint);
    const previous = this.paints[regionId] ?? null;
    if (samePaint(previous, next)) return;
    const start = this.now();
    this.spreads.delete(regionId);
    if (next) this.paints[regionId] = next;
    else delete this.paints[regionId];
    if (next && point && Number.isFinite(point.x) && Number.isFinite(point.y) && !reducedMotion) {
      const b = item.region.bounds;
      const center = { x: clamp(point.x, b.x, b.x + b.width), y: clamp(point.y, b.y, b.y + b.height) };
      const radius = Math.max(...[[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => Math.hypot(x - center.x, y - center.y))) + 24;
      this.spreads.set(regionId, { previous, next, center, radius, start: start - 15, duration: SPREAD_DURATION[next.paintType] });
    }
    this.redrawPaintLayer(item.dirtyBounds);
    this.render();
    this.counters.paints++;
    this.counters.lastPaintMs = this.now() - start;
    this.counters.maxPaintMs = Math.max(this.counters.maxPaintMs, this.counters.lastPaintMs);
    this.scheduleFrame();
  }

  hitTest(point: Point, tapAssist = true): string | null {
    this.assertAlive();
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.y < 0 || point.x > CANVAS_WIDTH || point.y > CANVAS_HEIGHT) return null;
    // Hit context stays at identity, independent of backing pixels or zoom.
    for (let index = this.compiled.length - 1; index >= 0; index--) {
      const item = this.compiled[index];
      const bounds = item.region.bounds;
      if (point.x < bounds.x || point.x > bounds.x + bounds.width || point.y < bounds.y || point.y > bounds.y + bounds.height) continue;
      if (this.hitContext.isPointInPath(item.path, point.x, point.y)) return item.region.id;
    }
    if (!tapAssist) return null;
    // Assist only close to a border, with a finite logical radius. Search rings
    // nearest-first; array order resolves ties to the visually frontmost shape.
    for (const radius of [5, 10, 16, 22]) {
      for (let index = this.compiled.length - 1; index >= 0; index--) {
        const item = this.compiled[index];
        if (!intersects(expandBounds(item.region.bounds, radius), { ...point, width: 0, height: 0 })) continue;
        for (let step = 0; step < 16; step++) {
          const angle = step * Math.PI / 8;
          if (this.hitContext.isPointInPath(item.path, point.x + Math.cos(angle) * radius, point.y + Math.sin(angle) * radius)) return item.region.id;
        }
      }
    }
    return null;
  }

  /** A visible interior anchor, not the bounding-box center (which can be a hole). */
  getRegionPoint(regionId: string): Point | null {
    this.assertAlive();
    if (this.regionPoints.has(regionId)) {
      const saved = this.regionPoints.get(regionId);
      return saved ? { ...saved } : null;
    }
    const item = this.compiledById.get(regionId);
    if (!item) return null;
    const bounds = item.region.bounds;
    const margin = Math.min(4, bounds.width / 8, bounds.height / 8);
    let firstInterior: Point | null = null;
    for (const candidate of REGION_POINT_CANDIDATES) {
      const point = { x: bounds.x + bounds.width * candidate.x, y: bounds.y + bounds.height * candidate.y };
      if (this.hitTest(point, false) !== regionId) continue;
      firstInterior ??= point;
      if ([[margin, 0], [-margin, 0], [0, margin], [0, -margin]].every(([x, y]) => this.hitTest({ x: point.x + x, y: point.y + y }, false) === regionId)) {
        this.regionPoints.set(regionId, point);
        return { ...point };
      }
    }
    this.regionPoints.set(regionId, firstInterior);
    return firstInterior ? { ...firstInterior } : null;
  }

  getPaints(): RegionPaints { return Object.fromEntries(Object.entries(this.paints).map(([key, value]) => [key, { ...value }])); }

  getMetrics(): EngineMetrics {
    return { ...this.counters, cacheBytes: this.cache.bytes, layerBytes: (this.paintLayer.width * this.paintLayer.height + this.detailLayer.width * this.detailLayer.height + this.canvas.width * this.canvas.height) * 4, activeAnimations: this.spreads.size };
  }

  /** Deterministic final image: animation state and touch position are excluded. */
  renderSnapshot(width = EXPORT_WIDTH): EngineCanvas {
    this.assertAlive();
    if (!this.template) throw new Error('ぬりえを開いてから保存してください。');
    if (!Number.isInteger(width) || width < 4 || width > 4096 || width % 4 !== 0) throw new Error('画像サイズが正しくありません。');
    const output = this.createCanvas(width, width * 5 / 4);
    const context = context2D(output);
    const scale = width / CANVAS_WIDTH;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    this.drawBackground(context);
    for (const item of this.compiled) {
      // Use the same complete region raster as the display. Keeping the fill and
      // ink together also avoids a different antialiasing path during export.
      const surface = this.buildSurface(item, this.paints[item.region.id] ?? null, scale);
      const b = surface.bounds;
      context.drawImage(canvasImage(surface.canvas), b.x, b.y, b.width, b.height);
      surface.canvas.width = 1; surface.canvas.height = 1;
    }
    this.drawDetails(context);
    if (this.frame) context.drawImage(this.frame, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    return output;
  }

  async exportPng(): Promise<Blob> {
    const output = this.renderSnapshot(EXPORT_WIDTH);
    try { return await canvasBlob(output, 'image/png'); }
    finally { output.width = 1; output.height = 1; }
  }

  async exportThumbnail(width = 320): Promise<Blob> {
    const output = this.renderSnapshot(width);
    try { return await canvasBlob(output, 'image/webp', 0.82); }
    finally { output.width = 1; output.height = 1; }
  }

  dispose(): void {
    if (this.disposed) return;
    this.cancelSpreads();
    this.cache.clear();
    for (const layer of [this.paintLayer, this.detailLayer, this.hitCanvas]) { layer.width = 1; layer.height = 1; }
    this.compiled = [];
    this.compiledById.clear();
    this.regionPoints.clear();
    this.detailPaths = [];
    this.paints = {};
    this.background = null;
    this.frame = null;
    this.template = null;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.disposed = true;
  }

  private assertAlive(): void { if (this.disposed) throw new Error('ぬりえの表示は終了しています。'); }

  private normalizePaints(paints: RegionPaints, ids: Set<string>): RegionPaints {
    const result: RegionPaints = {};
    for (const [id, paint] of Object.entries(paints)) {
      if (!ids.has(id)) throw new Error('ぬりえと保存データの組み合わせが正しくありません。');
      result[id] = copyPaint(paint);
    }
    return result;
  }

  private rebuildDetails(): void {
    const context = context2D(this.detailLayer);
    context.resetTransform();
    context.clearRect(0, 0, this.detailLayer.width, this.detailLayer.height);
    context.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    this.drawDetails(context);
  }

  private drawDetails(context: CanvasRenderingContext2D): void {
    context.lineCap = 'round'; context.lineJoin = 'round'; context.strokeStyle = '#000000';
    for (const detail of this.detailPaths) {
      if (detail.fill) { context.fillStyle = detail.fill; context.fill(detail.path); }
      if (detail.strokeWidth > 0) { context.lineWidth = detail.strokeWidth; context.stroke(detail.path); }
    }
  }

  private drawOutline(context: CanvasRenderingContext2D, item: CompiledRegion): void {
    const lineWidth = this.template?.lineWidth ?? 12;
    // Canvas ignores a zero lineWidth assignment; skip the stroke explicitly
    // when the original ink is supplied separately as filled detail paths.
    if (lineWidth <= 0) return;
    context.lineWidth = lineWidth;
    context.lineCap = 'round'; context.lineJoin = 'round'; context.strokeStyle = '#000000'; context.stroke(item.path);
  }

  private getSurface(item: CompiledRegion, paint: RegionPaint | null): { surface: RegionSurface; cached: boolean } {
    const key = `${item.region.id}:${paint ? `${paint.color}:${paint.paintType}` : 'blank'}:${this.canvas.width}`;
    const existing = this.cache.get(key);
    if (existing) { this.counters.cacheHits++; return { surface: existing, cached: true }; }
    this.counters.cacheMisses++;
    const surface = this.buildSurface(item, paint, this.scale);
    if (paint) this.counters.textureBuilds++;
    return { surface, cached: this.cache.set(key, surface) };
  }

  private buildSurface(item: CompiledRegion, paint: RegionPaint | null, scale: number): RegionSurface {
    const b = item.dirtyBounds;
    const left = Math.floor(b.x * scale);
    const top = Math.floor(b.y * scale);
    const width = Math.max(1, Math.ceil((b.x + b.width) * scale) - left);
    const height = Math.max(1, Math.ceil((b.y + b.height) * scale) - top);
    const canvas = this.createCanvas(width, height);
    const context = context2D(canvas);
    context.setTransform(scale, 0, 0, scale, -left, -top);
    // A dirty clip can change how Canvas rasterizes a curved path, even away
    // from the clip edge. Cache the white mask and ink with the texture so the
    // clipped scene pass only copies fixed pixels, never rasterizes paths.
    context.fillStyle = '#FFFFFF'; context.fill(item.path);
    if (paint) drawRegionFinish(context, item.region, item.path, paint, this.template?.id ?? '');
    this.drawOutline(context, item);
    return { canvas, bounds: { x: left / scale, y: top / scale, width: width / scale, height: height / scale }, bytes: width * height * 4 };
  }

  private drawPaint(context: CanvasRenderingContext2D, item: CompiledRegion, paint: RegionPaint | null): void {
    const { surface, cached } = this.getSurface(item, paint);
    const b = surface.bounds;
    context.drawImage(canvasImage(surface.canvas), b.x, b.y, b.width, b.height);
    if (!cached) { surface.canvas.width = 1; surface.canvas.height = 1; }
  }

  private redrawPaintLayer(dirty?: Bounds): void {
    const context = context2D(this.paintLayer);
    context.resetTransform();
    context.save();
    if (dirty) {
      // Align dirty rectangles to pixel boundaries to avoid accumulating a seam.
      const x = Math.floor(dirty.x * this.scale); const y = Math.floor(dirty.y * this.scale);
      const width = Math.ceil((dirty.x + dirty.width) * this.scale) - x;
      const height = Math.ceil((dirty.y + dirty.height) * this.scale) - y;
      context.beginPath(); context.rect(x, y, width, height); context.clip();
      context.clearRect(x, y, width, height);
    } else context.clearRect(0, 0, this.paintLayer.width, this.paintLayer.height);
    context.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    const time = this.now();
    for (const item of this.compiled) {
      if (dirty && !intersects(dirty, item.dirtyBounds)) continue;
      const spread = this.spreads.get(item.region.id);
      if (spread) this.drawSpread(context, item, spread, time);
      else this.drawPaint(context, item, this.paints[item.region.id] ?? null);
    }
    context.restore();
  }

  private drawSpread(context: CanvasRenderingContext2D, item: CompiledRegion, spread: Spread, time: number): void {
    const progress = clamp((time - spread.start) / spread.duration, 0, 1);
    if (progress >= 1) { this.spreads.delete(item.region.id); this.drawPaint(context, item, spread.next); return; }
    this.drawPaint(context, item, spread.previous);
    const ease = 1 - Math.pow(1 - progress, 2);
    const radius = Math.max(5, spread.radius * ease);
    if (spread.next.paintType === 'smooth') {
      for (const [margin, opacity] of [[18, 0.16], [9, 0.30], [0, 1]]) {
        context.save(); context.beginPath(); context.arc(spread.center.x, spread.center.y, radius + margin, 0, Math.PI * 2); context.clip(); context.globalAlpha = opacity;
        this.drawPaint(context, item, spread.next); context.restore();
      }
    } else {
      const random = seededRandom(fixedSeed(`${item.region.id}:${spread.next.paintType}`));
      const points = spread.next.paintType === 'crayon' ? 48 : 64;
      context.save(); context.beginPath();
      for (let index = 0; index < points; index++) {
        const angle = index * Math.PI * 2 / points;
        const edge = radius * (0.93 + random() * 0.14) + (spread.next.paintType === 'pencil' ? (index % 2) * 17 : 0);
        const x = spread.center.x + Math.cos(angle) * edge; const y = spread.center.y + Math.sin(angle) * edge;
        if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.closePath(); context.clip(); this.drawPaint(context, item, spread.next); context.restore();
    }
  }

  private drawBackground(context: CanvasRenderingContext2D): void {
    context.fillStyle = '#FFFFFF'; context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (this.background) context.drawImage(this.background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private render(): void {
    const start = this.now();
    this.context.resetTransform();
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    this.drawBackground(this.context);
    this.context.resetTransform();
    this.context.drawImage(canvasImage(this.paintLayer), 0, 0);
    this.context.drawImage(canvasImage(this.detailLayer), 0, 0);
    if (this.frame) this.context.drawImage(this.frame, 0, 0, this.canvas.width, this.canvas.height);
    this.counters.frames++;
    this.counters.lastFrameMs = this.now() - start;
    this.counters.maxFrameMs = Math.max(this.counters.maxFrameMs, this.counters.lastFrameMs);
  }

  private scheduleFrame(): void {
    if (this.pendingFrame !== null || this.spreads.size === 0) return;
    this.pendingFrame = this.requestFrame(() => {
      this.pendingFrame = null;
      if (this.disposed || this.spreads.size === 0) return;
      const dirty = [...this.spreads.keys()].map((id) => this.compiledById.get(id)?.dirtyBounds).filter((bounds): bounds is Bounds => bounds !== undefined);
      if (dirty.length > 0) {
        const start = this.now();
        this.redrawPaintLayer(unionBounds(dirty));
        this.render();
        this.counters.lastFrameMs = this.now() - start;
        this.counters.maxFrameMs = Math.max(this.counters.maxFrameMs, this.counters.lastFrameMs);
      }
      this.scheduleFrame();
    });
  }

  private cancelSpreads(): void {
    if (this.pendingFrame !== null) this.cancelFrame(this.pendingFrame);
    this.pendingFrame = null;
    this.spreads.clear();
  }
}
