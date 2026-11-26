/* ================= realtime: nghe thay đổi của nhóm chung / hồ sơ (Firebase SDK), có bản app mới thì tải lại =================
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
const rtBusy = () => view === 'form' || isAcct() || document.activeElement?.matches?.('input,textarea') || !$('#sheet').hidden
  || !!document.querySelector('.lacts, .dlg');
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
/* Có bản mới thì tải lại: so nội dung index.html + các file /js, /css mà nó nạp với lúc mở app.
   (Trước khi tách file, app so đoạn script nằm trong index.html; giờ code ở file riêng nên phải so cả các file đó.) */
const appFiles = doc => [...doc.querySelectorAll('script[src^="/js/"], link[rel="stylesheet"][href^="/css/"]')].map(e => e.getAttribute('src') || e.getAttribute('href'));
const appSig = async (html, files) => html + (await Promise.all(files.map(async f => { const r = await fetch(location.origin + f, { cache: 'no-cache' }); if (!r.ok) throw new Error(f); return r.text(); }))).join('\n');
let appSrc = '';
if (onWeb) fetch(location.origin + '/index.html', { cache: 'no-cache' }).then(r => r.ok ? r.text() : Promise.reject()).then(html => appSig(html, appFiles(document))).then(s => { appSrc = s; }, () => {});
async function checkUpdate(){
  if (!onWeb || !appSrc) return;
  try {
    const html = await (await fetch(location.origin + '/index.html?v=' + Date.now(), { cache: 'no-store' })).text();
    const files = appFiles(new DOMParser().parseFromString(html, 'text/html'));
    if (!files.length) return;
    const src = await appSig(html, files);
    if (src !== appSrc) { if (pushT) { clearTimeout(pushT); await push(); } location.reload(); }
  } catch(_) {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { checkUpdate(); syncNow().then(syncShared).then(refreshLinked); } else if (pushT) { clearTimeout(pushT); pushT = null; push(); } });
try { navigator.storage?.persist?.(); } catch(_) {}
