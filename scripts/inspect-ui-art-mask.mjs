import fs from 'node:fs/promises';
import sharp from 'sharp';
const compiled=JSON.parse(await fs.readFile('content/ui-art-v1/compiled.json','utf8')).outputs;
const {data,info}=await sharp('apps/web/public'+compiled['paint-dab'].src).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const values=[];for(let y=40;y<88;y++)for(let x=40;x<88;x++)values.push(data[(y*info.width+x)*4+3]);
const report={initialCheck:'FAIL: generated mask center not fully opaque',width:info.width,height:info.height,min:Math.min(...values),max:Math.max(...values),below255:values.filter(v=>v<255).length,center:[...data.slice((64*128+64)*4,(64*128+64)*4+4)],typecheckAndLint:'not executed in attempted redirected calls: output directory missing'};
await fs.mkdir('test-results/ui-art-v1/revision-1',{recursive:true});await fs.writeFile('test-results/ui-art-v1/revision-1/initial-mask-failure.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
