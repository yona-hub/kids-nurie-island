import { describe, expect, it } from 'vitest';
import { wheelDeltaPixels } from '../packages/coloring-engine/src/geometry';

describe('wheel input units', () => {
  it.each([
    { mode: 0, delta: -100 },
    { mode: 1, delta: -4 },
    { mode: 2, delta: -.2 },
  ])('normalizes mode $mode to the same 100 CSS pixel movement', ({ mode, delta }) => {
    expect(wheelDeltaPixels(delta, mode, 25, 500)).toBe(-100);
    expect(wheelDeltaPixels(-delta, mode, 25, 500)).toBe(100);
  });

  it('keeps subpixel movement and uses the supplied visible height after a resize', () => {
    expect(wheelDeltaPixels(-.5, 0, 25, 500)).toBe(-.5);
    expect(wheelDeltaPixels(-1, 2, 25, 250)).toBe(-250);
    expect(wheelDeltaPixels(-2, 1, 18, 500)).toBe(-36);
  });

  it('ignores invalid deltas, unknown modes and non-positive unit sizes', () => {
    for (const delta of [NaN, Infinity, -Infinity]) expect(wheelDeltaPixels(delta, 0, 25, 500)).toBe(0);
    expect(wheelDeltaPixels(-1, 3, 25, 500)).toBe(0);
    expect(wheelDeltaPixels(-1, 1, NaN, 500)).toBe(0);
    expect(wheelDeltaPixels(-1, 2, 25, 0)).toBe(0);
  });
});
