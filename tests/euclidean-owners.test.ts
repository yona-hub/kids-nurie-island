import {it,expect} from 'vitest';
import {euclideanOwners} from '../scripts/euclidean-owners.mjs';

it('assigns diagonal, sparse and edge surfaces by exact Euclidean distance in every orientation',()=>{
 const width=17,height=13,points=[[0,0],[3,10],[15,2],[16,12],[9,6]];
 for(const transform of [(x:number,y:number)=>[x,y],(x:number,y:number)=>[width-1-x,y],(x:number,y:number)=>[x,height-1-y]]){
  const seeds=points.map(([x,y])=>transform(x,y)),labels=new Uint16Array(width*height);
  seeds.forEach(([x,y],i)=>{labels[y*width+x]=i+1;});const owner=euclideanOwners(labels,width,height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const distances=seeds.map(([u,v])=>(x-u)**2+(y-v)**2);
   expect(distances[owner[y*width+x]-1],`nearest surface at ${x},${y}`).toBe(Math.min(...distances));
  }
  expect(euclideanOwners(labels,width,height)).toEqual(owner);
 }
});

it('rejects ownership without any surface or with inconsistent dimensions',()=>{
 expect(()=>euclideanOwners(new Uint16Array(12),4,3)).toThrow();
 expect(()=>euclideanOwners(new Uint16Array(11),4,3)).toThrow();
});
