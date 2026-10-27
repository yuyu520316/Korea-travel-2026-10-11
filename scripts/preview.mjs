import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 4173);
http.createServer(async (req, res) => {
  try {
    let name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (name === '/') name = '/index.html';
    if (name === '/guide') name = '/guide.html';
    const target = path.resolve(root, '.' + name);
    if (!target.startsWith(root)) { res.writeHead(403); res.end(); return; }
    const data = await readFile(target);
    res.writeHead(200, { 'Content-Type': name.endsWith('.css') ? 'text/css' : name.endsWith('.js') ? 'application/javascript' : 'text/html; charset=utf-8' });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, '0.0.0.0', () => console.log(`Preview: http://localhost:${port}`));
