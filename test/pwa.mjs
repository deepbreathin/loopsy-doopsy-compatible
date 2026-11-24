import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');
const server = spawn('python3', ['-m', 'http.server', '8224', '--bind', '127.0.0.1', '-d', new URL('../www/', import.meta.url).pathname], { stdio:'ignore' });
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  for (let i = 0; ; i++) {
    try { await page.goto('http://127.0.0.1:8224/'); break; }
    catch (e) { if (i >= 20) throw e; await new Promise(r => setTimeout(r, 100)); }
  }
  await page.waitForFunction(() => window.loopsyReady);
  await page.evaluate(async () => { await caches.open('unrelated-site-test'); await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller && window.loopsyReady);
  assert.equal(await page.evaluate(() => caches.has('unrelated-site-test')), true);
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => window.loopsyReady);
  assert.match(await page.title(), /Loopsy Doopsy Compatible/);
  console.log('Offline reload works and an unrelated cache remains intact');
} finally { await browser.close(); server.kill(); }
