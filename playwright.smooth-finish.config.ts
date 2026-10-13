import {defineConfig} from '@playwright/test';
import base from './playwright.config';
const output=process.env.SMOOTH_EVIDENCE_OUTPUT??'test-results/smooth-home-i33/revision-1';
export default defineConfig({...base,workers:1,fullyParallel:false,testMatch:/(smooth-finish|storybook-upgrade)\.spec\.ts/,
 projects:[
  {name:'smooth-desktop',use:{channel:'chrome',viewport:{width:1200,height:1000},deviceScaleFactor:1}},
  {name:'smooth-mobile',grep:/I33 smooth (princess|magic|dinosaurs|vehicles):/,use:{channel:'chrome',viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true}},
 ],outputDir:output+'/browser/artifacts',reporter:[['list'],['json',{outputFile:output+'/browser/results.json'}]],
});
