import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import fs from 'node:fs/promises';
import { performanceBuildIdentity, assertPerformanceBuildUnchanged } from './performance-evidence.mjs';
const url = process.env.PERFORMANCE_URL || 'http://127.0.0.1:4174';
const build = await performanceBuildIdentity(url);
const browser = await chromium.launch({ headless: true, args: ['--remote-debugging-port=9233'] });
try {
  const result = await lighthouse(url, { port: 9233, output: 'json', logLevel: 'error', onlyCategories: ['performance','accessibility','best-practices'], formFactor: 'mobile', screenEmulation: { mobile:true, width:390, height:844, deviceScaleFactor:1, disabled:false } });
  await fs.mkdir('test-results',{recursive:true});
  await fs.writeFile('test-results/lighthouse.json', result.report);
  const {lhr}=result;
  const resultSummary={url:lhr.finalDisplayedUrl,categories:Object.fromEntries(Object.entries(lhr.categories).map(([id,category])=>[id,category.score])),metrics:Object.fromEntries(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index'].map(id=>[id,{value:lhr.audits[id].numericValue,display:lhr.audits[id].displayValue}])),failures:Object.values(lhr.audits).filter(audit=>audit.score!==null&&audit.score<.9&&audit.details).map(audit=>({id:audit.id,title:audit.title,score:audit.score,details:audit.displayValue}))};
  const after = await performanceBuildIdentity(url); assertPerformanceBuildUnchanged(build, after);
  Object.assign(resultSummary, { measuredAt: lhr.fetchTime, browserVersion: browser.version(), build, buildUnchanged: true });
  await fs.writeFile('test-results/lighthouse-summary.json',JSON.stringify(resultSummary,null,2)+'\n');
  console.log(JSON.stringify({...resultSummary,build:{aggregateSha256:build.aggregateSha256,sourceAggregateSha256:build.sourceAggregateSha256}},null,2));
} finally { await browser.close(); }
