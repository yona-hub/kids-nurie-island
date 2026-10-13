import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { root, loadMasters, build } from './build.mjs';
import { readRasterPackage } from './raster-package.mjs';

const directory=path.resolve(process.argv[2]??'');
if(!process.argv[2])throw Error('使い方: node tools/asset-pipeline/import.mjs <コンパイル出力フォルダ> [--draft]');
const {template,qa}=await readRasterPackage(directory);
if(!qa.pass&&!process.argv.includes('--draft'))throw Error('QA不合格です。検査用の未公開draft登録には --draft を指定してください');
const existing=(await loadMasters()).find(m=>m.id===template.id);
const refresh=process.argv.includes('--refresh-evidence');
if(!/^[a-z][a-z0-9-]{1,63}$/.test(template.id)||(existing&&!refresh))throw Error('IDが不正または既に存在します。既存の原画は上書きしません');
if(existing&&refresh){
 if(existing.sourceKind!=='generated-raster'||existing.originalSha256!==qa.originalSha256||
  JSON.stringify(existing.regions.map(r=>({id:r.id,path:r.path})))!==JSON.stringify(template.regions.map(r=>({id:r.id,path:r.path})))||
  JSON.stringify(existing.details)!==JSON.stringify(template.details))throw Error('証拠更新で原画・領域・黒線は変更できません。新しいIDが必要です');
 const review=await fs.readFile(path.join(root,'content/templates/reviews',`${template.id}.json`),'utf8').then(JSON.parse).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
 if(review?.approval?.kind==='human')throw Error('人間承認後の証拠パッケージを自動更新できません');
}
const colors={standard:'#A7D2E7',skin:'#FFDFB5',hair:'#B78766',fur:'#E3CBAA',fabric:'#B69CE8',metal:'#B6C5D2',plastic:'#FFD667',glass:'#7BBFE9',rubber:'#677E96',wood:'#B78766',stone:'#B6C5D2'};
const families={princess:'pink',magic:'purple',animals:'brown',ocean:'blue',dinosaurs:'green',vehicles:'red',construction:'yellow',robots:'gray',space:'blue',flowers:'pink'};
const master={...template,defaultColorFamily:families[template.themeId]??template.defaultColorFamily,approved:false,sourceKind:'generated-raster',catalogVisible:true,regionRange:qa.expectedRange,regionCountPolicy:qa.countPolicy,originalSha256:qa.originalSha256,regions:template.regions.map(r=>({...r,sampleColor:colors[r.material]??colors.standard}))};
const imported=path.join(root,'content/templates/imported');await fs.mkdir(imported,{recursive:true});
const retained=path.join(root,'content/generated-lineart/compiled',template.id);await fs.mkdir(retained,{recursive:true});
// Retain original pixels, masks, measurements, and geometry together. Approval
// does not edit this compiler evidence, and failure remains failure at build.
for(const file of await fs.readdir(directory))if(/^(original\.(png|jpe?g|webp)|normalized-lineart\.png|grayscale\.png|analysis-[a-z-]+\.png|analysis-review\.json|interaction-[a-f0-9]{64}\.json|debug-regions\.png|mask-r\d+\.png|regions\.svg|template\.json|qa\.json)$/.test(file)){
 const bytes=await fs.readFile(path.join(directory,file));
 const old=await fs.readFile(path.join(retained,file)).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
 if(old?.equals(bytes))continue;
 if(old){
  if(!refresh)throw Error('保持済み原画パッケージは上書きできません');
  const history=path.join(retained,'evidence-history');await fs.mkdir(history,{recursive:true});
  const digest=createHash('sha256').update(old).digest('hex');await fs.writeFile(path.join(history,`${digest}-${file}`),old,{flag:'wx'}).catch(error=>{if(error.code!=='EEXIST')throw error;});
 }
 await fs.writeFile(path.join(retained,file),bytes);
}
await fs.writeFile(path.join(imported,`${template.id}.json`),`${JSON.stringify(master,null,2)}\n`,{flag:existing&&refresh?'w':'wx'});
if(!process.argv.includes('--no-build'))await build();
console.log(`${template.id} を未承認${qa.pass?'':'・QA不合格draft'}で取り込みました。制作確認サーバーを再起動し、日本語名・素材・原画・3画材を確認してください。`);
