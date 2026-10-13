import {it,expect} from 'vitest';
import {packSurfacePatches} from '../scripts/surface-light-atlas.mjs';
import rectangles from './fixtures/construction-light-rectangles.json';

it('packs the construction materials at full authored resolution without overlap or exceeding the existing image limit',()=>{
 const atlas=packSurfacePatches(rectangles);expect(atlas.width).toBeLessThanOrEqual(2048);expect(atlas.height).toBeLessThanOrEqual(4096);expect(packSurfacePatches(rectangles)).toEqual(atlas);
 atlas.positions.forEach((a,i)=>{
  expect([a.width,a.height]).toEqual([rectangles[i].width,rectangles[i].height]);expect(a.x).toBeGreaterThanOrEqual(4);expect(a.y).toBeGreaterThanOrEqual(4);expect(a.x+a.width+4).toBeLessThanOrEqual(atlas.width);expect(a.y+a.height+4).toBeLessThanOrEqual(atlas.height);
  atlas.positions.slice(i+1).forEach(b=>expect(a.x+a.width+8<=b.x||b.x+b.width+8<=a.x||a.y+a.height+8<=b.y||b.y+b.height+8<=a.y).toBe(true));
 });
});
