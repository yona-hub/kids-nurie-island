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
  if (![2,3,4].includes(profile.version) || !Array.isArray(profile.groups) || !Array.isArray(profile.eyes) || !profile.upgradeFrom || !profile.mediumAssets) throw new Error('ぬり方のデータが正しくありません。');
  if (profile.eyeStyle !== undefined && !['soft-v1','storybook-v2','authored-v3','simple-guide-v4','friendly-ink-v4'].includes(profile.eyeStyle)) throw new Error('目の描き方が正しくありません。');
  if(profile.version>=3){
    if(!(profile.version===4?['simple-guide-v4','friendly-ink-v4'].includes(profile.eyeStyle??''):profile.eyeStyle==='authored-v3')||!profile.opaquePath||!profile.upgradeSources)throw new Error('新版の制作データが不足しています。');
    if(['construction','vehicles'].includes(template.themeId)&&profile.eyes.length)throw new Error('車に顔のデータを付けないでください。');
    if(template.regions.some(r=>[r.fillRule,r.coverageFillRule].some(rule=>rule!==undefined&&!['evenodd','nonzero'].includes(rule))))throw new Error('塗り面の穴の規則が正しくありません。');
    for(const eye of profile.eyes){const a=eye.artwork;if(!a||!['human','animal','dinosaur','robot'].includes(a.kind)||!a.opening||!a.upperLid||!a.lowerLid||!Array.isArray(a.lashes)||!Array.isArray(a.reflections)||a.reflections.length<2||[a.upperWidth,a.lowerWidth,a.lashWidth].some(w=>!Number.isFinite(w)||w<=0)||[a.iris,a.pupil].some(g=>!g||!Object.values(g).every(Number.isFinite)||g.width<=0||g.height<=0)||a.reflections.some(r=>!r.path||!Number.isFinite(r.opacity)||r.opacity<=0||r.opacity>1)||!template.regions.some(r=>r.id===eye.parentRegionId))throw new Error('目の制作データが正しくありません。');if(eye.owner!=='princess'&&a.lashes.length)throw new Error('このキャラクターに追加まつげはありません。');}
  }
  if(profile.version===4){
    const form=profile.formArtwork;
    if(template.themeId!=='princess'||!profile.mediumAssets.form||!form||form.encoding!=='relative-light-v1'||form.width!==2048||form.height!==2560||!/^[a-f0-9]{64}$/.test(form.masterSha256)||!form.sourceTemplateId||!Array.isArray(form.groups))throw new Error('完成原画の陰影データが不足しています。');
    const groups=new Set(form.groups.map(g=>g.groupId));
    if(groups.size!==form.groups.length||form.groups.some(g=>!profile.groups.some(p=>p.id===g.groupId)||!/^#[a-f0-9]{6}$/i.test(g.referenceColor))||profile.groups.some(g=>!profile.eyes.some(e=>g.regionIds.includes(e.regionId))&&!groups.has(g.id)))throw new Error('完成原画と塗る部位の対応が正しくありません。');
    for(const eye of profile.eyes){const guide=eye.artwork?.blankGuide;if(!guide||!Object.values(guide).every(Number.isFinite)||guide.radius<=0||guide.strokeWidth<=0)throw new Error('線画の目の案内が正しくありません。');}
    if(profile.eyeStyle==='friendly-ink-v4'&&profile.eyes.some(e=>!e.artwork?.blankInkPath))throw new Error('初期線画の目のデータが不足しています。');
  }
  if(profile.smoothArtwork){
    const art=profile.smoothArtwork,groups=new Set(art.groups?.map(g=>g.groupId));
    if(profile.version<3||!profile.mediumAssets.smooth||!['relative-light-v1','relative-light-rgb-v2'].includes(art.encoding)||!['pigment-v1','surface-v1'].includes(art.ink)||art.width!==2048||art.height!==2560||!/^[a-f0-9]{64}$/.test(art.masterSha256)||!Array.isArray(art.groups)||groups.size!==art.groups.length||art.groups.some(g=>!profile.groups.some(p=>p.id===g.groupId)||!/^#[a-f0-9]{6}$/i.test(g.referenceColor))||profile.groups.some(g=>!profile.eyes.some(e=>g.regionIds.includes(e.regionId))&&!groups.has(g.id)))throw new Error('なめらか塗りの完成原画データが正しくありません。');
    if(art.encoding==='relative-light-rgb-v2'&&(art.ink!=='surface-v1'||!art.chromaticRegionIds?.length||new Set(art.chromaticRegionIds).size!==art.chromaticRegionIds.length||art.chromaticRegionIds.some(id=>!template.regions.some(r=>r.id===id)||profile.eyes.some(e=>e.regionId===id||e.highlightId===id))))throw new Error('なめらか塗りの相対色の対応が正しくありません。');
    if(art.ink==='surface-v1'){
      const fields=art.surfaceFields,ids=new Set(fields?.parts?.map(r=>r.regionId)),parts=template.regions.filter(r=>!profile.eyes.some(e=>e.regionId===r.id||e.highlightId===r.id));
      if(fields?.fillRule!=='evenodd'||!Array.isArray(fields.parts)||ids.size!==parts.length||ids.size!==fields.parts.length||parts.some(r=>!ids.has(r.id))||fields.parts.some(r=>!r.path)||!Array.isArray(fields.brows)||fields.brows.some(b=>!parts.some(r=>r.id===b.parentRegionId)||!parts.some(r=>r.id===b.colorRegionId)||!b.path||!Object.values(b.bounds).every(Number.isFinite)))throw new Error('なめらか塗りの面の対応が正しくありません。');
      const bounds=(b:{x:number;y:number;width:number;height:number}|undefined)=>!!b&&Object.values(b).every(Number.isFinite)&&b.width>0&&b.height>0;
      const skin=art.skinLight;
      if(!!skin!==!!profile.mediumAssets.skin||(skin&&(!Number.isInteger(skin.width)||!Number.isInteger(skin.height)||skin.width<=0||skin.width>2048||skin.height<=0||skin.height>4096||!skin.parts.length||new Set(skin.parts.map(p=>p.regionId)).size!==skin.parts.length||skin.parts.some(p=>!parts.some(r=>r.id===p.regionId&&r.material==='skin')||!bounds(p.source)||!bounds(p.target)||p.source.x<0||p.source.y<0||p.source.x+p.source.width>skin.width||p.source.y+p.source.height>skin.height||p.target.x<0||p.target.y<0||p.target.x+p.target.width>template.width||p.target.y+p.target.height>template.height))))throw new Error('肌の陰影素材の対応が正しくありません。');
      const surface=art.surfaceLight;
      if(surface&&(!fields.paintSurfacePath||fields.parts.some(p=>typeof p.paintedByField!=='boolean')))throw new Error('部位の下塗りと切り抜きの対応がありません。');
      if(!!surface!==!!profile.mediumAssets.surface||(surface&&(!Number.isInteger(surface.width)||!Number.isInteger(surface.height)||surface.width<=0||surface.width>2048||surface.height<=0||surface.height>4096||!surface.parts.length||new Set(surface.parts.map(p=>p.regionId)).size!==surface.parts.length||surface.parts.length!==parts.filter(r=>r.material!=='skin').length||surface.parts.some(p=>!parts.some(r=>r.id===p.regionId&&r.material!=='skin')||!bounds(p.source)||!bounds(p.target)||p.source.x<0||p.source.y<0||p.source.x+p.source.width>surface.width||p.source.y+p.source.height>surface.height||p.target.x<0||p.target.y<0||p.target.x+p.target.width>template.width||p.target.y+p.target.height>template.height))))throw new Error('部位の陰影素材の対応が正しくありません。');
      if(fields.parts.some(p=>(p.bounds!==undefined&&!bounds(p.bounds))||!!p.coveragePath!==!!p.paintBounds||(p.paintBounds!==undefined&&!bounds(p.paintBounds)))||fields.brows.some(b=>!bounds(b.bounds)||(b.clipPath!==undefined&&!b.clipPath)))throw new Error('なめらか塗りの補修範囲が正しくありません。');
      if(fields.faces?.some(f=>!f.path||!profile.eyes.some(e=>e.parentRegionId===f.parentRegionId&&e.artwork?.kind===f.kind)||!template.regions.some(r=>r.id===f.colorRegionId))||fields.whiteDetails?.some(w=>!Number.isInteger(w.detailIndex)||!/^#f{3}(?:f{3})?$/i.test(template.details[w.detailIndex]?.fill??'')||!ids.has(w.regionId))||new Set(fields.whiteDetails?.map(w=>w.detailIndex)).size!==(fields.whiteDetails?.length??0)||(fields.repairSilhouettePath!==undefined&&typeof fields.repairSilhouettePath!=='string'))throw new Error('なめらか塗りの表情と補修の対応が正しくありません。');
      if(!Array.isArray(art.eyes)||art.eyes.length!==profile.eyes.length||new Set(art.eyes.map(e=>e.regionId)).size!==profile.eyes.length||art.eyes.some(e=>!profile.eyes.some(p=>p.regionId===e.regionId)||[e.upperShadePath,e.upperCreasePath].some(p=>p!==undefined&&(typeof p!=='string'||!p))||[e.iris,e.pupil].some(g=>!g||!Object.values(g).every(Number.isFinite)||g.width<=0||g.height<=0)||!Number.isFinite(e.reflectionScale)||e.reflectionScale<1||e.reflectionScale>3||e.reflectionCenters.length!==2||e.reflectionCenters.some(c=>!Object.values(c).every(Number.isFinite)))||fields.mouths?.some(m=>!parts.some(p=>p.id===m.regionId&&(p.name==='口'||p.name.endsWith('の口')))||(m.teethPath!==undefined&&!m.teethPath)||(m.blankInkPath!==undefined&&!m.blankInkPath)))throw new Error('なめらか塗りの目と口の制作データが正しくありません。');
      if(fields.insets?.some(i=>!ids.has(i.regionId)||!i.path||!['dark','light'].includes(i.tone)))throw new Error('なめらか塗りの細部の対応が正しくありません。');
    }
  }else if(profile.mediumAssets.smooth)throw new Error('なめらか塗りの完成原画の対応がありません。');
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
  for(const map of Object.values(profile.upgradeSources??{}))for(const [old,id]of Object.entries(map))if(!old||!ids.has(id)||profile.retiredRegionIds?.includes(old))throw new Error('新版の引継ぎ対応が正しくありません。');
}
