import { Engine } from './engine.js';
import { encodeWav } from './wav.js';

const settings = { bpm: 90, beatsPerBar: 4, loopBars: 4, countIn: true, countInBeeps: false, autoPlay: true, latencyMs: null, monitor: false, liveMic: false, micBoost: 1 };
const engine = new Engine(settings);
const status = document.getElementById('status');
const bpm = document.getElementById('bpm');
const bars = document.getElementById('bars');
const grid = document.getElementById('pads');
let busy = false;
let saveQueue = Promise.resolve();
let database;
const say = (message) => { status.textContent = message; };

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('loopsy-compatible', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('board');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function transaction(mode, value) {
  return new Promise((resolve, reject) => {
    const tx = database.transaction('board', mode);
    const store = tx.objectStore('board');
    const request = mode === 'readonly' ? store.get('current') : store.put(value, 'current');
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Storage was interrupted'));
  });
}
function save() {
  if (!database) return;
  const board = { bpm: settings.bpm, bars: settings.loopBars, pads: engine.pads.map(p => p.raw ? engine.snapshot(p) : null) };
  saveQueue = saveQueue.then(() => transaction('readwrite', board)).catch(() => say('Could not save on this device. Download your sounds to keep them.'));
}
function render() {
  engine.pads.forEach((pad, i) => {
    const el = grid.children[i], main = el.querySelector('.pad-main');
    el.dataset.state = pad.state; el.dataset.active = String(pad.enabled);
    const state = pad.state === 'empty' ? 'Tap to record' : pad.state === 'armed' ? 'Get ready…' : pad.state === 'recording' ? 'Recording…' : pad.state === 'processing' ? 'Finishing…' : pad.pending ? (pad.enabled ? 'Starting…' : 'Stopping…') : pad.enabled ? 'Playing · tap to stop' : 'Tap to play';
    main.textContent = `Pad ${i + 1}\n${state}`;
    main.disabled = busy || pad.state === 'recording' || pad.state === 'processing';
    el.querySelector('.download').disabled = !pad.raw || busy;
    el.querySelector('.clear').disabled = !pad.raw || busy;
  });
  bpm.disabled = busy || engine.pads.some(p => p.state !== 'empty');
  bars.disabled = busy || engine.pads.some(p => ['armed','recording','processing'].includes(p.state));
}
async function tap(pad) {
  if (busy) return;
  busy = true; render();
  try {
    if (pad.state === 'armed') { engine.cancelRecording(pad); say('Recording cancelled.'); }
    else if (pad.state === 'empty') {
      if (engine.pads.some(p => ['armed','recording','processing'].includes(p.state))) { say('Wait for the current recording to finish.'); return; }
      await engine.record(pad); say('Get ready. Recording starts on the next loop.');
    } else if (pad.state === 'ready') await engine.trigger(pad);
  } catch (e) {
    console.error(e);
    say(e.name === 'NotAllowedError' ? 'Microphone access was denied. Allow it in your browser settings and try again.' : 'Could not start audio or microphone. Use HTTPS and a current browser, then try again.');
  } finally { busy = false; render(); }
}
for (const pad of engine.pads) {
  const el = document.createElement('div'); el.className = 'pad';
  const main = document.createElement('button'); main.className = 'pad-main'; main.type = 'button'; main.style.whiteSpace = 'pre-line'; main.addEventListener('click', () => tap(pad));
  const actions = document.createElement('div'); actions.className = 'pad-actions';
  const download = document.createElement('button'); download.type = 'button'; download.className = 'download'; download.textContent = 'Download WAV'; download.setAttribute('aria-label', `Download pad ${pad.index + 1} as WAV`);
  download.addEventListener('click', async () => {
    try { await engine.init(); } catch (e) { console.error(e); say('Could not prepare the sound for download.'); return; }
    const blob = encodeWav(pad.buffer.getChannelData(0), pad.buffer.sampleRate, {app:'loopsy', v:1, bpm:settings.bpm, beatsPerBar:4, bars:pad.bars, mode:'loop'});
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `loopsy-pad-${pad.index + 1}.wav`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  });
  const clear = document.createElement('button'); clear.type = 'button'; clear.className = 'clear'; clear.textContent = 'Clear'; clear.setAttribute('aria-label', `Clear pad ${pad.index + 1}`);
  clear.addEventListener('click', () => { if (confirm(`Clear pad ${pad.index + 1}? Download it first if you want to keep it.`)) { engine.clear(pad); save(); render(); } });
  actions.append(download, clear); el.append(main, actions); grid.append(el);
}
engine.addEventListener('change', render);
engine.addEventListener('recorded', () => { save(); say('Loop recorded and saved in this browser.'); render(); });
engine.addEventListener('saved', save);
bpm.addEventListener('change', () => { settings.bpm = Math.max(40, Math.min(200, Number(bpm.value) || 90)); bpm.value = settings.bpm; save(); });
bars.addEventListener('change', () => { settings.loopBars = Number(bars.value); save(); });
document.getElementById('stop').addEventListener('click', () => { if (!engine.ctx) return; engine.stopTransport(); engine.pads.forEach(p => p.enabled = false); say('Stopped. Tap a pad to play again.'); render(); });
render();
try {
  database = await openDB(); const board = await transaction('readonly');
  if (board) { settings.bpm = board.bpm || 90; settings.loopBars = board.bars || 4; bpm.value = settings.bpm; bars.value = settings.loopBars; board.pads.forEach((p, i) => { if (p && engine.pads[i]) engine.restore(engine.pads[i], p); }); }
} catch (e) { console.error(e); say('Browser storage is unavailable. Download your sounds before leaving.'); }
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
