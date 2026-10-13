import {defineConfig} from '@playwright/test';
import base from './playwright.config';
const output=process.env.PRINCESS_EVIDENCE_OUTPUT??'test-results/princess-master';

export default defineConfig({...base,
  workers:1,
  fullyParallel:false,
  testMatch:[/princess-master\.spec\.ts/,/princess-menu\.spec\.ts/,/eyes\.spec\.ts/,/storybook-upgrade\.spec\.ts/],
  grep:/master|princess menu|improved copy/,
  projects:[{name:'princess-chrome',use:{channel:'chrome',viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true}}],
  outputDir:`${output}/browser/artifacts`,
  reporter:[['list'],['json',{outputFile:`${output}/browser/results.json`}]],
});
