import { chromium } from 'playwright';
const url = process.argv[2] || 'http://127.0.0.1:8127/';
const b = await chromium.launch({ headless: false });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('console', m => console.error('[' + m.type() + ']', m.text()));
p.on('pageerror', e => console.error('[pageerror]', String(e)));
p.on('requestfailed', r => console.error('[404?]', r.url(), r.failure()?.errorText));
p.on('response', r => { if (r.status() >= 400) console.error('[http ' + r.status() + ']', r.url()); });
await p.goto(url, { waitUntil: 'load' });
await p.waitForFunction(() => window.__hale && window.__hale.isReady(), null, { timeout: 40000 });
// long tasks AFTER load only
await p.evaluate(() => { window.__tasks = []; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__tasks.push(Math.round(e.duration)); }).observe({ type: 'longtask' }); });
const cdp = await p.context().newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await p.evaluate(() => new Promise(res => {
  let last = performance.now(), min = 999, end = last + 6000;
  (function tick(t){ const d = t - last; last = t; if (d > 0) min = Math.min(min, 1000/d);
    scrollBy(0, innerHeight/55); if (t < end) requestAnimationFrame(tick); else { window.__min = min; res(); } })(performance.now());
}));
const r = await p.evaluate(() => ({ min: Math.round(window.__min), tasks: window.__tasks, h: document.documentElement.scrollHeight }));
console.error('AFTER-LOAD  minFps', r.min, ' longtasks', JSON.stringify(r.tasks), ' pageHeight', r.h);
// load-time cost, measured on a fresh page
const p2 = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p2.evaluate(() => 0).catch(() => {});
await p2.addInitScript(() => { window.__lt = []; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration)); }).observe({ type: 'longtask', buffered: true }); });
await p2.goto(url, { waitUntil: 'load' });
await p2.waitForFunction(() => window.__hale && window.__hale.isReady(), null, { timeout: 40000 });
await p2.waitForTimeout(500);
console.error('LOAD-TIME longtasks', JSON.stringify(await p2.evaluate(() => window.__lt)));
await b.close();
