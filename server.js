const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
};

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function tryServeFile(filePath, res) {
  // Handle URL-encoded filenames (e.g., favicon.ico?v=... saved as favicon.ico%3Fv=...)
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      res.writeHead(200, {
        'Content-Type': getMime(filePath),
        'Content-Length': stat.size,
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(filePath).pipe(res);
      return true;
    }
  }
  return false;
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);

  // Log requests for debugging
  console.log(`${req.method} ${req.url}`);

  // Serve static files
  let filePath = path.join(ROOT, urlPath);

  // Try serving the exact file
  if (tryServeFile(filePath, res)) return;

  // Try with .html extension
  if (tryServeFile(filePath + '.html', res)) return;

  // Try index.html in directory
  if (tryServeFile(path.join(filePath, 'index.html'), res)) return;

  // SPA fallback: for /en/tickets or similar React routes,
  // serve tickets.html from root
  if (urlPath.includes('ticket')) {
    const ticketsPath = path.join(ROOT, 'tickets.html');
    if (tryServeFile(ticketsPath, res)) return;
  }

  // Fallback: try serving from www.fifa.com directory for absolute paths
  // The React app requests /static/js/... which maps to www.fifa.com/static/js/...
  const wwwPath = path.join(ROOT, 'www.fifa.com', urlPath);
  if (tryServeFile(wwwPath, res)) return;

  // Also try the hospitality directory
  const hospPath = path.join(ROOT, 'fifaworldcup26.hospitality.fifa.com', urlPath);
  if (tryServeFile(hospPath, res)) return;

  // 404
  console.log(`  → 404 Not Found: ${filePath}`);
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n🏟️  FIFA Clone Server running at http://localhost:${PORT}`);
  console.log(`📋 Tickets page: http://localhost:${PORT}/tickets.html`);
  console.log(`🏠 Hospitality:  http://localhost:${PORT}/fifaworldcup26.hospitality.fifa.com/\n`);
});
