// Headless Chrome for the screenshot scripts, driven over its debugging protocol with no
// dependencies. One tab only: headless Chrome paints just the tab in front.

import { spawn } from 'node:child_process';
import { rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9377;

export const APP = process.env.APP_URL || 'http://localhost:3210';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Without the app there is nothing to photograph, and every page would wait out its full timeout. */
export async function requireApp() {
  if (await fetch(`${APP}/api/status`, { signal: AbortSignal.timeout(8000) }).then((r) => r.ok).catch(() => false)) return;
  console.error(`The app is not answering at ${APP}. Start it (npm run dev) and run this again.`);
  process.exit(1);
}

/** Starts Chrome and opens one tab of the given size. */
export async function launch({ width, height, mobile = false }) {
  const profile = path.join(os.tmpdir(), `variety-test-chrome-${process.pid}`);
  const chrome = spawn(
    CHROME,
    ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', `--window-size=${width},${height}`, 'about:blank'],
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

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const cmd = (method, params) => send(method, params, sessionId);
  await cmd('Page.enable');
  await cmd('Runtime.enable');
  await cmd('Network.enable');
  // The map on a contact block is an embed from Google; it is left out of the screenshots.
  await cmd('Network.setBlockedURLs', { urls: ['*google.com/maps*'] });
  await cmd('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  return { tab: { cmd, width }, quit };
}

export const evaluate = async (tab, expression) => (await tab.cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;

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

/**
 * Loads a page and waits until every picture on it exists and has been drawn. With
 * "draft" a picture that cannot be generated is left as its placeholder, not retried.
 */
export async function settle(tab, url, { draft = false } = {}) {
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
  // Pictures fade in when they arrive. A screenshot taken mid-fade shows an empty frame, so
  // the fade is switched off and every picture is drawn in its final state.
  await evaluate(tab, `(() => { const s = document.createElement('style'); s.textContent = '.site .pic img { animation: none !important; }'; document.head.append(s); })()`);
  // A timer, not an animation frame: a tab that is not in front never gets a frame.
  await evaluate(tab, 'document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 600)))');
  return state;
}

/** Saves one rectangle of the page, which may lie below the visible part. */
export async function capture(tab, file, { y = 0, height, scale = 1 }) {
  const { data } = await tab.cmd('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 82,
    captureBeyondViewport: true,
    clip: { x: 0, y, width: tab.width, height, scale },
  });
  await writeFile(file, Buffer.from(data, 'base64'));
}
