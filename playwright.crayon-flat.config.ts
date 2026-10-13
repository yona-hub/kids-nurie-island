import {defineConfig} from '@playwright/test';
import base from './playwright.config';
const output=process.env.CRAYON_EVIDENCE_OUTPUT??'test-results/crayon-flat-i32/revision-1';
export default defineConfig({...base,workers:1,fullyParallel:false,testMatch:/crayon-flat\.spec\.ts/,
 projects:[
  {name:'crayon-desktop',use:{channel:'chrome',viewport:{width:1200,height:1000},deviceScaleFactor:1}},
  {name:'crayon-mobile',use:{channel:'chrome',viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true}},
 ],outputDir:output+'/browser/artifacts',reporter:[['list'],['json',{outputFile:output+'/browser/results.json'}]],
});
