import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import { bindGapReviews, gapCandidateKey, matchesGapReview, validateGapEvidence, type GapQA, type GapPlan, type GapReview } from '../tools/asset-pipeline/gap-reviews.mjs';
import { assertQaOnlyRefresh } from '../tools/asset-pipeline/refresh-qa-evidence.mjs';

const read=async(file:string)=>JSON.parse(await fs.readFile(file,'utf8'));
const id='gen-princess-bunny-v6';
async function fixture(){
 const directory=`content/generated-lineart/compiled/${id}`;
 return {qa:await read(`${directory}/qa.json`) as GapQA,annotation:await read(`${directory}/analysis-review.json`),template:await read(`${directory}/template.json`),plan:(await read('content/generated-lineart/gap-review-plan.json')).templates[id] as GapPlan};
}
describe('gap decisions bind to source coordinates and topology, not order',()=>{
 it('reorders candidates without assigning a different part or reason',async()=>{
  const {qa,plan}=await fixture();const normal=bindGapReviews(qa,plan),reversed=bindGapReviews({...qa,gapCandidateDetails:[...qa.gapCandidateDetails].reverse()},plan);
  expect(reversed).toEqual([...normal].reverse());
  expect(normal[0]).toMatchObject({point:[732,721],parentRegionId:'r17',parentRegionName:'右外側の長い髪',parentExteriorConnected:false});
  expect(normal[1]).toMatchObject({point:[1216,1254],parentRegionId:null,parentRegionName:'外背景',parentExteriorConnected:true});
  expect(normal[0].part).toContain('髪');expect(normal[1].part).toContain('耳の付け根');
 });
 it.each(['originalSha256','point','parentRegionId','parentRegionName','parentExteriorConnected','candidateKey'] as const)('rejects a stale or unrelated %s',async field=>{
  const {qa,plan}=await fixture(),candidate=qa.gapCandidateDetails[0],review=bindGapReviews(qa,plan)[0];
  const changed={...review,[field]:field==='point'?[1216,1254]:field==='parentExteriorConnected'?true:'changed'} as GapReview;
  expect(matchesGapReview(candidate,changed)).toBe(false);
 });
 it('rejects an old array-index explanation without an explicit bound part',async()=>{
  const {qa}=await fixture();
  expect(matchesGapReview(qa.gapCandidateDetails[0],{point:[732,721],classification:'intentional-open-detail',reason:'まぶた'} as GapReview)).toBe(false);
 });
 it('checks all 10 retained adopted packages and their 12 source-bound decisions',async()=>{
  const catalog=await read('content/storybook-generated/compiled/legacy-catalog.json');let count=0;
  for(const {id}of catalog){const base=`content/generated-lineart/compiled/${id}`,qa=await read(`${base}/qa.json`),annotation=await read(`${base}/analysis-review.json`),template=await read(`${base}/template.json`);expect(()=>validateGapEvidence(template,qa,annotation)).not.toThrow();expect(qa.unreviewedLargeGapCandidates).toBe(0);for(const candidate of qa.gapCandidateDetails)expect(gapCandidateKey(candidate)).toBe(candidate.candidateKey);count+=qa.gapCandidateDetails.length;}
  expect(catalog).toHaveLength(10);expect(count).toBe(12);
 });
 it('rejects a changed parent even when candidate and annotation were changed together',async()=>{
  const {qa,annotation,template}=await fixture();const candidate=qa.gapCandidateDetails[0];candidate.parentRegionName='左の瞳';candidate.review!.parentRegionName='左の瞳';annotation.gapReviews[0].parentRegionName='左の瞳';
  expect(()=>validateGapEvidence(template,qa,annotation)).toThrow('親領域');
 });
 it('allows QA annotation refresh but never geometry or material changes',async()=>{
  const {qa,annotation}=await fixture();const before={qa:JSON.parse(JSON.stringify(qa)),annotation:structuredClone(annotation)},after=structuredClone(before);
  before.qa.gapReviewSchemaVersion=1;before.annotation.gapReviews=[];
  expect(()=>assertQaOnlyRefresh(before,after)).not.toThrow();
  const geometry=structuredClone(after);geometry.qa.templateSha256='changed';expect(()=>assertQaOnlyRefresh(before,geometry)).toThrow('原画・形状');
  const material=structuredClone(after);material.annotation.regions[0].material='skin';expect(()=>assertQaOnlyRefresh(before,material)).toThrow('素材・領域');
 });
});
