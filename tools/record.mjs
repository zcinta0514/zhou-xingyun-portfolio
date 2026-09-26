/* 录屏工具（开发用，不属于网站产物）
 *
 * 为什么需要它：截图有延迟，抓不到 160–700ms 这个窗口里的中间帧——
 * 结果“动效到底跑没跑”只能靠猜（这一轮就为此白折腾了很久）。
 * 这个工具用 CDP 的 screencast 连续抓帧，再用 ffmpeg 合成 mp4，
 * 动效可以直接当视频看，也可以丢给别人。
 *
 * 用法：
 *   node tools/serve.mjs "$PWD" 8899 &          # 先起静态服务器
 *   node tools/record.mjs --out /tmp/deck.mp4 \
 *     --path "site/index.html" \
 *     --scroll "#works-tiktok" --offset -70 \
 *     --setup "document.querySelectorAll('.deck-tab')[2].focus()" \
 *     --act   "await new Promise(r=>setTimeout(r,400)); for(const i of [3,1,4]){document.querySelectorAll('.deck-tab')[i].click(); await new Promise(r=>setTimeout(r,1100));}"
 *
 * 参数：
 *   --path     相对仓库根的页面路径（可带 ?query）
 *   --scroll   数字 = 滚到该 y；字符串 = 选择器，滚到该元素顶部
 *   --offset   配合 --scroll 选择器的微调
 *   --setup    滚动完成后、开始录制前执行一次（给元素聚焦之类）
 *   --act      开始录制后执行的交互脚本（顶层有 await，当 async 函数跑）
 *   --ms       录多久（默认 4200）
 *   --fps      输出帧率（默认 30）
 *   --out      输出文件（.mp4）
 *   --keep     保留抓到的帧目录，便于排查
 */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const has = k => argv.includes('--' + k);

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = Number(process.env.PORT || 9346);
const W = Number(process.env.VW || 1440);
const H = Number(process.env.VH || 900);
const BASE = process.env.BASE || 'http://localhost:8899';

const PATH_ = arg('path', 'site/index.html');
const SCROLL = arg('scroll', '0');
const OFFSET = arg('offset', '0');
const SETUP = arg('setup', '');
const ACT = arg('act', '');
const MS = Number(arg('ms', 4200));
const FPS = Number(arg('fps', 30));
const OUT = arg('out', '/tmp/record.mp4');
const FRAMES = (arg('out', '/tmp/record.mp4') + '').replace(/\.[a-z]+$/, '') + '-frames';

mkdirSync(FRAMES, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  '--force-device-scale-factor=1',
  `--user-data-dir=/tmp/cdp-rec-${PORT}`,
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
const frames = [];                       // { file, ts }
let recording = false;

ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.method === 'Page.screencastFrame' && recording) {
    const p = m.params;
    const file = `f${String(frames.length).padStart(4, '0')}.jpg`;
    writeFileSync(`${FRAMES}/${file}`, Buffer.from(p.data, 'base64'));
    frames.push({ file, ts: Date.now() });
    send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {});
  }
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

/* ---- 准备：加载、预热滚动（让懒加载图片与 IntersectionObserver 全部触发） ---- */
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 600 });
await send('Page.navigate', { url: BASE + '/' + PATH_ });
await sleep(2600);
await ev(`(async()=>{const s=document.documentElement.scrollHeight;
  for(let y=0;y<s;y+=450){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,70));}
  window.scrollTo(0,0);await new Promise(r=>setTimeout(r,400));})()`, true);
await pump(60);
await sleep(900);

/* ---- 滚到目标位置 ---- */
const scrollExpr = (SCROLL !== '0' && isNaN(Number(SCROLL)))
  ? `(()=>{const el=document.querySelector(${JSON.stringify(SCROLL)});if(!el)return -1;
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY + ${Number(OFFSET) || 0});return scrollY;})()`
  : `(()=>{window.scrollTo(0, ${Number(SCROLL) || 0});return scrollY;})()`;
const y = await ev(scrollExpr);
await pump(60);
await sleep(1200);                       // 等揭示动画播完，再开始录

if (SETUP) { await ev(SETUP); await sleep(200); }

/* ---- 开录：先启动抓帧，再跑交互脚本 ---- */
recording = true;
await send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: W, maxHeight: H, everyNthFrame: 1 });

if (ACT) {
  const wrapped = `(async()=>{ ${ACT} })()`;
  await send('Runtime.evaluate', { expression: wrapped, awaitPromise: true });
}
await sleep(MS);

recording = false;
await send('Page.stopScreencast').catch(() => {});
ws.close();
chrome.kill();

if (frames.length < 2) {
  console.log(`只抓到 ${frames.length} 帧，没法合成。`);
  process.exit(1);
}

/* ---- 用真实时间戳写 concat 清单，保证播放速度等于实际速度 ---- */
const lines = frames.map((f, i) => {
  const next = frames[i + 1];
  const dur = ((next ? next.ts : f.ts + 400) - f.ts) / 1000;
  return `file '${f.file}'\nduration ${dur.toFixed(3)}`;
});
lines.push(`file '${frames[frames.length - 1].file}'`);   // concat 需要最后再写一次文件名
writeFileSync(`${FRAMES}/list.txt`, lines.join('\n'));

await new Promise((resolve, reject) => {
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', `${FRAMES}/list.txt`,
    '-vf', `fps=${FPS},format=yuv420p`,
    '-c:v', 'libx264', '-crf', '20', '-movflags', '+faststart',
    OUT,
  ], { stdio: 'inherit' });
  ff.on('exit', code => code === 0 ? resolve() : reject(new Error('ffmpeg 失败 ' + code)));
});

const secs = ((frames[frames.length - 1].ts - frames[0].ts) / 1000).toFixed(1);
console.log(`录了 ${frames.length} 帧 / 约 ${secs}s（滚动位置 y=${y}）`);
console.log('输出：' + OUT);
if (!has('keep')) rmSync(FRAMES, { recursive: true, force: true });
else console.log('帧留在：' + FRAMES);
