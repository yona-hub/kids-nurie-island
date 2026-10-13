import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { readRasterPackage, rasterBuildEvidence } from '../tools/asset-pipeline/raster-package.mjs';

const id='gen-tree-friends-v4';
const retained=path.resolve('content/generated-lineart/compiled',id);
async function withPackage(check:(directory:string)=>Promise<void>){
 const base=path.resolve('.local/raster-package-tests');await fs.mkdir(base,{recursive:true});
 const directory=await fs.mkdtemp(path.join(base,'package-'));
 if(!path.resolve(directory).startsWith(base+path.sep))throw Error('unsafe test cleanup');
 try{await fs.cp(retained,directory,{recursive:true});await check(directory);}
 finally{await fs.rm(directory,{recursive:true,force:true});}
}

describe('generated original and review evidence integrity',()=>{
 it.each(['original.png','normalized-lineart.png','template.json','analysis-review.json'])('rejects a changed %s even when its QA still says PASS',async filename=>{
  await withPackage(async directory=>{
   expect((await readRasterPackage(directory)).qa.pass).toBe(true);
   const file=path.join(directory,filename);await fs.appendFile(file,' ');
   await expect(readRasterPackage(directory)).rejects.toThrow('hash');
  });
 });
 it('binds a narrow-region exception to frozen operation evidence',async()=>{
  await withPackage(async directory=>{
   const {qa}=await readRasterPackage(directory);expect(qa.widthExceptions).toHaveLength(1);
   await fs.appendFile(path.join(directory,qa.widthExceptions[0].evidenceSnapshot),' ');
   await expect(readRasterPackage(directory)).rejects.toThrow('操作証拠');
  });
 });
 it('prevents material review from restoring automatic pupil reflections',async()=>{
  const {template}=await readRasterPackage(retained);
  const pupil=template.regions.find(region=>region.name==='犬の右の瞳')!;
  pupil.highlight=true;
  const result=await rasterBuildEvidence(path.resolve('.'),{id,sourceKind:'generated-raster'},template);
  expect(result?.errors.some(message=>message.includes('自動の陰影'))).toBe(true);
 });
});
