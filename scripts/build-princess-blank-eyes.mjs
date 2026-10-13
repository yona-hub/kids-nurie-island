import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';
import {Path2D} from '@napi-rs/canvas';
import {fitPolygonPath} from '../tools/asset-pipeline/vector-curves.mjs';

/** Reuse the second generated drawing's simple white pupil, not the finished eye. */
export async function buildFriendlyBlankEyes(eyes){
  const source='content/generated-lineart/originals/princess-v2.png',root='content/princess-master/blank-eyes-v3';
  const crops=[{left:400,top:270,width:74,height:74},{left:518,top:299,width:68,height:69},{left:731,top:935,width:62,height:66},{left:810,top:967,width:58,height:61}];
  await fs.mkdir(root,{recursive:true});const specs=[];
  for(const [i,crop]of crops.entries()){
    const gray=await sharp(source).extract(crop).greyscale().raw().toBuffer(),rgba=Buffer.alloc(crop.width*crop.height*4);
    // A source cheek/forehead can cross the crop edge. It is not eye ink.
    const seen=new Uint8Array(gray.length),mask=new Uint8Array(gray.length);
    for(let seed=0;seed<gray.length;seed++)if(gray[seed]<128&&!seen[seed]){
      const stack=[seed],component=[];seen[seed]=1;let touches=false;
      while(stack.length){const p=stack.pop(),x=p%crop.width,y=Math.floor(p/crop.width);component.push(p);if(x===0||y===0||x===crop.width-1||y===crop.height-1)touches=true;
        for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,q=ny*crop.width+nx;if(nx>=0&&nx<crop.width&&ny>=0&&ny<crop.height&&!seen[q]&&gray[q]<128){seen[q]=1;stack.push(q);}}
      }
      if(!touches&&component.length>=8)for(const p of component)mask[p]=255;
    }
    for(let p=0;p<gray.length;p++)rgba[p*4+3]=mask[p];
    const file=`${root}/${eyes[i].regionId}-source-ink.png`;
    await sharp(rgba,{raw:{width:crop.width,height:crop.height,channels:4}}).png().toFile(file);
    specs.push({file,x:0,y:0,scale:1});
  }
  const input=`${root}/trace-input.json`,output=`${root}/trace-output.json`;
  await fs.writeFile(input,JSON.stringify(specs));
  const proc=spawnSync('C:/Users/yonaf/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',['tools/asset-pipeline/trace_storybook_ink.py',input,output],{encoding:'utf8',windowsHide:true});
  if(proc.error||proc.status!==0)throw Error(proc.error?.message||proc.stderr||'Source eye tracing did not complete.');
  const traced=JSON.parse(await fs.readFile(output,'utf8'));
  const paths=traced.map((result,i)=>{
    if(!result.path)throw Error(`Source eye crop lost its ink: ${eyes[i].regionId}`);
    const p=new Path2D(fitPolygonPath(result.path,{error:.35}).path),b=p.computeTightBounds(),g=eyes[i].geometry;
    if(!(b[2]>b[0]&&b[3]>b[1]))throw Error(`Invalid source eye boundary: ${eyes[i].regionId}`);
    const sx=g.width*.92/(b[2]-b[0]),sy=g.height*.92/(b[3]-b[1]);
    return p.transform({a:sx,b:0,c:0,d:sy,e:g.cx-(b[0]+b[2])/2*sx,f:g.cy-(b[1]+b[3])/2*sy}).toSVGString();
  });
  const report={instruction:'I22 supersedes black default pupils: simple early outline with white pupil; finish only after painting',sourceFile:source,sourceSha256:createHash('sha256').update(await fs.readFile(source)).digest('hex'),crops,eyes:eyes.map((e,i)=>({regionId:e.regionId,path:paths[i]}))};
  await fs.writeFile(`${root}/manifest.json`,JSON.stringify(report,null,2)+'\n');return report;
}
