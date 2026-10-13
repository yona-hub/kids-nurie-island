import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root='content/ui-art-v1/before';
const files=['packages/content-schema/src/index.ts','packages/shared-types/src/index.ts','apps/web/src/pages/Editor.tsx','apps/web/src/pages/Home.tsx','apps/web/src/pages/Gallery.tsx','apps/web/src/components/Brand.tsx','apps/web/src/styles-editor.css','docs/storybook-improvement.md'];
const result=[];
for(const file of files){const bytes=await fs.readFile(file);const to=path.join(root,file);await fs.mkdir(path.dirname(to),{recursive:true});await fs.writeFile(to,bytes,{flag:'wx'});result.push({file,sha256:createHash('sha256').update(bytes).digest('hex')});}
await fs.writeFile(root+'/manifest.json',JSON.stringify({instruction:'I25',recordedAt:new Date().toISOString(),files:result},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({saved:result.length,root}));
