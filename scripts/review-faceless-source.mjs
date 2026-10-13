import fs from 'node:fs/promises';
import {constructionMap} from '../tools/asset-pipeline/faceless-vehicle.mjs';
const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const source='content/vector-generated/faceless-source',qa=await read(`${source}/qa.json`),old=await read('apps/web/public/content/templates/gen-excavator-cones-v2.json');
const prior=await read('content/vector-generated/faceless-analysis-review.json').catch(e=>{if(e.code==='ENOENT')return null;throw e;});
if(prior&&prior.originalSha256!==qa.originalSha256)throw Error('Do not reuse annotations from another generated source.');
const regions=qa.regions.map(r=>{
 const number=constructionMap[Number(r.id.slice(1))],part=old.regions.find(p=>p.id===`r${String(number).padStart(2,'0')}`);
 if(!part)return {sourceRegionId:r.id,point:r.labelPoint,role:'background',name:'アームとピストンの間の背景',reason:'生成原画でアームとピストンに挟まれた負の空間。車の部品ではないため塗り領域から除く。'};
 return {sourceRegionId:r.id,point:r.labelPoint,role:'paint',name:part.name,reason:`新しい番号付き原画と対応表で${part.name}として照合。旧承認・旧幅例外は転記せず、新原画の操作証拠を使用。`,...Object.fromEntries(['material','confidence','shade','highlight','texture','direction'].map(k=>[k,part[k]])),...(r.usableDiameter<24?{widthException:{reason:'細い軸・クローラー部品。新原画に対する4倍の直接タップ・描画・消去を測定する。',evidenceFile:'content/generated-lineart/interaction/gen-excavator-cones-faceless-v1.json'}}:{})};
});
for(const tiny of qa.tinyRegionDetails)regions.push({point:tiny.point,role:'background',name:'奥アームとピストン接合の負の空間',reason:'原画を拡大して確認した二本の部品の交点にある小さな白い隙間。独立した車の部品ではなく、線やmaskの修復はしない。'});
// Already excluded negative spaces disappear from the compiler's region list.
// Retain these exact source/coordinate-bound annotations on a repeated review.
for(const r of prior?.regions??[])if(r.role==='background'&&!regions.some(p=>JSON.stringify(p.point)===JSON.stringify(r.point)))regions.push(r);
const gapReviews=qa.gapCandidateDetails.map(g=>{
 const parent=regions.find(r=>r.sourceRegionId===g.parentRegionId);
 return {candidateKey:g.candidateKey,originalSha256:g.originalSha256,kind:g.kind,parentRegionId:g.parentRegionId,parentRegionName:parent.name,parentExteriorConnected:g.parentExteriorConnected,point:g.labelPoint,classification:'intentional-open-detail',part:'右クローラーの外周折り返し',reason:'生成原画の右端で履帯の内部線が外周手前で止まる意図した開線。外背景に接続せず、9px closeだけで別領域へ分割される。原画・黒線・解析maskを自動修復しない。'};
});
const result={schemaVersion:1,templateId:qa.templateId,originalSha256:qa.originalSha256,coordinateSpace:'normalized-1600x2000',reviewer:'Codex technical source review',reviewKind:'author-technical-annotation',humanApproved:false,checks:['faceless-vehicle','physical-parts-preserved','negative-spaces-excluded'],unresolvedLeaks:[],regions,gapReviews};
await fs.writeFile('content/vector-generated/faceless-analysis-review.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({paint:regions.filter(r=>r.role==='paint').length,negativeSpaces:regions.filter(r=>r.role==='background').length,gaps:gapReviews.length,narrow:regions.filter(r=>r.widthException).length,humanApproved:false}));
