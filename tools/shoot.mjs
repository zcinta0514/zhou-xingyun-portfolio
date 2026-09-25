/* 截图/自检工具（开发用，不属于网站产物）
 *
 * 用法：
 *   node tools/serve.mjs "$PWD" 8899 &          # 先起静态服务器（必须用这个，别用 python3 -m http.server）
 *   PLAN='[{"path":"site/index.html","name":"hero","scroll":0,"wait":800}]' \
 *     OUTDIR=/tmp/shots node tools/shoot.mjs
 *
 * PLAN 每项：{ path, name, scroll, offset, wait }
 *   scroll 给数字 = 滚到该 y；给字符串 = 当作选择器，滚到该元素顶部（可配 offset 微调）
 *
 * 两个必须知道的坑（都踩过）：
 *  1. headless 下 rAF 会被节流，不 pump 帧的话 IntersectionObserver 不派发、动效不推进 → 看起来像页面坏了。
 *  2. headless 默认没有 WebGL，getContext('webgl') 返回 null，页面会走降级分支。
 *     所以下面显式开了 swiftshader 软渲染，并且不能带 --disable-gpu。
 *  3. 快速程序化滚动会让 loading="lazy" 的图片不发起请求 → 截图里像破图。
 *     所以每个页面都会先「预热滚动」一遍。
 */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = Number(process.env.PORT || 9345);
const W = Number(process.env.VW || 1440);
const H = Number(process.env.VH || 900);
const DPR = Number(process.env.DPR || 1);
const OUT = process.env.OUTDIR || '/tmp/shots';
const BASE = process.env.BASE || 'http://localhost:8899';
const PLAN = JSON.parse(process.env.PLAN || '[]');

mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  `--user-data-dir=/tmp/cdp-shoot-${PORT}`,
  `--window-size=${W},${H}`, 'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function wsUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find(t => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(300);
  }
  throw new Error('找不到 CDP target');
}

const ws = new WebSocket(await wsUrl());
await new Promise(r => ws.addEventListener('open', r, { once: true }));

let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown')
    errors.push('EXC: ' + (m.params.exceptionDetails?.exception?.description || '').slice(0, 200));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
    errors.push('ERR: ' + (m.params.args || []).map(a => a.value || a.description || '').join(' ').slice(0, 200));
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const mid = ++id; pending.set(mid, { resolve, reject });
  ws.send(JSON.stringify({ id: mid, method, params }));
});
const ev = async (expr, awaitPromise = false) =>
  (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise })).result.value;
const pump = n => ev(`(async()=>{for(let i=0;i<${n};i++)await new Promise(r=>requestAnimationFrame(r));})()`, true);

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: DPR, mobile: W < 600 });

let current = null;
for (const step of PLAN) {
  const url = BASE + '/' + step.path;
  if (url !== current) {
    await send('Page.navigate', { url });
    current = url;
    await sleep(2800);
    // 预热：让懒加载图片与 IntersectionObserver 全部触发
    await ev(`(async()=>{const s=document.documentElement.scrollHeight;
      for(let y=0;y<s;y+=450){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,70));}
      window.scrollTo(0,0);await new Promise(r=>setTimeout(r,400));})()`, true);
    await pump(70);
    await sleep(700);
  }
  const expr = typeof step.scroll === 'string'
    ? `(()=>{const el=document.querySelector(${JSON.stringify(step.scroll)});if(!el)return -1;
        window.scrollTo(0, el.getBoundingClientRect().top + scrollY + ${step.offset || 0});return scrollY;})()`
    : `(()=>{window.scrollTo(0, ${step.scroll || 0});return scrollY;})()`;
  const y = await ev(expr);
  await pump(50);
  await sleep(step.wait ?? 400);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot?.data) {
    writeFileSync(`${OUT}/${step.name}.png`, Buffer.from(shot.data, 'base64'));
    console.log('shot', step.name, 'y=' + y);
  } else console.log('FAILED', step.name, 'y=' + y);
}

if (errors.length) console.log('\n控制台错误:\n' + errors.slice(0, 6).join('\n'));
ws.close();
chrome.kill();
