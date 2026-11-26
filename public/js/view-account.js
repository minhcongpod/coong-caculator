/* ================= tài khoản: đặt tên lần đầu, đăng nhập, mã PIN, trang Tài khoản ================= */
/* lưu tài khoản: đổi tên thì @tên đổi theo, không trùng người khác; tên cũ trỏ sang tên mới */
async function saveAcct(btn){
  const n = $('#aName').value.trim().replace(/\s+/g, ' '), h = toHandle(n), me = root.acct || {};
  if (!n) { $('#aName').focus(); toast('Nhập tên của bạn'); return; }
  if (!okHandle(h)) { $('#aName').focus(); toast(MSG_BADNAME); return; }
  const done = o => { root.acct = pickAcct(o); save(); rtWatch(usrCode(o.handle), () => syncShared().then(rtGroups)); if (onWeb && location.pathname !== '/' + o.handle) history.replaceState(null, '', '/' + o.handle); toast('Đã lưu tài khoản'); go(adraft.from || 'home'); };
  if (!onWeb) { done({ ...me, uid: me.uid || newCode(), handle: h, name: n, avatar: adraft.avatar }); return; }
  btn.disabled = true; let saved = null;
  try {
    const old = me.handle ? await fsGet(usrCode(me.handle)) : null, groups = old?.data && me.uid && old.data.uid === me.uid ? old.data.groups || [] : [];   // sổ chưa có tài khoản (link quỹ ngắn cũ): không có hồ sơ cũ
    const o = { uid: me.uid || newCode(), name: n, avatar: adraft.avatar || '', book, groups, pin: old?.data && me.uid && old.data.uid === me.uid ? old.data.pin : undefined };
    const res = h === me.handle && old ? await fsPut(usrCode(h), prof(o, h), Date.now(), old.ut) : await claimHandle(h, o);
    if (res !== 'ok') { toast(res === 'bad' ? 'Tên này không dùng được' : `@${h} đã có người dùng, chọn tên khác`); $('#aName').focus(); return; }
    if (me.handle && me.handle !== h && me.uid && old?.data?.uid === me.uid) await fsPut(usrCode(me.handle), { uid: me.uid, handle: me.handle, movedTo: h }, Date.now(), old.ut).catch(() => {});   // tên cũ không nhả ra: link cũ tự chuyển sang tên mới, người khác không chiếm được
    saved = { ...o, handle: h };
  } catch(e) { console.error('saveAcct', e); toast(navigator.onLine === false ? 'Chưa lưu được: máy đang mất mạng' : `Chưa lưu được (lỗi ${String(e?.message || e).slice(0, 40)}), thử lại nhé`); }
  finally { btn.disabled = false; }
  if (saved) { done(saved); refreshLinked(); }   // vẽ lại trang nằm ngoài try: lỗi vẽ không bị báo nhầm thành lỗi mạng
}
/* Trang Tài khoản (POD 22/11): sửa được tên, @tên đổi theo, không trùng người khác; tên cũ của chính mình thì lấy lại được */
let acSt = { h: '', st: 'ok' }, acT = null;
async function acctFree(h){ const me = root.acct || {}, cur = await fsGet(usrCode(h));
  if (cur?.data) return cur.data.uid === me.uid || !!cur.data.released;
  return !(slugCode(h) !== book && await fsGet(slugCode(h))); }
function acctCheck(v){
  adraft.name = v; clearTimeout(acT); setLink(v); fitOname();
  const n = v.trim().replace(/\s+/g, ' '), h = toHandle(n);
  const set = st => { acSt = { h, st }; const el = $('#aHandle'); if (el) { el.className = 'ohandle ' + st; el.textContent = st === 'taken' ? `@${h} đã có người dùng` : st === 'bad' ? MSG_BADNAME : st === 'empty' ? 'Nhập tên của bạn' : ''; } const b = $('#saveAcct'); if (b) b.disabled = st !== 'ok'; };
  if (!n) return set('empty');
  if (!okHandle(h)) return set('bad');
  if (!onWeb || h === root.acct?.handle) return set('ok');
  set('checking'); acT = setTimeout(async () => { try { const free = await acctFree(h); if (acSt.h === h) set(free ? 'ok' : 'taken'); } catch(_) { if (acSt.h === h) set('ok'); } }, 300);   // lỗi mạng: để lúc lưu báo
}
/* Trang đặt tên lần đầu: ô tên bật sẵn, nút Tạo nhóm đầu tiên nổi trên bàn phím; @tên được kiểm tra trùng ngay khi gõ, trùng thì không cho đi tiếp */
let onbSt = { h: '', st: 'empty' }, onbT = null;   // st: empty | bad | checking | ok | taken
const onbMsg = () => onbSt.st === 'taken' ? `@${onbSt.h} đã có người dùng` : onbSt.st === 'bad' ? MSG_BADNAME : onbSt.st === 'err' ? onbSt.msg : '';   // Figma 518:8436: dòng link riêng (xám), dòng báo lỗi riêng (vàng) bên dưới
const hlink = n => { const h = toHandle(String(n || '').trim()); return h ? `${onWeb ? location.host : 'coongno.web.app'}/${h}` : ''; };
const setLink = n => { const l = $('#aLink'); if (l) l.textContent = hlink(n); };   // dưới tên: đường link của khách (Figma 410:508)
const onbOff = () => ['empty', 'bad', 'taken'].includes(onbSt.st);
function avInline(){   // v2 (Figma 398:2051): bảng chọn ảnh đại diện hiện sẵn dưới tên, không cần mở bảng
  const cur = adraft.avatar?.startsWith('ic:') ? icParse(adraft.avatar) : { k: 'user', c: 6 }, col = AV_COL[cur.c], fg = col === '#FFD60A' ? '#000' : '#fff';
  return `<div class="avinl" id="avInl"><div class="emogrid" style="--c:${col};--fg:${fg}">${AN_PICK.map(([k, n]) => `<button class="ico ${k === cur.k ? 'on' : ''}" data-avic="${k}" aria-label="${n}">${anSvg(k)}</button>`).join('')}</div>
    <div class="swrow">${AV_SHOW.map(i => `<button class="sw ${i === cur.c ? 'on' : ''} ${i === 6 ? 'def' : ''}" style="--c:${AV_COL[i]}" data-avcol="${i}" aria-label="Màu ${i + 1}"></button>`).join('')}</div></div>`;
}
function onbView(){   // Figma 410:508: thanh trên (logo, chuông, tài khoản) → avatar → @tên → link → nút Tạo tài khoản ngay dưới link
  return `<section class="view onb auth"><header class="lhead"><svg class="wm" viewBox="0 0 135 27" role="img" aria-label="Coong Nợ"><use href="#i-logo"/></svg></header>
    <button class="avpick" id="acAvBtn" aria-label="Chọn ảnh đại diện">${avHTML(adraft.avatar, 'big', 'i-user')}<span class="avpen">${svg('i-pen')}</span></button>
    <div class="aname2"><div class="onrow"><span class="at">@</span><input class="oname" id="aName" placeholder="Nhập tên của bạn" value="${esc(adraft.name)}" maxlength="40" autocomplete="off" autocapitalize="words" enterkeyhint="done" aria-label="Tên của bạn"></div>
    <p class="alnk" id="aLink">${esc(hlink(adraft?.name))}</p><p class="ohandle ${onbSt.st}" id="aHandle">${esc(onbMsg())}</p></div>
    <button class="btn onbbtn" id="onbGo">Tạo tài khoản</button>
    <p class="alink">Nhớ rồi! <button id="toLogin">Đăng nhập</button></p></section>`;   // Figma 510:6486: dòng thông báo luôn giữ chỗ nên nút không xê dịch
}
function fitOname(){ const i = $('#aName'); if (!i || !i.classList.contains('oname')) return; const cs = getComputedStyle(i); mctx.font = `700 24px ${cs.fontFamily}`;
  const W = Math.max(120, (i.closest('.aname2')?.clientWidth || 342) - 33), w = Math.ceil(mctx.measureText(i.value || i.placeholder).width) + 8;   // tên dài: thu chữ cho vừa một dòng (Figma 510:7228)
  i.style.fontSize = w > W ? Math.max(16, Math.floor(24 * W / w)) + 'px' : ''; i.style.width = Math.min(W, w) + 'px'; }
/* chữ Space Grotesk tải xong sau lần đo đầu (đo bằng font tạm hẹp hơn) → ô tên hẹp, chữ gợi ý bị cắt: đo lại khi font tải xong */
document.fonts?.ready.then(() => fitOname()); document.fonts?.addEventListener?.('loadingdone', () => fitOname());
function onbCheck(v){
  adraft.name = v; clearTimeout(onbT); setLink(v);
  const n = v.trim().replace(/\s+/g, ' '), h = toHandle(n);
  fitOname();
  const set = st => { onbSt = { h, st }; const el = $('#aHandle'); if (el) { el.className = 'ohandle ' + st; el.textContent = onbMsg(); } $('#onbGo')?.classList.toggle('off', onbOff()); };
  if (!n) return set('empty');
  if (!okHandle(h)) return set('bad');
  set(onWeb ? 'checking' : 'ok');
  if (onWeb) onbT = setTimeout(async () => { try { const free = await handleFree(h); if (onbSt.h === h) set(free ? 'ok' : 'taken'); } catch(_) {} }, 300);   // lỗi mạng: để bước tạo báo
}
async function onbCreate(btn){   // bước 1 tạo tài khoản: kiểm tra tên → sang đặt mã PIN (tài khoản chỉ được tạo sau khi nhập lại PIN khớp)
  const n = adraft.name.trim().replace(/\s+/g, ' '), h = toHandle(n), inp = $('#aName');
  const err = (st, msg) => { onbSt = { h, st, msg }; const el = $('#aHandle'); if (el) { el.className = 'ohandle ' + st; el.textContent = onbMsg(); } inp?.focus(); };
  if (!n) return err('err', 'Nhập tên của bạn');
  if (!okHandle(h)) return err('bad');
  if (onWeb) {
    btn.disabled = true;
    try { if (!await handleFree(h)) return err('taken'); }
    catch(e) { return err('err', navigator.onLine === false ? 'Máy đang mất mạng' : 'Chưa kiểm tra được tên, thử lại nhé'); }
    finally { btn.disabled = false; }
  }
  auth = { mode: 'create', step: 'set', h, n, pin1: '', err: '' }; go('pin');
}
async function createAcct(pin){   // bước cuối tạo tài khoản: nhập lại PIN khớp → giữ @tên (điều kiện "chưa có") kèm băm PIN
  const { h, n } = auth, o = { uid: newCode(), name: n, avatar: adraft.avatar || '', book, groups: [], pin: await pinMake(pin) };
  if (onWeb) {
    try {
      const res = await claimHandle(h, o);   // hai người cùng chọn một tên thì chỉ một người được
      if (res !== 'ok') { onbSt = { h, st: 'taken' }; auth = null; go('onb'); return; }
    } catch(e) { pinFail(navigator.onLine === false ? 'Máy đang mất mạng' : 'Chưa tạo được, thử lại nhé'); return; }
  }
  root.acct = pickAcct({ ...o, handle: h }); authMark(o.uid); save();
  if (onWeb) { history.replaceState(null, '', '/' + h); rtStart(); }   // link theo tên vừa đặt; bắt đầu nghe lời mời vào nhóm
  auth = null; go('home');   // tạo xong tài khoản thì về trang chủ trống (Tạo nhóm ngay)
}
/* --- Đăng nhập (Figma 510:6457 / 6615 / 6768): @tên → mã PIN 4 số. Mã PIN chỉ lưu dạng băm PBKDF2 có muối trong hồ sơ @tên.
   Máy đã đăng nhập / tạo tài khoản được ghi nhớ (coong_auth) nên mở lại link /tên không phải nhập lại. --- */
let auth = null, lgErr = '', pinTries = 0, pinLockUntil = 0;
const AUTHK = 'coong_auth';
const authed = id => (store.get(AUTHK) || []).includes(id);
const authMark = id => { const l = store.get(AUTHK) || []; if (id && !l.includes(id)) store.set(AUTHK, [...l, id]); };
const b64 = u8 => btoa(String.fromCharCode(...u8)), unb64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
async function pinHash(pin, salt){
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  return b64(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, k, 256)));
}
async function pinMake(pin){ const salt = crypto.getRandomValues(new Uint8Array(16)); return { s: b64(salt), h: await pinHash(pin, salt) }; }
async function pinOk(pin, rec){ try { return !!rec?.s && (await pinHash(pin, unb64(rec.s))) === rec.h; } catch(_) { return false; } }
function loginView(){
  return `<section class="view onb auth"><header class="lhead"><svg class="wm" viewBox="0 0 135 27" role="img" aria-label="Coong Nợ"><use href="#i-logo"/></svg></header>
    <div class="avpick">${avHTML('', 'big', 'i-user')}</div>
    <div class="aname2"><div class="onrow"><span class="at">@</span><input class="oname" id="aName" placeholder="Nhập tên của bạn" value="${esc(adraft?.name || '')}" maxlength="40" autocomplete="username" autocapitalize="off" enterkeyhint="go" aria-label="Tên tài khoản"></div>
    <p class="alnk" id="aLink">${esc(hlink(adraft?.name))}</p><p class="ohandle ${lgErr ? 'err' : ''}" id="aHandle">${esc(lgErr)}</p></div>
    <button class="btn onbbtn" id="lGo">Đăng nhập</button>
    <p class="alink"><button id="toCreate">Chưa có tài khoản?</button></p></section>`;
}
let lgT = null, lgH = '';
function lgLook(v){   // gõ đúng @tên đã có: hiện luôn ảnh đại diện của tài khoản đó
  clearTimeout(lgT); const h = toHandle(String(v || '').trim()), box = $('.view.auth .avpick'); if (!box) return;
  const show = av => { if (box.dataset.av === av) return; box.dataset.av = av; box.innerHTML = avHTML(av, 'big', 'i-user'); if (av && !RMO && box.animate) box.animate([{ scale: .85, opacity: .4 }, { scale: 1, opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.34,1.4,.64,1)' }); };
  lgH = h; if (!h || !onWeb) return show('');
  lgT = setTimeout(async () => { try { const u = await getUser(h); if (lgH === h) show(u?.data?.avatar || ''); } catch(_) {} }, 350);
}
async function loginGo(btn){
  const n = ($('#aName')?.value || '').trim(), h = toHandle(n);
  const err = m => { lgErr = m; const el = $('#aHandle'); if (el) { el.className = 'ohandle err'; el.textContent = m; } $('#aName')?.focus(); };
  if (!h) return err('Nhập tên tài khoản');
  if (!onWeb) return err('Chưa kết nối được máy chủ');
  btn.disabled = true;
  try {
    const u = await getUser(h);
    if (!u?.data) return err('Tài khoản chưa tồn tại');
    if (!u.data.pin) return err('Tài khoản chưa đặt mã PIN, mở app trên máy đang dùng để đặt');
    auth = { mode: 'login', step: 'login', u, err: '' }; go('pin');
  } catch(e) { err(navigator.onLine === false ? 'Máy đang mất mạng' : 'Chưa kiểm tra được, thử lại nhé'); }
  finally { btn.disabled = false; }
}
async function loginDone(u){   // đúng PIN: dùng tài khoản + sổ của @tên trên máy này, tải dữ liệu từ máy chủ (không ghi đè)
  const d = u.data; authMark(d.uid); pinTries = 0;
  root = { groups: [], me: '', updatedAt: 0, acct: pickAcct(d) }; G = null; store.set(KEY, root);
  sy = { ut: '', at: 0 }; store.set(SYNC, sy); setBook(d.book);
  if (location.pathname !== '/' + d.handle) history.replaceState(null, '', '/' + d.handle);
  auth = null; ready = true; go('home');
  await syncNow(); if (!root.acct?.uid) { root.acct = pickAcct(d); store.set(KEY, root); }
  await syncShared(); refreshLinked(); rtStart(); rerender();
}
function kbHold(){ let h = $('#kbHold'); if (!h) { h = document.createElement('input'); h.id = 'kbHold'; h.type = 'tel'; h.inputMode = 'numeric'; h.setAttribute('aria-hidden', 'true'); h.tabIndex = -1; h.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0'; document.body.appendChild(h); } h.focus({ preventScroll: true }); }   // focus tạm trong cú chạm để khi sang ô mã PIN bàn phím vẫn mở
function pinView(){
  const a = auth || {}, nw = a.mode === 'change' && a.had ? ' mới' : '', title = (a.step === 'confirm' ? 'Nhập lại mã PIN' : 'Nhập mã PIN') + nw;
  if (a.mode === 'login' || a.mode === 'create') {   // Figma 518:8436: cùng trang với tên, 4 ô mã PIN thay vào chỗ nút, dòng vàng dưới link báo "Nhập mã PIN" / lỗi
    const nm = a.mode === 'login' ? a.u.data.name || a.u.data.handle : a.n, av = a.mode === 'login' ? a.u.data.avatar || '' : adraft.avatar || '';
    return `<section class="view onb auth pinv2"><header class="lhead"><svg class="wm" viewBox="0 0 135 27" role="img" aria-label="Coong Nợ"><use href="#i-logo"/></svg></header>
    <div class="avpick">${avHTML(av, 'big', 'i-user')}</div>
    <div class="aname2"><button class="onrow" id="pinBack" aria-label="Đổi tên"><span class="at">@</span><span class="oname onm">${esc(nm)}</span></button><p class="alnk">${esc(hlink(a.mode === 'login' ? a.u.data.handle : a.h))}</p><p class="ohandle err" id="pinErr">${esc(a.err || title)}</p></div>
    <label class="pins" aria-label="${title}">${[0, 1, 2, 3].map(i => `<span class="pd ${i ? '' : 'on'}"></span>`).join('')}<input id="pinIn" type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="one-time-code" aria-label="${title}"></label>${a.mode === 'login' ? '<p class="alink pother"><button id="pinOther">Đăng nhập bằng tài khoản khác</button></p>' : ''}</section>`;
  }
  const sub = a.step === 'set' && !a.err ? (a.mode === 'upgrade' ? 'Đặt mã PIN để đăng nhập trên máy khác' : a.mode === 'change' ? (a.had ? '' : 'Đặt mã PIN trước khi đăng xuất') : '') : '';
  return `<section class="view onb auth pinv"><header class="phd">${a.mode === 'upgrade' ? '' : `<button class="circ back c44" id="pinBack" aria-label="Quay lại">${svg('i-back')}</button>`}</header>
    <div class="pinb"><h1>${title}</h1><label class="pins" aria-label="${title}">${[0, 1, 2, 3].map(i => `<span class="pd ${i ? '' : 'on'}"></span>`).join('')}<input id="pinIn" type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="one-time-code" aria-label="${title}"></label>
    <p class="perr ${a.err ? '' : 'sub'}" id="pinErr">${esc(a.err || sub)}</p></div></section>`;
}
function pinDraw(v){ document.querySelectorAll('.pins .pd').forEach((d, i) => { d.innerHTML = v[i] ? '<i class="pdot"></i>' : ''; d.classList.toggle('on', i === v.length); }); }   // che số: chỉ hiện chấm
function pinFail(m){ if (!auth) return; auth.err = m; const i = $('#pinIn'); if (i) i.value = ''; pinDraw(''); const e = $('#pinErr'); if (e) { e.textContent = m; e.className = e.closest('.pinv2') ? 'ohandle err' : 'perr'; } $('.pins')?.animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 240 }); }
async function pinSubmit(v){
  const a = auth; if (!a || v.length < 4 || a.busy) return;
  a.busy = true;
  try {
    if (a.step === 'set') { a.pin1 = v; a.step = 'confirm'; a.err = ''; const i = $('#pinIn'); if (i) i.value = ''; pinDraw(''); const e = $('#pinErr'), t = $('.pinb h1'); if (t) t.textContent = 'Nhập lại mã PIN' + (a.mode === 'change' && a.had ? ' mới' : ''); if (e) { e.textContent = t ? '' : 'Nhập lại mã PIN'; e.className = t ? 'perr sub' : 'ohandle err'; } return; }   // không vẽ lại trang để bàn phím không tắt
    if (a.step === 'confirm') {
      if (v !== a.pin1) { pinFail('Mã PIN không khớp'); return; }
      if (a.mode === 'create') { await createAcct(v); return; }
      if (a.mode === 'upgrade' || a.mode === 'change') {   // tài khoản cũ chưa có PIN / đổi PIN ở trang Tài khoản: lưu băm PIN vào hồ sơ @tên
        try { const u = await getUser(root.acct.handle); if (u && u.data.uid === root.acct.uid && await fsPut(usrCode(u.data.handle), { ...prof(u.data, u.data.handle), pin: await pinMake(v) }, Date.now(), u.ut) === 'ok') { authMark(root.acct.uid); auth = null; if (a.mode === 'change') { toast(a.had ? 'Đã đổi mã PIN' : 'Đã đặt mã PIN'); go('acct'); } else { toast('Đã đặt mã PIN'); go('home'); } return; } } catch(_) {}
        pinFail('Chưa lưu được mã PIN, thử lại nhé'); return;
      }
    }
    if (a.step === 'login') {
      if (Date.now() < pinLockUntil) { pinFail(`Thử lại sau ${Math.ceil((pinLockUntil - Date.now()) / 1000)} giây`); return; }
      if (await pinOk(v, a.u.data.pin)) { await loginDone(a.u); return; }
      if (++pinTries >= 5) { pinTries = 0; pinLockUntil = Date.now() + 30000; pinFail('Sai mã PIN 5 lần, thử lại sau 30 giây'); return; }
      pinFail('Sai mã PIN');
    }
  } finally { a.busy = false; }
}
async function logout(){   // đẩy hết thay đổi lên máy chủ, xoá dữ liệu của app trên máy này rồi về trang Đăng nhập
  const me = root.acct; if (!me?.uid) return;
  toast('Đang đăng xuất…');
  try {
    const u = await getUser(me.handle);
    if (u?.data?.uid === me.uid && !u.data.pin) { auth = { mode: 'change', step: 'set', err: '', had: false }; go('pin'); return; }   // chưa có PIN thì đăng xuất xong không vào lại được: đặt PIN trước
    clearTimeout(pushT); pushT = null; await push(); await pushShared();
    if (syncState === 'err' || dirtyG.size) throw 0;
  } catch(_) { toast('Chưa lưu hết lên máy chủ, thử lại khi có mạng'); return; }
  try { Object.keys(localStorage).filter(k => k.startsWith('coong_') && k !== 'coong_epoch').forEach(k => localStorage.removeItem(k)); } catch(_) {}
  location.replace('/');
}
function acctView(){   // Figma 398:2129: thanh trên (quay lại, tiêu đề 20px, nút ✓ vàng) → avatar 80px (bấm mở bảng chọn) → @tên → link
  return `<section class="view onb acv">
    <header class="ahd"><button class="circ back c44" id="acBack" aria-label="Quay lại">${svg('i-back')}</button><h1>Tài khoản</h1><button class="circ c44 okb" id="saveAcct" aria-label="Lưu" ${acSt.st === 'ok' ? '' : 'disabled'}>${svg('i-check')}</button></header>
    <button class="avpick" id="acAvBtn" aria-label="Đổi ảnh đại diện">${avHTML(adraft.avatar, 'big', 'i-user')}<span class="avpen">${svg('i-pen')}</span></button>
    <div class="aname2"><div class="onrow"><span class="at">@</span><input class="oname" id="aName" placeholder="Nhập tên của bạn" value="${esc(adraft.name)}" maxlength="40" autocomplete="off" autocapitalize="words" enterkeyhint="done" aria-label="Tên của bạn"></div>
    <p class="alnk" id="aLink">${esc(hlink(adraft.name))}</p><p class="ohandle" id="aHandle"></p></div>
    ${root.acct?.uid && onWeb ? `<button class="btn onbbtn acbtn" id="chPin">Đổi mã PIN</button><button class="aout" id="logout">Đăng xuất</button>` : ''}
  </section>`;
}
