import { chromium } from 'playwright';
const b = await chromium.launch({ headless: false });
for (const [label, down, lat, cpu] of [['Fast 3G + 4x CPU', 1.6*1024*1024/8, 150, 4], ['unthrottled', 0, 0, 1]]) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type:'layout-shift', buffered:true });
    new PerformanceObserver(l => { window.__lcp = l.getEntries().pop(); }).observe({ type:'largest-contentful-paint', buffered:true });
  });
  const cdp = await p.context().newCDPSession(p);
  if (down) await cdp.send('Network.emulateNetworkConditions', { offline:false, downloadThroughput:down, uploadThroughput:down/4, latency:lat });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await p.goto(process.argv[2] || 'http://127.0.0.1:8127/', { waitUntil:'load' });
  await p.waitForTimeout(4000);
  const m = await p.evaluate(() => ({ lcp: Math.round(window.__lcp ? window.__lcp.startTime : -1),
    el: window.__lcp && window.__lcp.element ? window.__lcp.element.tagName + '.' + window.__lcp.element.className.split(' ')[0] : '?',
    cls: +window.__cls.toFixed(4), fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || -1) }));
  console.error(label.padEnd(18), 'FCP', String(m.fcp).padStart(5)+'ms', ' LCP', String(m.lcp).padStart(5)+'ms', '('+m.el+')', ' CLS', m.cls);
  await p.close();
}
await b.close();
