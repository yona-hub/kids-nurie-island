// Derive relative luminance from legitimate same-hue hair shadows. The private
// finished RGB painting is never distributed to the runtime.
export function sampleHairShadows(parts, labels, registered, gray, references, groups) {
 const W=1600,H=2000,N=W*H;
 const hue=rgb=>{const [r,g,b]=rgb,m=Math.max(...rgb),n=Math.min(...rgb),d=m-n;return {h:d?(m===r?((g-b)/d+6)%6:m===g?(b-r)/d+2:(r-g)/d+4)*60:0,s:m?d/m:0};};
 const specifications=parts.map(r=>{
  if(r.material!=='hair')return null;
  const group=groups.find(g=>g.regionIds.includes(r.id)),reference=references.find(g=>g.groupId===group?.id);
  if(!reference)return null;
  const c=parseInt(reference.referenceColor.slice(1),16),rgb=[c>>>16,(c>>>8)&255,c&255];
  return {...hue(rgb),reference};
 });
 let count=0;
 const value=(rgb,spec)=>{
  const source=hue(rgb),angle=Math.abs(source.h-spec.h),delta=Math.min(angle,360-angle),lum=(.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2])/255;
  const matches=spec.s>.2?delta<26&&source.s>spec.s*.65:Math.max(...rgb)-Math.min(...rgb)<32;
  if(!matches||lum<.018||lum>.987)return;
  const base=spec.reference.referenceLuminance;
  return Math.round(255*(lum<base?.5*Math.max(.025,lum/base):.5+.5*Math.min(.97,(lum-base)/(1-base))));
 };
 for(let p=0;p<N;p++){
  const spec=specifications[labels[p]-1];if(!spec)continue;
  const v=value([registered[p*3],registered[p*3+1],registered[p*3+2]],spec);
  if(v!==undefined){gray[p]=v;count++;}
 }
 return {count,specifications,value};
}
