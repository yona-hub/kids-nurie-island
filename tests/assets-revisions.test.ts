import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { assertCompatibleTemplate, publishRevision } from '../tools/asset-pipeline/revisions.mjs';
import type { Template } from '../packages/shared-types/src/index';

describe('immutable revision publication',()=>{
 it('retains old published bytes and rejects corruption at an existing revision URL',async()=>{
  const base=path.resolve('.local/asset-tests');await fs.mkdir(base,{recursive:true});
  const temporary=await fs.mkdtemp(path.join(base,'revisions-'));
  if(!path.resolve(temporary).startsWith(base+path.sep))throw Error('unsafe test cleanup');
  try{
   await fs.mkdir(path.join(temporary,'templates'));
   const first=await publishRevision(temporary,'templates','sample','json','{"texture":0.35}');
   const second=await publishRevision(temporary,'templates','sample','json','{"texture":0}');
   expect(first).not.toBe(second);
   expect(await fs.readFile(path.join(temporary,'templates',path.basename(first)),'utf8')).toBe('{"texture":0.35}');
   expect(await publishRevision(temporary,'templates','sample','json','{"texture":0.35}')).toBe(first);
   await fs.writeFile(path.join(temporary,'templates',path.basename(first)),'corrupted');
   await expect(publishRevision(temporary,'templates','sample','json','{"texture":0.35}')).rejects.toThrow('hash');
  }finally{
   // Restrict recursive cleanup to the test workspace generated immediately above.
   await fs.rm(temporary,{recursive:true,force:true});
  }
 });
 it('permits a material correction but requires a new logical ID for changed paint geometry',async()=>{
  const before:Template=JSON.parse(await fs.readFile('apps/web/public/content/templates/princess-bunny.json','utf8'));
  const materials=structuredClone(before);materials.regions[0].texture=0;
  expect(()=>assertCompatibleTemplate(before,materials)).not.toThrow();
  const geometry=structuredClone(before);geometry.regions[0].path='M 100 100 H 500 V 500 H 100 Z';
  expect(()=>assertCompatibleTemplate(before,geometry)).toThrow('template ID');
  const ids=structuredClone(before);ids.regions[0].id='new-region';
  expect(()=>assertCompatibleTemplate(before,ids)).toThrow('template ID');
 });
});
