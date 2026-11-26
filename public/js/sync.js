/* ================= cloud sync =================
   iPhone keeps a home-screen app's storage separate from Safari's, so localStorage alone looks like a "reset".
   Each person gets a private sổ (book) code in the URL (/s/CODE); data lives in Firestore under that code
   (REST, no SDK) plus a local copy for offline use. Newest change (updatedAt) wins. */
const FS_URL = 'https://firestore.googleapis.com/v1/projects/quanlyquy-f5fce/databases/(default)/documents/books/';
const FS_KEY = 'AIzaSyCyQv6aBKLrzUyzBw5hc36fe9kbifKiPrI';
const BOOK = 'coong_book';
const onWeb = /^https?:$/.test(location.protocol) && !/claude|anthropic|usercontent/.test(location.hostname) && !BILL;   // trang bill không đồng bộ/ghi gì

const hadLocal = !!store.get(KEY) || (!SLUG && !!store.get('coong_calc_v3'));
/* nhóm mở gần nhất trên máy này */
const LAST = 'coong_last';
let adraft = null;
const DEMOQ = new URLSearchParams(location.search).get('demo');   // /?demo → nhóm ví dụ (seedDemo)
let root = store.get(KEY);
if ((SLUG || BILL) && (!root || !Array.isArray(root.groups))) root = { groups: [], me: '', updatedAt: 0 };
if (!root || !Array.isArray(root.groups)) {
  const prev = fromV3(), v3 = store.get('coong_calc_v3') || {};
  root = { groups: prev || [], me: v3.me || '', updatedAt: v3.updatedAt || 0 };   // người mới: bắt đầu từ trang Xin chào
}
root.updatedAt = root.updatedAt || (hadLocal ? 1 : 0);   // 0 = máy này chưa có gì; dữ liệu trên máy chủ luôn thắng
/* ảnh đại diện tải lên (bản cũ, dạng data:) không dùng nữa: xoá khỏi dữ liệu để sổ trên máy chủ nhẹ, không chạm giới hạn 1MB */
const dropUploads = r => { let n = 0; const z = o => { if (o && String(o.avatar || '').startsWith('data:')) { o.avatar = ''; n++; } };
  z(r.acct); (r.groups || []).forEach(g => { z(g); (g.members || []).forEach(z); }); return n; };
const hadUpload = String(root.acct?.avatar || '').startsWith('data:');
dropUploads(root);   // không đổi updatedAt: máy cũ không được vì thế mà ghi đè bản mới hơn trên máy chủ
const fixUid = () => { uid = Math.max(uid, ...root.groups.flatMap(g => [g.id, ...g.members.map(m => m.id), ...g.exps.map(e => e.id)])) + 1; };
fixUid();
if (!BILL) store.set(KEY, root);

const newCode = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; return [...crypto.getRandomValues(new Uint8Array(22))].map(x => a[x % a.length]).join(''); };
const urlCode = (location.pathname.match(/^\/s\/([A-Za-z0-9]{20,40})\/?$/) || [])[1];
const slugHash = sl => [1, 2, 3, 4].map(k => { let h = 0x811c9dc5 ^ k; for (const ch of sl) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, '0'); }).join('');
const slugCode = sl => /^[a-z0-9]{1,20}$/.test(sl) ? ('quy' + String(sl.length).padStart(2, '0') + sl).padEnd(20, '0') : 'quh' + slugHash(sl);   // mã sổ cố định cho từng link ngắn
let book = BILL ? (BILL.bid ? '' : BILL.code || slugCode(BILL.owner)) : SLUG ? slugCode(SLUG) : urlCode || store.get(BOOK) || newCode();
let syncState = onWeb ? 'saving' : 'off', pushT = null;
function setBook(code){ book = code; store.set(BOOK, code); const pth = root.acct?.handle ? '/' + root.acct.handle : urlCode ? '/s/' + code : ''; if (onWeb && pth && location.pathname !== pth) window.history.replaceState(null, '', pth); }   // chưa có tài khoản thì giữ nguyên địa chỉ "/" cho tới khi người dùng đặt tên
/* máy chưa có tài khoản, chưa có nhóm, đang ở trang gốc "/": chưa có gì để lưu, không tạo bản ghi rỗng trên máy chủ cho người chỉ ghé qua */
const anon = () => !SLUG && !urlCode && !root.acct?.uid && !root.groups.length;
if (onWeb && !SLUG) setBook(book);
const bookLink = () => root.acct?.handle ? `${location.origin}/${root.acct.handle}` : SLUG ? `${location.origin}/${SLUG.split('/').map(encodeURIComponent).join('/')}` : `${location.origin}/s/${book}`;
/* tên nhóm → đuôi link bill: "Cầu Lông Tháng 9" → caulongthang9 (trùng tên thì thêm -2, -3…) */
const gSlugs = gs => { const seen = {}; return gs.map(g => { const s = String(g.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40) || 'nhom'; seen[s] = (seen[s] || 0) + 1; return seen[s] > 1 ? s + '-' + seen[s] : s; }); };
const billLink = g => g.bill ? `${location.origin}/bills/${g.bill}` : `${bookLink()}/bill/${gSlugs(root.groups)[root.groups.indexOf(g)]}`;
/* ================= tài khoản @tên, nhóm chung, link bill =================
   Vẫn chỉ dùng collection books/{mã}. Ngoài sổ của từng người còn 3 loại bản ghi:
   - usr<băm @tên>: hồ sơ { uid, handle, name, avatar, book, groups: [mã nhóm chung được mời vào] }. Link /<tên> mở sổ `book`.
   - grp…: nhóm chung { g }. Nhóm có thành viên @ (người dùng khác) nằm ở đây để cả hai app cùng xem/sửa; bản sửa sau cùng thắng (g.uat).
   - bil<số>: link bill /bills/<số> → { book, gid, sid }.
   Chặn trùng tên: tạo hồ sơ với điều kiện "chưa có" (currentDocument.exists=false); firestore.rules chặn ghi đè hồ sơ của uid khác. */
const usrCode = h => 'usr' + slugHash(h);
const bilCode = n => 'bil' + String(n).padStart(17, '0');
const NAME_MAX = 18;   // @tên tối đa 18 ký tự
const capName = v => { while (v && toHandle(v).length > NAME_MAX) v = v.slice(0, -1); return v; };
const toHandle = n => String(n || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
const HANDLE_BAD = new Set(['s', 'bill', 'bills', 'newuser', 'index']);
const okHandle = h => h.length >= 2 && /[a-z]/.test(h) && !HANDLE_BAD.has(h);
const rnd = n => crypto.getRandomValues(new Uint32Array(1))[0] % n;
const fsFetch = async (url, opt) => { try { return await fetch(url, opt); } catch(e) { await new Promise(r => setTimeout(r, 600)); return fetch(url, opt); } };   // mạng chập chờn: thử lại một lần
async function fsGet(code){
  const r = await fsFetch(`${FS_URL}${code}?key=${FS_KEY}`, { cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(r.status);
  const j = await r.json();
  return { at: Number(j.fields?.updatedAt?.integerValue || 0), data: JSON.parse(j.fields?.data?.stringValue || 'null'), ut: j.updateTime };
}
const fsBody = (data, at) => JSON.stringify({ fields: { data: { stringValue: JSON.stringify(data) }, updatedAt: { integerValue: String(at || Date.now()) } } });
/* pre: 'new' = chỉ ghi khi chưa có; chuỗi thời gian = chỉ ghi khi bản trên máy chủ chưa đổi. Trả 'ok' hoặc 'taken' (điều kiện không đạt / luật chặn). */
async function fsPut(code, data, at, pre){
  const q = pre === 'new' ? '&currentDocument.exists=false' : pre ? '&currentDocument.updateTime=' + encodeURIComponent(pre) : '';
  const r = await fsFetch(`${FS_URL}${code}?key=${FS_KEY}${q}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: fsBody(data, at) });
  if (r.ok) return 'ok';
  if ([400, 403, 409, 412].includes(r.status)) return 'taken';
  throw new Error(r.status);
}
async function getUser(h, hops = 3){   // tên đã đổi thì hồ sơ cũ trỏ sang tên mới (movedTo)
  const u = h && await fsGet(usrCode(h)); if (!u?.data) return null;
  if (u.data.movedTo) return hops ? getUser(u.data.movedTo, hops - 1) : null;
  return u.data.released ? null : u;
}
const MSG_BADNAME = 'Tên cần ít nhất 2 chữ hoặc số, và có chữ cái';
async function handleFree(h){   // @tên còn trống? (cùng điều kiện với claimHandle)
  const cur = await fsGet(usrCode(h));
  if (cur?.data && !cur.data.released) return false;
  return !(!cur && await fsGet(slugCode(h)));   // trùng link quỹ ngắn của người khác (/abc) cũng là đã có người dùng
}
const prof = (o, h) => ({ uid: o.uid, handle: h, name: o.name, avatar: o.avatar || '', book: o.book, groups: o.groups || [], ...(o.pin ? { pin: o.pin } : {}) });   // pin: { s: muối, h: băm PBKDF2 } của mã PIN 4 số   // uid luôn đứng đầu (firestore.rules đọc nó)
async function claimHandle(h, o){
  if (!okHandle(h)) return 'bad';
  const cur = await fsGet(usrCode(h));
  if (cur?.data && cur.data.uid !== o.uid && !cur.data.released) return 'taken';
  if (!cur && slugCode(h) !== o.book && await fsGet(slugCode(h))) return 'taken';   // trùng link quỹ ngắn của người khác (/abc); quỹ ngắn của chính mình thì được lấy tên đó
  return fsPut(usrCode(h), prof(o, h), Date.now(), cur ? cur.ut : 'new');
}
/* quyền: chỉ người tạo nhóm mới xoá được nhóm; chỉ người tạo khoản chi mới sửa/xoá được khoản đó (dữ liệu cũ chưa ghi người tạo thì ai cũng sửa được) */
const myUid = () => root.acct?.uid || '';
/* Người tạo nhóm luôn là thành viên đầu tiên (gắn với tài khoản của họ), có sẵn khi tạo nhóm và không bỏ ra được */
const selfMember = () => ({ id: uid++, name: root.acct.name, uid: root.acct.uid, handle: root.acct.handle, avatar: root.acct.avatar || '' });
const newDraft = from => ({ id: null, from, name: '', members: root.acct?.uid ? [selfMember()] : [], fund: { sponsors: [], contrib: {} } });
const creatorOf = () => (draft?.id && root.groups.find(g => g.id === draft.id)?.by) || myUid();
const isCreatorM = m => !!m.uid && m.uid === creatorOf();
/* Lịch sử hoạt động của nhóm (g.log): chỉ thêm vào, không sửa, không xoá (không có nút nào để xoá; chỉ khi nhóm bị xoá thì mất theo). Mỗi dòng giữ sẵn tên người làm và câu mô tả lúc đó. */
const LOGMAX = 2000;   // giữ dưới giới hạn 1MB của một tài liệu Firestore
const unionLog = (a, b) => { const m = new Map(); [...(a || []), ...(b || [])].forEach(x => m.set(x.id, x)); const l = [...m.values()].sort((x, y) => x.at - y.at || x.id - y.id); return l.length > LOGMAX ? l.slice(-LOGMAX) : l; };
let lastLid = 0;   // id tăng dần trong một máy: hai dòng ghi cùng một mili-giây vẫn đúng thứ tự thao tác
const logAct = (g, k, msg, x) => { if (g && msg) g.log = unionLog(g.log, [{ id: lastLid = Math.max(newId(), lastLid + 1), at: Date.now(), by: myUid(), who: root.acct?.name || 'Ai đó', k, msg, ...(x || {}) }]); };   // x: dữ liệu cho trang Thông báo (n = loại, số tiền từng người…)   // k: loại việc (quyết định icon + màu ở trang lịch sử)
/* POD 25/11 (1B): khoản chi / lần góp quỹ thuộc đợt tổng kết đã đóng (g.cuts) thì khóa, không ai sửa hay xóa được */
const inCut = (ids, id) => (G?.cuts || []).some(c => (c[ids] || []).map(String).includes(String(id)));
const closedExp = e => !!e && inCut('ex', e.id), closedTop = a => !!a && inCut('ad', a.id);   // POD 26/11: đợt đã chốt sổ bị khoá
const canTop = a => !BILL && !closedTop(a) && (!myUid() || (!!a?.by && a.by === myUid()) || canDelG(G));   // POD 25/11 (6B): lần góp quỹ chỉ người tạo nó hoặc người tạo nhóm sửa / xoá
const topNote = a => BILL ? '' : closedTop(a) ? 'Đã chốt sổ nên không thể chỉnh sửa' : 'Chỉ người tạo lần góp hoặc người tạo nhóm mới sửa được';
const roNote = e => BILL ? '' : closedExp(e) ? 'Đã chốt sổ nên không thể chỉnh sửa' : 'Chỉ người tạo khoản chi mới sửa được';
const canExp = e => !BILL && !closedExp(e) && (!e?.by || !myUid() || e.by === myUid());
const canDelG = g => !g?.by || !myUid() || g.by === myUid();
const closedItem = it => !!it && (G?.cuts || []).some(c => (it.at || 0) <= c.at);   // POD 25/11: đồ mua trước khi đóng một đợt tổng kết thì khóa
const canItem = it => !BILL && !closedItem(it) && (it?.by ? !myUid() || it.by === myUid() : canDelG(G));   // xóa đồ kho: ai tạo đồ thì người đó xóa (POD 20/11); đồ cũ chưa có người tạo thì người tạo nhóm. Thêm/sửa: ai trong nhóm cũng được
const newId = () => Date.now() * 1000 + rnd(1000);   // id khoản chi không trùng giữa các máy (nhóm chung)
const byName = (by, fb, g = G) => !by ? '' : by === myUid() ? 'tôi' :   // của chính mình: "Tạo bởi tôi"
  (g?.members.find(m => m.uid === by)?.name || fb || 'Người khác');
const formRO = () => { const g = draft?.id && root.groups.find(x => x.id === draft.id); return !!g && !canDelG(g); };   // thành viên không phải người tạo: chỉ được thêm thành viên
const pickAcct = o => ({ uid: o.uid, handle: o.handle, name: o.name, avatar: o.avatar || '' });
let HDOC = null, ready = !SLUG;
async function boot(){
  if (!ready) {   // /<tên>: tìm hồ sơ để biết sổ của người đó. Link chưa ai dùng (không có hồ sơ, không có quỹ cũ, máy này cũng chưa có gì) thì về trang chào "/": không tự tạo tài khoản hay bản ghi nào cho link gõ tay
    let none = false;
    try {
      const u = /^[a-z0-9]{2,30}$/.test(SLUG) ? await getUser(SLUG) : null;
      if (u) { HDOC = u.data; book = u.data.book; if (!store.get(BOOK)) store.set(BOOK, book); if (u.data.handle !== SLUG) history.replaceState(null, '', '/' + u.data.handle); }
      else none = !root.acct?.uid && !root.groups.length && !await fsGet(book);   // book = mã quỹ ngắn kiểu cũ của link này
    } catch(_) {}   // lỗi mạng: không kết luận là "chưa ai dùng", để người đã có dữ liệu vẫn mở được
    if (none) { try { localStorage.removeItem(KEY); } catch(_) {} location.replace('/'); return; }
    if (HDOC?.pin && root.acct?.uid !== HDOC.uid && !authed(HDOC.uid)) { auth = { mode: 'login', step: 'login', u: { data: HDOC }, err: '' }; HDOC = null; go('pin'); return; }   // link /tên của tài khoản có PIN, máy này chưa đăng nhập: hỏi PIN trước, chưa tải dữ liệu
    ready = true;
  }
  await syncNow(); await ensureAcct(); await syncShared(); refreshLinked(); seedDemo();
  rtStart();
}
async function ensureAcct(){
  if (!onWeb) return;
  try {
    if (HDOC && root.acct?.handle !== HDOC.handle) { root.acct = pickAcct(HDOC); save(); }
    if (hadUpload && root.acct?.handle) { const u = await getUser(root.acct.handle); if (u && u.data.uid === root.acct.uid && String(u.data.avatar || '').startsWith('data:')) await fsPut(usrCode(u.data.handle), { ...prof(u.data, u.data.handle), avatar: '' }, Date.now(), u.ut); }   // hồ sơ cũ còn ảnh tải lên
  } catch(_) {}
  if (root.acct?.handle && (!SLUG || HDOC) && location.pathname !== '/' + root.acct.handle) history.replaceState(null, '', '/' + root.acct.handle);
  try { const me = root.acct; if (me?.uid && me.handle && !auth) { const u = await getUser(me.handle); if (u?.data && u.data.uid === me.uid) { if (u.data.pin) authMark(me.uid); else if (!['form', 'pin'].includes(view) && $('#sheet').hidden) { auth = { mode: 'upgrade', step: 'set', err: '' }; go('pin'); return; } } } } catch(_) {}   // tài khoản tạo trước khi có PIN: đặt PIN một lần
  if (isAcct()) return; renderBar();
}
/* nhóm chung */
const dirtyG = new Set();
function markShared(g){ if (g?.sid) { g.uat = Date.now(); dirtyG.add(g); } }
/* Gộp nhóm chung theo từng khoản thay vì ghi đè cả nhóm, để hai người sửa cùng lúc không mất của nhau:
   - mỗi khoản chi / lần góp thêm có uat riêng; khoản của người khác luôn lấy bản trên máy chủ (mình không được sửa)
   - phần chung (tên, thành viên, quỹ, đánh dấu đã chuyển) có mat; bản đổi sau cùng thắng
   - khoản bị xoá ghi vào del để máy khác không đưa lại
   - ghi kèm điều kiện "bản trên máy chủ chưa đổi"; đụng nhau thì tải lại, gộp lại, ghi lại */
const BASE = new Map();   // sid → bản đã đồng bộ gần nhất { e: Map(id → json), m: json }
const ej = x => JSON.stringify({ ...x, uat: 0 });
const metaOf = g => JSON.stringify([g.name, g.avatar, g.members, { ...(g.fund || {}), adds: 0 }, g.items, g.done, g.pays, g.cuts, g.round, g.bill, g.uids, g.own]);
function setBase(g){ BASE.set(g.sid, { e: new Map([...(g.exps || []), ...(g.fund?.adds || [])].map(x => [x.id, ej(x)])), m: metaOf(g) }); }
function stamp(g){
  const b = BASE.get(g.sid); if (!b) return; const now = Date.now(), items = [...g.exps, ...(g.fund?.adds || [])], ids = new Set(items.map(x => x.id));
  items.forEach(x => { if (b.e.get(x.id) !== ej(x)) x.uat = now; });
  b.e.forEach((_, id) => { if (!ids.has(id) && !(g.del ||= []).includes(id)) g.del.push(id); });
  if (metaOf(g) !== b.m) g.mat = now;
}
function mergeG(a, r){
  const del = [...new Set([...(a.del || []), ...(r.del || [])])], gone = new Set(del), me = myUid();
  const pick = (la, ra) => { const m = new Map(ra.map(x => [x.id, x])); la.forEach(x => { const o = m.get(x.id); if (o && x.by && x.by !== me) return; if (!o || (x.uat || 0) > (o.uat || 0)) m.set(x.id, x); }); return [...m.values()].filter(x => !gone.has(x.id)); };
  const meta = (a.mat || 0) > (r.mat || 0) ? a : r;
  return { ...meta, log: unionLog(a.log, r.log), exps: pick(a.exps || [], r.exps || []), fund: { ...(meta.fund || {}), adds: pick(a.fund?.adds || [], r.fund?.adds || []) }, del, uat: Date.now(), mat: Math.max(a.mat || 0, r.mat || 0) };
}
async function pushShared(){
  for (const g of [...dirtyG]) {
    dirtyG.delete(g);
    try {
      stamp(g); let ok = false;
      for (let k = 0; k < 4 && !ok; k++) {
        const r = await fsGet(g.sid), s0 = JSON.stringify(g), m = r?.data?.g ? mergeG(g, r.data.g) : { ...g, uat: Date.now() };
        if (await fsPut(g.sid, { g: m }, m.uat, r ? r.ut : 'new') === 'ok') {
          ok = true; if (JSON.stringify(g) !== s0) { setBase(m); dirtyG.add(g); schedulePush(); continue; }   // POD 25/11: máy vừa sửa trong lúc đang ghi (vd bấm Hoàn tác chốt sổ) → không đè bằng bản cũ, ghi lại bản mới
          const before = JSON.stringify(g); Object.keys(g).forEach(k2 => delete g[k2]); Object.assign(g, m); setBase(g); store.set(KEY, root);
          const busy = document.activeElement?.matches?.('input,textarea') || !$('#sheet').hidden;
          if (G === g && ['group', 'cal', 'kho', 'sum'].includes(view) && !busy && JSON.stringify(g) !== before) rerender();   // có thay đổi của người khác gộp vào
        }
      }
      if (!ok) dirtyG.add(g);
    } catch(_) { dirtyG.add(g); }
  }
}
async function syncShared(){
  const me = root.acct; if (!onWeb || !me?.handle) return;
  try {
    const u = await fsGet(usrCode(me.handle));
    const sids = [...new Set([...(u?.data?.groups || []), ...root.groups.filter(g => g.sid).map(g => g.sid)])];
    const got = await Promise.all(sids.map(sid => fsGet(sid).catch(() => undefined)));
    let changed = false;
    sids.forEach((sid, k) => {
      const rg = got[k]?.data?.g; if (!rg) return;
      const i = root.groups.findIndex(g => g.sid === sid), inIt = (rg.uids || []).includes(me.uid);
      if (!inIt) { if (i >= 0 && !dirtyG.has(root.groups[i])) { if (G === root.groups[i]) G = null; root.groups.splice(i, 1); changed = true; } return; }
      if (i >= 0 && dirtyG.has(root.groups[i])) return;   // mình đang có thay đổi chưa đẩy: lúc đẩy sẽ gộp
      setBase(rg);
      if (i < 0) { root.groups.unshift(rg); changed = true; }
      else if ((rg.uat || 0) > (root.groups[i].uat || 0)) { if (G === root.groups[i]) G = rg; root.groups[i] = rg; changed = true; }
    });
    if (!changed) return;
    fixUid(); root.updatedAt = Date.now(); store.set(KEY, root); schedulePush();
    const busy = document.activeElement?.matches?.('input,textarea') || !$('#sheet').hidden || view === 'form' || isAcct();
    if (!busy) rerender();
  } catch(_) {}
}
/* ================= lưu sổ + đồng bộ sổ với máy chủ, nhóm chung, link bill ================= */
async function shareGroup(g){   // nhóm có thành viên @ người khác: đưa lên grp… và mời họ
  const me = root.acct; if (!onWeb || !me?.uid) return;
  const linked = g.members.filter(m => m.uid && m.uid !== me.uid);
  if (!g.sid && !linked.length) return;
  const before = new Set(g.uids || []);
  if (!g.sid) { g.sid = 'grp' + newCode(); g.own = g.members.some(m => m.uid === me.uid) ? [] : [me.uid]; g.by ||= me.uid; g.byName ||= me.name; g.exps.forEach(e => { if (!e.by) { e.by = me.uid; e.byName = me.name; } }); }
  g.uids = [...new Set([...(g.own || []), ...g.members.filter(m => m.uid && !m.left).map(m => m.uid)])];
  markShared(g); save();
  try { await pushShared(); } catch(_) {}
  rtGroups();
  for (const m of linked) if (!before.has(m.uid)) editInbox(m.handle, m.uid, gs => gs.includes(g.sid) ? null : [...gs, g.sid]).catch(() => {});
}
async function ensureBill(g){   // mỗi nhóm một số bill ngẫu nhiên, tạo một lần
  if (!onWeb || !g || g.bill || g._billing) return; g._billing = true;
  try {
    for (let k = 0; k < 6; k++) {
      const n = String(100000 + rnd(900000));
      if (await fsPut(bilCode(n), { book, gid: g.id, sid: g.sid || '' }, Date.now(), 'new') === 'ok') { g.bill = n; if (g.sid) markShared(g); save(); break; }
    }
  } catch(_) {} finally { delete g._billing; }
}
async function loadBill(){
  try {
    if (BILL.bid) {
      const m = await fsGet(bilCode(BILL.bid)); if (!m?.data) throw 'none';
      let g = null;
      if (m.data.sid) g = (await fsGet(m.data.sid))?.data?.g || null;
      if (!g) { const b = await fsGet(m.data.book); g = (b?.data?.root?.groups || []).find(x => x.id === m.data.gid) || null; }
      if (!g) throw 'none';
      g.members = g.members || []; g.exps = g.exps || []; g.done = g.done || {};
      root = { groups: [g], me: '', updatedAt: 0 }; fixUid(); G = g; BILL.st = 'ok'; view = 'sum'; render(); return;
    }
    const gs = (await fsGet(book))?.data?.root?.groups; if (!Array.isArray(gs)) throw 'none';
    const i = gSlugs(gs).indexOf(BILL.g); if (i < 0) throw 'none';
    gs.forEach(g => { g.members = g.members || []; g.exps = g.exps || []; g.done = g.done || {}; });
    root = { groups: gs, me: '', updatedAt: 0 }; fixUid(); G = gs[i]; BILL.st = 'ok'; view = 'sum';
  } catch(e) { BILL.st = e === 'none' ? 'none' : 'err'; }
  render();
}
const setSync = st => { syncState = st; };   // 'saving' | 'ok' | 'err': Chia sẻ bill dùng để báo link có thể chưa mở được
const save = () => { if (BILL) return; if (G && ['group', 'sum', 'cal', 'kho'].includes(view)) { G.uat = Date.now(); if (G.sid) markShared(G); } root.updatedAt = Date.now(); store.set(KEY, root); schedulePush(); };
/* Đồng bộ sổ giữa các máy: nhớ bản trên máy chủ lần gần nhất (ut = updateTime, at = updatedAt).
   - Ghi kèm điều kiện "bản trên máy chủ chưa đổi". Máy khác vừa ghi thì tải về, gộp, ghi lại.
   - Gộp theo từng nhóm: nhóm nào sửa sau (g.uat) thì lấy bản đó; nhóm đã xoá ghi vào root.delG để máy khác không đưa lại.
   - Máy này không có gì mới thì lấy nguyên bản trên máy chủ như trước. */
const SYNC = KEY + '_sync';
let sy = store.get(SYNC) || { ut: '', at: 0 };
const setSy = (ut, at) => { sy = { ut: ut || sy.ut, at }; store.set(SYNC, sy); };
const markDel = id => { (root.delG ||= []).push(id); root.delG = root.delG.slice(-200); };
function mergeRoot(L, Rm){
  const gone = new Set([...(L.delG || []), ...(Rm.delG || [])]), lNew = (L.updatedAt || 0) > (Rm.updatedAt || 0);
  const m = new Map(Rm.groups.map(g => [g.id, g]));
  L.groups.forEach(g => { const o = m.get(g.id), w = !o || (g.uat || 0) > (o.uat || 0) || ((g.uat || 0) === (o.uat || 0) && lNew) ? g : o; m.set(g.id, o ? { ...w, log: unionLog(g.log, o.log) } : g); });   // bản nào thắng thì lấy bản đó, riêng lịch sử luôn gộp cả hai
  const ids = [...Rm.groups.filter(g => !L.groups.some(x => x.id === g.id)), ...L.groups].map(g => g.id);   // nhóm mới tạo ở máy khác lên đầu
  return { ...(lNew ? L : Rm), groups: [...new Set(ids)].map(id => m.get(id)).filter(g => !gone.has(g.id)), delG: [...gone].slice(-200), updatedAt: Date.now() };
}
function schedulePush(){ if (!onWeb) return; clearTimeout(pushT); setSync('saving'); pushT = setTimeout(() => { pushT = null; push(); }, 700); }   // pushT chỉ còn khi đang chờ đẩy
async function push(k = 0){
  if (!onWeb || !ready || anon()) return;
  pushShared();
  try {
    if (!root.updatedAt) root.updatedAt = 1;
    const at = root.updatedAt, q = sy.ut ? '&currentDocument.updateTime=' + encodeURIComponent(sy.ut) : '';
    const r = await fetch(`${FS_URL}${book}?key=${FS_KEY}${q}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: fsBody({ v: 4, root }, at), keepalive: true });
    if (r.ok) { setSy((await r.json().catch(() => ({}))).updateTime, at); store.set(KEY, root); setSync('ok'); return; }
    if (sy.ut && [400, 409, 412].includes(r.status) && k < 3) { await syncNow(k + 1); return; }   // máy khác vừa ghi: tải về, gộp, ghi lại
    throw new Error(r.status);
  } catch(e) { setSync('err'); }
}
function takeRemote(remote){
  const d = remote.data; if (!d || !d.root) return false;
  let next = d.root;
  if (!Array.isArray(next.groups) && Array.isArray(next.events)) next = { groups: fromV3(next) || [], me: next.me || '' };   // book saved by the older app
  if (!Array.isArray(next.groups)) return false;
  if (hadLocal) store.set(KEY + '_backup', root);
  const merge = sy.at && root.updatedAt > sy.at;   // máy này có thay đổi chưa lên máy chủ: gộp, không ghi đè
  root = merge ? mergeRoot(root, { ...next, updatedAt: remote.at }) : { ...next, updatedAt: remote.at };
  root.me = root.me || ''; dropUploads(root);
  fixUid(); store.set(KEY, root); setSy(remote.ut, merge ? sy.at : remote.at);
  return true;
}
async function syncNow(k = 0){
  if (!onWeb || !ready || anon()) return;
  setSync('saving');
  const remote = await fsGet(book).catch(() => { setSync('err'); });
  if (remote === undefined) return;
  const newer = remote && (sy.at ? remote.at > sy.at : remote.at > root.updatedAt);   // máy chủ có bản mới từ máy khác (máy chưa từng đồng bộ kiểu mới: so như cũ)
  if (newer) {
    if (takeRemote(remote)) {
      $('#sheet').hidden = true;
      if (G) G = root.groups.find(g => g.id === G.id) || null;
      if (!G && view !== 'home') view = 'home';
      if (view !== 'form') rerender();
    }
  } else if (remote) sy.ut = remote.ut;
  if (!remote || root.updatedAt !== (remote && newer ? sy.at : remote.at)) push(k);
  else { setSy(remote.ut, remote.at); setSync('ok'); }
}
