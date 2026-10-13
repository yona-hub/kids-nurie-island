import {defineConfig} from '@playwright/test';
import base from './playwright.config';
const output=process.env.PRINCESS_EVIDENCE_OUTPUT??'test-results/princess-master';

export default defineConfig({...base,
  workers:1,fullyParallel:false,testMatch:/pwa\.spec\.ts/,grep:/offline reload/,
  projects:[{name:'princess-offline-chrome',use:{channel:'chrome',viewport:{width:390,height:844},deviceScaleFactor:2}}],
  outputDir:`${output}/offline/artifacts`,
  reporter:[['list'],['json',{outputFile:`${output}/offline/results.json`}]],
  use:{...base.use,screenshot:'on'},
});
