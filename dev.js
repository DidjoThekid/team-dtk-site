'use strict';
// Serveur local : node dev.js  (puis http://localhost:3000, admin sur /admin)
const http = require('http'); const fs = require('fs'); const path = require('path');
const PORT = process.env.PORT || 3000;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'); let p = decodeURIComponent(u.pathname);
  if (p.startsWith('/api/')) {
    const f = path.join(__dirname, 'api', path.basename(p) + '.js');
    if (!fs.existsSync(f)) { res.statusCode = 404; return res.end('{}'); }
    return require(f)(req, res);
  }
  if (p === '/') p = '/index.html'; else if (!path.extname(p)) p += '.html';
  const file = path.join(__dirname, 'public', path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(path.join(__dirname, 'public')) || !fs.existsSync(file)) { res.statusCode = 404; return res.end('404'); }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Team DTK -> http://localhost:${PORT}  (admin: /admin)`));
