// Opens every page of every site in a test run in headless Chrome (through the app's
// /preview route), waits for its pictures, and saves screenshots. Opening a page is
// also what makes the app generate that page's pictures, so this step is where the
// image cost of a run is spent. Pictures are cached, so a second run is free.
//
//   node scripts/variety-test/shots.mjs [batch] [--first]
//
// With --first only the first screen of each Home page is opened and photographed, which
// generates one picture per site instead of all of them. With --draft a picture that
// cannot be generated (no credit, say) is left as its placeholder instead of retried.
//
// Writes .prototype-cache/runs/<batch>/shots/<id>--<page>--full.jpg (whole page) and
// <id>--home--fold.jpg (what a visitor sees first), plus shots.json describing them.

import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const batch = process.argv[2] || 'variety-1';
const firstOnly = process.argv.includes('--first');
const draft = process.argv.includes('--draft');
// --only=a,b photographs just those sites and keeps the rest of an earlier run.
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',');
// One tab by default. Headless Chrome only paints the tab in front, so extra tabs stall.
const tabs = 1;
const APP = process.env.APP_URL || 'http://localhost:3210';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9377;
const WIDTH = 1440;
const HEIGHT = 900;
const RUN = path.join(root, '.prototype-cache', 'runs', batch);
const OUT = path.join(RUN, 'shots');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- Chrome, over its debugging protocol

const profile = path.join(os.tmpdir(), `variety-test-chrome-${process.pid}`);
const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', `--window-size=${WIDTH},${HEIGHT}`, 'about:blank'],
  { stdio: 'ignore' },
);
const quit = async () => {
  chrome.kill();
  await sleep(300);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
};
process.on('SIGINT', () => void quit().then(() => process.exit(130)));

let wsUrl = '';
for (let i = 0; i < 60 && !wsUrl; i++) {
  await sleep(250);
  wsUrl = await fetch(`http://127.0.0.1:${PORT}/json/version`)
    .then((r) => r.json())
    .then((j) => j.webSocketDebuggerUrl)
    .catch(() => '');
}
if (!wsUrl) {
  await quit();
  throw new Error('Chrome did not start');
}

const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});
let seq = 0;
const waiting = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  const w = msg.id && waiting.get(msg.id);
  if (!w) return;
  waiting.delete(msg.id);
  if (msg.error) w.reject(new Error(msg.error.message));
  else w.resolve(msg.result);
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    waiting.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

async function openTab() {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const cmd = (method, params) => send(method, params, sessionId);
  await cmd('Page.enable');
  await cmd('Runtime.enable');
  await cmd('Network.enable');
  // The map on a contact block is an embed from Google; it is left out of the screenshots.
  await cmd('Network.setBlockedURLs', { urls: ['*google.com/maps*'] });
  await cmd('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
  return { cmd, close: () => send('Target.closeTarget', { targetId }) };
}

const evaluate = async (tab, expression) => (await tab.cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;

const STATE = `(() => {
  const states = [...document.querySelectorAll('.site .pic')].map((p) => p.dataset.state);
  const imgs = [...document.querySelectorAll('.site img')];
  return {
    site: !!document.querySelector('.site'),
    pics: states.length,
    pending: states.filter((s) => s === 'idle' || s === 'queued' || s === 'loading').length,
    failed: states.filter((s) => s === 'error' || s === 'off').length,
    undecoded: imgs.filter((i) => !i.complete || !i.naturalWidth).length,
    fonts: document.fonts.status,
  };
})()`;

/** Loads a page and waits until every picture on it exists and has been drawn. */
async function settle(tab, url) {
  let state = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    await tab.cmd('Page.navigate', { url });
    const deadline = Date.now() + 240_000;
    while (Date.now() < deadline) {
      await sleep(700);
      state = await evaluate(tab, STATE).catch(() => null);
      if (state?.site && !state.pending && (state.failed || (!state.undecoded && state.fonts === 'loaded'))) break;
    }
    // A failed picture is asked for again on reload; the ones that worked come from the cache.
    if (!state?.failed || draft) break;
    await sleep(2500);
  }
  // A timer, not an animation frame: a tab that is not in front never gets a frame.
  await evaluate(tab, 'document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 600)))');
  return state;
}

async function capture(tab, file, height, scale) {
  const { data } = await tab.cmd('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 82,
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: WIDTH, height, scale },
  });
  await writeFile(file, Buffer.from(data, 'base64'));
}

// ---------------------------------------------------------------- the run

await mkdir(OUT, { recursive: true });
const sites = [];
for (const f of (await readdir(RUN)).filter((f) => f.endsWith('.json')).sort()) {
  const run = JSON.parse(await readFile(path.join(RUN, f), 'utf8'));
  if (run?.doc?.pages?.[0]?.sections?.length && (!only || only.includes(run.id))) sites.push({ id: run.id, pages: run.doc.pages.map((p) => p.id) });
}

const manifestFile = path.join(RUN, firstOnly ? 'shots-first.json' : 'shots.json');
const manifest = only ? JSON.parse(await readFile(manifestFile, 'utf8').catch(() => '{}')) : {};
const queue = [...sites];
await Promise.all(
  Array.from({ length: tabs }, async () => {
    const tab = await openTab();
    for (let site; (site = queue.shift()); ) {
      const t0 = Date.now();
      const pages = [];
      for (const page of firstOnly ? site.pages.slice(0, 1) : site.pages) {
        const state = await settle(tab, `${APP}/preview/${batch}/${site.id}?page=${encodeURIComponent(page)}${firstOnly ? '&first=1' : ''}`);
        const { cssContentSize } = await tab.cmd('Page.getLayoutMetrics');
        const height = Math.ceil(cssContentSize.height);
        const entry = { page, height, pics: state?.pics ?? 0, failed: state?.failed ?? 0, pending: state?.pending ?? 0 };
        if (!firstOnly) {
          entry.full = `${site.id}--${page}--full.jpg`;
          await capture(tab, path.join(OUT, entry.full), height, 0.4);
        }
        if (page === site.pages[0]) {
          entry.fold = `${site.id}--${page}--fold.jpg`;
          await capture(tab, path.join(OUT, entry.fold), HEIGHT, 0.5);
        }
        pages.push(entry);
      }
      manifest[site.id] = pages;
      const bad = pages.reduce((n, p) => n + p.failed + p.pending, 0);
      console.log(`${site.id.padEnd(24)} ${pages.length} pages · ${pages.reduce((n, p) => n + p.pics, 0)} picture slots · ${((Date.now() - t0) / 1000).toFixed(0)}s${bad ? ` · ${bad} PICTURES MISSING` : ''}`);
    }
    await tab.close();
  }),
);

await writeFile(manifestFile, JSON.stringify(manifest, null, 1));
await quit();
const missing = Object.values(manifest).flat().reduce((n, p) => n + p.failed + p.pending, 0);
console.log(`\n${Object.keys(manifest).length} sites photographed into ${path.relative(root, OUT)}${missing ? `, ${missing} pictures missing` : ''}`);
process.exit(0);
