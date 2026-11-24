// The first Compatible release kept one board in a separate IndexedDB database.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');
const server = spawn('python3', ['-m', 'http.server', '8224', '--bind', '127.0.0.1', '-d', new URL('../www/', import.meta.url).pathname], { stdio: 'ignore' });
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
try {
  const page = await browser.newPage();
  for (let i = 0; ; i++) {
    try { await page.goto('http://127.0.0.1:8224/manifest.webmanifest'); break; }
    catch (e) { if (i >= 20) throw e; await new Promise(r => setTimeout(r, 100)); }
  }
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('loopsy-compatible', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('board');
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
    await new Promise((resolve, reject) => {
      const tx = db.transaction('board', 'readwrite');
      tx.objectStore('board').put({ bpm: 120, bars: 1, pads: [{ mode:'loop', volume:0.9, bars:1, free:false, fold:false, startBar:0, edits:[], raw:new Float32Array(96000).fill(0.1), sampleRate:48000, trimStart:0, lengthSamples:96000, defaultStart:0 }] }, 'current');
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await page.goto('http://127.0.0.1:8224/');
  await page.waitForFunction(() => window.loopsyReady);
  assert.deepEqual(await page.evaluate(() => ({ name: loopsy.projects.current.name, bpm: loopsy.settings.bpm, raw: loopsy.engine.pads[0].raw.length })), { name: 'My compatible loops', bpm: 120, raw: 96000 });
  await page.reload();
  await page.waitForFunction(() => window.loopsyReady);
  assert.equal(await page.evaluate(() => loopsy.engine.pads[0].raw.length), 96000);
  assert.equal(await page.evaluate(async () => {
    const db = await new Promise(resolve => { const r = indexedDB.open('loopsy-compatible'); r.onsuccess = () => resolve(r.result); });
    return await new Promise(resolve => { const r = db.transaction('board').objectStore('board').get('current'); r.onsuccess = () => resolve(r.result.pads[0].raw.length); });
  }), 96000);
  console.log('Prototype board imported, reloaded and retained in original storage');
} finally { await browser.close(); server.kill(); }
