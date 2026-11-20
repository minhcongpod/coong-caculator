// Chế độ tự cập nhật: node tools/live.js [nhánh=claude/project-thread-xroxrn] [cổng=8123]
// Cứ 4 giây tự `git fetch` + `git merge --ff-only` nhánh đó; có code mới thì mọi trình duyệt đang mở (cùng wifi) tự tải lại.
// Không cần bấm git pull. Nếu bạn sửa file ngay trên máy (có thay đổi chưa commit) thì bước kéo bị bỏ qua cho an toàn.
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const branch = process.argv[2] || 'claude/project-thread-xroxrn', port = +process.argv[3] || 8123;
const repo = path.resolve(__dirname, '..'), root = path.join(repo, 'public');
const git = (...a) => execFileSync('git', a, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const TYPES = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.js': 'application/javascript' };
let ver = Date.now();
const RELOAD = `<script>(function(){var v;setInterval(function(){fetch('/__ver',{cache:'no-store'}).then(function(r){return r.text()}).then(function(t){if(v&&t!==v)location.reload();v=t}).catch(function(){})},2000)})()</script>`;
function sync() {
  try {
    const cur = git('rev-parse', '--abbrev-ref', 'HEAD');
    if (cur !== branch) git('checkout', branch);
    git('fetch', 'origin', branch);
    if (git('rev-parse', 'HEAD') !== git('rev-parse', 'FETCH_HEAD')) {
      git('merge', '--ff-only', 'FETCH_HEAD'); ver = Date.now();
      console.log(new Date().toLocaleTimeString(), 'Đã cập nhật:', git('log', '--oneline', '-1'));
    }
  } catch (e) { console.log(new Date().toLocaleTimeString(), 'Chưa kéo được (bỏ qua):', String(e.stderr || e.message).split('\n')[0]); }
}
sync(); setInterval(sync, 4000);
http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/__ver') { r.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }); return r.end(String(ver)); }
  let f = path.join(root, u);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'index.html');
  const type = TYPES[path.extname(f)] || 'application/octet-stream';
  r.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  if (path.extname(f) === '.html') r.end(fs.readFileSync(f, 'utf8').replace('</body>', RELOAD + '</body>')); else fs.createReadStream(f).pipe(r);
}).listen(port, '0.0.0.0', () => {
  console.log(`Trên máy này:  http://localhost:${port}`);
  Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).forEach(i => console.log(`Mạng nội bộ:   http://${i.address}:${port}   (điện thoại/máy khác cùng wifi)`));
  console.log(`Tự cập nhật nhánh ${branch} mỗi 4 giây.`);
});
