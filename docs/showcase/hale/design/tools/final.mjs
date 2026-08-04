import { chromium } from 'playwright';
const URL = process.argv[2] || 'http://127.0.0.1:8127/';
const b = await chromium.launch({ headless: false });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on('console', m => m.type()==='error' && errs.push(m.text())); p.on('pageerror', e => errs.push(String(e)));
await p.goto(URL, { waitUntil: 'load' });
await p.waitForFunction(() => window.__hale && window.__hale.isReady(), null, { timeout: 40000 });
const top = await p.evaluate(() => window.scrollY + document.getElementById('s3').getBoundingClientRect().top);

// scrub bidirectionality: same scroll position reached from above and from below must render identically
const at = 0.55;
await p.evaluate(y => scrollTo(0, y), top);            await p.waitForTimeout(300);
await p.evaluate(y => scrollTo(0, y), top + at*3780);  await p.waitForTimeout(500);
const down = await p.evaluate(() => { const c = window.__hale.camera; return [c.position.toArray().map(v=>+v.toFixed(4)), window.__hale.parts.map(q=>+q.node.position.y.toFixed(4))]; });
await p.evaluate(y => scrollTo(0, y), top + 3780);     await p.waitForTimeout(400);
await p.evaluate(y => scrollTo(0, y), top + at*3780);  await p.waitForTimeout(500);
const up = await p.evaluate(() => { const c = window.__hale.camera; return [c.position.toArray().map(v=>+v.toFixed(4)), window.__hale.parts.map(q=>+q.node.position.y.toFixed(4))]; });
console.error('scrub bidirectional identical:', JSON.stringify(down) === JSON.stringify(up));

// INP-ish: time from click to the next paint on the only interactive control
await p.evaluate(() => scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(500);
const inp = await p.evaluate(() => new Promise(res => {
  const a = document.querySelector('.cta'); const t0 = performance.now();
  a.addEventListener('click', () => requestAnimationFrame(() => requestAnimationFrame(() => res(Math.round(performance.now() - t0)))), { once: true });
  a.click();
}));
console.error('click → next paint:', inp + 'ms');

// keyboard order + visible focus ring on each stop
await p.evaluate(() => scrollTo(0, 0));
const tabs = [];
for (let i = 0; i < 6; i++) {
  await p.keyboard.press('Tab');
  tabs.push(await p.evaluate(() => { const e = document.activeElement; const s = getComputedStyle(e);
    return e.tagName + ':' + (e.textContent||'').trim().slice(0,22) + ' outline=' + s.outlineWidth + ' ' + s.outlineStyle; }));
}
console.error('tab order:'); tabs.forEach(t => console.error('   ', t));

// watch the film: a dense slow pass, 20 frames end to end
const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
for (let i = 0; i < 20; i++) {
  await p.evaluate(y => scrollTo(0, y), Math.round(H * i / 19));
  await p.waitForTimeout(260);
  await p.screenshot({ path: `design/tools/film/f${String(i).padStart(2,'0')}.png` });
}
console.error('console errors over the whole run:', errs.length ? JSON.stringify(errs) : '0');
await b.close();
