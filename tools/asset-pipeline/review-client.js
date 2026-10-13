/* global document, Path2D, window, requestAnimationFrame, Image */
import { ColoringEngine } from '@review-engine';
const names={standard:'標準',skin:'肌',hair:'髪',fur:'毛',fabric:'布',metal:'金属',plastic:'プラスチック',glass:'ガラス',rubber:'ゴム',wood:'木',stone:'石'};
const materialColors={standard:'#B9DDF0',skin:'#F5D1B1',hair:'#B590D0',fur:'#CFB384',fabric:'#E7A3C3',metal:'#9FB2CC',plastic:'#F0C676',glass:'#9FDBD6',rubber:'#9999AF',wood:'#BCAA86',stone:'#BCBEC0'};
const $=id=>document.getElementById(id);
const engines=new Map(['smooth','crayon','pencil'].map(id=>[id,new ColoringEngine($(id),{maxCanvasPixels:320000,maxCacheBytes:6*1024*1024})]));
let current=null,loadVersion=0,renderPending=false,savePending=false,loadPending=true;
const drafts=new Map();
const editControls='#save,#approve,#reviewer,#confirm,#region-rows input,#region-rows select';
const locked=()=>savePending||loadPending||!current||$('template-select').value!==current.template.id;
function updateControls(){document.querySelectorAll(editControls).forEach(control=>{control.disabled=locked();});$('template-select').disabled=savePending;}
function edited(change){if(locked())return;change();current.dirty=true;current.candidateRejected=false;drafts.set(current.template.id,current);$('confirm').checked=false;showStatus();scheduleRender();}
const option=(value,label)=>{const el=document.createElement('option');el.value=value;el.textContent=label;return el;};
function drawSimple(id,colors){const canvas=$(id);canvas.width=400;canvas.height=500;const ctx=canvas.getContext('2d');ctx.scale(.25,.25);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1600,2000);ctx.lineJoin='round';ctx.lineCap='round';const width=current.template.lineWidth??12;if(width>0)ctx.lineWidth=width;for(let i=0;i<current.template.regions.length;i++){const p=new Path2D(current.template.regions[i].path);ctx.fillStyle=colors?.[i]??'#ffffff';ctx.fill(p);if(width>0){ctx.strokeStyle='#000000';ctx.stroke(p);}}for(const d of current.template.details){const p=new Path2D(d.path);if(d.fill){ctx.fillStyle=d.fill;ctx.fill(p);}if((d.strokeWidth??width)>0){ctx.lineWidth=d.strokeWidth??width;ctx.stroke(p);}}}
function render(){
 if(!current)return;
 drawSimple('original');if(current.originalImage){const ctx=$('original').getContext('2d');ctx.drawImage(current.originalImage,0,0,1600,2000);}drawSimple('regions',current.template.regions.map((_,i)=>`hsl(${i*137.508%360} 66% 76%)`));drawSimple('materials',current.template.regions.map(r=>materialColors[r.material]));
 // Only this isolated preview copy bypasses the publication flag. Public packages remain gated.
 for(const [type,engine]of engines){const paints=Object.fromEntries(current.template.regions.map((r,i)=>[r.id,{color:current.sampleColors[i],paintType:type}]));engine.loadTemplate({...current.template,approved:true},paints);engine.resize(320,400,1);}
}
function scheduleRender(){if(renderPending)return;renderPending=true;requestAnimationFrame(()=>{renderPending=false;render();});}
function field(type,value,label,onchange){const input=document.createElement('input');input.type=type;input.setAttribute('aria-label',label);if(type==='checkbox')input.checked=value;else input.value=value;input.addEventListener('input',()=>edited(()=>onchange(type==='checkbox'?input.checked:type==='text'?input.value:Number(input.value))));return input;}
function table(){const rows=$('region-rows');rows.replaceChildren();for(const r of current.template.regions){const tr=document.createElement('tr');const add=node=>{const td=document.createElement('td');if(typeof node==='string'){td.textContent=node;}else{td.append(node);}tr.append(td);};add(r.id);add(field('text',r.name,`${r.id} 領域名`,v=>r.name=v));const select=document.createElement('select');select.setAttribute('aria-label',`${r.id} 素材`);Object.entries(names).forEach(([id,name])=>select.append(option(id,name)));select.value=r.material;select.addEventListener('change',()=>edited(()=>{r.material=select.value;}));add(select);const confidence=field('number',r.confidence,`${r.id} 信頼度`,v=>r.confidence=v);confidence.min='0';confidence.max='1';confidence.step='.05';add(confidence);add(field('checkbox',r.shade,`${r.id} 陰影`,v=>r.shade=v));add(field('checkbox',r.highlight,`${r.id} ハイライト`,v=>r.highlight=v));const texture=field('range',r.texture,`${r.id} 質感`,v=>r.texture=v);texture.min='0';texture.max='1';texture.step='.05';add(texture);const angle=field('number',r.direction,`${r.id} 向き`,v=>r.direction=v);angle.min='0';angle.max='360';angle.step='5';add(angle);rows.append(tr);}updateControls();}
function showStatus(){const status=$('status');status.dataset.templateId=current.template.id;status.classList.toggle('bad',!current.qa.pass);status.replaceChildren();const strong=document.createElement('strong');strong.textContent=`${current.template.title} — ${current.template.regions.length}領域 / QA ${current.dirty&&!current.candidateRejected?'未検査':current.qa.pass?'合格':'不合格'}`;status.append(strong);const p=document.createElement('p');const approval=current.review.approval;p.textContent=current.candidateRejected?'編集中の設定は保存・承認されていません。保存済みの設定と承認記録は変更していません。':current.dirty?'編集内容は未保存・未承認です。線画を切り替えて戻っても、この画面を開いている間は編集を保持します。':approval?.kind==='human'&&current.qa.pass&&current.template.approved?`人間承認: ${approval.reviewer}（${approval.recordedAt}）`:approval?.kind==='author-technical'?'制作時の技術確認済み。公開前の人間による内容・表現の確認が必要です。':'未承認: 本体の一覧には公開されません。';status.append(p);for(const error of current.qa.errors){const item=document.createElement('p');item.textContent=error;status.append(item);}}
async function load(id){
 if(savePending){$('template-select').value=current.template.id;return;}
 const version=++loadVersion;loadPending=true;updateControls();$('confirm').checked=false;$('message').classList.remove('error');$('message').textContent='線画を読み込んでいます…';
 try{
  let data=drafts.get(id);
  if(!data){const response=await fetch(`/api/templates/${id}`);if(!response.ok)throw Error('線画を読み込めません');data=await response.json();if(version!==loadVersion)return;if(data.template?.id!==id)throw Error('要求した線画と読込結果が一致しません');if(data.originalImageUrl){const image=new Image();image.src=data.originalImageUrl;await image.decode();data.originalImage=image;}}
  if(version!==loadVersion)return;
  current=data;$('template-select').value=id;showStatus();table();render();$('message').textContent='';
 }catch(error){if(version!==loadVersion)return;if(current){$('template-select').value=current.template.id;showStatus();}else{$('template-select').selectedIndex=-1;$('status').textContent='線画を読み込めませんでした。もう一度選んでください。';}$('message').classList.add('error');$('message').textContent=error.message;}
 finally{if(version===loadVersion){loadPending=false;updateControls();}}
}
async function save(approve){
 if(locked())return;
 const targetId=current.template.id,version=loadVersion,originalImage=current.originalImage;
 const message=$('message');message.classList.remove('error');
 if(approve&&(!$('confirm').checked||!$('reviewer').value.trim())){message.classList.add('error');message.textContent='全領域と3画材を確認し、確認者の名前を記入してください。';return;}
 const regions=Object.fromEntries(current.template.regions.map(r=>[r.id,Object.fromEntries(['name','material','confidence','shade','highlight','texture','direction'].map(k=>[k,r[k]]))]));
 savePending=true;
 updateControls();
 message.textContent='編集後のQAを検査し、設定とアセットを保存しています…';
 try{
  const response=await fetch(`/api/templates/${targetId}`,{method:'POST',headers:{'Content-Type':'application/json','X-Review-Token':document.querySelector('meta[name="review-token"]').content},body:JSON.stringify({regions,approve,confirmAll:$('confirm').checked,reviewer:$('reviewer').value})});
  const result=await response.json();
  if(version!==loadVersion||current?.template.id!==targetId||$('template-select').value!==targetId)throw Error('保存対象と表示中の線画が一致しません。線画を選び直してください。');
  if(!response.ok){if(result.qa){current={...current,qa:result.qa,candidateRejected:true};drafts.set(targetId,current);showStatus();}throw Error(result.error??'保存できませんでした');}
  if(result.template?.id!==targetId)throw Error('保存した線画と応答が一致しません。線画を選び直してください。');
  if(approve&&(!result.qa?.pass||!result.template?.approved||result.review?.approval?.kind!=='human'||!result.qa.contentHash||result.review.approval.contentHash!==result.qa.contentHash))throw Error('返されたQAと承認記録が一致しないため、承認の成立を確認できませんでした。');
  current={...result,originalImage};drafts.delete(targetId);showStatus();table();render();$('confirm').checked=false;
  message.textContent=approve?'QA合格を確認し、承認と修正を保存しました。本体の一覧へ反映しました。':current.qa.pass?'修正を保存しました。承認は解除されました。':'修正を下書き保存しました。QAは不合格で、承認・公開はされていません。';
  if(!current.qa.pass)message.classList.add('error');
 }catch(error){message.classList.add('error');message.textContent=error.message;}
 finally{savePending=false;updateControls();}
}
$('template-select').addEventListener('change',()=>{void load($('template-select').value);});$('save').addEventListener('click',()=>save(false));$('approve').addEventListener('click',()=>save(true));updateControls();
for(const[id,name]of Object.entries(names)){const span=document.createElement('span'),swatch=document.createElement('i');swatch.style.background=materialColors[id];span.append(swatch,document.createTextNode(name));$('legend').append(span);}
window.addEventListener('pagehide',()=>engines.forEach(engine=>engine.dispose()));
try{const response=await fetch('/api/templates');if(!response.ok)throw Error('制作データを読み込めません');const templates=await response.json();for(const t of templates)$('template-select').append(option(t.id,`${t.title}（${t.regionCount}領域）`));await load(templates[0].id);}catch(error){$('status').classList.add('bad');$('status').textContent=error.message;}
