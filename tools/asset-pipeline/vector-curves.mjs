// Production fitting for the adopted polygon contours. Coordinates remain in
// the 1600 × 2000 page; the maximum fitting error is independent of zoom/DPR.
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]], sub=(a,b)=>[a[0]-b[0],a[1]-b[1]], mul=(a,n)=>[a[0]*n,a[1]*n];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1], length=a=>Math.hypot(...a), unit=a=>mul(a,1/(length(a)||1));
const distance=(a,b)=>length(sub(a,b));
export function polygonContours(path) {
 if(/[^MLZ\s\d.,+e-]/i.test(path))throw Error('Curve fitting requires the original polygon contours.');
 return [...path.matchAll(/M([^M]*?)(?:Z|$)/gi)].map(m=>{
  const values=m[1].match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)?.map(Number)??[];
  const points=[];for(let i=0;i<values.length;i+=2){const p=[values[i],values[i+1]];if(p.every(Number.isFinite)&&(!points.length||distance(p,points.at(-1))>.01))points.push(p);}
  if(points.length>1&&distance(points[0],points.at(-1))<.01)points.pop();return points;
 }).filter(p=>p.length>=3);
}
function cubic(c,t){const u=1-t;return add(add(mul(c[0],u**3),mul(c[1],3*t*u*u)),add(mul(c[2],3*t*t*u),mul(c[3],t**3)));}
function fit(points,t0,t1,error,out,depth=0){
 const n=points.length,p0=points[0],p3=points.at(-1);
 if(n===2){const d=distance(p0,p3)/3;out.push([p0,add(p0,mul(t0,d)),add(p3,mul(t1,d)),p3]);return;}
 const u=[0];for(let i=1;i<n;i++)u.push(u.at(-1)+distance(points[i],points[i-1]));const total=u.at(-1);for(let i=1;i<n;i++)u[i]/=total||1;
 let c00=0,c01=0,c11=0,x0=0,x1=0;
 for(let i=0;i<n;i++){const t=u[i],v=1-t,b0=v**3,b1=3*t*v*v,b2=3*t*t*v,b3=t**3,a0=mul(t0,b1),a1=mul(t1,b2),r=sub(points[i],add(mul(p0,b0+b1),mul(p3,b2+b3)));c00+=dot(a0,a0);c01+=dot(a0,a1);c11+=dot(a1,a1);x0+=dot(a0,r);x1+=dot(a1,r);}
 const det=c00*c11-c01*c01;let a=det?(x0*c11-x1*c01)/det:0,b=det?(c00*x1-c01*x0)/det:0,d=distance(p0,p3);
 if(a<d*.001||b<d*.001||a>d*2||b>d*2){a=b=d/3;}
 const curve=[p0,add(p0,mul(t0,a)),add(p3,mul(t1,b)),p3];let worst=0,split=Math.floor(n/2);
 for(let i=1;i<n-1;i++){const e=distance(cubic(curve,u[i]),points[i]);if(e>worst){worst=e;split=i;}}
 if(worst<=error||depth>24){out.push(curve);return;}
 const tangent=unit(sub(points[split-1],points[split+1]));
 fit(points.slice(0,split+1),t0,tangent,error,out,depth+1);fit(points.slice(split),mul(tangent,-1),t1,error,out,depth+1);
}
function prepared(points,cornerSpan=9,smoothingPasses=2){
 // Long-baseline corners distinguish real tips/notches from pixel stair steps.
 const perimeter=points.reduce((s,p,i)=>s+distance(p,points[(i+1)%points.length]),0);
 if(perimeter<20)return {points,corners:points.map((_,i)=>i)};
 const sampled=[],marks=[];const step=1.5;
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],n=Math.max(1,Math.ceil(distance(a,b)/step));for(let j=0;j<n;j++)sampled.push(add(a,mul(sub(b,a),j/n)));}
 const n=sampled.length,offset=Math.min(Math.round(cornerSpan/step),Math.floor(n/8));
 for(let i=0;i<n;i++){const a=unit(sub(sampled[i],sampled[(i-offset+n)%n])),b=unit(sub(sampled[(i+offset)%n],sampled[i]));if(dot(a,b)<.25)marks.push(i);}
 // Keep one apex per corner cluster, including clusters crossing the seam.
 const corners=[];for(const i of marks)if(!corners.length||i-corners.at(-1)>offset*2)corners.push(i);
 if(corners.length>1&&n-corners.at(-1)+corners[0]<offset*2)corners.pop();
 const protectedPoint=i=>corners.some(j=>Math.min(Math.abs(i-j),n-Math.abs(i-j))<4);
 let result=sampled;for(let pass=0;pass<smoothingPasses;pass++)result=result.map((p,i)=>protectedPoint(i)?p:add(mul(p,.5),mul(add(result[(i+n-1)%n],result[(i+1)%n]),.25)));
 return {points:result,corners};
}
export function fitPolygonPath(path,{error=.65,cornerSpan=9,smoothingPasses=2}={}) {
 const contours=polygonContours(path),f=n=>Number(n.toFixed(3)),xy=p=>p.map(f).join(' ');let segments=0;
 const result=contours.map(original=>{
  const {points:p,corners}=prepared(original,cornerSpan,smoothingPasses),n=p.length;
  // Two anchors on a smooth closed loop avoid a coincident endpoint fit.
  const anchors=corners.length>1?corners:[0,Math.floor(n/2)];const curves=[];
  for(let j=0;j<anchors.length;j++){const start=anchors[j],end=anchors[(j+1)%anchors.length],part=[];for(let i=start;;i=(i+1)%n){part.push(p[i]);if(i===end)break;}
   const cornerStart=corners.includes(start),cornerEnd=corners.includes(end);
   const t0=unit(sub(cornerStart?part[1]:p[(start+2)%n],cornerStart?part[0]:p[(start+n-2)%n]));
   const t1=unit(sub(cornerEnd?part.at(-2):p[(end+n-2)%n],cornerEnd?part.at(-1):p[(end+2)%n]));
   fit(part,t0,t1,error,curves);
  }
  segments+=curves.length;return `M${xy(curves[0][0])}`+curves.map(c=>`C${xy(c[1])} ${xy(c[2])} ${xy(c[3])}`).join('')+'Z';
 }).join('');
 return {path:result,contours:contours.length,segments,sourcePoints:contours.reduce((s,p)=>s+p.length,0),error};
}
