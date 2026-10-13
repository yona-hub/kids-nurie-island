import {createCanvas,Path2D} from '@napi-rs/canvas';

/** Register a generated cavity through continuous row coordinates. Sanitize
 * displaced non-mouth samples inside the authored source mask first, so no
 * patch of blue skin or page white can become a tooth or a rectangular lip. */
export function registerSourceMouth(out,source,labels,id,part,pathString){
 const bounds=part.bounds;
 const W=1600,path=new Path2D(pathString),b=path.computeTightBounds(),x0=Math.floor(b[0]),y0=Math.floor(b[1]),w=Math.ceil(b[2])-x0+1,h=Math.ceil(b[3])-y0+1;
 const canvas=createCanvas(w,h),ctx=canvas.getContext('2d');ctx.translate(-x0,-y0);ctx.fill(path);const mask=ctx.getImageData(0,0,w,h).data;canvas.width=canvas.height=1;
 const values=new Float32Array(w*h*3),valid=new Uint8Array(w*h),queue=new Int32Array(w*h),unknown=[],rows=[];let head=0,tail=0;
 const neighbors=p=>[p%w?p-1:-1,p%w<w-1?p+1:-1,p>=w?p-w:-1,p<w*(h-1)?p+w:-1];
 for(let y=0;y<h;y++){let left=w,right=-1;for(let x=0;x<w;x++){const p=y*w+x;if(mask[p*4+3]<128)continue;left=Math.min(left,x);right=Math.max(right,x);const q=((y+y0)*W+x+x0)*3,r=source[q],g=source[q+1],blue=source[q+2];
  if(r>g*1.3&&r>blue*1.05&&(g<r*.55||blue>r*.32)){values.set(source.subarray(q,q+3),p*3);valid[p]=1;queue[tail++]=p;}else unknown.push(p);
 }if(right>=left)rows.push({y,left,right});}
 if(!tail)throw Error('Empty authored source cavity');
 while(head<tail){const p=queue[head++];for(const q of neighbors(p))if(q>=0&&mask[q*4+3]>=128&&!valid[q]){values.set(values.subarray(p*3,p*3+3),q*3);valid[q]=1;queue[tail++]=q;}}
 for(let pass=0;pass<25;pass++)for(const p of unknown){const ns=neighbors(p).filter(q=>q>=0&&valid[q]);if(ns.length)for(let c=0;c<3;c++)values[p*3+c]=ns.reduce((s,q)=>s+values[q*3+c],0)/ns.length;}
 const target=[];for(let y=Math.floor(bounds.y);y<=Math.ceil(bounds.y+bounds.height);y++){let left=W,right=-1;for(let x=Math.floor(bounds.x);x<=Math.ceil(bounds.x+bounds.width);x++)if(labels[y*W+x]===id){left=Math.min(left,x);right=Math.max(right,x);}if(right>=left)target.push({y,left,right});}
 const probe=createCanvas(1,1).getContext('2d'),targetPath=new Path2D(part.path);
 const span=(shape,y,left,right)=>{let a=left-1,b=left+.5;for(let i=0;i<12;i++){const m=(a+b)/2;if(probe.isPointInPath(shape,m,y))b=m;else a=m;}const lo=(a+b)/2;a=right+.5;b=right+1.5;for(let i=0;i<12;i++){const m=(a+b)/2;if(probe.isPointInPath(shape,m,y))a=m;else b=m;}return [lo,(a+b)/2];};
 const sourceSpans=rows.map(row=>span(path,row.y+y0+.5,row.left+x0,row.right+x0).map(x=>x-x0));
 const sample=(rowIndex,u,c)=>{const row=rows[rowIndex],[left,right]=sourceSpans[rowIndex],x=Math.max(row.left,Math.min(row.right,left+u*(right-left))),a=Math.floor(x),v=x-a;return values[(row.y*w+a)*3+c]*(1-v)+values[(row.y*w+Math.min(row.right,a+1))*3+c]*v;};
 for(const [j,row]of target.entries()){const sy=j/Math.max(1,target.length-1)*(rows.length-1),a=Math.floor(sy),v=sy-a;
  const [left,right]=span(targetPath,row.y+.5,row.left,row.right);
  for(let x=row.left;x<=row.right;x++)if(labels[row.y*W+x]===id){const u=Math.max(0,Math.min(1,(x+.5-left)/Math.max(.01,right-left))),q=(row.y*W+x)*3;for(let c=0;c<3;c++)out[q+c]=Math.round(sample(a,u,c)*(1-v)+sample(Math.min(rows.length-1,a+1),u,c)*v);}
 }
}
