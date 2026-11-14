// Máy chủ tĩnh tối giản để thử app trên máy: node tools/serve.js [thư mục=public] [cổng=8123]
// Mọi đường dẫn không phải file đều trả về index.html (giống rewrite của Firebase Hosting).
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', 'public')), port = +process.argv[3] || 8123;
const TYPES = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.js': 'application/javascript' };
http.createServer((q, r) => {
  let f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'index.html');
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
}).listen(port, () => console.log(`http://localhost:${port}`));
