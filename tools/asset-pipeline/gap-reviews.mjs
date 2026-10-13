import { createHash } from 'node:crypto';

export function gapCandidateKey(candidate) {
 const fields=[candidate.originalSha256,candidate.kind,candidate.maskSha256,candidate.parentRegionId??'exterior',candidate.parentExteriorConnected?'exterior':'enclosed',...candidate.bounds.map(value=>value.toFixed(6)),...candidate.labelPoint.map(value=>value.toFixed(6))];
 return 'gap-'+createHash('sha256').update(fields.join('|')).digest('hex');
}
export function matchesGapReview(candidate,review) {
 if(!review||candidate.candidateKey!==review.candidateKey||candidate.candidateKey!==gapCandidateKey(candidate))return false;
 if(!['originalSha256','kind','parentRegionId','parentRegionName','parentExteriorConnected'].every(key=>Object.hasOwn(review,key)&&candidate[key]===review[key]))return false;
 return JSON.stringify(review.point)===JSON.stringify(candidate.labelPoint)&&review.classification===(candidate.parentExteriorConnected?'background':'intentional-open-detail')&&typeof review.part==='string'&&review.part.trim().length>0&&typeof review.reason==='string'&&review.reason.trim().length>0;
}

/** The author plan is indexed by reviewed coordinates, never by g01/g02 order. */
export function bindGapReviews(qa,plan) {
 if(!plan||plan.originalSha256!==qa.originalSha256||qa.gapReviewSchemaVersion!==2)throw Error('線切れ候補の原画hashまたは確認planが一致しません');
 const candidates=qa.gapCandidateDetails;
 if(Object.keys(plan.candidates).length!==candidates.length)throw Error('線切れ候補の増減を目視確認してください');
 return candidates.map(candidate=>{
  const entry=plan.candidates[candidate.labelPoint.join(',')];
  const review=entry&&{...entry,originalSha256:plan.originalSha256,point:candidate.labelPoint};
  if(!matchesGapReview(candidate,review))throw Error('線切れ候補の座標・親領域・部位の対応を目視確認してください');
  return review;
 });
}

export function validateGapEvidence(template,qa,annotation) {
 if(qa.gapReviewSchemaVersion!==2||!Array.isArray(qa.gapCandidateDetails)||!Array.isArray(annotation?.gapReviews)||annotation.originalSha256!==qa.originalSha256)throw Error('線切れ候補に原画・座標・親領域へ結び付いた注釈がありません');
 const candidates=qa.gapCandidateDetails,keys=new Set();let unreviewed=0;
 for(const candidate of candidates){
  if(candidate.originalSha256!==qa.originalSha256||candidate.candidateKey!==gapCandidateKey(candidate)||keys.has(candidate.candidateKey))throw Error('線切れ候補の原画・mask・座標hashが不正です');
  keys.add(candidate.candidateKey);
  const parent=template.regions.find(region=>region.id===candidate.parentRegionId);
  if(candidate.parentExteriorConnected?(candidate.kind!=='new-from-background'||candidate.parentRegionId!==null||candidate.parentRegionName!=='外背景'):(candidate.kind!=='split-open-detail'||!parent||parent.name!==candidate.parentRegionName))throw Error('線切れ候補の親領域と外背景接続が一致しません');
  if(!candidate.review){unreviewed++;continue;}
  const reviews=annotation.gapReviews.filter(review=>review.candidateKey===candidate.candidateKey);
  const fields=['candidateKey','originalSha256','point','kind','parentRegionId','parentRegionName','parentExteriorConnected','classification','part','reason'];
  if(reviews.length!==1||!matchesGapReview(candidate,reviews[0])||!matchesGapReview(candidate,candidate.review)||!fields.every(key=>JSON.stringify(reviews[0][key])===JSON.stringify(candidate.review[key])))throw Error('線切れ候補の説明が現在の座標・部位へ対応していません');
 }
 if(candidates.length!==qa.largeGapCandidates||unreviewed!==qa.unreviewedLargeGapCandidates||(unreviewed>0&&qa.pass)||annotation.gapReviews.some(review=>!keys.has(review.candidateKey)))throw Error('線切れ候補の確認件数が一致しません');
}
