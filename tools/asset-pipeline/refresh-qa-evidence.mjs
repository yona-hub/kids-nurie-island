/** Update only candidate-review evidence; preserve the existing human adoption. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { root, templateHash } from './build.mjs';
import { readRasterPackage } from './raster-package.mjs';
import { validateGapEvidence } from './gap-reviews.mjs';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const without=(value,keys)=>Object.fromEntries(Object.entries(value).filter(([key])=>!keys.includes(key)));
export function assertQaOnlyRefresh(before,after){
 if(!after.qa.pass||before.qa.originalSha256!==after.qa.originalSha256||before.qa.templateSha256!==after.qa.templateSha256||before.qa.normalizedSha256!==after.qa.normalizedSha256)throw Error('技術証拠更新で原画・形状・QA合否を変更できません');
 if(JSON.stringify(without(before.qa,['annotationSha256','gapCandidateDetails','gapReviewSchemaVersion']))!==JSON.stringify(without(after.qa,['annotationSha256','gapCandidateDetails','gapReviewSchemaVersion'])))throw Error('候補注釈以外のQA変更は技術証拠更新の範囲外です');
 if(JSON.stringify(without(before.annotation,['gapReviews']))!==JSON.stringify(without(after.annotation,['gapReviews'])))throw Error('候補注釈以外の素材・領域設定は変更できません');
}

export async function refreshQaEvidence(){
 const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
 const catalog=await read(path.join(root,'apps/web/public/content/catalog.json')),jobs=[];
 // Validate every package before the first metadata mutation.
 for(const {id}of catalog){
  const source=path.join(root,'tools/asset-pipeline/output',id),retained=path.join(root,'content/generated-lineart/compiled',id);
  const next=await readRasterPackage(source);
  const before={qa:await read(path.join(retained,'qa.json')),annotation:await read(path.join(retained,'analysis-review.json'))};
  const after={qa:next.qa,annotation:await read(path.join(source,'analysis-review.json'))};
  validateGapEvidence(next.template,after.qa,after.annotation);assertQaOnlyRefresh(before,after);
  const template=await read(path.join(root,'content/templates',`${id}.json`));
  const reviewFile=path.join(root,'content/templates/reviews',`${id}.json`),reviewBytes=await fs.readFile(reviewFile),review=JSON.parse(reviewBytes);
  if(review.approval?.kind!=='human'||review.approval.contentHash!==templateHash(template))throw Error(`${id}: 現在の正式採用記録を照合できません`);
  const protectedFiles=(await fs.readdir(retained)).filter(file=>/^(original\.(png|jpe?g|webp)|normalized-lineart\.png|grayscale\.png|analysis-(mask|dilate-candidate|gap-candidates)\.png|debug-regions\.png|mask-r\d+\.png|regions\.svg|template\.json|interaction-[a-f0-9]{64}\.json)$/.test(file));
  for(const file of protectedFiles){if(!(await fs.readFile(path.join(retained,file))).equals(await fs.readFile(path.join(source,file))))throw Error(`${id}/${file}: 原画・形状・解析mask・操作証拠を変更できません`);}
  const updates=[];
  for(const file of ['qa.json','analysis-review.json']){const oldBytes=await fs.readFile(path.join(retained,file)),newBytes=await fs.readFile(path.join(source,file));if(!oldBytes.equals(newBytes))updates.push({file,oldBytes,newBytes,beforeSha256:digest(oldBytes),afterSha256:digest(newBytes)});}
  jobs.push({id,retained,reviewFile,reviewBytes,approval:review.approval,protectedFiles,updates});
 }
 for(const job of jobs){
  const history=path.join(job.retained,'evidence-history');await fs.mkdir(history,{recursive:true});
  for(const update of job.updates){
   await fs.writeFile(path.join(history,`${update.beforeSha256}-${update.file}`),update.oldBytes,{flag:'wx'}).catch(error=>{if(error.code!=='EEXIST')throw error;});
   const target=path.join(job.retained,update.file);await fs.writeFile(target+'.tmp',update.newBytes);await fs.rename(target+'.tmp',target);
  }
  if(!(await fs.readFile(job.reviewFile)).equals(job.reviewBytes))throw Error(`${job.id}: 正式採用記録が処理中に変更されました`);
 }
 const report={schemaVersion:1,kind:'technical-evidence-correction',recordedAt:new Date().toISOString(),basis:'A06-03: 候補説明を原画hash・座標・候補mask・親領域・外背景接続へ照合。原画・公開形状・素材・ユーザー正式採用の内容と日時は変更しない。',newHumanApprovalCreated:false,templates:jobs.map(job=>({id:job.id,contentHash:job.approval.contentHash,existingApproval:job.approval,approvalFileSha256:digest(job.reviewBytes),protectedFiles:job.protectedFiles,updates:job.updates.map(({file,beforeSha256,afterSha256})=>({file,beforeSha256,afterSha256}))}))};
 const history=path.join(root,'content/generated-lineart/technical-updates');await fs.mkdir(history,{recursive:true});
 const filename=`a06-03-${report.recordedAt.replace(/[:.]/g,'-')}.json`;await fs.writeFile(path.join(history,filename),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const result=await refreshQaEvidence();console.log(JSON.stringify({templates:result.templates.length,updatedFiles:result.templates.reduce((sum,t)=>sum+t.updates.length,0),newHumanApprovalCreated:false}));}
