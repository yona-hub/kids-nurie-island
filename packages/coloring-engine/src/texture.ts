import type { Bounds, MaterialType, PaintType, Region, RegionPaint } from '../../shared-types/src/index';
import { clamp } from './geometry';

export function fixedSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export const MATERIAL_STRENGTH: Record<PaintType, number> = { smooth: 1, crayon: 0.7, pencil: 0.55 };
export const SPREAD_DURATION: Record<PaintType, number> = { smooth: 180, crayon: 205, pencil: 190 };

const MATERIALS: Record<MaterialType, { shade: number; highlight: number }> = {
  standard: { shade: 0.085, highlight: 0.10 }, skin: { shade: 0.065, highlight: 0.075 },
  hair: { shade: 0.12, highlight: 0.17 }, fur: { shade: 0.065, highlight: 0.07 },
  fabric: { shade: 0.10, highlight: 0.035 }, metal: { shade: 0.19, highlight: 0.26 },
  plastic: { shade: 0.085, highlight: 0.19 }, glass: { shade: 0.12, highlight: 0.30 },
  rubber: { shade: 0.11, highlight: 0.025 }, wood: { shade: 0.075, highlight: 0.05 },
  stone: { shade: 0.095, highlight: 0.06 },
};

const rgba = (white: boolean, alpha: number) => `rgba(${white ? '255,255,255' : '0,0,0'},${clamp(alpha, 0, 1)})`;

function luminance(color: string): number {
  const value = Number.parseInt(color.slice(1), 16);
  return (((value >>> 16) & 255) * 0.2126 + ((value >>> 8) & 255) * 0.7152 + (value & 255) * 0.0722) / 255;
}

function fillGradient(context: CanvasRenderingContext2D, bounds: Bounds, stops: [number, string][], angle = Math.PI / 4): void {
  const extent = Math.abs(Math.cos(angle)) * bounds.width + Math.abs(Math.sin(angle)) * bounds.height;
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const dx = Math.cos(angle) * extent / 2;
  const dy = Math.sin(angle) * extent / 2;
  const gradient = context.createLinearGradient(centerX - dx, centerY - dy, centerX + dx, centerY + dy);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  context.fillStyle = gradient;
  context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
}

function materialFinish(context: CanvasRenderingContext2D, region: Region, paint: RegionPaint, seed: number): void {
  const { bounds: b, material } = region;
  const level = MATERIAL_STRENGTH[paint.paintType];
  const light = luminance(paint.color);
  // Do not turn white into gray or black into a reflective silver surface.
  const shade = MATERIALS[material].shade * level * (0.20 + 0.80 * Math.min(light * 1.3, 1)) * (light > 0.96 ? 0.52 : 1);
  const highlight = MATERIALS[material].highlight * level * (0.55 + 0.45 * light) * (light > 0.95 ? 0.30 : 1);
  const angle = (Number.isFinite(region.direction) ? region.direction : 90) * Math.PI / 180;

  if (region.shade) {
    fillGradient(context, b, [[0, rgba(false, 0)], [0.36, rgba(false, 0)], [0.78, rgba(false, shade * 0.4)], [1, rgba(false, shade)]]);
    if (material === 'fabric') {
      fillGradient(context, b, [[0, rgba(false, 0)], [0.28, rgba(false, shade * 0.35)], [0.47, rgba(false, 0)], [0.75, rgba(false, shade * 0.45)], [1, rgba(false, 0)]], angle);
    } else if (material === 'rubber') {
      const radius = Math.max(b.width, b.height) * 0.75;
      const gradient = context.createRadialGradient(b.x + b.width * 0.44, b.y + b.height * 0.42, radius * 0.22, b.x + b.width / 2, b.y + b.height / 2, radius);
      gradient.addColorStop(0, rgba(false, 0)); gradient.addColorStop(1, rgba(false, shade * 0.9));
      context.fillStyle = gradient; context.fillRect(b.x, b.y, b.width, b.height);
    }
  }
  if (region.highlight) {
    if (material === 'metal') {
      fillGradient(context, b, [[0, rgba(true, 0)], [0.10, rgba(true, highlight)], [0.17, rgba(true, highlight * 0.12)], [0.36, rgba(true, 0)], [0.46, rgba(true, highlight * 0.8)], [0.58, rgba(true, 0)], [1, rgba(true, 0)]], angle);
    } else if (material === 'glass') {
      fillGradient(context, b, [[0, rgba(true, 0)], [0.16, rgba(true, 0)], [0.20, rgba(true, highlight)], [0.24, rgba(true, highlight)], [0.27, rgba(true, 0)], [0.33, rgba(true, 0)], [0.35, rgba(true, highlight * 0.65)], [0.38, rgba(true, 0)], [1, rgba(true, 0)]], -Math.PI / 6);
    } else if (material !== 'hair') {
      const radius = Math.max(b.width, b.height) * 0.85;
      const gradient = context.createRadialGradient(b.x + b.width * 0.29, b.y + b.height * 0.23, 0, b.x + b.width * 0.29, b.y + b.height * 0.23, radius);
      gradient.addColorStop(0, rgba(true, highlight)); gradient.addColorStop(0.60, rgba(true, highlight * 0.18)); gradient.addColorStop(1, rgba(true, 0));
      context.fillStyle = gradient; context.fillRect(b.x, b.y, b.width, b.height);
    }
  }
  if (material === 'hair' && (region.shade || region.highlight)) {
    fillGradient(context, b, [[0, rgba(false, 0)], [0.15, rgba(false, region.shade ? shade * 0.55 : 0)], [0.30, rgba(true, region.highlight ? highlight * 0.8 : 0)], [0.44, rgba(false, 0)], [0.62, rgba(false, region.shade ? shade * 0.5 : 0)], [0.77, rgba(true, region.highlight ? highlight * 0.55 : 0)], [1, rgba(false, 0)]], angle + Math.PI / 2);
  }
  const amount = clamp(region.texture, 0, 1) * level;
  if (amount <= 0 || material === 'skin') return;
  const random = seededRandom(seed);
  if (material === 'fur' || material === 'stone') {
    const count = Math.min(620, Math.ceil(b.width * b.height / (material === 'fur' ? 500 : 420)));
    context.lineCap = 'round';
    for (let index = 0; index < count; index++) {
      const x = b.x + random() * b.width; const y = b.y + random() * b.height;
      const white = random() > 0.46;
      context.strokeStyle = rgba(white, amount * (white ? 0.075 : 0.055));
      context.fillStyle = context.strokeStyle;
      if (material === 'fur') {
        const length = 3 + random() * 9; const direction = angle + (random() - 0.5) * 1.3;
        context.lineWidth = 1.4 + random() * 1.6;
        context.beginPath(); context.moveTo(x, y); context.lineTo(x + Math.cos(direction) * length, y + Math.sin(direction) * length); context.stroke();
      } else {
        context.beginPath(); context.ellipse(x, y, 1 + random() * 4, 1 + random() * 2, random() * Math.PI, 0, Math.PI * 2); context.fill();
      }
    }
  } else if (material === 'wood') {
    context.save(); context.translate(b.x + b.width / 2, b.y + b.height / 2); context.rotate(angle);
    const diagonal = Math.hypot(b.width, b.height);
    context.lineWidth = 1.8;
    for (let offset = -diagonal / 2; offset < diagonal / 2; offset += 17 + random() * 15) {
      context.strokeStyle = rgba(random() > 0.6, amount * 0.07);
      context.beginPath(); context.moveTo(-diagonal / 2, offset); context.bezierCurveTo(-diagonal / 5, offset + random() * 15, diagonal / 5, offset - random() * 12, diagonal / 2, offset + random() * 7); context.stroke();
    }
    context.restore();
  }
}

function paintTexture(context: CanvasRenderingContext2D, region: Region, paint: RegionPaint, seed: number): void {
  const type = paint.paintType;
  if (type === 'smooth') return;
  const b = region.bounds;
  const random = seededRandom(seed ^ 0x9e3779b9);
  const grainStrength = 0.55 + 0.45 * Math.sqrt(luminance(paint.color));
  if (type === 'crayon') {
    const count = Math.min(2600, Math.ceil(b.width * b.height / 110));
    // Keep every seeded grain position. Group near-identical opacity/width into
    // 48 paths so a new color does not issue up to 2600 separate raster strokes.
    // The same logical grouping is used for the display and full-size export.
    const buckets: number[][] = Array.from({ length: 48 }, () => []);
    context.lineCap = 'round';
    for (let index = 0; index < count; index++) {
      const x = b.x + random() * b.width; const y = b.y + random() * b.height;
      const opacity = Math.floor(random() * 8), width = Math.floor(random() * 6);
      buckets[opacity * 6 + width].push(x, y, x + 1 + random() * 5, y - 1 - random() * 4);
    }
    for (let index = 0; index < buckets.length; index++) {
      const points = buckets[index];
      if (!points.length) continue;
      context.strokeStyle = rgba(true, grainStrength * (0.11 + (Math.floor(index / 6) + 0.5) / 8 * 0.23));
      context.lineWidth = 1 + (index % 6 + 0.5) / 6 * 2.7;
      context.beginPath();
      for (let point = 0; point < points.length; point += 4) {
        context.moveTo(points[point], points[point + 1]);
        context.lineTo(points[point + 2], points[point + 3]);
      }
      context.stroke();
    }
  } else {
    context.save(); context.translate(b.x + b.width / 2, b.y + b.height / 2); context.rotate(-Math.PI / 5);
    const diagonal = Math.hypot(b.width, b.height);
    context.lineWidth = 1.05;
    // Preserve the seeded lines and group nearby opacity values. Rasterizing
    // each long stroke separately repeatedly applies the same complex mask.
    const buckets: number[][] = Array.from({ length: 32 }, () => []);
    for (let y = -diagonal / 2; y <= diagonal / 2; y += 4.8) {
      const opacity = Math.floor(random() * buckets.length);
      buckets[opacity].push(y, y + (random() - 0.5) * 2.2);
    }
    for (let index = 0; index < buckets.length; index++) {
      const lines = buckets[index];
      if (!lines.length) continue;
      context.strokeStyle = rgba(true, grainStrength * (0.10 + (index + 0.5) / buckets.length * 0.14));
      context.beginPath();
      for (let line = 0; line < lines.length; line += 2) {
        context.moveTo(-diagonal / 2, lines[line]);
        context.lineTo(diagonal / 2, lines[line + 1]);
      }
      context.stroke();
    }
    context.restore();
  }
}

/** All coordinates, directions and seeds are logical and independent of raster size. */
export function drawRegionFinish(context: CanvasRenderingContext2D, region: Region, path: Path2D, paint: RegionPaint, templateId: string): void {
  context.save();
  context.clip(path);
  context.fillStyle = paint.color;
  const b = region.bounds;
  context.fillRect(b.x - 1, b.y - 1, b.width + 2, b.height + 2);
  const seed = fixedSeed(`${templateId}:${region.id}:${paint.paintType}:${region.seed}`);
  materialFinish(context, region, paint, seed);
  paintTexture(context, region, paint, seed);
  context.restore();
}
