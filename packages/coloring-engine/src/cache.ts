import type { Bounds } from '../../shared-types/src/index';
import type { EngineCanvas } from './canvas';

export interface RegionSurface { canvas: EngineCanvas; bounds: Bounds; bytes: number }

/** A strict byte bounded LRU. Eviction also releases the backing bitmap. */
export class SurfaceCache {
  private entries = new Map<string, RegionSurface>();
  private used = 0;
  constructor(readonly maxBytes: number) {}
  get bytes(): number { return this.used; }
  get size(): number { return this.entries.size; }
  get(key: string): RegionSurface | undefined {
    const value = this.entries.get(key);
    if (!value) return undefined;
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }
  set(key: string, value: RegionSurface): boolean {
    if (value.bytes > this.maxBytes) return false;
    this.delete(key);
    while (this.used + value.bytes > this.maxBytes && this.entries.size > 0) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.delete(oldest);
    }
    this.entries.set(key, value);
    this.used += value.bytes;
    return true;
  }
  delete(key: string): void {
    const value = this.entries.get(key);
    if (!value) return;
    this.used -= value.bytes;
    value.canvas.width = 1;
    value.canvas.height = 1;
    this.entries.delete(key);
  }
  clear(): void { for (const key of this.entries.keys()) this.delete(key); }
}
