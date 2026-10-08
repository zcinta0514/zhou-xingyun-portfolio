/* 使用 Chrome 打印独立 PDF 排版；等待图片、字体，并检查页面边界。 */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'dist/zhou-xingyun-portfolio-2026.pdf');
const review = resolve(root, 'dist/portfolio-review');
const port = 9371;
const httpPort = 8902;
const sleep = ms => new Promise(r=>setTimeout(r,ms));
mkdirSync(review, { recursive:true });
const server = spawn(process.execPath, [resolve(root,'tools/serve.mjs'),root,String(httpPort)], {stdio:'ignore'});
const chrome = spawn(process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[
  '--headless=new','--no-first-run','--no-default-browser-check','--hide-scrollbars',
  '--remote-debugging-port='+port,'--user-data-dir='+mkdtempSync('/tmp/portfolio-pdf-chrome-'), 'about:blank'
],{stdio:'ignore'});
let ws;
try {
  let target;
  for(let i=0;i<60;i++){
    try { target=(await (await fetch('http://127.0.0.1:'+port+'/json/list')).json()).find(t=>t.type==='page'); if(target)break; } catch{}
    await sleep(200);
  }
  if(!target)throw new Error('Chrome 启动失败');
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let id=0;
  const pending=new Map(),errors=[];
  ws.addEventListener('message',e=>{
    const m=JSON.parse(e.data);
    if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);
    if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{const mid=++id;pending.set(mid,{resolve,reject});ws.send(JSON.stringify({id:mid,method,params}));});
  const ev=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:'+httpPort+'/portfolio-pdf/'});
  for(let i=0;i<60;i++){if(await ev('!!window.PDF_CHAPTERS'))break;await sleep(200);}
  await ev('Promise.all([document.fonts.ready,...Array.from(document.images).map(i=>i.decode().catch(()=>null))])');
  const check=await ev('(()=>{const badImages=[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src);const overflow=[];for(const p of document.querySelectorAll(".page")){const b=p.getBoundingClientRect();for(const e of p.querySelectorAll("h2,h3,h4,p,figure,table,.strip,.credit,.statrow,.email,.contact-links,.link,.toc,.edu,.job")){const r=e.getBoundingClientRect();if(r.bottom>b.bottom-58||r.right>b.right-30||r.left<b.left)overflow.push({page:p.id,tag:e.tagName,text:e.textContent.slice(0,70),bottom:r.bottom-b.top,right:r.right-b.left});}}return {badImages,overflow,chapters:window.PDF_CHAPTERS};})()');
  writeFileSync(resolve(review,'checks.json'),JSON.stringify({...check,errors},null,2));
  if(check.badImages.length||check.overflow.length||errors.length)throw new Error('图片或页面边界检查未通过，见 dist/portfolio-review/checks.json');
  await send('Emulation.setEmulatedMedia',{media:'print'});
  const pdf=await send('Page.printToPDF',{printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false,generateTaggedPDF:true,generateDocumentOutline:true});
  writeFileSync(out,Buffer.from(pdf.data,'base64'));
  writeFileSync(resolve(review,'chapters.json'),JSON.stringify(check.chapters,null,2));
  console.log('PDF 已生成：'+out+'；共 '+check.chapters.length+' 页。');
} finally {if(ws)ws.close();chrome.kill();server.kill();}
