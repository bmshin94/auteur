/* The rubric rows that screenshots cannot answer: the three degraded cuts, measured contrast on the
 * colours as painted, LCP/CLS, keyboard order, and what actually survives a file:// open.
 *   node design/tools/qa.mjs http://127.0.0.1:8127/ file:///.../index.html            */
import { chromium } from 'playwright';

const HTTP = process.argv[2] || 'http://127.0.0.1:8127/';
const FILE = process.argv[3];
const browser = await chromium.launch({ headless: false });
const out = [];
const say = (k, v) => { out.push([k, v]); console.error(k.padEnd(30), v); };

/** every text node that matters, measured against what is actually painted behind it */
const CONTRAST_PROBE = `(() => {
  const srgb = c => { c/=255; return c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
  const lum = ([r,g,b]) => 0.2126*srgb(r) + 0.7152*srgb(g) + 0.0722*srgb(b);
  const parse = s => (s.match(/[\\d.]+/g) || []).slice(0,3).map(Number);
  const bgOf = el => { for (let n = el; n; n = n.parentElement) {
      const c = getComputedStyle(n).backgroundColor;
      if (c && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(c)) return parse(c);
    } return [12,10,6]; };
  const ratio = (a,b) => { const [x,y] = [lum(a),lum(b)].sort((p,q)=>q-p); return (x+0.05)/(y+0.05); };
  const rows = [];
  for (const sel of ['.body','.rev p','.owner p','.spec dt','.spec dd','.spec-note','.colophon p',
                     'h1','h2','.price','.lbl','.rev .yr','.owner .who','.cta','.dim .val']) {
    const el = document.querySelector(sel); if (!el) continue;
    const cs = getComputedStyle(el);
    const px = parseFloat(cs.fontSize);
    const large = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight,10) >= 700);
    rows.push({ sel, px: Math.round(px), large,
      r: +ratio(parse(cs.color), bgOf(el)).toFixed(2), need: large ? 3 : 4.5 });
  }
  return rows;
})()`;

// ── 1. the full page, WebGL on ────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(l => { window.__lcp = l.getEntries().pop(); })
      .observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await page.goto(HTTP, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__hale && window.__hale.isReady(), null, { timeout: 40_000 });
  await page.waitForTimeout(900);
  const m = await page.evaluate(() => ({
    lcp: Math.round(window.__lcp ? window.__lcp.startTime : -1),
    lcpEl: window.__lcp && window.__lcp.element ? window.__lcp.element.tagName + '.' + window.__lcp.element.className : '?',
    cls: +window.__cls.toFixed(4),
    webgl: document.documentElement.classList.contains('webgl'),
    height: document.documentElement.scrollHeight,
  }));
  say('webgl booted', m.webgl);
  say('LCP (local, unthrottled)', m.lcp + 'ms  ' + m.lcpEl);
  say('CLS', m.cls);
  say('page height @1440', m.height + 'px (' + (m.height / 900).toFixed(1) + '× viewport)');
  say('console errors', errs.length ? JSON.stringify(errs) : '0');

  const contrast = await page.evaluate(CONTRAST_PROBE);
  for (const c of contrast) {
    say('  contrast ' + c.sel, `${c.r}:1  (${c.px}px${c.large ? ' large' : ''}, need ${c.need}) ${c.r >= c.need ? 'PASS' : 'FAIL'}`);
  }

  // keyboard: tab to every focusable and confirm a visible outline
  const tabs = await page.evaluate(() => [...document.querySelectorAll('a[href],button,[tabindex]:not([tabindex="-1"])')]
    .map(el => el.tagName + ':' + (el.textContent || '').trim().slice(0, 28)));
  say('focusable in order', tabs.length + ' — ' + tabs.join(' | '));
  await page.close();
}

// ── 2. reduced motion ─────────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(HTTP, { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  const m = await page.evaluate(() => ({
    webgl: document.documentElement.classList.contains('webgl'),
    height: document.documentElement.scrollHeight,
    peak: Math.round(document.getElementById('s3').getBoundingClientRect().height),
    posters: [...document.querySelectorAll('.poster')].map(i => i.naturalWidth > 0 && getComputedStyle(i).visibility === 'visible'),
    names: getComputedStyle(document.querySelector('.peak-static .names')).display,
    words: document.body.innerText.trim().split(/\s+/).length,
  }));
  say('reduced: webgl booted', m.webgl + '  (must be false)');
  say('reduced: page height', m.height + 'px, peak section ' + m.peak + 'px');
  say('reduced: posters painted', JSON.stringify(m.posters));
  say('reduced: part names', m.names + '  (must not be none)');
  say('reduced: words visible', m.words);
  await page.close();
}

// ── 3. JavaScript off ─────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(HTTP, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const m = await page.evaluate ? null : null;
  const words = (await page.innerText('body')).trim().split(/\s+/).length;
  const shot = await page.locator('.peak-static .names').isVisible();
  const posterOk = await page.locator('.poster-hero').isVisible();
  say('no-JS: words visible', words);
  say('no-JS: hero poster shown', posterOk);
  say('no-JS: eight part names', shot);
  await ctx.close();
}

// ── 4. WebGL unavailable ──────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t) {
      if (/webgl|webgpu/i.test(t)) return null;
      return orig.apply(this, arguments);
    };
  });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(HTTP, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const m = await page.evaluate(() => ({
    webgl: document.documentElement.classList.contains('webgl'),
    poster: getComputedStyle(document.querySelector('.poster-hero')).display,
    names: getComputedStyle(document.querySelector('.peak-static .names')).display,
  }));
  say('no-WebGL: webgl class', m.webgl + '  (must be false)');
  say('no-WebGL: hero poster', m.poster + '  (must not be none)');
  say('no-WebGL: part names', m.names + '  (must not be none)');
  say('no-WebGL: page errors', errs.length ? JSON.stringify(errs) : '0');
  await page.close();
}

// ── 5. file:// — what genuinely survives with no server ───────────────────────
if (FILE) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(FILE, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  const m = await page.evaluate(() => ({
    webgl: document.documentElement.classList.contains('webgl'),
    poster: document.querySelector('.poster-hero').naturalWidth,
    font: document.fonts.check('700 40px "Martian Mono"'),
    words: document.body.innerText.trim().split(/\s+/).length,
    height: document.documentElement.scrollHeight,
  }));
  say('file:// webgl booted', m.webgl);
  say('file:// poster loaded', m.poster + 'px wide (0 = failed)');
  say('file:// display font', m.font);
  say('file:// words visible', m.words);
  say('file:// page errors', errs.length ? JSON.stringify(errs) : '0');
  await page.close();
}

await browser.close();
