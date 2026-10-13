import { inspectTemplate, materialIds, templateHash } from './build.mjs';

export const json = (response, status, data) => {
 response.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 response.end(JSON.stringify(data));
};

function validateEdits(data, template) {
 if (!data || typeof data !== 'object' || !data.regions || Array.isArray(data.regions)) throw Error('領域データが不正です');
 const regionIds=new Set(template.regions.map(r=>r.id)), allowed=['name','material','confidence','shade','highlight','texture','direction'], edits={};
 for (const [id,value] of Object.entries(data.regions)) {
  if (!regionIds.has(id)||!value||typeof value!=='object'||Array.isArray(value)) throw Error('領域IDが不正です');
  if (Object.keys(value).some(key=>!allowed.includes(key))) throw Error('変更できない項目が含まれています');
  if (typeof value.name!=='string'||value.name.length<1||value.name.length>80||!materialIds.includes(value.material)) throw Error('名前または素材が不正です');
  if (typeof value.shade!=='boolean'||typeof value.highlight!=='boolean'||![value.confidence,value.texture,value.direction].every(Number.isFinite)||value.confidence<0||value.confidence>1||value.texture<0||value.texture>1||value.direction<0||value.direction>360) throw Error('素材の設定値が不正です');
  edits[id]=Object.fromEntries(allowed.map(key=>[key,value[key]]));
 }
 if (Object.keys(edits).length!==regionIds.size) throw Error('すべての領域を保存してください');
 return edits;
}

/** Storage is injectable for real HTTP/UI regression tests without human records. */
export function createReviewApi({masters,store,port,token}) {
 const ids=new Set(masters.map(t=>t.id));
 let saving=false;
 return async (request,response,url) => {
  if (url.pathname==='/api/templates'&&request.method==='GET') {
   json(response,200,masters.map(t=>({id:t.id,title:t.title,regionCount:t.regions.length})));return true;
  }
  const match=url.pathname.match(/^\/api\/templates\/([a-z0-9-]+)$/);
  if (!match||!ids.has(match[1])) return false;
  const id=match[1];
  if (request.method==='GET') {json(response,200,await store.getData(id));return true;}
  if (request.method!=='POST') return false;
  if (request.headers['x-review-token']!==token||request.headers['content-type']!=='application/json') {json(response,403,{error:'確認画面を再読み込みしてください'});return true;}
  if (request.headers.origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(request.headers.origin)) {json(response,403,{error:'別のサイトからは保存できません'});return true;}
  if (saving) {json(response,409,{error:'別の保存処理中です。少し待って再試行してください'});return true;}
  saving=true;
  try {
   const chunks=[];let size=0;
   for await (const chunk of request) {size+=chunk.length;if(size>131072){json(response,413,{error:'設定データが大きすぎます'});return true;}chunks.push(chunk);}
   const data=JSON.parse(Buffer.concat(chunks).toString('utf8')),current=await store.getData(id),regions=validateEdits(data,current.template);
   if (data.approve!==undefined&&typeof data.approve!=='boolean') throw Error('承認設定が不正です');
   if (data.approve&&(!data.confirmAll||typeof data.reviewer!=='string'||data.reviewer.trim().length<1||data.reviewer.length>100)) {json(response,400,{error:'全領域の確認と確認者の記入が必要です'});return true;}
   const updated={...current.template,approved:false,regions:current.template.regions.map(r=>({...r,...regions[r.id]}))};
   const {qa}=await inspectTemplate(masters.find(t=>t.id===id),updated);
   const contentHash=templateHash(updated);
   // Crucially this is the edited candidate's QA, before any approval write.
   if (data.approve&&!qa.pass) {json(response,409,{error:'編集後のQAが不合格のため承認を保存しませんでした。指摘を修正してください。',qa:{...qa,contentHash},saved:false});return true;}
   const review={schemaVersion:1,templateId:id,regions,approval:data.approve?{kind:'human',reviewer:data.reviewer.trim(),recordedAt:new Date().toISOString(),contentHash,basis:'日本語制作確認UIで全領域を確認し、承認して保存を選択'}:null};
   try {
    await store.writeReview(id,review);
    await store.rebuild();
    const result=await store.getData(id);
    if (result.qa.contentHash!==contentHash||templateHash(result.template)!==contentHash||
        (data.approve?(!result.qa.pass||!result.template.approved||result.review.approval?.kind!=='human'||result.review.approval.contentHash!==contentHash):result.review.approval!==null)) throw Error('再生成後のQA・承認記録が編集内容と一致しません');
    json(response,200,result);
   } catch (error) {
    // A later IO/build failure must not leave a human record that the UI rejected.
    try {await store.writeReview(id,current.review);await store.rebuild();}
    catch {json(response,500,{error:'保存に失敗し、以前の状態の復元も完了できませんでした。制作ファイルを確認してください。',saved:false});return true;}
    json(response,500,{error:`保存に失敗したため以前の設定に戻しました: ${error.message}`,saved:false});
   }
  } catch (error) {json(response,400,{error:error instanceof Error?error.message:'保存できませんでした',saved:false});}
  finally {saving=false;}
  return true;
 };
}
