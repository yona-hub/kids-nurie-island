import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateGapEvidence } from './gap-reviews.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const geometry = template => JSON.stringify({
  lineWidth: template.lineWidth,
  regions: template.regions.map(region => ({ id: region.id, path: region.path })),
  details: template.details,
});

/** Bind compiler evidence to the actual original, preview, and geometry. */
export async function readRasterPackage(directory) {
  const templateBytes = await fs.readFile(path.join(directory, 'template.json'));
  const template = JSON.parse(templateBytes.toString('utf8'));
  const qa = JSON.parse(await fs.readFile(path.join(directory, 'qa.json'), 'utf8'));
  const files = await fs.readdir(directory);
  const originalName = files.find(file => /^original\.(png|jpe?g|webp)$/i.test(file));
  if (!originalName) throw Error('元画像がないため取り込めません');
  const original = await fs.readFile(path.join(directory, originalName));
  const normalized = await fs.readFile(path.join(directory, 'normalized-lineart.png'));
  if (qa.compilerVersion !== 2 || qa.templateId !== template.id ||
      qa.originalSha256 !== digest(original) || qa.templateSha256 !== digest(templateBytes) ||
      qa.normalizedSha256 !== digest(normalized)) throw Error('原画像・解析レポート・領域データのhashが一致しません');
  if (!Array.isArray(qa.errors) || qa.pass !== (qa.errors.length === 0)) throw Error('QA合否と検査結果が一致しません');
  if (qa.annotationSha256) {
    const annotationBytes=await fs.readFile(path.join(directory,'analysis-review.json'));
    if (qa.annotationSha256!==digest(annotationBytes)) throw Error('背景除外・素材注釈のhashが一致しません');
    validateGapEvidence(template,qa,JSON.parse(annotationBytes.toString('utf8')));
  }
  for (const exception of qa.widthExceptions ?? []) {
    if (!/^interaction-[a-f0-9]{64}\.json$/.test(exception.evidenceSnapshot ?? '')) throw Error('幅の個別例外に固定済み操作証拠がありません');
    const bytes = await fs.readFile(path.join(directory, exception.evidenceSnapshot));
    const evidence = JSON.parse(bytes.toString('utf8'));
    const proof = evidence.regions?.find(region => region.id === exception.id);
    const region = template.regions.find(region => region.id === exception.id);
    if (digest(bytes) !== exception.evidenceSha256 || evidence.templateId !== template.id || evidence.originalSha256 !== qa.originalSha256 ||
        !region || proof?.pathSha256 !== digest(region.path) || !['hitAtZoom4', 'painted', 'erased'].every(key => proof[key] === true) ||
        exception.usableDiameter < 17 || (exception.secondaryUsableDiameter ?? exception.usableDiameter) < 17 ||
        (exception.secondaryUsableDiameter ?? exception.usableDiameter) >= 24) throw Error('幅の個別例外と原画・領域・操作証拠が一致しません');
  }
  if (template.lineWidth !== 0 || template.details.some(detail => detail.strokeWidth !== 0)) throw Error('ラスタ原画に追加の輪郭strokeは使用できません');
  return { template, qa, original, originalName, normalized };
}

export async function rasterBuildEvidence(root, master, template) {
  if (master.sourceKind !== 'generated-raster') return null;
  const source = await readRasterPackage(path.join(root, 'content/generated-lineart/compiled', master.id));
  const errors = [...source.qa.errors];
  for (const check of ['all-subject-parts-closed', 'negative-space-excluded', 'pupils-and-highlights-white']) {
    if (!source.qa.technicalSemanticReview?.checks?.includes(check)) errors.push(`原画像の技術目視確認が未記録です: ${check}`);
  }
  if (geometry(template) !== geometry(source.template)) errors.push('公開形状が検査済みラスタの原画contourと一致しません');
  for (const region of template.regions) {
    if (/^領域\s*\d+$/.test(region.name) || region.confidence < .75) errors.push(`${region.id}: 日本語領域名・素材区分が未確認です`);
  }
  const annotation=JSON.parse(await fs.readFile(path.join(root,'content/generated-lineart/compiled',master.id,'analysis-review.json'),'utf8'));
  for(const eye of annotation.eyes??[]){
    if(eye.pupilIds.includes(eye.highlightId))errors.push('瞳とハイライトは別領域にしてください');
    for(const id of [...eye.pupilIds,eye.highlightId]){
      const region=template.regions.find(region=>region.id===id);
      if(!region||region.highlight!==false||region.shade!==false||region.texture!==0)errors.push(`${id}: 瞳と白く残せる枠に自動の陰影・ハイライト・質感を追加できません`);
    }
  }
  return { ...source, errors };
}
