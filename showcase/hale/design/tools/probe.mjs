import { chromium } from 'playwright';
const b = await chromium.launch({ headless: false });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto(process.argv[2] || 'http://127.0.0.1:8127/', { waitUntil: 'load' });
await p.waitForFunction(() => window.__hale && window.__hale.isReady(), null, { timeout: 40000 });
const start = await p.evaluate(() => window.scrollY + document.getElementById('s3').getBoundingClientRect().top);
console.error('s3 starts at', start, 'pageH', await p.evaluate(() => document.documentElement.scrollHeight));
let i = 0;
for (const frac of [0.05, 0.2, 0.4, 0.6, 0.8, 0.95]) {
  await p.evaluate(y => scrollTo(0, y), start + frac * 1688);
  await p.waitForTimeout(450);
  await p.screenshot({ path: `design/tools/out/peak390-${String(i++).padStart(2,'0')}.png` });
}
await b.close();
