// Avengers Doomsday — Mahjong Skies: screenshot + playtest driver.
// Loads the game in headless Chromium over CDP, collects console errors,
// play-tests the real game with keyboard and mouse, and captures 4 JPEG
// screenshots into screenshots/:
//   1-title.jpg   title screen (Mahjong tile wall)
//   2-play.jpg    ring run in progress (HUD, rings, city)
//   3-combat.jpg  void swarm fight (drones, blaster, combo)
//   4-victory.jpg doomsday gate reached, victory screen
// Usage: node shots.mjs [base-url]  (default http://localhost:8080/)
// The test Chrome is the Playwright Chromium on this machine.
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';

const BASE = process.argv[2] ?? 'http://localhost:8080/';
const OUT = new URL('./screenshots/', import.meta.url).pathname;
const CHROME = process.env.TEST_CHROME
  || '/home/hatch/workspace/makefun/.pw-chrome/chrome-linux64/chrome';
const PORT = 9224;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader',
  `--remote-debugging-port=${PORT}`,
  '--window-size=1280,800',
  '--hide-scrollbars',
  'about:blank',
], { stdio: 'ignore' });

let ws = null;
let nextId = 0;
const awaiting = new Map();
const problems = [];

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.addEventListener('open', () => resolve(socket));
    socket.addEventListener('error', reject);
    socket.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && awaiting.has(msg.id)) {
        const { resolve: res, reject: rej } = awaiting.get(msg.id);
        awaiting.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        problems.push('exception: ' + JSON.stringify(msg.params.exceptionDetails?.exception?.description ?? msg.params));
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        problems.push('console.error: ' + JSON.stringify(msg.params.args));
      } else if (msg.method === 'Network.loadingFailed') {
        problems.push('network failed: ' + JSON.stringify(msg.params));
      }
    });
  });
}

function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    awaiting.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalJs(expression) {
  const res = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) throw new Error('eval failed: ' + JSON.stringify(res.exceptionDetails));
  return res.result.value;
}

async function navigate(url) {
  await call('Page.navigate', { url });
  await sleep(1200);
}

async function shot(name) {
  const res = await call('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
  const buf = Buffer.from(res.data, 'base64');
  writeFileSync(`${OUT}${name}`, buf);
  console.log(`shot ${name}: ${(buf.length / 1024).toFixed(0)} KiB`);
}

async function key(type, keyName, code, keyCode) {
  await call('Input.dispatchKeyEvent', { type, key: keyName, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
}

async function pressKey(keyName, code, keyCode) {
  await key('keyDown', keyName, code, keyCode);
  await key('keyUp', keyName, code, keyCode);
}

async function mouse(x, y, button = 'left') {
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button, clickCount: 1 });
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button, clickCount: 1 });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  let targetUrl = null;
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page');
      if (page) { targetUrl = page.webSocketDebuggerUrl; break; }
    } catch { /* not up yet */ }
    await sleep(250);
  }
  if (!targetUrl) throw new Error('devtools did not come up');
  ws = await connect(targetUrl);
  await call('Page.enable');
  await call('Runtime.enable');
  await call('Network.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

  // 1 — title screen.
  await navigate(`${BASE}?shot=title&seed=20261126`);
  await shot('1-title.jpg');

  // 2 — ring run in progress.
  await navigate(`${BASE}?shot=play&seed=20261126`);
  await shot('2-play.jpg');
  console.log('play state:', await evalJs(`window.__doom.state() + ' score=' + window.__doom.hero().score + ' rings=' + window.__doom.hero().rings`));

  // 3 — void swarm combat.
  await navigate(`${BASE}?shot=combat&seed=20261126`);
  await shot('3-combat.jpg');
  console.log('combat state:', await evalJs(`window.__doom.state() + ' score=' + window.__doom.hero().score + ' kills=' + window.__doom.hero().kills`));

  // 4 — victory screen.
  await navigate(`${BASE}?shot=victory&seed=20261126`);
  await shot('4-victory.jpg');
  console.log('victory state:', await evalJs(`window.__doom.state() + ' score=' + window.__doom.hero().score`));

  // Live playtest: start the real game with Enter, steer with the mouse,
  // fire with a click, and confirm the HUD state actually moves.
  await navigate(BASE);
  await sleep(600);
  await pressKey('Enter', 'Enter', 13);
  await sleep(400);
  const started = await evalJs(`window.__doom.state()`);
  console.log('live start state:', started);
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 800, y: 300, button: 'none' });
  await mouse(800, 300);
  await sleep(2500);
  const live = await evalJs(`JSON.stringify({ state: window.__doom.state(), x: window.__doom.hero().x.toFixed(2), y: window.__doom.hero().y.toFixed(2), fuel: window.__doom.hero().fuel.toFixed(1), score: window.__doom.hero().score })`);
  console.log('live after 2.5s:', live);
  if (started !== 'playing') problems.push('live game did not start on Enter');
  const parsed = JSON.parse(live);
  if (Math.abs(parsed.x) < 0.05) problems.push('hero did not steer toward the mouse');

  console.log(problems.length === 0 ? 'PLAYTEST OK: no console/network errors' : `PROBLEMS (${problems.length}):\n- ${problems.join('\n- ')}`);
  ws.close();
  chrome.kill();
  process.exit(problems.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('driver failed:', err.message);
  try { chrome.kill(); } catch { /* already dead */ }
  process.exit(2);
});
