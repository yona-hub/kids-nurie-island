import type { PaintMode, RegionPaint, RegionPaints, Template } from '../../shared-types/src/index';

/** Authored membership only: never group by material, location or current color. */
export function paintTargets(template: Template, regionId: string, mode: PaintMode): string[] {
  const profile = template.paintingProfile;
  const eye = profile?.eyes.find(item => item.highlightId === regionId);
  const target = eye?.regionId ?? regionId;
  if (!template.regions.some(region => region.id === target)) throw new Error('ぬる場所が見つかりませんでした。');
  return mode === 'group' ? [...(profile?.groups.find(group => group.regionIds.includes(target))?.regionIds ?? [target])] : [target];
}

export function applyPaints(paints: RegionPaints, ids: readonly string[], paint: RegionPaint | null): RegionPaints {
  const next = { ...paints };
  for (const id of ids) { if (paint) next[id] = { ...paint }; else delete next[id]; }
  return next;
}

export function validatePaintingProfile(template: Template): void {
  const profile = template.paintingProfile;
  if (!profile) return;
  if (profile.version !== 2 || !Array.isArray(profile.groups) || !Array.isArray(profile.eyes) || !profile.upgradeFrom || !profile.mediumAssets) throw new Error('ぬり方のデータが正しくありません。');
  if (profile.eyeStyle !== undefined && !['soft-v1','storybook-v2'].includes(profile.eyeStyle)) throw new Error('目の描き方が正しくありません。');
  if (template.details.some(d=>d.eyeRegionId&&!profile.eyes.some(e=>e.regionId===d.eyeRegionId))) throw new Error('目の輪郭の対応が正しくありません。');
  const ids = new Set(template.regions.map(region => region.id));
  const automatic = new Set(profile.eyes.map(eye => eye.highlightId));
  if (new Set(profile.eyes.map(eye => eye.regionId)).size !== profile.eyes.length || automatic.size !== profile.eyes.length || profile.eyes.some(eye => automatic.has(eye.regionId))) throw new Error('目の対応が重複しています。');
  if (new Set(profile.groups.map(group => group.id)).size !== profile.groups.length) throw new Error('まとめぬりの名前が重複しています。');
  if (!Object.values(profile.mediumAssets).every(url => /^\/content\/media\/[a-z0-9-]+\.[a-f0-9]{64}\.png$/.test(url))) throw new Error('画材の素材が正しくありません。');
  const seen = new Set<string>();
  for (const eye of profile.eyes) if (!ids.has(eye.regionId) || !ids.has(eye.highlightId) || eye.regionId === eye.highlightId || !eye.owner) throw new Error('目のデータが正しくありません。');
  for (const eye of profile.eyes) if (eye.geometry && (!Object.values(eye.geometry).every(Number.isFinite) || eye.geometry.width <= 0 || eye.geometry.height <= 0 || Math.abs(eye.geometry.rotation) > Math.PI / 2)) throw new Error('目の向きのデータが正しくありません。');
  for (const group of profile.groups) {
    if (!group.id || !group.name || !group.regionIds.length || !Number.isFinite(group.direction) || !Object.values(group.bounds).every(Number.isFinite) || group.bounds.width <= 0 || group.bounds.height <= 0) throw new Error('まとめぬりのデータが正しくありません。');
    if (group.shading && (!['hair','fabric'].includes(group.shading.kind) || !Array.isArray(group.shading.curves) || group.shading.curves.some(curve => curve.length !== 8 || curve.some(value => !Number.isFinite(value) || value < 0 || value > 1)))) throw new Error('陰影のデータが正しくありません。');
    for (const id of group.regionIds) { if (!ids.has(id) || automatic.has(id) || seen.has(id)) throw new Error('まとめぬりの領域が正しくありません。'); seen.add(id); }
  }
  if ([...ids].some(id => !automatic.has(id) && !seen.has(id))) throw new Error('まとめぬりの領域が不足しています。');
  for (const [old, id] of Object.entries(profile.regionMap)) if (!old || !ids.has(id)) throw new Error('以前の作品との対応が正しくありません。');
}
