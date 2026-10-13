import {createHash} from 'node:crypto';

// VV-07: the legacy raster compiler made two white pinholes into fixed details.
// Both lie inside the new shared car-body boundary and obscure its painted color.
// Remove only these source paths in the unadopted v3 candidate. Real tire glints
// and every adopted/shipped legacy asset are retained.
const carPinholes=new Set([
 '4908e5fd409539a926098a64d15fe1c79340c1cc5f4e46cf71c977e7b4fe9e35',
 '8c18d7d21da13cfcbd44752701f389389cace09cdf03d3e58fe9ca28fa5b9622',
]);
export function retainedVectorDetails(source){
 if(source.id!=='gen-round-sports-car-v2')return source.details;
 const retired=source.details.filter(d=>d.fill?.toLowerCase()==='#ffffff'&&carPinholes.has(createHash('sha256').update(d.path).digest('hex')));
 if(retired.length!==2)throw Error('Reviewed car pinhole source paths changed; review again before compiling.');
 return source.details.filter(d=>!retired.includes(d));
}
