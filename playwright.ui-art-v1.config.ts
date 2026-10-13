import {defineConfig} from '@playwright/test';
import base from './playwright.config';
const output=process.env.UI_ART_EVIDENCE_OUTPUT??'test-results/ui-art-v1/revision-1';
export default defineConfig({...base,workers:1,fullyParallel:false,testMatch:/palette-illustrations\.spec\.ts/,
  projects:[
    {name:'ui-chrome-desktop',use:{channel:'chrome',viewport:{width:1200,height:1000},deviceScaleFactor:1}},
    {name:'ui-chrome-mobile',use:{channel:'chrome',viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true}},
    {name:'ui-chrome-small',use:{channel:'chrome',viewport:{width:320,height:568},deviceScaleFactor:1,hasTouch:true}},
  ],outputDir:output+'/browser/artifacts',reporter:[['list'],['json',{outputFile:output+'/browser/results.json'}]],
});
