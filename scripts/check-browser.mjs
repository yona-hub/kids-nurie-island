import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Windows startup policy check; real-browser rendering was explicitly requested. */
export function checkBrowser() {
  // The current browser skill routes rendered Canvas/CSS QA directly to Chrome.
  // This read-only check must not start Docker/Rancher for a visual workflow.
  const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  const report = { platform: process.platform, route:'rendered Chrome; Firefox/WebKit for required cross-engine regression', chrome, chromeAvailable:existsSync(chrome) };
  if(process.platform==='win32'&&!report.chromeAvailable)throw new Error('The configured Chrome executable is unavailable.');
  console.log('Rendered Canvas QA uses Chrome; no Lightpanda startup is needed.');
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/browser-readiness.json', JSON.stringify(report, null, 2));
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) checkBrowser();
