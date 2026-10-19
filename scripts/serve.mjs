import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, extname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
await stat(resolve(root, 'index.html')).catch(() => { throw new Error('Build missing. Run npm run build first.'); });

createServer(async (request, response) => {
  const reject = (status, message) => { response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end(message); };
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.setHeader('Allow', 'GET, HEAD'); return reject(405, 'Method not allowed'); }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); } catch { return reject(400, 'Invalid URL'); }
  if (pathname.includes('\0')) return reject(400, 'Invalid URL');
  const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  const local = relative(root, file);
  if (local.startsWith('..') || isAbsolute(local)) return reject(403, 'Forbidden');
  try {
    const info = await stat(file);
    if (!info.isFile()) return reject(404, 'Not found');
    response.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': extname(file) === '.html' ? 'no-cache' : /-[\w-]{8,}\./.test(local) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    });
    if (request.method === 'HEAD') return response.end();
    const stream = createReadStream(file);
    stream.on('error', () => response.destroy());
    stream.pipe(response);
  } catch { reject(404, 'Not found'); }
}).listen(port, host, () => console.log(`CODEAM production: http://${host}:${port}`));
