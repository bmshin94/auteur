/* Minimal static server for local QA. The 3D scene fetches .gltf/.bin/.hdr, and fetch() is
 * blocked on file:// — so every check that involves the live stage has to run over http.
 *   node design/tools/serve.mjs [port]        (from docs/showcase/hale) */
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, resolve, normalize } from 'path';

const ROOT = resolve(process.argv[3] || '.');
const PORT = Number(process.argv[2] || 8127);
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.hdr': 'image/vnd.radiance',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml', '.md': 'text/markdown',
};

createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''));
  try {
    if ((await stat(file)).isDirectory()) throw new Error('dir');
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 ' + p);
  }
}).listen(PORT, () => console.error(`[serve] ${ROOT} → http://127.0.0.1:${PORT}/`));
