/* Render the fallback stills straight out of the live scene.
 *
 * The no-WebGL / reduced-motion / file:// cut of this page shows two images. They are not
 * lookalikes and they are not generated: this script drives the real three.js stage at 2560×1600,
 * reads the canvas, and writes PNG masters. ffmpeg turns those into the shipped webp.
 *
 *   node design/tools/serve.mjs 8127 &
 *   node design/tools/posters.mjs http://127.0.0.1:8127/
 */
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'fs/promises';

const URL = process.argv[2] || 'http://127.0.0.1:8127/';
const OUT = 'design/tools/out';
const SHOTS = [
  // name        scene   progress   what it has to show
  ['hero', 'hero', 0.06],       // scene 1: assembled, low angle, one hard key
  ['exploded', 'peak', 0.62],   // scene 3: fully apart, camera three-quarters through the orbit
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 2560, height: 1600 }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });

await page.goto(URL, { waitUntil: 'load' });
await page.waitForFunction(() => window.__hale && window.__hale.isReady(), null, { timeout: 45_000 });
await page.waitForTimeout(600);                       // let textures finish decoding

for (const [name, mode, p] of SHOTS) {
  const data = await page.evaluate(([mode, p]) => {
    const s = window.__hale;
    s[mode](p);
    s.render();                                        // read in the same turn: the drawing buffer
    return s.renderer.domElement.toDataURL('image/png'); // is only cleared at the next composite
  }, [mode, p]);
  const buf = Buffer.from(data.split(',')[1], 'base64');
  await writeFile(`${OUT}/${name}.png`, buf);
  console.error(`[posters] ${name}.png  ${(buf.length / 1024).toFixed(0)}KB  (${mode} @ ${p})`);
}

await browser.close();
