// Avengers Doomsday — Mahjong Skies: local static server (Node 22 stdlib).
// Serves game/ on http://localhost:8080 so the entry can be played and
// screenshotted without a build step. Development convenience only.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const portArg = process.argv.indexOf('--port');
const port = portArg === -1 ? 8080 : Number(process.argv[portArg + 1]) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  if (pathname === '/') pathname = '/index.html';
  const file = resolve(join(root, normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '')));
  if (!file.startsWith(root + sep) && file !== root) {
    res.writeHead(403).end('forbidden');
    return;
  }
  let stat;
  try {
    stat = statSync(file);
  } catch {
    res.writeHead(404).end('not found');
    return;
  }
  if (!stat.isFile()) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': MIME[extname(file)] ?? 'application/octet-stream',
    'content-length': stat.size,
  });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`serving game/ on http://localhost:${port}/`));
