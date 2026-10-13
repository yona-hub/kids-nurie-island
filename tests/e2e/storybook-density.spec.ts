import {test,expect,startArtwork,project} from './helpers';
import {mkdirSync,writeFileSync} from 'node:fs';
test('DPR changes at unchanged CSS size redraw the viewport without changing the work',async({page,context},info)=>{
 test.skip(!info.project.name.startsWith('chromium'),'CDP density emulation is Chromium-only; cross-browser viewports are tested separately.');
 const id=await startArtwork(page,'おひめさま',0,'group'),stage=page.getByTestId('artwork'),session=await context.newCDPSession(page),size=page.viewportSize()!;
 await stage.focus();await stage.press('Enter');
 const before=await project(page,id);
 const css=await stage.evaluate(el=>({w:el.clientWidth,h:el.clientHeight}));
 const output='test-results/vector-improvement/dynamic-density',measurements=[];
 mkdirSync(output,{recursive:true});
 for(const dpr of [3,2,1]){
  await session.send('Emulation.setDeviceMetricsOverride',{width:size.width,height:size.height,deviceScaleFactor:dpr,mobile:info.project.name==='chromium-mobile'});
  await expect.poll(()=>stage.evaluate(el=>({width:el.querySelector('canvas')!.width,height:el.querySelector('canvas')!.height}))).toEqual({width:Math.round(css.w*dpr),height:Math.round(css.h*dpr)});
  expect(await stage.evaluate(el=>({w:el.clientWidth,h:el.clientHeight}))).toEqual(css);
  const beforeCapture=await stage.evaluate(el=>({dpr:devicePixelRatio,css:{w:el.clientWidth,h:el.clientHeight},canvas:{w:el.querySelector('canvas')!.width,h:el.querySelector('canvas')!.height}}));
  const box=(await stage.boundingBox())!;
  const capture=await session.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false,clip:{...box,scale:1}}),bytes=Buffer.from(capture.data,'base64');
  const afterCapture=await stage.evaluate(el=>({dpr:devicePixelRatio,css:{w:el.clientWidth,h:el.clientHeight},canvas:{w:el.querySelector('canvas')!.width,h:el.querySelector('canvas')!.height}}));
  expect(afterCapture).toEqual(beforeCapture);expect(bytes.readUInt32BE(16)).toBe(Math.round(box.width*dpr));expect(bytes.readUInt32BE(20)).toBe(Math.round(box.height*dpr));
  writeFileSync(`${output}/dpr-${dpr}.png`,bytes);measurements.push({beforeCapture,afterCapture,png:{w:bytes.readUInt32BE(16),h:bytes.readUInt32BE(20)}});
 }
 expect(await project(page,id)).toEqual(before);
 writeFileSync(`${output}/measurements.json`,JSON.stringify({measurements,projectUnchanged:true},null,2));
 await session.detach();
});
