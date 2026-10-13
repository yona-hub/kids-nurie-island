import sharp from 'sharp';

/** Pack relative RGB light, with each skin part's own sampling gutter. */
export async function compileSkinLight(patches){
 if(!patches.length)return undefined;
 const width=2048,parts=[],images=[];let x=4,y=4,rowHeight=0;
 for(const patch of [...patches].sort((a,b)=>b.target.height-a.target.height)){
  const w=Math.ceil(patch.target.width*1.28),h=Math.ceil(patch.target.height*1.28);
  if(w+8>width)throw Error('Skin light patch exceeds atlas width');
  if(x+w+4>width){x=4;y+=rowHeight+8;rowHeight=0;}
  const image=await sharp(patch.data,{raw:{width:patch.target.width,height:patch.target.height,channels:3}}).blur(1.25).resize(w,h,{kernel:'cubic'}).png().toBuffer();
  parts.push({regionId:patch.regionId,source:{x,y,width:w,height:h},target:patch.target});images.push({input:image,left:x,top:y});x+=w+8;rowHeight=Math.max(rowHeight,h);
 }
 const height=y+rowHeight+4;
 if(height>4096)throw Error('Skin light atlas exceeds height limit');
 const image=await sharp({create:{width,height,channels:3,background:{r:128,g:128,b:128}}}).composite(images).png().toBuffer();
 return {image,width,height,parts};
}
