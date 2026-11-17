// Firestore REST giả để chạy thử 2 người dùng trên máy mà không ghi dữ liệu thật.
// Hỗ trợ GET / PATCH books/<mã>, điều kiện currentDocument.exists=false (409) và currentDocument.updateTime (400), CORS mở.
// Dùng: node tools/mock-firestore.js  (cổng 8124), rồi chép public/index.html ra chỗ khác, thay FS_URL bằng http://localhost:8124/books/
// và phục vụ bằng node tools/serve.js <thư mục> 8123. Mở 2 "máy" bằng http://localhost:8123/<tên> và http://127.0.0.1:8123/<tên> (bộ nhớ riêng).
// Xem toàn bộ dữ liệu: http://localhost:8124/dump . Không có realtime (onSnapshot) — phần đó chỉ thử được trên Firestore thật.
const http = require('http'); const db = new Map(); let t = 0;
const send = (r, code, obj) => { r.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,PATCH,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }); r.end(JSON.stringify(obj)); };
http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x'), code = decodeURIComponent(u.pathname.split('/').pop());
  if (q.method === 'OPTIONS') return send(r, 204, {});
  if (u.pathname === '/dump') return send(r, 200, Object.fromEntries([...db].map(([k, v]) => [k, JSON.parse(v.fields.data.stringValue)])));
  if (q.method === 'GET') { const d = db.get(code); return d ? send(r, 200, d) : send(r, 404, { error: { status: 'NOT_FOUND' } }); }
  let b = ''; q.on('data', c => b += c); q.on('end', () => {
    const cur = db.get(code), ex = u.searchParams.get('currentDocument.exists'), ut = u.searchParams.get('currentDocument.updateTime');
    if (ex === 'false' && cur) return send(r, 409, { error: { status: 'ALREADY_EXISTS' } });
    if (ut && (!cur || cur.updateTime !== ut)) return send(r, 400, { error: { status: 'FAILED_PRECONDITION' } });
    const d = { name: code, fields: JSON.parse(b).fields, updateTime: new Date(Date.UTC(2026, 0, 1) + (++t)).toISOString() };
    db.set(code, d); send(r, 200, d);
  });
}).listen(+process.argv[2] || 8124, () => console.log('mock firestore on', +process.argv[2] || 8124));
