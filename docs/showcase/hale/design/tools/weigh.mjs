import { chromium } from 'playwright';
const b = await chromium.launch({ headless: false });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const seen = new Map();
p.on('response', async r => { try { const buf = await r.body(); seen.set(new URL(r.url()).pathname, buf.length); } catch {} });
await p.goto(process.argv[2] || 'http://127.0.0.1:8127/', { waitUntil: 'load' });
await p.waitForFunction(() => window.__hale && window.__hale.isReady(), null, { timeout: 40000 });
await p.waitForTimeout(1500);
let total = 0;
for (const [k, v] of [...seen].sort((a, c) => c[1] - a[1])) { total += v; console.error(String(Math.round(v/1024)).padStart(6) + ' KB  ' + k); }
console.error('-'.repeat(46));
console.error(String(Math.round(total/1024)).padStart(6) + ' KB  TOTAL (' + (total/1048576).toFixed(2) + ' MB, ' + seen.size + ' requests)');
await b.close();
