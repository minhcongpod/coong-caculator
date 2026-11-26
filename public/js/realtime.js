/* ================= realtime =================
   Nghe thẳng Firestore (thư viện Firebase chính thức, tải sau khi app đã hiện): sổ của mình, hồ sơ @tên (lời mời vào nhóm)
   và từng nhóm chung. Máy khác / người khác sửa là màn hình cập nhật ngay. Ghi vẫn đi đường cũ (REST + gộp theo khoản).
   Đang gõ / đang mở bảng nhập thì xếp hàng, rảnh tay mới áp dụng để không mất chữ đang gõ. */
const FB_V = '10.12.2';
let RT = null; const rtSubs = new Map(), rtQ = new Map();
async function rtInit(){
  if (RT !== null) return RT; RT = false;
  try {
    const [{ initializeApp }, fs] = await Promise.all([import(`https://www.gstatic.com/firebasejs/${FB_V}/firebase-app.js`), import(`https://www.gstatic.com/firebasejs/${FB_V}/firebase-firestore.js`)]);
    RT = { db: fs.getFirestore(initializeApp({ apiKey: FS_KEY, projectId: 'quanlyquy-f5fce' })), doc: fs.doc, onSnapshot: fs.onSnapshot };
  } catch(e) { console.warn('realtime off', e); RT = false; }
  return RT;
}
function rtWatch(code, fn){
  if (!RT || !code || rtSubs.has(code)) return;
  rtSubs.set(code, RT.onSnapshot(RT.doc(RT.db, 'books', code), snap => {
    if (snap.metadata.hasPendingWrites || !snap.exists()) return;
    const d = snap.data(); let data = null; try { data = JSON.parse(d.data || 'null'); } catch(_) { return; }
    rtQ.set(code, () => fn({ at: Number(d.updatedAt || 0), data })); rtFlush();
  }, () => {}));
}
const rtBusy = () => view === 'form' || isAcct() || document.activeElement?.matches?.('input,textarea') || !$('#amp').hidden || !$('#cmp').hidden || !$('#sheet').hidden
  || !!document.querySelector('.lacts, .dlg') || document.body.classList.contains('drwon') || !!editing;
function rtFlush(){ if (!rtQ.size || rtBusy()) return; const fns = [...rtQ.values()]; rtQ.clear(); fns.forEach(f => { try { f(); } catch(e) { console.warn(e); } }); }
setInterval(rtFlush, 1000);
async function rtStart(){
  if (!onWeb || BILL || !await rtInit()) return;
  rtWatch(book, remote => {   // sổ của mình sửa ở máy khác: tải bản đầy đủ (có updateTime) rồi gộp như lúc mở app
    if (pushT || !(remote.at > sy.at) || remote.at === root.updatedAt) return;
    syncNow().then(rtGroups);
  });
  if (root.acct?.handle) rtWatch(usrCode(root.acct.handle), () => syncShared().then(rtGroups));   // được mời vào nhóm mới
  rtGroups();
}
function rtGroups(){
  root.groups.forEach(g => g.members.forEach(m => { if (m.uid && m.handle && m.uid !== myUid()) rtWatch(usrCode(m.handle), () => refreshLinked()); }));   // thành viên đổi tên / avatar
  root.groups.filter(g => g.sid).forEach(g => rtWatch(g.sid, remote => {
    const rg = remote.data?.g; if (!rg) return;
    const i = root.groups.findIndex(x => x.sid === g.sid); if (i < 0) return;
    const cur = root.groups[i]; if (dirtyG.has(cur)) return;   // mình đang có thay đổi chưa đẩy: lúc đẩy sẽ gộp
    if (!(rg.uids || []).includes(myUid())) return;
    if ((rg.uat || 0) <= (cur.uat || 0)) { setBase(rg); return; }
    setBase(rg); if (G === cur) G = rg; root.groups[i] = rg; fixUid(); store.set(KEY, root); rerender();
  }));
}
/* thành viên có @tên: lấy tên + avatar mới nhất từ hồ sơ của họ (họ đổi là các nhóm đổi theo, không phải thêm lại) */
let rlT = null;
function refreshLinked(){ clearTimeout(rlT); rlT = setTimeout(doRefreshLinked, 300); }
async function doRefreshLinked(){
  if (!onWeb) return; const me = root.acct;
  const hs = new Map(); root.groups.forEach(g => g.members.forEach(m => { if (m.uid && m.handle && m.uid !== me?.uid) hs.set(m.uid, m.handle); }));
  const got = await Promise.all([...hs].map(([u, h]) => getUser(h).then(x => x && x.data.uid === u ? x.data : null).catch(() => null)));
  const P = new Map(got.filter(Boolean).map(d => [d.uid, d]));
  if (me?.uid) P.set(me.uid, { name: me.name, avatar: me.avatar || '', handle: me.handle });
  let ch = false;
  root.groups.forEach(g => {
    let gch = false;
    g.members.forEach(m => { const d = m.uid && P.get(m.uid); if (d && (m.name !== d.name || (m.avatar || '') !== (d.avatar || '') || m.handle !== d.handle)) { m.name = d.name; m.avatar = d.avatar || ''; m.handle = d.handle; gch = true; } });
    if (g.by && P.has(g.by) && g.byName !== P.get(g.by).name) { g.byName = P.get(g.by).name; gch = true; }
    if (gch) { ch = true; g.uat = Date.now(); if (g.sid) markShared(g); }
  });
  if (!ch) return;
  root.updatedAt = Date.now(); store.set(KEY, root); schedulePush();
  rtQ.set('linked', () => rerender()); rtFlush();
}
async function editInbox(h, uidWant, fn){   // thêm/bớt mã nhóm trong hồ sơ của một người (đọc rồi ghi có điều kiện, thử lại khi đụng nhau)
  for (let k = 0; k < 3; k++) {
    const u = await getUser(h); if (!u || u.data.uid !== uidWant) return;
    const gs = fn(u.data.groups || []); if (gs === null) return;
    if (await fsPut(usrCode(u.data.handle), { ...prof(u.data, u.data.handle), groups: gs }, Date.now(), u.ut) === 'ok') return;
  }
}
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
const appSrc = document.currentScript?.textContent || '';
async function checkUpdate(){
  if (!onWeb || !appSrc) return;
  try {
    const html = await (await fetch(location.origin + '/index.html?v=' + Date.now(), { cache: 'no-store' })).text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const src = [...doc.scripts].find(x => !x.src && x.textContent.includes('coong_calc_v4'))?.textContent;
    if (src && src !== appSrc) { if (pushT) { clearTimeout(pushT); await push(); } location.reload(); }
  } catch(_) {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { checkUpdate(); syncNow().then(syncShared).then(refreshLinked); } else if (pushT) { clearTimeout(pushT); pushT = null; push(); } });
try { navigator.storage?.persist?.(); } catch(_) {}

/* ui state */
let view = 'home', G = null, draft = null, editing = null, R = null;
const isAcct = () => view === 'acct' || view === 'onb';   // 2 trang dùng chung ô tên + ảnh đại diện: Tài khoản và Đặt tên lần đầu
