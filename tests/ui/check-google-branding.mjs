/* global document, getComputedStyle, window */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, firefox, webkit, expect } from '@playwright/test';
import { build } from 'vite';
import { checkBrowser } from '../../scripts/check-browser.mjs';

const directory = resolve('test-results/google-branding');
await mkdir(directory, { recursive: true });
await build({ configFile: false, logLevel: 'error', define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: { outDir: `${directory}/bundle`, emptyOutDir: false, target: 'es2022', lib: { entry: resolve('tests/ui/browser-google-entry.tsx'), formats: ['es'], fileName: () => 'fixture.js' } } });
const source = await readFile(`${directory}/bundle/fixture.js`);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const provenance = JSON.parse(await readFile('content/third-party/google-signin/sources.json', 'utf8'));
const resources = new Map([['/fixture.js', { contentType: 'text/javascript', body: source }]]);
for (const name of ['styles.css', 'styles-editor.css', 'styles-google.css']) resources.set(`/${name}`, { contentType: 'text/css', body: await readFile(`apps/web/src/${name}`) });
for (const name of ['g-logo.png', 'google-sans-google-500.ttf']) {
  const body = await readFile(`apps/web/public/images/google-signin/${name}`);
  assert.equal(digest(body), provenance.assets.find(item => item.file === name).sha256);
  resources.set(`/images/google-signin/${name}`, { contentType: name.endsWith('.png') ? 'image/png' : 'font/ttf', body });
}
const html = '<!doctype html><html lang="ja"><head><meta charset="utf-8"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script type="module">import * as fixture from "/fixture.js";window.brandFixture=fixture</script></body></html>';
const readiness = checkBrowser(), results = [];
for (const [name, launcher] of Object.entries({ chromium, firefox, webkit })) {
  const override = name === 'firefox' ? process.env.FIREFOX_EXECUTABLE_PATH : undefined;
  const browser = await launcher.launch({ headless: true, ...(override ? { executablePath: resolve(override) } : {}) });
  try {
    const errors = [], external = [], context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== 'http://google-branding.test') { external.push(url.href); return route.abort(); }
      const resource = resources.get(url.pathname);
      if (resource) return route.fulfill(resource);
      if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: html });
      return route.fulfill({ status: 404, body: 'Missing fixture resource' });
    });
    await page.goto('http://google-branding.test/');
    const button = page.getByRole('button', { name: 'Googleでログイン' });
    await expect(button).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const states = {};
    const inspect = () => button.evaluate(element => {
      const css = getComputedStyle(element), overlay = getComputedStyle(element.querySelector('.google-signin-state'));
      const img = element.querySelector('img'), iconStyle = getComputedStyle(img);
      return { background: css.backgroundColor, border: css.borderColor, color: css.color, stateOpacity: Number(overlay.opacity), outlineWidth: css.outlineWidth, iconFit: iconStyle.objectFit, iconLoaded: img.naturalWidth > 0, fontLoaded: document.fonts.check('500 14px "Google Sans Signin"', 'Google'), height: element.getBoundingClientRect().height };
    });
    states.normal = await inspect();
    await button.hover(); states.hover = await inspect();
    await page.mouse.move(0, 0); await page.keyboard.press('Tab'); await expect(button).toBeFocused(); states.focus = await inspect();
    await button.hover(); await page.mouse.down(); states.pressed = await inspect(); await page.mouse.up();
    await expect(button).toBeDisabled(); states.busy = await inspect();
    await expect(page.getByLabel('認証呼出し数')).toHaveText('1');
    await page.keyboard.press('Enter'); await expect(page.getByLabel('認証呼出し数')).toHaveText('1');
    await page.evaluate(() => window.brandFixture.finishSignIn()); await expect(button).toBeEnabled();
    await button.focus(); await page.keyboard.press('Enter'); await expect(page.getByLabel('認証呼出し数')).toHaveText('2');
    await page.evaluate(() => window.brandFixture.finishSignIn()); await expect(button).toBeEnabled();
    for (const state of Object.values(states)) {
      assert.equal(state.background, 'rgb(255, 255, 255)'); assert.equal(state.border, 'rgb(116, 119, 117)');
      assert.equal(state.color, 'rgb(31, 31, 31)'); assert.ok(state.iconLoaded && state.fontLoaded); assert.equal(state.iconFit, 'contain'); assert.ok(state.height >= 44);
    }
    assert.equal(states.normal.stateOpacity, 0); assert.equal(states.hover.stateOpacity, 0.08);
    assert.equal(states.focus.stateOpacity, 0.12); assert.equal(states.pressed.stateOpacity, 0.12); assert.equal(states.busy.stateOpacity, 0);
    assert.equal(states.focus.outlineWidth, '3px'); assert.deepEqual(errors, []); assert.deepEqual(external, []);
    await page.screenshot({ path: `${directory}/${name}.png` });
    results.push({ browser: name, version: browser.version(), executablePath: override ?? launcher.executablePath(), states, signInCalls: 2, consoleErrors: errors, externalRequests: external, pass: true });
  } finally { await browser.close(); }
}
await writeFile(`${directory}/results.json`, JSON.stringify({ createdAt: new Date().toISOString(), readiness, componentSha256: digest(await readFile('apps/web/src/components/GoogleSignInButton.tsx')), results }, null, 2));
console.log(JSON.stringify({ pass: true, browsers: results.map(item => item.browser), states: 5, authenticationActions: 'mouse + Enter; disabled duplicate rejected' }));
