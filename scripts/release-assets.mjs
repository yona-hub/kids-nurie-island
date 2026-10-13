import fs from 'node:fs/promises';
import path from 'node:path';
import { templateHash } from '../tools/asset-pipeline/build.mjs';

export function releaseApprovalError(template, review, qa) {
  if (!qa?.pass || !template?.approved) return '素材の技術検査または承認状態を確認してください';
  if (review?.approval?.kind !== 'human') return '人間による線画の確認・承認が必要です';
  if (review.approval.contentHash !== templateHash(template)) return '承認後に線画が変更されています';
  if (qa.contentHash !== templateHash(template)) return '現在の線画に対する技術検査が必要です';
  return null;
}
export async function verifyReleaseAssets(root = path.resolve(import.meta.dirname, '..')) {
  const catalog = JSON.parse(await fs.readFile(path.join(root,'apps/web/public/content/catalog.json'),'utf8'));
  if (!catalog.length) throw new Error('公開する承認済み線画がありません。');
  const failures = [];
  for (const item of catalog) {
    if (!item.assetUrl?.startsWith('/content/templates/') || item.assetUrl.includes('..')) throw new Error(`Invalid template asset URL: ${item.id}`);
    const [template, review, qa] = await Promise.all([
      fs.readFile(path.join(root,'apps/web/public',item.assetUrl.slice(1)),'utf8'),
      fs.readFile(path.join(root,'content/templates/reviews',`${item.id}.json`),'utf8'),
      fs.readFile(path.join(root,'content/qa',`${item.id}.json`),'utf8'),
    ]).then(items=>items.map(item=>JSON.parse(item)));
    const error = releaseApprovalError(template, review, qa);
    if (error) failures.push(`${item.id}: ${error}`);
  }
  if (failures.length) throw new Error(`公開用アセットの確認が必要です。\n${failures.join('\n')}\nローカル技術検証は npm run build:demo を使用できます。`);
  console.log(`Release asset approval verified: ${catalog.length} templates.`);
}
