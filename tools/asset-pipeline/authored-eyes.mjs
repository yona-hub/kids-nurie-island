// These paths are authored at production time, and shipped as geometry. The
// renderer never invents eyelids or lashes based on a character's material.
export const eyeNames={princess:'おひめさま',bunny:'うさぎ',boy:'魔法使い',dog:'いぬ',cat:'ねこ',dolphin:'イルカ',turtle:'カメ',fish:'さかな',dinosaur:'きょうりゅう',robot:'ロボット',astronaut:'宇宙飛行士'};
// Bound to the adopted originals' semantic names (face/body), not material or
// selected paint. The eye's removed source ink becomes part of this parent.
export const eyeParents={princess:'r07',bunny:'r38',boy:'r06',dog:'r10',cat:'r19',dolphin:'r02',turtle:'r09',fish:'r23',dinosaur:'r01',robot:'r06',astronaut:'r14'};
// The boy's right upper eyelid is a second closed source feature, separate
// from its iris rim. Original artwork comparison distinguishes it from the
// higher eyebrow. Bounds guard against applying this edit to another source.
export const additionalEyeClearance={boy:{r15:[{contour:5,bounds:[833,602,904,667]}]}};
const specifications={
 princess:{kind:'human',ratio:.98,iris:.89,upper:[.08,.03,.91,-.03],lower:[.94,.92,.05,.98],lashes:3},
 boy:{kind:'human',ratio:.86,iris:.92,upper:[.13,-.02,.91,.02],lower:[.91,.97,.08,.95],lashes:0},
 astronaut:{kind:'human',ratio:.88,iris:.92,upper:[.12,.01,.88,.01],lower:[.9,.96,.1,.96],lashes:0},
 bunny:{kind:'animal',ratio:.86,iris:.93,upper:[.08,.02,.95,.02],lower:[.9,.97,.08,.97],lashes:0},
 dog:{kind:'animal',ratio:.92,iris:.94,upper:[.10,.04,.92,.06],lower:[.92,.94,.10,.96],lashes:0},
 cat:{kind:'animal',ratio:.96,iris:.93,upper:[.07,.07,.96,.04],lower:[.94,.90,.06,.93],lashes:0},
 dolphin:{kind:'animal',ratio:.90,iris:.95,upper:[.08,.11,.91,.08],lower:[.89,.93,.07,.9],lashes:0},
 turtle:{kind:'animal',ratio:.92,iris:.95,upper:[.09,.07,.92,.08],lower:[.92,.91,.08,.94],lashes:0},
 fish:{kind:'animal',ratio:.96,iris:.95,upper:[.08,.08,.92,.08],lower:[.92,.92,.08,.92],lashes:0},
 dinosaur:{kind:'dinosaur',ratio:.80,iris:.94,upper:[.09,.02,.92,.04],lower:[.92,.94,.10,.96],lashes:0},
 robot:{kind:'robot',ratio:.92,iris:.94,upper:[.06,.08,.94,.08],lower:[.94,.92,.06,.92],lashes:0},
};
const fmt=n=>Number(n.toFixed(3));
export function eyeCoordinate(g,x,y){const u=(x-.5)*g.width,v=(y-.5)*g.height,c=Math.cos(g.rotation),s=Math.sin(g.rotation);return [g.cx+u*c-v*s,g.cy+u*s+v*c];}
function authorPath(g,commands){return commands.map(([op,...coords])=>op+coords.reduce((a,_,i)=>i%2?a:[...a,...eyeCoordinate(g,coords[i],coords[i+1]).map(fmt)],[]).join(' ')).join('');}
export function ellipsePath(g){
 const k=.55228475;return authorPath(g,[['M',1,.5],['C',1,.5+k/2,.5+k/2,1,.5,1],['C',.5-k/2,1,0,.5+k/2,0,.5],['C',0,.5-k/2,.5-k/2,0,.5,0],['C',.5+k/2,0,1,.5-k/2,1,.5],['Z']]);
}
export function authorEye(measured,owner,index){
 const s=specifications[owner];if(!s)throw Error(`Eye artwork must be authored for ${owner}`);
 const g={...measured,width:Math.max(measured.width,measured.height*s.ratio)};
 const [a,b,c,d]=s.upper,[e,f,h,i]=s.lower;
 // One curved opening replaces the old traced rim AND its inner highlight ink.
 const bottom=owner==='princess'?.945:1;
 const opening=authorPath(g,[['M',0,.52],['C',0,.22,a,b,.5,0],['C',c,d,1,.25,1,.52],['C',1,.80,e,f*bottom,.5,bottom],['C',h,i*bottom,0,.79,0,.52],['Z']]);
 const upperLid=authorPath(g,[['M',0,.52],['C',0,.22,a,b,.5,0],['C',c,d,1,.25,1,.52]]);
 const lowerLid=authorPath(g,[['M',1,.52],['C',1,.80,e,f*bottom,.5,bottom],['C',h,i*bottom,0,.79,0,.52]]);
 // The home original looks toward screen-left in BOTH eyes; moving each iris
 // toward the nose creates a crossed gaze. Keep its shared gaze direction.
 const center=eyeCoordinate(g,owner==='princess'?.42:.49,owner==='princess'?.505:.515),diameter=owner==='princess'?g.height*.88:Math.min(g.width*.97,g.height*.95);
 const oval=s.kind==='dinosaur';
 const iris={cx:center[0],cy:center[1],width:oval?g.width*.93:diameter,height:oval?g.height*.94:diameter,rotation:oval?g.rotation:0};
 const pupil={...iris,width:iris.width*.48,height:iris.height*(oval?.57:.48)};
 // Authored world-space glints keep the lighting on the same upper-right side
 // in both eyes, including when the character tilts its head.
 const light={...iris,rotation:0,cx:iris.cx+iris.width*.185,cy:iris.cy-iris.height*.215,width:iris.width*(owner==='princess'?.16:.205),height:iris.height*(owner==='princess'?.12:.15)};
 const reflection=authorPath(light,[['M',.10,.34],['C',.22,.10,.58,.015,.81,.17],['C',.94,.35,.92,.69,.71,.80],['C',.56,.89,.27,.78,.16,.61],['C',.10,.51,.04,.48,.10,.34],['Z']]);
 const smallLight={...iris,rotation:0,cx:iris.cx+diameter*.27,cy:iris.cy-diameter*.045,width:diameter*.042,height:diameter*.033};
 const small=authorPath(smallLight,[['M',.07,.31],['C',.28,.07,.81,.13,.94,.36],['C',1,.56,.67,.79,.35,.89],['C',.12,.80,-.02,.50,.07,.31],['Z']]);
 const lashes=[];
 if(s.lashes){const side=index%2===0?'left':'right';for(let j=0;j<s.lashes;j++){
  const x=side==='left'?.05+j*.06:.95-j*.06,dx=side==='left'?-.10:.10,y=.30-j*.073;
  lashes.push(authorPath(g,[['M',x,y],['C',x+dx*.25,y-.012,x+dx,y-.035,x+dx*.88,y-.10+j*.01]]));
 }}
 return {geometry:g,artwork:{kind:s.kind,opening,upperLid,lowerLid,lashes,upperWidth:Math.max(2.6,g.width*(owner==='princess'?.065:s.kind==='human'?.042:.036)),lowerWidth:Math.max(1.4,g.width*.017),lashWidth:Math.max(1.8,g.width*.029),iris,pupil,reflections:[{path:reflection,opacity:1},{path:small,opacity:.78}]}};
}
