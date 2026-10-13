import { expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

it('uses edited QA before approval, returns consistent responses, and rolls back later build failure',async()=>{
 const {stdout}=await promisify(execFile)(process.execPath,['tests/assets-review-approval.mjs','--handler-only'],{cwd:process.cwd(),timeout:40000});
 const result=JSON.parse(stdout.trim().split('\n').at(-1)!);
 expect(result.pass).toBe(true);
 expect(result.realReviewFilesUnchanged).toBe(true);
 expect(result.results.map((item:{status:number})=>item.status)).toEqual([409,409,200,500]);
 expect(result.results.map((item:{pass:boolean})=>item.pass)).toEqual([true,true,true,true]);
},45000);
