import { chromium } from 'playwright';
const b = await chromium.launch({ headless: false });
for (const [w,h] of [[390,844],[1440,900]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, reducedMotion:'reduce' });
  await p.goto(process.argv[2] || 'http://127.0.0.1:8127/', { waitUntil:'load' });
  await p.waitForTimeout(1200);
  const top = await p.evaluate(() => window.scrollY + document.getElementById('s3').getBoundingClientRect().top);
  let i = 0;
  for (const y of [0, top - 40, top + 260, top + 700]) {
    await p.evaluate(v => scrollTo(0, v), y);
    await p.waitForTimeout(350);
    await p.screenshot({ path: `design/tools/out/rm${w}-${i++}.png` });
  }
  await p.close();
}
await b.close();
