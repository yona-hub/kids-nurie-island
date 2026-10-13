/** Exact squared Euclidean ownership. Row/column flooding produces diamond
 * cells and visible stair-shaped material edges along diagonal contours. */
export function euclideanOwners(labels,width,height){
 if(labels.length!==width*height||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)throw Error('Invalid ownership dimensions');
 const n=labels.length,horizontal=new Float64Array(n),source=new Int32Array(n);horizontal.fill(Infinity);source.fill(-1);
 for(let y=0;y<height;y++){
  let left=-1;for(let x=0;x<width;x++){const p=y*width+x;if(labels[p])left=x;if(left>=0){horizontal[p]=(x-left)**2;source[p]=y*width+left;}}
  let right=-1;for(let x=width-1;x>=0;x--){const p=y*width+x;if(labels[p])right=x;if(right>=0&&(right-x)**2<horizontal[p]){horizontal[p]=(right-x)**2;source[p]=y*width+right;}}
 }
 const owner=new Uint16Array(n),v=new Int32Array(height),z=new Float64Array(height+1);
 for(let x=0;x<width;x++){
  let k=-1;
  for(let q=0;q<height;q++){
   const fq=horizontal[q*width+x];if(!Number.isFinite(fq))continue;let s=-Infinity;
   while(k>=0){const p=v[k];s=((fq+q*q)-(horizontal[p*width+x]+p*p))/(2*(q-p));if(s>z[k])break;k--;}
   k++;v[k]=q;z[k]=k?s:-Infinity;z[k+1]=Infinity;
  }
  if(k<0)throw Error('Ownership requires a labeled surface');
  let at=0;for(let y=0;y<height;y++){while(z[at+1]<y)at++;owner[y*width+x]=labels[source[v[at]*width+x]];}
 }
 return owner;
}
